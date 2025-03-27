import React, { useEffect, useState } from 'react'
import { View, StyleSheet, Alert, Modal, ScrollView, TouchableOpacity } from 'react-native'
import { Text, Button, Card, Image } from '@rneui/themed'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../App'
import { supabase } from '../lib/supabase'
import { Session } from '@supabase/supabase-js'

export default function FindMeals({ session }: { session: Session }) {
  const [meals, setMeals] = useState<any[]>([])
  const [selectedMeal, setSelectedMeal] = useState<any | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'FindMeals'>>()

  // Fetch meals from Supabase
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

  useEffect(() => {
    fetchMeals()
  }, [])

  // Handle meal selection
  const handleMealSelect = (meal: any) => {
    setSelectedMeal(meal)
    setModalVisible(true)
  }

  // Handle "join" action
  const handleJoinMeal = () => {
    if (!selectedMeal) return

    // Logic to join the meal (e.g., add to user’s meal list)
    Alert.alert('Joined Meal', `You have joined the meal: ${selectedMeal.name}`)
    setModalVisible(false)
  }

  const handleUpdateMealList = () => {
    fetchMeals()
  }

  return (
    <ScrollView style={styles.container}>
      <View style={{ paddingTop: 40 }}>
        <Text h3 style={styles.heading}>Find Meals</Text>
        <Text style={styles.subtitle}>Discover meals shared by people in your community</Text>

        {/* Display meals */}
        <View style={styles.mealsContainer}>
          {meals.map((meal) => (
            <TouchableOpacity key={meal.id} onPress={() => handleMealSelect(meal)}>
              <Card containerStyle={styles.card}>
                <Text h4>{meal.name}</Text>
                <Image source={{ uri: meal.image_url }} style={styles.image} />
                <Text>{`Location: ${meal.location}`}</Text>
                <Text>{`Price: $${meal.price}`}</Text>
                <Button title="Join Meal" onPress={() => handleMealSelect(meal)} buttonStyle={styles.joinButton} />
              </Card>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.heading} onPress={() => handleUpdateMealList()}>Update Meal List</Text>
        

        {/* Modal to show selected meal details */}
        <Modal
          animationType="slide"
          transparent={false}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            {selectedMeal && (
              <Card>
                <Text h3>{selectedMeal.name}</Text>
                <Image source={{ uri: selectedMeal.image_url }} style={styles.image} />   
                <Text>{`Location: ${selectedMeal.location}`}</Text>
                <Text>{`Price: $${selectedMeal.price}`}</Text>
                <Text>{`Max Guests: ${selectedMeal.max_guests}`}</Text>
                <Text>{`Meal Date: ${new Date(selectedMeal.meal_date).toLocaleString()}`}</Text>

                <Button
                  title="Join Meal"
                  onPress={handleJoinMeal}
                  buttonStyle={styles.joinButton}
                />
                <Button
                  title="Close"
                  onPress={() => setModalVisible(false)}
                  type="clear"
                />
              </Card>
            )}
          </View>
        </Modal>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF3E0',
    padding: 20,
  },
  heading: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#ffb31a',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    color: '#444',
  },
  mealsContainer: {
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginVertical: 10,
    resizeMode: 'cover',
  },
  card: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  joinButton: {
    backgroundColor: '#ffb31a',
    borderRadius: 30,
    marginTop: 10,
  },
  buttonContainer: {
    marginTop: 20,
    width: '100%',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
  },
})
