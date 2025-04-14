import React, { useState, useEffect } from 'react'
import { View, Alert } from 'react-native'
import MapView, { Marker } from 'react-native-maps'
import * as Location from 'expo-location'
import { supabase } from '../lib/supabase'

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

const INITIAL_REGION: Region = {
  latitude: 37.78825,
  longitude: -122.4324,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
}

interface MealMapProps {
  userLocation: Region;
}

export default function MealMap({ userLocation }: MealMapProps) {
  // Use the passed-in userLocation as initial state
  const [region, setRegion] = useState<Region>(userLocation);
  const [loading, setLoading] = useState(false);
  const [meals, setMeals] = useState<any[]>([]);

  const fetchMeals = async () => {
    const { data, error } = await supabase
      .from('meals')
      .select('*')

    if (error) {
        Alert.alert('Error', error.message)
      } else {
        console.log('Meals from database:', data)
        setMeals(data)
      }
    }

  // Fetch meals on component mount
  useEffect(() => {
    fetchMeals();
    
    // Log meals for debugging
    console.log('Current meals state:', meals);
  }, []);
  
  // Update region when userLocation changes
  useEffect(() => {
    setRegion(userLocation);
  }, [userLocation]);

  return (
    <View style={{ flex: 1, width: '100%', height: '100%' }}>
      <MapView
        style={{ flex: 1, width: '100%', height: '100%' }}
        initialRegion={INITIAL_REGION}
        region={region}
        showsUserLocation={true}
        showsMyLocationButton={true}
        followsUserLocation={true}
        zoomEnabled={true}
        zoomTapEnabled={true}
        zoomControlEnabled={true}
      >
        {meals.map(meal => (
          <Marker
            key={meal.id}
            coordinate={{
              latitude: meal.location[0].latitude,
              longitude: meal.location[0].longitude
            }}
            title={meal.name}
            description="Test"
          />
        ))}
      </MapView>
    </View>
  )
}