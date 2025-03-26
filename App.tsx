
import React from 'react'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { Session } from '@supabase/supabase-js'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

// Screens
import Welcome from './components/Welcome'
import LoginScreen from './components/LogInScreen'
import Account from './components/Account'
import FindMeals from './components/FindMeals'
import HostMeal from './components/HostMeal'
import EmailScreen from './components/EmailScreen'
import PasswordScreen from './components/PasswordScreen'
import NameScreen from './components/NameScreen'

export type RootStackParamList = {
  Welcome: undefined;
  LoginScreen: undefined;
  EmailScreen: undefined;
  PasswordScreen: { email: string };
  NameScreen: { email: string; password: string };
  Account: undefined;
  FindMeals: undefined;
  HostMeal: undefined;
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
            <Stack.Screen name="Account">
              {(props) => <Account {...props} session={session} />}
            </Stack.Screen>
            <Stack.Screen name="FindMeals" component={FindMeals} />
            <Stack.Screen name="HostMeal" component={HostMeal} />
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
