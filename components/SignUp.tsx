import React, { useState } from 'react'
import { View, Text, Alert, StyleSheet } from 'react-native'
import { Button, Input } from '@rneui/themed'
import { supabase } from '../lib/supabase'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(false)

  async function signUpWithEmail() {
    setLoading(true)

    const { data: { session }, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: userName,
        },
      },
    })

    if (error) Alert.alert('Sign up error', error.message)
    else if (!session) Alert.alert('Check your email to confirm your sign up.')
    setLoading(false)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>What's your email address?</Text>
      <Text style={styles.heading}>This will be used to sign in again</Text>

      <Input
        placeholder="Email"
        leftIcon={{ type: 'font-awesome', name: 'envelope' }}
        onChangeText={setEmail}
        value={email}
        autoCapitalize="none"
      />
      <Input
        placeholder="Password"
        leftIcon={{ type: 'font-awesome', name: 'lock' }}
        onChangeText={setPassword}
        value={password}
        secureTextEntry
        autoCapitalize="none"
      />
      <Button title="Sign Up" onPress={signUpWithEmail} disabled={loading} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#ffb31a',
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 30,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
})
