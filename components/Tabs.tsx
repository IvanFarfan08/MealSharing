import React, { useState, useEffect } from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Icon } from '@rneui/themed'
import * as Location from 'expo-location'
import { Alert } from 'react-native'

import AccountScreen from './Account'
import HostMeal from './HostMeal'
import MealMap from './MealMap'
import MyMeals from './MyMeals' // <-- Updated from SearchMeals
import { Session } from '@supabase/supabase-js'
import FindMeals from './FindMeals'
import Notifications from './Notifications'

const Tab = createBottomTabNavigator()

// Interface for location data
interface LocationCoords {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

const INITIAL_REGION: LocationCoords = {
  latitude: 37.78825,
  longitude: -122.4324,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
}

export default function MainTabs({ session }: { session: Session }) {
  const [userLocation, setUserLocation] = useState<LocationCoords>(INITIAL_REGION);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  
  // Get user location
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;
    
    const setupLocationTracking = async () => {
      try {
        // Request location permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        setLocationPermission(status === 'granted');
        
        if (status !== 'granted') {
          console.log('Location permission denied');
          return;
        }
        
        // Get initial location
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });
        
        const locationRegion = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        };
        
        setUserLocation(locationRegion);
        
        // Subscribe to location updates
        locationSubscription = await Location.watchPositionAsync(
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
      } catch (error) {
        console.error('Error setting up location tracking:', error);
        Alert.alert(
          "Location Error",
          "Could not get your location. Using default location instead."
        );
      }
    };
    
    setupLocationTracking();
    
    // Cleanup location subscription
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#ffb31a',
        tabBarStyle: { 
          height: 70,
          paddingBottom: 10,
          paddingTop: 5,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
          elevation: 4,
          backgroundColor: '#fff',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          zIndex: 1000, // Ensure tab bar stays on top
        },
        tabBarLabelStyle: { fontSize: 11, marginTop: 2 },
        tabBarIconStyle: { marginBottom: -8 },
      }}
    >
      {/* Home tab - Find Meals */}
      <Tab.Screen
        name="Find"
        children={() => <MealMap userLocation={userLocation} session={session} />}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="map-marker" type="font-awesome" color={color} size={22} />
          ),
        }}
      />

      {/* Updated tab - My Meals */}
      <Tab.Screen
        name="My Meals"
        children={() => <MyMeals session={session} />}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="list" type="font-awesome" color={color} size={22} />
          ),
        }}
      />

      {/* Host tab */}
      <Tab.Screen
        name="Host"
        children={() => <HostMeal session={session} userLocation={userLocation} />}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="cutlery" type="font-awesome" color={color} size={22} />
          ),
        }}
      />

      {/* Notifications tab */}
      <Tab.Screen
        name="Notifications"
        children={() => <Notifications session={session} />}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="bell" type="font-awesome" color={color} size={22} />
          ),
        }}
      />

      {/* Account tab */}
      <Tab.Screen
        name="Account"
        children={() => <AccountScreen session={session} />}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="user" type="font-awesome" color={color} size={22} />
          ),
        }}
      />
    </Tab.Navigator>
  )
}