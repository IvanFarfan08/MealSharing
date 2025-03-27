import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import Account from './components/Account'
import { Session } from '@supabase/supabase-js'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import SignUp from './components/SignUp'
import FindMeals from './components/FindMeals'
import HostMeal from './components/HostMeal'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

const Stack = createNativeStackNavigator()

const stripePromise = loadStripe('pk_test_51R73KlQdLCvMgvw4tFMxS406PkgHFAvcSORcYy6oe3PxDOLut24VarpCDU7E9YDoGoEPoGJ1aK9Bu2ECSQe8zit500Qk3kB3Ba')

export default function App() {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  return (
    <Elements stripe={stripePromise}>
      <NavigationContainer>
        <Stack.Navigator>
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
              <Stack.Screen name="Login" component={Auth} />
              <Stack.Screen name="SignUp" component={SignUp} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </Elements>
  )
}
