import React, { useState, useEffect } from 'react'
import { StyleSheet, View, ScrollView, Alert } from 'react-native'
import { Text, Button } from '@rneui/themed'
import { Session } from '@supabase/supabase-js'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '../lib/supabase'
import LottieView from 'lottie-react-native'

export default function Account({ session }: { session: Session }) {
  const [username, setUsername] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [reviews, setReviews] = useState<any[]>([])

  useEffect(() => {
    if (session?.user) getProfile()
  }, [session])

  async function getProfile() {
    const { data, error } = await supabase
      .from('profiles')
      .select(`username, rating, reviews`)
      .eq('id', session.user.id)
      .single()

    if (error) {
      Alert.alert('Error loading profile', error.message)
      return
    }

    if (data) {
      setUsername(data.username)
      setRating(data.rating)
      setReviews(Array.isArray(data.reviews) ? data.reviews : [])
    }
  }

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) Alert.alert('Error signing out', error.message)
  }

  const renderStars = (count: number) => (
    <Text style={{ color: '#FFD700', fontSize: 18 }}>
      {'★'.repeat(count)}{'☆'.repeat(5 - count)}
    </Text>
  )

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={true}
      bounces={true}
    >
      <Text h3 style={styles.heading}>Account</Text>

      <View style={styles.infoSection}>
        <Text style={styles.label}>Username:</Text>
        <Text style={styles.value}>{username}</Text>

        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{session.user.email}</Text>

        <Text style={styles.label}>User ID:</Text>
        <Text style={styles.value}>{session.user.id}</Text>

        {rating !== null && (
          <>
            <Text style={styles.label}>Average Rating:</Text>
            <Text style={styles.value}>{rating.toFixed(1)} / 5.0</Text>
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
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF3E0',
  },
  content: {
    flex: 1,
    padding: 24,
    paddingBottom: 80,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
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
})