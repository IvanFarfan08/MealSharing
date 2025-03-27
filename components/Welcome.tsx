import React from 'react'
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import LottieView from 'lottie-react-native'
import type { RootStackParamList } from '../App' // ✅ Correct import

type WelcomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Welcome'>

export default function Welcome() {
  const navigation = useNavigation<WelcomeScreenNavigationProp>()

  return (
    <View style={styles.container}>
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.heading}>Welcome to MealSharing</Text>
        <Text style={styles.subheading}>A platform where you exchange flavors and stories</Text>

        {/* Lottie Animation - Wrapped in a fixed View */}
        <View style={styles.lottieContainer}>
          <LottieView
            source={require('../assets/animations/Animation1.json')}
            autoPlay
            loop
            style={styles.lottie}
          />
        </View>
      </View>

      {/* Custom Buttons */}
      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('LoginScreen')} 
        >
          <Text style={styles.buttonText}>Log In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.outlineButton]}
          onPress={() => navigation.navigate('EmailScreen')}
        >
          <Text style={[styles.buttonText, styles.outlineButtonText]}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  welcomeSection: {
    marginTop: 60,
    alignItems: 'center',
  },
  heading: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffb31a',
    textAlign: 'center',
    marginBottom: 12,
  },
  subheading: {
    fontSize: 18,
    textAlign: 'center',
    color: '#ffb31a',
    marginBottom: 20,
  },
  // Wrapped Lottie in a fixed container to prevent size overflow
  lottieContainer: {
    width: 300,
    height: 300,
    alignSelf: 'center',
    overflow: 'hidden', // Prevents unwanted resizing
  },
  lottie: {
    flex: 1, // Ensures it scales within the container
  },
  buttonSection: {
    marginBottom: 80,
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
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  outlineButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ffb31a',
  },
  outlineButtonText: {
    color: '#ffb31a',
  },
})
