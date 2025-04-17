import React, { useState, useCallback } from 'react'
import { View, StyleSheet, Alert, Modal, ScrollView, TouchableOpacity } from 'react-native'
import { Text, Button, Card, Image } from '@rneui/themed'
import { supabase } from '../lib/supabase'
import { Session } from '@supabase/supabase-js'
import { useFocusEffect } from '@react-navigation/native'

export default function FindMeals({ session }: { session: Session }) {
  const [meals, setMeals] = useState<any[]>([])
  const [selectedMeal, setSelectedMeal] = useState<any | null>(null)
  const [modalVisible, setModalVisible] = useState(false)

  const fetchMeals = async () => {
    const { data, error } = await supabase
      .from('meals')
      .select('*')

    if (error) {
      Alert.alert('Error', error.message)
    } else {
      setMeals(data)
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchMeals()
    }, [])
  )

  const handleMealSelect = (meal: any) => {
    setSelectedMeal(meal)
    setModalVisible(true)
  }

  const handleJoinMeal = async () => {
    if (!selectedMeal) return

    if (selectedMeal.host_id === session.user.id) {
      Alert.alert('Not Allowed', 'You cannot join a meal you are hosting.')
      return
    }

    const alreadyJoined = selectedMeal.joined_guests?.includes(session.user.id)
    if (alreadyJoined) {
      Alert.alert('Already Joined', 'You have already joined this meal.')
      return
    }

    const updatedGuests = [...(selectedMeal.joined_guests || []), session.user.id]

    const { error } = await supabase
      .from('meals')
      .update({ joined_guests: updatedGuests })
      .eq('id', selectedMeal.id)

    if (error) {
      Alert.alert('Join Error', error.message)
    } else {
      Alert.alert('Joined Meal', `You have joined the meal: ${selectedMeal.name}`)
      setModalVisible(false)
      fetchMeals()
    }
  }

  const visibleMeals = meals.filter(meal => {
    const count = meal.joined_guests?.length || 0
    const alreadyJoined = meal.joined_guests?.includes(session.user.id)
    return count < meal.max_guests && !alreadyJoined
  })

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={true}
      bounces={true}
    >
      <Text h3 style={styles.heading}>Find Meals</Text>
      <Text style={styles.subtitle}>Find meals shared by your community</Text>

      <View style={styles.mealsContainer}>
        {visibleMeals.map(meal => (
          <TouchableOpacity key={meal.id} onPress={() => handleMealSelect(meal)}>
            <Card containerStyle={styles.card}>
              {meal.image_url ? (
                <Image source={{ uri: meal.image_url }} style={styles.image} />
              ) : null}
              <Text h4>{meal.name}</Text>
              <Text>{`Price: $${meal.price}`}</Text>
              <Text>{`Guests Joined: ${meal.joined_guests?.length || 0}/${meal.max_guests}`}</Text>
              <Button title="Join Meal" onPress={() => handleMealSelect(meal)} buttonStyle={styles.joinButton} />
            </Card>
          </TouchableOpacity>
        ))}
      </View>

      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          {selectedMeal && (
            <Card>
              {selectedMeal.image_url ? (
                <Image source={{ uri: selectedMeal.image_url }} style={styles.modalImage} />
              ) : null}
              <Text h3>{selectedMeal.name}</Text>
              <Text>{`Location: ${selectedMeal.location}`}</Text>
              <Text>{`Date: ${new Date(selectedMeal.meal_date).toLocaleString()}`}</Text>
              <Text>{`Price: $${selectedMeal.price}`}</Text>
              <Text>{`Guests: ${selectedMeal.joined_guests?.length || 0}/${selectedMeal.max_guests}`}</Text>
              <Text>{`Courses: ${(selectedMeal.courses || []).join(', ')}`}</Text>
              <Text style={{ marginTop: 10 }}>Ingredients:</Text>
              {(selectedMeal.ingredients || []).map((item: string, idx: number) => (
                <Text key={idx}>• {item}</Text>
              ))}

              <Button title="Join Meal" onPress={handleJoinMeal} buttonStyle={styles.joinButton} />
              <Button title="Close" onPress={() => setModalVisible(false)} type="clear" />
            </Card>
          )}
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
    flex: 1,
    padding: 16,
    paddingBottom: 80,
  },
  heading: {
    textAlign: 'center',
    marginBottom: 12,
    color: '#ffb31a',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#444',
  },
  mealsContainer: {
    marginBottom: 20,
  },
  card: {
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    marginBottom: 10,
  },
  joinButton: {
    backgroundColor: '#ffb31a',
    borderRadius: 30,
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#FFF3E0',
    padding: 20,
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#444',
  },
})
