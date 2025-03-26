import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Input } from '@rneui/themed'
import { useNavigation } from '@react-navigation/native'

export default function EmailScreen() {
  const [email, setEmail] = useState('')
  const navigation = useNavigation<any>()

  const isValidEmail = (email: string) => /\S+@\S+\.\S+/.test(email)

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>✕</Text>
      </TouchableOpacity>

      <Text style={styles.heading}>What's your email?</Text>

      <Input
        placeholder="you@example.com"
        leftIcon={{ type: 'font-awesome', name: 'envelope' }}
        onChangeText={setEmail}
        value={email}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TouchableOpacity
        style={[styles.button, !isValidEmail(email) && { opacity: 0.5 }]}
        disabled={!isValidEmail(email)}
        onPress={() => navigation.navigate('PasswordScreen', { email })}
      >
        <Text style={styles.buttonText}>Continue</Text>
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
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#ffb31a',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 18,
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
