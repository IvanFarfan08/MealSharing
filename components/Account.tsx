import React, { useState, useEffect } from 'react'
import { StyleSheet, View, ScrollView, Alert } from 'react-native'
import { Text, Button } from '@rneui/themed'
import { Session } from '@supabase/supabase-js'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '../lib/supabase'
import LottieView from 'lottie-react-native'

export default function Account({ session }: { session: Session }) {
  const [username, setUsername] = useState('')

  useEffect(() => {
    if (session?.user) getProfile()
  }, [session])

  async function getProfile() {
    const { data } = await supabase
      .from('profiles')
      .select(`username`)
      .eq('id', session.user.id)
      .single()

    if (data) setUsername(data.username)
  }

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) Alert.alert('Error signing out', error.message)
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Account Settings</Text>

        <View style={styles.infoSection}>
          <Text style={styles.label}>Username:</Text>
          <Text style={styles.value}>{username}</Text>

          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{session.user.email}</Text>

          <Text style={styles.label}>User ID:</Text>
          <Text style={styles.value}>{session.user.id}</Text>
        </View>

        <Button
          title="Log Out"
          onPress={handleSignOut}
          buttonStyle={styles.logoutButton}
        />

        <LottieView
          source={require('../assets/animations/Animation3.json')}
          autoPlay
          loop
          style={{ width: '100%', height: 400, marginTop: 10 }}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF3E0',
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoSection: {
    marginBottom: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginTop: 12,
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#ffb31a',
    borderRadius: 30,
    paddingVertical: 12,
    marginTop: 10,
  },
})
