import React, { useState, useEffect } from 'react'
import { StyleSheet, View, ScrollView, Alert, Modal, ActivityIndicator } from 'react-native'
import { Text, Button } from '@rneui/themed'
import { Session } from '@supabase/supabase-js'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '../lib/supabase'
import LottieView from 'lottie-react-native'
import OpenAI from 'openai'
import { OPENAI_API_KEY } from '@env'

export default function Account({ session }: { session: Session }) {
  const [full_name, setfull_name] = useState('')
  const [username, setUsername] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [categoryRatings, setCategoryRatings] = useState<Record<string, number>>({})
  const [summaryModalVisible, setSummaryModalVisible] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    if (session?.user) getProfile()
  }, [session])

  async function getProfile() {
    const { data, error } = await supabase
      .from('profiles')
      .select(`username, rating, reviews, full_name`)
      .eq('id', session.user.id)
      .single()

    if (error) {
      Alert.alert('Error loading profile', error.message)
      return
    }

    if (data) {
      setfull_name(data.full_name)
      setUsername(data.username)
      setRating(data.rating)
      setReviews(Array.isArray(data.reviews) ? data.reviews : [])

      const categoryAverages: Record<string, number> = { Punctuality: 0, Cleanliness: 0, Communication: 0, Hospitality: 0, MealQuality: 0, Organization: 0 };
      const categoryCounts: Record<string, number> = { Punctuality: 0, Cleanliness: 0, Communication: 0, Hospitality: 0, MealQuality: 0, Organization: 0 };

      data.reviews.forEach((review: any) => {
        if (review.category_ratings) {
          Object.keys(review.category_ratings).forEach(category => {
            categoryAverages[category] += review.category_ratings[category];
            categoryCounts[category] += 1;
          });
        }
      });

      Object.keys(categoryAverages).forEach(category => {
        if (categoryCounts[category] > 0) {
          categoryAverages[category] /= categoryCounts[category];
        }
      });

      setCategoryRatings(categoryAverages);
    }
  }

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) Alert.alert('Error signing out', error.message)
  }

  const summarizeReviews = async () => {
    setLoadingSummary(true);
    setSummaryModalVisible(true);
    try {
      const openai = new OpenAI({ apiKey: OPENAI_API_KEY, dangerouslyAllowBrowser: true });

      const comments = reviews.map(r => r.comment).filter(Boolean).join('\n');

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You summarize user reviews into a concise paragraph.' },
          { role: 'user', content: `Summarize the following reviews:\n${comments}` }
        ],
        temperature: 0.7,
      });

      const summary = response.choices[0]?.message?.content ?? 'No summary available.';
      setSummaryText(summary);
    } catch (error) {
      setSummaryText('Failed to generate summary.');
      console.error(error);
    } finally {
      setLoadingSummary(false);
    }
  };

  const renderStars = (count: number) => (
    <Text style={{ color: '#FFD700', fontSize: 18 }}>
      {'★'.repeat(count)}{'☆'.repeat(5 - count)}
    </Text>
  )

  const renderCategoryRatings = (categories: string[], ratings: any) => (
    categories.map(category => (
      <View key={category} style={styles.categoryRatingRow}>
        <Text style={styles.categoryLabel}>{category}:</Text>
        <Text style={styles.categoryValue}>{ratings[category]?.toFixed(1) || 'N/A'}</Text>
      </View>
    ))
  )

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={[styles.content, { paddingBottom: 120, marginTop: 30 }]}
      showsVerticalScrollIndicator={true}
      bounces={true}
    >
      <Text h3 style={styles.heading}>Account</Text>

      <View style={styles.infoSection}>
        <Text style={styles.label}>Name:</Text>
        <Text style={styles.value}>{full_name}</Text>

        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{session.user.email}</Text>

        <Text style={styles.label}>User ID:</Text>
        <Text style={styles.value}>{session.user.id}</Text>

        {rating !== null && (
          <>
            <Text style={styles.label}>Average Rating:</Text>
            <Text style={styles.value}>{rating.toFixed(1)} / 5.0</Text>
            <Text style={styles.label}>Category Ratings:</Text>
            {renderCategoryRatings(['Punctuality', 'Cleanliness', 'Communication'], categoryRatings)}
            {renderCategoryRatings(['Hospitality', 'MealQuality', 'Organization'], categoryRatings)}
          </>
        )}
      </View>

      {reviews.length > 0 && (
        <View style={styles.reviewSection}>
          <Text style={styles.reviewTitle}>Reviews</Text>
          {reviews.map((review, index) => (
            <View key={index} style={styles.reviewCard}>
              {renderStars(review.rating)}
              <Text style={styles.reviewText}>{review.comment || 'No comment'}</Text>
              <Text style={styles.reviewDate}>
                {new Date(review.timestamp).toLocaleDateString()}
              </Text>
            </View>
          ))}

          <Button
            title="Summarize Reviews"
            onPress={summarizeReviews}
            buttonStyle={[styles.logoutButton, { backgroundColor: '#FFA500' }]}
          />
        </View>
      )}

      <Button
        title="Log Out"
        onPress={handleSignOut}
        buttonStyle={styles.logoutButton}
      />

      <View style={styles.lottieContainer}>
        <LottieView
          source={require('../assets/animations/Animation3.json')}
          autoPlay
          loop
          style={styles.lottie}
        />
      </View>

      <Modal
        visible={summaryModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSummaryModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10, width: '85%' }}>
            {loadingSummary ? (
              <ActivityIndicator size="large" color="#ffb31a" />
            ) : (
              <>
                <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}>Review Summary</Text>
                <Text style={{ fontSize: 16, color: '#333' }}>{summaryText}</Text>
                <Button
                  title="Close"
                  onPress={() => setSummaryModalVisible(false)}
                  buttonStyle={[styles.logoutButton, { backgroundColor: '#ccc', marginTop: 10 }]}
                />
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF3E0',
  },
  content: {
    padding: 24,
    paddingBottom: 80,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffb31a',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoSection: {
    marginBottom: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginTop: 12,
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#ffb31a',
    borderRadius: 30,
    paddingVertical: 12,
    marginTop: 10,
  },
  reviewSection: {
    marginBottom: 30,
  },
  reviewTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  reviewText: {
    fontSize: 16,
    marginTop: 4,
    color: '#444',
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  lottieContainer: {
    width: '100%',
    height: 400,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  categoryRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginRight: 8,
  },
  categoryValue: {
    fontSize: 16,
    color: '#333',
  },
})
