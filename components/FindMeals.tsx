import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Text, Button } from '@rneui/themed'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from './Welcome'

export default function FindMeals() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'FindMeals'>>()

  return (
    <View style={styles.container}>
      <Text h2>Find Meals</Text>
      <Text style={styles.subtitle}>Discover meals shared by people in your community</Text>
      
      <View style={styles.buttonContainer}>
        <Button 
          title="Go Back" 
          onPress={() => navigation.goBack()} 
          type="outline"
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
  buttonContainer: {
    marginTop: 30,
    width: '100%',
  }
})
