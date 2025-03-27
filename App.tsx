import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { Session } from '@supabase/supabase-js'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

// Screens
import Welcome from './components/Welcome'
import LoginScreen from './components/LogInScreen'
import EmailScreen from './components/EmailScreen'
import PasswordScreen from './components/PasswordScreen'
import NameScreen from './components/NameScreen'
import MainTabs from './components/Tabs' // Bottom tab navigator

export type RootStackParamList = {
  Welcome: undefined;
  LoginScreen: undefined;
  EmailScreen: undefined;
  PasswordScreen: { email: string };
  NameScreen: { email: string; password: string };
  MainTabs: undefined;
  FindMeals: undefined;
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function App() {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session && session.user ? (
          <>
            <Stack.Screen name="MainTabs">
              {() => <MainTabs session={session} />}
            </Stack.Screen>
          </>
        ) : (
          <>
            <Stack.Screen name="Welcome" component={Welcome} />
            <Stack.Screen name="LoginScreen" component={LoginScreen} />
            <Stack.Screen name="EmailScreen" component={EmailScreen} />
            <Stack.Screen name="PasswordScreen" component={PasswordScreen} />
            <Stack.Screen name="NameScreen" component={NameScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}