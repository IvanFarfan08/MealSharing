import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { Input } from '@rneui/themed'
import { useNavigation } from '@react-navigation/native'
import { supabase } from '../lib/supabase'

export default function LoginScreen() {
  const navigation = useNavigation<any>()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter both email and password.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      Alert.alert('Login Failed', error.message)
    }

    setLoading(false)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Welcome back!</Text>
      <Text style={styles.subheading}>Log in to continue</Text>

      <Input
        placeholder="Email"
        leftIcon={{ type: 'font-awesome', name: 'envelope' }}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Input
        placeholder="Password"
        leftIcon={{ type: 'font-awesome', name: 'lock' }}
        rightIcon={{
          type: 'font-awesome',
          name: showPassword ? 'eye-slash' : 'eye',
          onPress: () => setShowPassword(!showPassword),
        }}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.6 }]}
        disabled={loading}
        onPress={handleLogin}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Log In</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('EmailScreen')}>
        <Text style={styles.altText}>Don’t have an account? Sign Up</Text>
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
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subheading: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#ffb31a',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
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
  altText: {
    color: '#ffb31a',
    textAlign: 'center',
    fontSize: 16,
    marginTop: 8,
  },
})
