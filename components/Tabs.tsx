import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Icon } from '@rneui/themed'

import AccountScreen from './Account'
import HostMeal from './HostMeal'
import MealMap from './MealMap'
import MyMeals from './MyMeals' // <-- Updated from SearchMeals
import { Session } from '@supabase/supabase-js'

const Tab = createBottomTabNavigator()

export default function MainTabs({ session }: { session: Session }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#ffb31a',
        tabBarStyle: { height: 60, paddingBottom: 5 },
        tabBarLabelStyle: { fontSize: 12 },
      }}
    >
      {/* Home tab - Find Meals */}
      <Tab.Screen
        name="Find"
        children={() => <MealMap />}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="map-marker" type="font-awesome" color={color} size={size} />
          ),
        }}
      />

      {/* Updated tab - My Meals */}
      <Tab.Screen
        name="My Meals"
        children={() => <MyMeals session={session} />}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="list" type="font-awesome" color={color} size={size} />
          ),
        }}
      />

      {/* Host tab */}
      <Tab.Screen
        name="Host"
        children={() => <HostMeal session={session} />}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="cutlery" type="font-awesome" color={color} size={size} />
          ),
        }}
      />

      {/* Account tab */}
      <Tab.Screen
        name="Account"
        children={() => <AccountScreen session={session} />}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="user" type="font-awesome" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  )
}