import React, { useState } from 'react'
import { View, StyleSheet, ScrollView, Alert, Image, TouchableOpacity, Modal, Dimensions } from 'react-native'
import { Input, Button, Text, Icon } from '@rneui/themed'
import MapView, { Marker } from 'react-native-maps'
import { supabase } from '../lib/supabase'
import { Session } from '@supabase/supabase-js'
import * as ImagePicker from 'expo-image-picker'
import DateTimePicker from '@react-native-community/datetimepicker'
import LottieView from 'lottie-react-native'

interface HostMealProps {
  session: Session;
  userLocation: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
}

export default function HostMeal({ session, userLocation }: HostMealProps) {
  const [name, setName] = useState('')
  const [location, setLocation] = useState({
    longitude: userLocation.longitude,
    latitude: userLocation.latitude
  })
  const [mapVisible, setMapVisible] = useState(false)
  const [maxGuests, setMaxGuests] = useState('')
  const [price, setPrice] = useState('')
  const [mealDate, setMealDate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [courses, setCourses] = useState([{ name: '', ingredients: '' }])
  const [image, setImage] = useState<string | null>(null)

  const handleImageUpload = async (uri: string) => {
    try {
      setUploading(true)

      // Create a unique filename
      const fileName = `${session.user.id}_${Date.now()}.jpg`

      // Create FormData
      const formData = new FormData()
      formData.append('file', {
        uri: uri,
        name: fileName,
        type: 'image/jpeg'
      } as any)

      // Upload directly to Supabase storage
      const { data, error } = await supabase.storage
        .from('images')
        .upload(fileName, formData, {
          contentType: 'multipart/form-data',
          upsert: true
        })

      if (error) {
        throw new Error(error.message)
      }

      // Make direct request to upload
      const uploadResponse = await fetch(uri, {
        method: 'PUT',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (!uploadResponse.ok) {
        throw new Error('Upload failed')
      }

      // Get the public URL
      const { data: url } = await supabase.storage
        .from('images')
        .getPublicUrl(fileName)

      setImage(url.publicUrl)
    } catch (error) {
      console.error('Error:', error)
      Alert.alert('Error', (error as Error)?.message || 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }
  
  const pickImage = async () => {
    try {
      // Request permission first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload images.')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
        allowsEditing: true,
      })

      if (!result.canceled && result.assets[0]) {
        // Show local image immediately for better UX
        setImage(result.assets[0].uri)
        
        // Upload the image
        await handleImageUpload(result.assets[0].uri)
      }
    } catch (e) {
      console.error('Image picker error:', e)
      Alert.alert('Error', 'Failed to pick image')
    }
  }

  const handleCourseChange = (index: number, field: 'name' | 'ingredients', value: string) => {
    const updated = [...courses]
    updated[index][field] = value
    setCourses(updated)
  }

  const addCourse = () => {
    setCourses([...courses, { name: '', ingredients: '' }])
  }

  const removeCourse = (index: number) => {
    const updated = [...courses]
    updated.splice(index, 1)
    setCourses(updated)
  }

  const handleSubmit = async () => {
    if (!name || !location || !price || !maxGuests || !mealDate || courses.length === 0) {
      Alert.alert('Validation Error', 'Please fill out all fields and add at least one course.')
      return
    }

    const courseNames = courses.map(c => c.name)
    const allIngredients = courses.map(c => `${c.name}: ${c.ingredients}`)

    const { error } = await supabase.from('meals').insert([{
      name,
      location: location,
      max_guests: parseInt(maxGuests),
      price: parseFloat(price),
      meal_date: mealDate.toISOString(),
      meal_time: mealDate.toTimeString().split(' ')[0],
      image_url: image ?? '',
      host_id: session.user.id,
      ingredients: allIngredients,
      courses: courseNames,
    }])

    if (error) {
      Alert.alert('Error', error.message)
    } else {
      Alert.alert('Success', 'Meal created successfully!')
      setName('')
      setLocation({
        longitude: userLocation.longitude,
        latitude: userLocation.latitude
      })
      setMaxGuests('')
      setPrice('')
      setImage(null)
      setCourses([{ name: '', ingredients: '' }])
      setMealDate(new Date())
    }
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={true}
      bounces={true}
    >
      <View>
        <Text h3 style={styles.heading}>Host a Meal</Text>

        <Input placeholder="Meal Name" value={name} onChangeText={setName} />
        <View>
          <Text style={styles.subheading}>Location</Text>
          <TouchableOpacity
            style={styles.mapContainer}
            onPress={() => setMapVisible(true)}
          >
            <MapView
              style={styles.miniMap}
              initialRegion={{
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
            >
              <Marker
                coordinate={{
                  latitude: location.latitude,
                  longitude: location.longitude
                }}
              />
            </MapView>
            <View style={styles.mapOverlay}>
              <Icon name="map-marker" type="font-awesome" color="#ffb31a" size={24} />
              <Text style={styles.tapToEditText}>Tap to set location</Text>
            </View>
          </TouchableOpacity>
          
          <Modal
            visible={mapVisible}
            transparent={false}
            animationType="slide"
            onRequestClose={() => setMapVisible(false)}
          >
            <View style={[styles.container]}>
              <View style={styles.mapHeader}>
                <Text style={styles.mapTitle}>Set Meal Location</Text>
                <TouchableOpacity onPress={() => setMapVisible(false)} style={styles.closeButton}>
                  <Icon name="close" type="material" color="#ffb31a" />
                </TouchableOpacity>
              </View>
              
              <MapView
                style={styles.fullMap}
                initialRegion={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                onPress={(e) => {
                  setLocation(e.nativeEvent.coordinate);
                }}
              >
                <Marker
                  coordinate={{
                    latitude: location.latitude,
                    longitude: location.longitude
                  }}
                  draggable
                  onDragEnd={(e) => {
                    setLocation(e.nativeEvent.coordinate);
                  }}
                />
              </MapView>
              
              <View style={styles.mapButtonContainer}>
                <Button 
                  title="Use This Location" 
                  onPress={() => setMapVisible(false)}
                  buttonStyle={styles.mapButton}
                />
              </View>
            </View>
          </Modal>
        </View>
        <Input placeholder="Max Guests" keyboardType="numeric" value={maxGuests} onChangeText={(text) => setMaxGuests(text.replace(/[^0-9]/g, ''))} />
        <Input placeholder="Price (e.g. 9.99)" keyboardType="decimal-pad" value={price} onChangeText={(text) => setPrice(text.replace(/[^0-9.]/g, ''))} />

        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
          <Input
            label="Meal Date"
            value={mealDate.toLocaleString()}
            editable={false}
            rightIcon={<Icon name="calendar" type="font-awesome" />}
          />
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={mealDate}
            mode="datetime"
            display="default"
            onChange={(_, selectedDate) => {
              setShowDatePicker(false)
              if (selectedDate) setMealDate(selectedDate)
            }}
          />
        )}

        <Button
          title="Pick Image"
          onPress={pickImage}
          icon={{ name: 'image', type: 'font-awesome', color: 'white' }}
          buttonStyle={styles.imageButton}
        />
        {image && <Image source={{ uri: image }} style={styles.image} />}

        {/* Wrapped LottieView in a fixed container */}
        <View style={styles.lottieContainer}>
          <LottieView
            source={require('../assets/animations/Animation2.json')}
            autoPlay
            loop
            style={styles.lottie}
          />
        </View>

        <Text h4 style={styles.subheading}>Courses</Text>
        {courses.map((course, index) => (
          <View key={index} style={styles.courseBlock}>
            <Input placeholder="Course Name" value={course.name} onChangeText={(text) => handleCourseChange(index, 'name', text)} />
            <Input placeholder="Ingredients" value={course.ingredients} onChangeText={(text) => handleCourseChange(index, 'ingredients', text)} />
            {courses.length > 1 && (
              <Button
                title="Remove"
                type="clear"
                onPress={() => removeCourse(index)}
                titleStyle={{ color: 'red' }}
              />
            )}
          </View>
        ))}

        <Button
          title="Add Another Course"
          onPress={addCourse}
          icon={{ name: 'plus', type: 'font-awesome', color: 'white' }}
          buttonStyle={styles.addCourseButton}
        />

        <Button title="Submit Meal" onPress={handleSubmit} buttonStyle={styles.submitButton} />
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
    padding: 16,
    paddingBottom: 100,
  },
  heading: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#ffb31a',
  },
  subheading: {
    marginTop: 20,
    marginBottom: 10,
    fontWeight: 'bold',
    fontSize: 18,
    color: '#444',
  },
  courseBlock: {
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: '#ffb31a',
    borderRadius: 30,
    paddingVertical: 12,
    marginTop: 20,
  },
  imageButton: {
    backgroundColor: '#ffb31a',
    borderRadius: 30,
    marginVertical: 10,
  },
  addCourseButton: {
    backgroundColor: '#ffb31a',
    borderRadius: 30,
    marginTop: 10,
    paddingVertical: 12,
  },
  mapButton: {
    backgroundColor: "#ffb31a",
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  mapButtonContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 1000,
  },
  image: {
    width: '100%',
    height: 200,
    marginVertical: 10,
    borderRadius: 10,
  },
  // New container for LottieView
  lottieContainer: {
    width: '100%',
    height: 180,
    alignItems: 'center', // Centers the LottieView
    justifyContent: 'center',
    overflow: 'hidden', // Prevents expansion
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  // Map related styles
  mapContainer: {
    height: 150,
    marginBottom: 15,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  miniMap: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapToEditText: {
    color: 'white',
    fontWeight: 'bold',
    marginTop: 8,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  fullMap: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingTop: 60,
    backgroundColor: '#FFF3E0',
    borderBottomWidth: 1,
    borderBottomColor: '#ffb31a',
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#444',
  },
  closeButton: {
    padding: 8,
  },
})