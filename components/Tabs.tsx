import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Icon } from '@rneui/themed'

import AccountScreen from './Account'
import HostMeal from './HostMeal'
import FindMeals from './FindMeals'
import SearchMeals from './SearchMeals'
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
      {/* Make FindMeals first/home tab */}
      <Tab.Screen
        name="Find"
        component={FindMeals}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="map-marker" type="font-awesome" color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="Search"
        component={SearchMeals}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="search" type="font-awesome" color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="Host"
        children={() => <HostMeal session={session} />}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="cutlery" type="font-awesome" color={color} size={size} />
          ),
        }}
      />

      {/* Move Account to end */}
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
