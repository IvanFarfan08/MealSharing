import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Input } from '@rneui/themed'
import { useNavigation, useRoute } from '@react-navigation/native'

export default function PasswordScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const { email } = route.params

  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const getPasswordStrength = () => {
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/
    if (strongRegex.test(password)) return 'strong'
    else if (password.length >= 6) return 'weak'
    return 'very weak'
  }

  const getBorderColor = () => {
    const strength = getPasswordStrength()
    if (strength === 'strong') return '#00C851'      
    if (strength === 'weak') return '#ffbb33'       
    return '#ff4444'                                  
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      <Text style={styles.heading}>Create a password</Text>
      <Text style={styles.subheading}>Use at least 8 characters, 1 uppercase, 1 number, and 1 special character</Text>

      <Input
        placeholder="Password"
        leftIcon={{ type: 'font-awesome', name: 'lock' }}
        rightIcon={{
          type: 'font-awesome',
          name: showPassword ? 'eye-slash' : 'eye',
          onPress: () => setShowPassword(!showPassword),
        }}
        onChangeText={setPassword}
        value={password}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        inputContainerStyle={{ borderBottomColor: getBorderColor(), borderBottomWidth: 2 }}
      />

      <TouchableOpacity
        style={[styles.button, getPasswordStrength() !== 'strong' && { opacity: 0.5 }]}
        disabled={getPasswordStrength() !== 'strong'}
        onPress={() => navigation.navigate('NameScreen', { email, password })}
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
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subheading: {
    fontSize: 14,
    textAlign: 'center',
    color: '#777',
    marginBottom: 20,
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
