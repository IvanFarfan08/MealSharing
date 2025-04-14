import React, { useState, useCallback } from 'react'
import {View, StyleSheet, ScrollView, Alert, Image, Modal, TextInput, TouchableOpacity,} from 'react-native'
import { Text, Card, Button } from '@rneui/themed'
import { supabase } from '../lib/supabase'
import { Session } from '@supabase/supabase-js'
import { useFocusEffect } from '@react-navigation/native'
import * as ImagePicker from 'expo-image-picker'

export default function MyMeals({ session }: { session: Session }) {
  const [hostedMeals, setHostedMeals] = useState<any[]>([])
  const [joinedMeals, setJoinedMeals] = useState<any[]>([])
  const [selectedMeal, setSelectedMeal] = useState<any | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [uploading, setUploading] = useState(false)

  const fetchMyMeals = async () => {
    const userId = session.user.id

    const { data: hosted, error: hostedError } = await supabase
      .from('meals')
      .select('*')
      .eq('host_id', userId)

    if (hostedError) {
      Alert.alert('Error loading hosted meals', hostedError.message)
    } else {
      setHostedMeals(hosted)
    }

    const { data: joined, error: joinedError } = await supabase
      .from('meals')
      .select('*')
      .neq('host_id', userId)
      .contains('joined_guests', [userId])

    if (joinedError) {
      Alert.alert('Error loading joined meals', joinedError.message)
    } else {
      setJoinedMeals(joined)
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

      const { data: url } = await supabase.storage
        .from('images')
        .getPublicUrl(fileName)

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

  const handleEditSave = async () => {
    if (!selectedMeal) return

    const { error } = await supabase
      .from('meals')
      .update({
        name: selectedMeal.name,
        location: selectedMeal.location,
        price: parseFloat(selectedMeal.price) || 0,
        max_guests: parseInt(selectedMeal.max_guests) || 1,
        image_url: selectedMeal.image_url,
      })
      .eq('id', selectedMeal.id)

    if (error) {
      Alert.alert('Error updating meal', error.message)
    } else {
      Alert.alert('Meal Updated', 'Your changes have been saved.')
      setModalVisible(false)
      fetchMyMeals()
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={{ marginTop: 30 }}>
        <Text h3 style={styles.sectionTitle}>Meals You're Hosting</Text>
      </View>
      {hostedMeals.length === 0 ? (
        <Text style={styles.emptyText}>You haven't hosted any meals yet.</Text>
      ) : (
        hostedMeals.map((meal) => (
          <TouchableOpacity
            key={meal.id}
            onPress={() => {
              setSelectedMeal({ ...meal })
              setModalVisible(true)
            }}
          >
            <Card containerStyle={styles.card}>
              {meal.image_url && <Image source={{ uri: meal.image_url }} style={styles.image} />}
              <Text h4>{meal.name}</Text>
              <Text>{`Location: ${meal.location}`}</Text>
              <Text>{`Price: $${meal.price}`}</Text>
              <Text>{`Guests Joined: ${meal.joined_guests?.length || 0}/${meal.max_guests}`}</Text>
              <Text style={{ color: '#888', marginTop: 5 }}>Tap to edit</Text>
            </Card>
          </TouchableOpacity>
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
            <Text>{`Location: ${meal.location}`}</Text>
            <Text>{`Price: $${meal.price}`}</Text>
            <Text>{`Guests Joined: ${meal.joined_guests?.length || 0}/${meal.max_guests}`}</Text>
            <Button
              title="Leave Meal"
              onPress={() => handleLeaveMeal(meal.id)}
              buttonStyle={styles.leaveButton}
            />
          </Card>
        ))
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setModalVisible(false)}
      >
        <ScrollView style={styles.modalContainer}>
          <Text h3>Edit Meal</Text>

          <TextInput
            placeholder="Meal Name"
            value={selectedMeal?.name}
            onChangeText={(text) => setSelectedMeal({ ...selectedMeal, name: text })}
            style={styles.input}
          />
          <TextInput
            placeholder="Location"
            value={selectedMeal?.location}
            onChangeText={(text) => setSelectedMeal({ ...selectedMeal, location: text })}
            style={styles.input}
          />
          <TextInput
            placeholder="Price"
            keyboardType="decimal-pad"
            value={selectedMeal?.price?.toString() || ''}
            onChangeText={(text) => setSelectedMeal({ ...selectedMeal, price: text })}
            style={styles.input}
          />
          <TextInput
            placeholder="Max Guests"
            keyboardType="numeric"
            value={selectedMeal?.max_guests?.toString() || ''}
            onChangeText={(text) => setSelectedMeal({ ...selectedMeal, max_guests: text })}
            style={styles.input}
          />

          <Button title="Pick Image" onPress={pickImage} buttonStyle={styles.imageButton} />
          {selectedMeal?.image_url && (
            <Image source={{ uri: selectedMeal.image_url }} style={styles.image} />
          )}

          <Button title="Save Changes" onPress={handleEditSave} buttonStyle={styles.saveButton} />
          <Button title="Cancel" onPress={() => setModalVisible(false)} type="clear" />
        </ScrollView>
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
})
