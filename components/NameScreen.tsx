import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { Input } from '@rneui/themed'
import { useNavigation, useRoute } from '@react-navigation/native'
import { supabase } from '../lib/supabase'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../App'

type NameScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'NameScreen'>

export default function NameScreen() {
  const navigation = useNavigation<NameScreenNavigationProp>()
  const route = useRoute()
  const { email, password } = route.params as { email: string; password: string }

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignUp() {
    setLoading(true)
  
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    })
  
    if (error) {
      Alert.alert('Sign up error', error.message)
    }
  
    setLoading(false)

  }
  
  

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      <Text style={styles.heading}>What’s your name?</Text>

      <Input
        placeholder="First Name"
        leftIcon={{ type: 'font-awesome', name: 'user' }}
        onChangeText={setFirstName}
        value={firstName}
      />
      <Input
        placeholder="Last Name"
        leftIcon={{ type: 'font-awesome', name: 'user' }}
        onChangeText={setLastName}
        value={lastName}
      />

      <TouchableOpacity
        style={[styles.button, (!firstName || !lastName) && { opacity: 0.5 }]}
        disabled={!firstName || !lastName || loading}
        onPress={handleSignUp}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Signing you up...' : 'Finish Sign Up'}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  heading: {
    fontSize: 24,
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#ffb31a',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
  },
  backText: {
    fontSize: 24,
  },
})
