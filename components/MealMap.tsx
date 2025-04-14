import React, { useState, useEffect } from 'react'
import { View, Text, Alert } from 'react-native'
import MapView, { Marker } from 'react-native-maps'
import * as Location from 'expo-location'

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

const getUserLocation = async (): Promise<Region> => {
  // Request location permissions
  let { status } = await Location.requestForegroundPermissionsAsync();
  
  if (status !== 'granted') {
    throw new Error('Permission to access location was denied');
  }
  
  // Get the current location
  let location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };
}

export default function MealMap() {
  const [region, setRegion] = useState<Region>(INITIAL_REGION);
  const [userLocation, setUserLocation] = useState<Region | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const setupLocationTracking = async () => {
      try {
        // Request permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          console.log('Location permission denied');
          return;
        }
        
        // Get initial location
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });
        
        // Only update state if component is still mounted
        if (isMounted) {
          const locationRegion = {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          };
          
          setRegion(locationRegion);
          setUserLocation(locationRegion);
          
          // Subscribe to location updates
          const subscription = await Location.watchPositionAsync(
            { 
              accuracy: Location.Accuracy.Balanced,
              distanceInterval: 10, // update if moved by 10 meters
              timeInterval: 5000    // or update every 5 seconds
            },
            (newLocation) => {
              const updatedRegion = {
                latitude: newLocation.coords.latitude,
                longitude: newLocation.coords.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              };
              
              setUserLocation(updatedRegion);
            }
          );
          
          setLocationSubscription(subscription);
        }
      } catch (error) {
        console.error('Error setting up location tracking:', error);
        if (isMounted) {
          Alert.alert(
            "Location Error",
            "Could not get your location. Using default location instead.",
            [{ text: "OK" }]
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    setupLocationTracking();
    
    // Cleanup function
    return () => {
      isMounted = false;
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

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
        {userLocation && (
          <Marker
            coordinate={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude
            }}
            title="You are here"
            description="Your current location"
            pinColor="blue"
          />
        )}
      </MapView>
    </View>
  )
}