// components/SearchMeals.tsx
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

export default function SearchMeals() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Search for meals coming soon!</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
  },
})
