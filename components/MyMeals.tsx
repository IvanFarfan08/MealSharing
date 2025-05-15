import React, { useState, useCallback } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { Text, Card, Button } from '@rneui/themed'
import { supabase } from '../lib/supabase'
import { Session } from '@supabase/supabase-js'
import { useFocusEffect } from '@react-navigation/native'
import * as ImagePicker from 'expo-image-picker'
import moment from 'moment-timezone'
import axios from 'axios'
import OpenAI from 'openai'
import { OPENAI_API_KEY } from '@env'

export default function MyMeals({ session }: { session: Session }) {
  const [hostedMeals, setHostedMeals] = useState<any[]>([])
  const [joinedMeals, setJoinedMeals] = useState<any[]>([])
  const [selectedMeal, setSelectedMeal] = useState<any | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [reviewModalVisible, setReviewModalVisible] = useState(false)
  const [currentRevieweeId, setCurrentRevieweeId] = useState('')
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [mealToReview, setMealToReview] = useState<any | null>(null)
  const [pastHostedMeals, setPastHostedMeals] = useState<any[]>([])
  const [pastJoinedMeals, setPastJoinedMeals] = useState<any[]>([])
  const [guestInfo, setGuestInfo] = useState<any>({})
  const [requestedMeals, setRequestedMeals] = useState<any[]>([])
  const [requesterInfo, setRequesterInfo] = useState<any>({})
  const [newDate, setNewDate] = useState(selectedMeal?.meal_date || '')
  const [newTime, setNewTime] = useState(selectedMeal?.meal_time || '')
  const [rescheduleComment, setRescheduleComment] = useState('')
  const [cuisine, setCuisine] = useState('')
  const [guestSummaries, setGuestSummaries] = useState<{[key: string]: string}>({})
  const [loadingSummaries, setLoadingSummaries] = useState<{[key: string]: boolean}>({})

  // Define categories for guests and hosts
  const guestCategories = ['Punctuality', 'Cleanliness', 'Communication'];
  const hostCategories = ['Hospitality', 'Meal Quality', 'Organization'];

  // Add state for category ratings
  const [categoryRatings, setCategoryRatings] = useState<{[key: string]: number}>({
    Punctuality: 0,
    Cleanliness: 0,
    Communication: 0,
    Hospitality: 0,
    MealQuality: 0,
    Organization: 0,
  });

  const fetchMyMeals = async () => {
    const userId = session.user.id
    const now = Date.now()
  
    const { data: hosted } = await supabase
      .from('meals')
      .select('*')
      .eq('host_id', userId)
  
    const { data: joined } = await supabase
      .from('meals')
      .select('*')
      .neq('host_id', userId)
      .contains('joined_guests', [userId])

    const { data: requested } = await supabase
      .from('meals')
      .select('*')
      .neq('host_id', userId)
      .contains('requested_guests', [userId])

      setRequestedMeals(requested?.filter(m => new Date(m.meal_date).getTime() > now) || [])

    setHostedMeals(hosted?.filter(m => new Date(m.meal_date).getTime() > now) || [])
    setPastHostedMeals(hosted?.filter(m => new Date(m.meal_date).getTime() <= now) || [])
    setJoinedMeals(joined?.filter(m => new Date(m.meal_date).getTime() > now) || [])
    setPastJoinedMeals(joined?.filter(m => new Date(m.meal_date).getTime() <= now) || [])
  
    // Get joined guests info
    const guestIds = hosted?.flatMap(m => m.joined_guests || []) || []
    const { data: guests } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', [...new Set(guestIds)])
  
    const lookup: any = {}
    guests?.forEach(g => {
      lookup[g.id] = g.username
    })
    setGuestInfo(lookup)

    // Get requested guests info with full_name, rating, and reviews
    const requesterIds = hosted?.flatMap(m => m.requested_guests || []) || []
    if (requesterIds.length > 0) {
      const { data: requesters } = await supabase
        .from('profiles')
        .select('id, username, full_name, rating, reviews')
        .in('id', [...new Set(requesterIds)])
      
      const requesterLookup: any = {}
      requesters?.forEach(r => {
        requesterLookup[r.id] = {
          username: r.username,
          full_name: r.full_name,
          rating: r.rating,
          reviews: r.reviews || []
        }
      })
      setRequesterInfo(requesterLookup)
    }
  }
  

  useFocusEffect(
    useCallback(() => {
      fetchMyMeals()
    }, [])
  )

  const handleLeaveMeal = async (mealId: string) => {
    const userId = session.user.id

    const { data: mealData, error: fetchError } = await supabase
      .from('meals')
      .select('joined_guests')
      .eq('id', mealId)
      .single()

    if (fetchError || !mealData?.joined_guests) {
      Alert.alert('Error fetching meal', fetchError?.message || 'No guests found')
      return
    }

    const updatedGuests = mealData.joined_guests.filter((id: string) => id !== userId)

    const { error: updateError } = await supabase
      .from('meals')
      .update({ joined_guests: updatedGuests })
      .eq('id', mealId)

    if (updateError) {
      Alert.alert('Error leaving meal', updateError.message)
    } else {
      Alert.alert('Left Meal', 'You have left the meal.')
      fetchMyMeals()
    }
  }

  const handleImageUpload = async (uri: string) => {
    try {
      setUploading(true)
      const fileName = `${session.user.id}_${Date.now()}.jpg`

      const formData = new FormData()
      formData.append('file', {
        uri,
        name: fileName,
        type: 'image/jpeg',
      } as any)

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, formData, {
          contentType: 'multipart/form-data',
          upsert: true,
        })

      if (uploadError) throw new Error(uploadError.message)

      const { data: url } = await supabase.storage.from('images').getPublicUrl(fileName)

      if (url?.publicUrl) {
        setSelectedMeal((prev: any) => ({ ...prev, image_url: url.publicUrl }))
      }
    } catch (error) {
      console.error('Image upload error:', error)
      Alert.alert('Error', (error as Error)?.message || 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera roll access is required to upload an image.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: true,
    })

    if (!result.canceled && result.assets[0]) {
      setSelectedMeal((prev: any) => ({ ...prev, image_url: result.assets[0].uri }))
      await handleImageUpload(result.assets[0].uri)
    }
  }

  const updateMealAndNotifyGuests = async (mealId: string, newDate: string, newTime: string, hostComment: string, mealName: string) => {
    try {
      // Update the meal's date and time in the database
      const { error: updateError } = await supabase
        .from('meals')
        .update({ meal_date: newDate, meal_time: newTime })
        .eq('id', mealId);

      if (updateError) {
        throw new Error(`Error updating meal: ${updateError.message}`);
      }

      // Fetch the guests who have joined the meal
      const { data: mealData, error: fetchError } = await supabase
        .from('meals')
        .select('joined_guests')
        .eq('id', mealId)
        .single();

      if (fetchError || !mealData) {
        throw new Error(`Error fetching meal data: ${fetchError?.message || 'No data found'}`);
      }

      // Create notifications for each guest
      const notifications = mealData.joined_guests.map((guestId: string) => ({
        user_id: guestId,
        type: 'meal_change',
        meal_id: mealId,
        meal_name: mealName,
        new_date: newDate,
        new_time: newTime,
        meal_change_comment: hostComment,
        created_at: new Date().toISOString(),
      }));

      // Insert notifications into the database
      if (notifications && mealData.joined_guests.length > 0) {
        try {
          const { error: insertError } = await supabase
            .from('notifications')
            .insert(notifications);
            
          if (insertError) {
            throw new Error(`Error creating notifications: ${insertError.message}`);
          }
      
          console.log('Notifications created successfully');
        } catch (error: any) {
          console.error('Error creating notifications:', error.message);
        }
      }
    } catch (error: any) {
      console.error('Error in updateMealAndNotifyGuests:', error.message);
    }
  };

  const handleEditSave = async () => {
    if (!selectedMeal) return

    // Use moment-timezone to set the date to local time
    const localDate = moment.tz(newDate + ' ' + newTime, 'YYYY-MM-DD HH:mm', 'America/New_York').toDate();

    const { error } = await supabase
      .from('meals')
      .update({
        name: selectedMeal.name,
        cuisine: selectedMeal.cuisine,
        location: selectedMeal.location,
        price: parseFloat(selectedMeal.price) || 0,
        max_guests: parseInt(selectedMeal.max_guests) || 1,
        image_url: selectedMeal.image_url,
        meal_date: localDate.toISOString(),
        meal_time: newTime,
      })
      .eq('id', selectedMeal.id)

    if (error) {
      Alert.alert('Error updating meal', error.message)
    } else {
      // Notify guests about the reschedule
      const { data: guests } = await supabase
        .from('profiles')
        .select('id')
        .in('id', selectedMeal.joined_guests || [])

      if (guests) {
        await updateMealAndNotifyGuests(selectedMeal.id, newDate, newTime, rescheduleComment, selectedMeal.name);
      }

      Alert.alert('Meal Updated', 'Your changes have been saved.')
      setModalVisible(false)
      fetchMyMeals()
    }
  }

  const handleSubmitReview = async () => {
    if (!mealToReview || !currentRevieweeId) return
  
    // Calculate average rating
    const categories = session.user.id === mealToReview.host_id ? guestCategories : hostCategories;
    const avgRating = categories.reduce((acc, category) => acc + categoryRatings[category], 0) / categories.length;

    const newReview = {
      meal_id: mealToReview.id,
      reviewer_id: session.user.id,
      rating: avgRating,
      comment: reviewComment,
      timestamp: new Date().toISOString(),
      category_ratings: categoryRatings,
    }
  
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('reviews, rating')
      .eq('id', currentRevieweeId)
      .single()
  
    if (error || !profile) {
      Alert.alert('Error fetching profile', error?.message || 'Unknown error')
      return
    }
  
    const reviewsArray = Array.isArray(profile.reviews) ? profile.reviews : []
    const updatedReviews = [...reviewsArray, newReview]
  
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ reviews: updatedReviews, rating: avgRating })
      .eq('id', currentRevieweeId)
  
    if (updateError) {
      Alert.alert('Error submitting review', updateError.message)
      return
    }
  
    if (session.user.id === mealToReview.host_id) {
      const updatedGuests = [...(mealToReview.reviewed_guests || []), currentRevieweeId]
      await supabase
        .from('meals')
        .update({ reviewed_guests: updatedGuests })
        .eq('id', mealToReview.id)
    } else {
      const updatedHostReviewers = [...(mealToReview.host_reviewed || []), session.user.id]
      await supabase
        .from('meals')
        .update({ host_reviewed: updatedHostReviewers })
        .eq('id', mealToReview.id)
    }
  
    // UI reset + refresh
    Alert.alert('Thanks for the review!')
    setReviewModalVisible(false)
    setReviewRating(0)
    setReviewComment('')
    setCurrentRevieweeId('')
    fetchMyMeals()
  }
  const handleAcceptRequest = async (meal: any, guestId: string) => {
    const updatedRequested = (meal.requested_guests || []).filter((id: string) => id !== guestId)
    const updatedJoined = [...(meal.joined_guests || []), guestId]

    const { error } = await supabase
      .from('meals')
      .update({
        requested_guests: updatedRequested,
        joined_guests: updatedJoined,
      })
      .eq('id', meal.id)

    if (error) {
      Alert.alert('Error', error.message)
    } else {
      // Create a notification for the accepted guest
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: guestId,
          type: 'request_accepted',
          meal_id: meal.id,
          meal_name: meal.name,
          host_id: session.user.id,
          host_name: session.user.user_metadata?.username || 'Host',
          read: false,
          created_at: new Date().toISOString(),
        })

      if (notificationError) {
        console.error('Error creating notification:', notificationError)
      }

      Alert.alert('Guest Accepted', 'The guest has been added to your meal.')
      fetchMyMeals()
    }
  }

  const handleDenyRequest = async (meal: any, guestId: string) => {
    const updatedRequested = (meal.requested_guests || []).filter((id: string) => id !== guestId)

    const { error } = await supabase
      .from('meals')
      .update({
        requested_guests: updatedRequested,
      })
      .eq('id', meal.id)

    if (error) {
      Alert.alert('Error', error.message)
    } else {
      // Create a notification for the denied guest
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: guestId,
          type: 'request_denied',
          meal_id: meal.id,
          meal_name: meal.name,
          host_id: session.user.id,
          host_name: session.user.user_metadata?.username || 'Host',
          read: false,
          created_at: new Date().toISOString(),
        })

      if (notificationError) {
        console.error('Error creating notification:', notificationError)
      }

      Alert.alert('Request Denied', 'The guest request has been denied.')
      fetchMyMeals()
    }
  }

  // Add a function to handle meal join requests
  const handleJoinMeal = async (meal: any) => {
    const userId = session.user.id
    
    // Check if user profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      Alert.alert('Account Error', 'Your account profile could not be found. Please contact support.')
      return
    }
    
    // Check if the meal is full
    if (meal.joined_guests && meal.joined_guests.length >= meal.max_guests) {
      Alert.alert('Meal Full', 'This meal is already full.')
      return
    }
    
    // Check if the user has already requested to join
    if (meal.requested_guests && meal.requested_guests.includes(userId)) {
      Alert.alert('Already Requested', 'You have already requested to join this meal.')
      return
    }
    
    // Check if the user has already joined
    if (meal.joined_guests && meal.joined_guests.includes(userId)) {
      Alert.alert('Already Joined', 'You have already joined this meal.')
      return
    }
    
    // Add the user to the requested_guests array
    const updatedRequested = [...(meal.requested_guests || []), userId]
    
    const { error } = await supabase
      .from('meals')
      .update({
        requested_guests: updatedRequested,
      })
      .eq('id', meal.id)
    
    if (error) {
      Alert.alert('Error', error.message)
    } else {
      // Get the guest's profile information
      const { data: guestProfile, error: profileError } = await supabase
        .from('profiles')
        .select('username, full_name')
        .eq('id', userId)
        .single()
      
      if (profileError) {
        console.error('Error fetching guest profile:', profileError)
      }
      
      // Create a notification for the host
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: meal.host_id,
          type: 'join_request',
          meal_id: meal.id,
          meal_name: meal.name,
          guest_id: userId,
          guest_name: guestProfile?.full_name || guestProfile?.username || 'Guest',
          read: false,
          created_at: new Date().toISOString(),
        })
      
      if (notificationError) {
        console.error('Error creating notification:', notificationError)
      }
      
      Alert.alert('Request Sent', 'Your request to join the meal has been sent to the host.')
      fetchMyMeals()
    }
  }

  const handleEditMeal = (meal: any) => {
    setSelectedMeal(meal); // Keep the image
    setNewDate(meal.meal_date.split('T')[0]); // Set date without time
    setNewTime(meal.meal_time || ''); // Set time
    setRescheduleComment(''); // Clear comment
    setModalVisible(true);
  };

  const handleCancelJoinRequest = async (mealId: string) => {
    try {
      const userId = session.user.id;

      // Fetch the current meal data
      const { data: mealData, error: fetchError } = await supabase
        .from('meals')
        .select('requested_guests')
        .eq('id', mealId)
        .single();

      if (fetchError || !mealData) {
        throw new Error(`Error fetching meal data: ${fetchError?.message || 'No data found'}`);
      }

      // Remove the user from the requested_guests list
      const updatedRequestedGuests = mealData.requested_guests.filter((id: string) => id !== userId);

      // Update the meal with the new requested_guests list
      const { error: updateError } = await supabase
        .from('meals')
        .update({ requested_guests: updatedRequestedGuests })
        .eq('id', mealId);

      if (updateError) {
        throw new Error(`Error updating meal: ${updateError.message}`);
      }

      // Delete the join request notification
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('meal_id', mealId)
        .eq('guest_id', userId)
        .eq('type', 'join_request');

      if (deleteError) {
        throw new Error(`Error deleting notification: ${deleteError.message}`);
      }

      Alert.alert('Request Cancelled', 'Your join request has been cancelled.');
      fetchMyMeals(); // Refresh the meals list
    } catch (error: any) {
      console.error('Error in handleCancelJoinRequest:', error.message);
    }
  };

  // Add a function to handle meal cancellation
  const handleCancelMeal = async (mealId: string) => {
    try {
      // Fetch the current meal data
      const { data: mealData, error: fetchError } = await supabase
        .from('meals')
        .select('joined_guests')
        .eq('id', mealId)
        .single();

      if (fetchError || !mealData) {
        throw new Error(`Error fetching meal data: ${fetchError?.message || 'No data found'}`);
      }

      // Check if there are any joined guests
      if (mealData.joined_guests && mealData.joined_guests.length > 0) {
        Alert.alert('Cannot Cancel', 'This meal cannot be canceled because guests have already joined.');
        return;
      }

      // Delete the meal if no guests have joined
      const { error: deleteError } = await supabase
        .from('meals')
        .delete()
        .eq('id', mealId);

      if (deleteError) {
        throw new Error(`Error deleting meal: ${deleteError.message}`);
      }

      Alert.alert('Meal Canceled', 'The meal has been successfully canceled.');
      fetchMyMeals(); // Refresh the meals list
    } catch (error: any) {
      console.error('Error in handleCancelMeal:', error.message);
    }
  };

  const getGuestSummary = async (guestId: string, reviews: any[]) => {
    if (guestSummaries[guestId]) return; // Return if summary already exists
    
    setLoadingSummaries(prev => ({ ...prev, [guestId]: true }));
    
    try {
      const openai = new OpenAI({ apiKey: OPENAI_API_KEY, dangerouslyAllowBrowser: true });
      
      // Filter reviews where the person was a guest
      const guestReviews = reviews.filter(review => 
        review.category_ratings && 
        Object.keys(review.category_ratings).includes('Punctuality')
      );
      
      if (guestReviews.length === 0) {
        setGuestSummaries(prev => ({ ...prev, [guestId]: 'No guest reviews available.' }));
        return;
      }

      const comments = guestReviews.map(r => r.comment).filter(Boolean).join('\n');
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { 
            role: 'system', 
            content: 'You summarize guest reviews into a concise paragraph focusing on their behavior as a guest. Highlight key traits like punctuality, cleanliness, and communication.' 
          },
          { 
            role: 'user', 
            content: `Summarize the following guest reviews into a short paragraph:\n${comments}` 
          }
        ],
        temperature: 0.7,
      });

      const summary = response.choices[0]?.message?.content ?? 'No summary available.';
      setGuestSummaries(prev => ({ ...prev, [guestId]: summary }));
    } catch (error) {
      console.error('Error generating summary:', error);
      setGuestSummaries(prev => ({ ...prev, [guestId]: 'Failed to generate summary.' }));
    } finally {
      setLoadingSummaries(prev => ({ ...prev, [guestId]: false }));
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return '#4CAF50'; // Excellent - Green
    if (rating >= 4.0) return '#8BC34A'; // Very Good - Light Green
    if (rating >= 3.5) return '#FFC107'; // Good - Yellow
    if (rating >= 3.0) return '#FF9800'; // Average - Orange
    return '#F44336'; // Below Average - Red
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={true}
      bounces={true}
    >
      <View style={{ marginTop: 30 }}>
        <Text h3 style={styles.sectionTitle}>Meals You're Hosting</Text>
      </View>
      {hostedMeals.length === 0 ? (
        <Text style={styles.emptyText}>You haven't hosted any meals yet.</Text>
      ) : (
        hostedMeals.map((meal, index) => (
          <View key={`${meal.id}-${index}`}>
            <Card containerStyle={styles.card}>
              <TouchableOpacity
                onPress={() => handleEditMeal(meal)}
              >
                {meal.image_url && (
                  <Image source={{ uri: meal.image_url }} style={styles.image} />
                )}
                <Text h4>{meal.name}</Text>
                <Text>{`Cuisine: ${meal.cuisine}`}</Text>
                <Text>{`Price: $${meal.price}`}</Text>
                <Text>{`Guests Joined: ${meal.joined_guests?.length || 0}/${meal.max_guests}`}</Text>
                <Text style={{ color: '#888', marginTop: 5 }}>Tap to edit</Text>
              </TouchableOpacity>

              {/* Cancel Meal Button */}
              {meal.joined_guests?.length === 0 && (
                <Button
                  title="Cancel Meal"
                  onPress={() => handleCancelMeal(meal.id)}
                  buttonStyle={{
                    backgroundColor: '#f44336',
                    borderRadius: 20,
                    marginTop: 10,
                  }}
                />
              )}

              {/* Incoming Join Requests */}
              {(meal.requested_guests || []).length > 0 && (
                <>
                  <Text
                    style={{ marginTop: 15, fontWeight: 'bold', color: '#333' }}
                  >
                    Incoming Join Requests:
                  </Text>
                  {(meal.requested_guests || []).map((guestId: string, guestIndex: number) => {
                    const requester = requesterInfo[guestId] || {}
                    return (
                      <View key={`${guestId}-${guestIndex}`} style={styles.requesterCard}>
                        <Text style={styles.requesterName}>
                          {requester.full_name || requester.username || guestId}
                        </Text>
                        
                        {requester.rating !== undefined && (
                          <View style={styles.ratingContainer}>
                            <Text style={[styles.ratingText, { color: getRatingColor(requester.rating) }]}>
                              Rating: {requester.rating.toFixed(1)}/5.0
                            </Text>
                            <View style={styles.starsContainer}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Text key={star} style={{ color: star <= requester.rating ? '#FFD700' : '#ccc' }}>
                                  {star <= requester.rating ? '★' : '☆'}
                                </Text>
                              ))}
                            </View>
                          </View>
                        )}
                        
                        {requester.reviews && requester.reviews.length > 0 && (
                          <View style={styles.reviewsContainer}>
                            <Text style={styles.reviewsTitle}>Guest Summary:</Text>
                            {loadingSummaries[guestId] ? (
                              <ActivityIndicator size="small" color="#ffb31a" />
                            ) : guestSummaries[guestId] ? (
                              <Text style={styles.summaryText}>{guestSummaries[guestId]}</Text>
                            ) : (
                              <Button
                                title="Generate Summary"
                                onPress={() => getGuestSummary(guestId, requester.reviews)}
                                buttonStyle={styles.summaryButton}
                              />
                            )}
                          </View>
                        )}
                        
                        <View style={styles.requestButtonsContainer}>
                          <Button
                            title="Accept"
                            onPress={() => handleAcceptRequest(meal, guestId)}
                            buttonStyle={{
                              backgroundColor: '#4CAF50',
                              borderRadius: 20,
                              marginTop: 10,
                            }}
                          />
                          <Button
                            title="Deny"
                            onPress={() => handleDenyRequest(meal, guestId)}
                            buttonStyle={{
                              backgroundColor: '#f44336',
                              borderRadius: 20,
                              marginTop: 10,
                            }}
                          />
                        </View>
                      </View>
                    )
                  })}
                </>
              )}
            </Card>
          </View>
        ))
      )}

  
      <Text h3 style={styles.sectionTitle}>Meals You've Joined</Text>
      {joinedMeals.length === 0 ? (
        <Text style={styles.emptyText}>You haven't joined any meals yet.</Text>
      ) : (
        joinedMeals.map((meal) => (
          <Card key={meal.id} containerStyle={styles.card}>
            {meal.image_url && <Image source={{ uri: meal.image_url }} style={styles.image} />}
            <Text h4>{meal.name}</Text>
            <Text>{`Cuisine: ${meal.cuisine}`}</Text>
            <Text>{`Price: $${meal.price}`}</Text>
            <Text>{`Guests Joined: ${meal.joined_guests?.length || 0}/${meal.max_guests}`}</Text>
            <Button
              title="Leave Meal"
              onPress={() => handleLeaveMeal(meal.id)}
              buttonStyle={styles.leaveButton}
            />
            {new Date(meal.meal_date).getTime() <= Date.now() && (
              <Button
                title="Leave a Review"
                onPress={() => {
                  setCurrentRevieweeId(meal.host_id)
                  setMealToReview(meal)
                  setReviewModalVisible(true)
                }}
                buttonStyle={{ backgroundColor: '#FFD700', borderRadius: 20, marginTop: 10 }}
              />
            )}
          </Card>
        ))
      )}

      <Text h3 style={styles.sectionTitle}>Meals You've Requested</Text>
      {requestedMeals.length === 0 ? (
        <Text style={styles.emptyText}>You have no pending requests.</Text>
      ) : (
        requestedMeals.map((meal) => (
          <Card key={meal.id} containerStyle={styles.card}>
            {meal.image_url && <Image source={{ uri: meal.image_url }} style={styles.image} />}
            <Text h4>{meal.name}</Text>
            <Text>{`Location: ${meal.location}`}</Text>
            <Text>{`Price: $${meal.price}`}</Text>
            <Text>{`Requested - Waiting on Host Approval`}</Text>
            <Button
              title="Cancel Request"
              onPress={() => handleCancelJoinRequest(meal.id)}
              buttonStyle={styles.cancelButton}
            />
          </Card>
        ))
      )}

  
      <Text h3 style={styles.sectionTitle}>Rate Previous Meals (as Guest)</Text>
      {pastJoinedMeals.filter(meal => !(meal.host_reviewed || []).includes(session.user.id)).length === 0 ? (
        <Text style={styles.emptyText}>You've reviewed all your past hosts.</Text>
      ) : (
        pastJoinedMeals
          .filter(meal => !(meal.host_reviewed || []).includes(session.user.id))
          .map(meal => (
            <Card key={meal.id} containerStyle={styles.card}>
              <Text h4>{meal.name}</Text>
              <Button
                title="Review Host"
                onPress={() => {
                  setCurrentRevieweeId(meal.host_id)
                  setMealToReview(meal)
                  setReviewModalVisible(true)
                }}
                buttonStyle={{ backgroundColor: '#FFD700', borderRadius: 20, marginTop: 10 }}
              />
            </Card>
          ))
      )}
  
      <Text h3 style={styles.sectionTitle}>Rate Your Guests (as Host)</Text>
      {pastHostedMeals.filter(meal =>
        (meal.joined_guests || []).some((g: string) =>
          !(meal.reviewed_guests || []).includes(g)
        )
      ).length === 0 ? (
        <Text style={styles.emptyText}>You've reviewed all your guests.</Text>
      ) : (
        pastHostedMeals.map(meal => {
          const reviewed = meal.reviewed_guests || []
          const unreviewedGuests = (meal.joined_guests || []).filter((g: string) => !reviewed.includes(g))
  
          if (unreviewedGuests.length === 0) return null
  
          return (
            <Card key={meal.id} containerStyle={styles.card}>
              <Text h4>{meal.name}</Text>
              {unreviewedGuests.map((guestId: string) => (
                <View key={guestId} style={{ marginTop: 10 }}>
                  <Text>{guestInfo[guestId] || 'Guest'}</Text>
                  <Button
                    title="Review Guest"
                    onPress={() => {
                      setCurrentRevieweeId(guestId)
                      setMealToReview(meal)
                      setReviewModalVisible(true)
                    }}
                    buttonStyle={{ backgroundColor: '#FFD700', borderRadius: 20, marginTop: 5 }}
                  />
                </View>
              ))}
            </Card>
          )
        })
      )}
  
      <Modal visible={modalVisible} animationType="slide" transparent={false} onRequestClose={() => setModalVisible(false)}>
        <ScrollView style={styles.modalContainer}>
          <Text h3>Edit Meal</Text>
          <TextInput placeholder="Meal Name" value={selectedMeal?.name} onChangeText={(text) => setSelectedMeal({ ...selectedMeal, name: text })} style={styles.input} />
          <TextInput placeholder="Cuisine" value={selectedMeal?.cuisine} onChangeText={(text) => setSelectedMeal({ ...selectedMeal, cuisine: text })} style={styles.input} />
          <TextInput placeholder="Price" keyboardType="decimal-pad" value={selectedMeal?.price?.toString() || ''} onChangeText={(text) => setSelectedMeal({ ...selectedMeal, price: text })} style={styles.input} />
          <TextInput placeholder="Max Guests" keyboardType="numeric" value={selectedMeal?.max_guests?.toString() || ''} onChangeText={(text) => setSelectedMeal({ ...selectedMeal, max_guests: text })} style={styles.input} />
          <TextInput
            placeholder="New Date (YYYY-MM-DD)"
            value={newDate}
            onChangeText={setNewDate}
            style={styles.input}
          />
          <TextInput
            placeholder="New Time (HH:MM)"
            value={newTime}
            onChangeText={setNewTime}
            style={styles.input}
          />
          <TextInput
            placeholder="Reschedule Comment"
            value={rescheduleComment}
            onChangeText={setRescheduleComment}
            style={styles.input}
            multiline
          />
          <Button title="Pick Image" onPress={pickImage} buttonStyle={styles.imageButton} />
          {selectedMeal?.image_url && <Image source={{ uri: selectedMeal.image_url }} style={styles.image} />}
          <Button title="Save Changes" onPress={handleEditSave} buttonStyle={styles.saveButton} />
          <Button title="Cancel" onPress={() => setModalVisible(false)} type="clear" />
        </ScrollView>
      </Modal>
  
      <Modal visible={reviewModalVisible} animationType="slide" transparent={true}>
        <View style={styles.reviewModal}>
          <Card containerStyle={styles.reviewCard}>
            <Text h4 style={{ textAlign: 'center' }}>Leave a Review</Text>
            {session.user.id === mealToReview?.host_id ? guestCategories.map(category => (
              <View key={category} style={styles.categoryRow}>
                <Text style={styles.categoryLabel}>{category}</Text>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setCategoryRatings(prev => ({ ...prev, [category]: star }))}>
                      <Text style={{ fontSize: 30, color: categoryRatings[category] >= star ? '#FFD700' : '#ccc' }}>★</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )) : hostCategories.map(category => (
              <View key={category} style={styles.categoryRow}>
                <Text style={styles.categoryLabel}>{category}</Text>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setCategoryRatings(prev => ({ ...prev, [category]: star }))}>
                      <Text style={{ fontSize: 30, color: categoryRatings[category] >= star ? '#FFD700' : '#ccc' }}>★</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
            <TextInput
              placeholder="Write a comment (optional)"
              value={reviewComment}
              onChangeText={setReviewComment}
              style={styles.input}
              multiline
            />
            <Button title="Submit Review" onPress={handleSubmitReview} buttonStyle={{ backgroundColor: '#ffb31a', borderRadius: 20, marginTop: 10 }} />
            <Button title="Cancel" type="clear" onPress={() => setReviewModalVisible(false)} />
          </Card>
        </View>
      </Modal>
    </ScrollView>
  )
  
}  

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF3E0',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    color: '#ffb31a',
  },
  emptyText: {
    marginVertical: 12,
    textAlign: 'center',
    fontSize: 16,
    color: '#888',
  },
  card: {
    borderRadius: 12,
    marginBottom: 20,
    padding: 15,
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 10,
  },
  leaveButton: {
    backgroundColor: '#ff4d4d',
    borderRadius: 30,
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFF3E0',
    padding: 20,
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  imageButton: {
    backgroundColor: '#ffb31a',
    borderRadius: 30,
    marginVertical: 10,
  },
  saveButton: {
    backgroundColor: '#ffb31a',
    borderRadius: 30,
    marginTop: 20,
  },
  reviewModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  reviewCard: {
    width: '90%',
    borderRadius: 16,
    padding: 20,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
  requesterCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  requesterName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  ratingContainer: {
    marginTop: 5,
  },
  ratingText: {
    fontSize: 14,
    color: '#555',
  },
  starsContainer: {
    flexDirection: 'row',
    marginTop: 2,
  },
  reviewsContainer: {
    marginTop: 8,
  },
  reviewsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 4,
  },
  reviewItem: {
    marginTop: 4,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#ddd',
  },
  reviewRating: {
    fontSize: 12,
    color: '#666',
  },
  reviewComment: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 2,
  },
  requestButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: '#ff4d4d',
    borderRadius: 30,
    marginTop: 10,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  summaryText: {
    fontSize: 14,
    color: '#444',
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 20,
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#ffb31a',
  },
  summaryButton: {
    backgroundColor: '#ffb31a',
    borderRadius: 20,
    marginTop: 10,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
})

