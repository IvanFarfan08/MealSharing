import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { StyleSheet, View, Alert } from 'react-native'
import { Button, Text } from '@rneui/themed'
import { useNavigation } from '@react-navigation/native'
import { Session } from '@supabase/supabase-js'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../App'  

export default function Account({ session }: { session: Session }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Account'>>()
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  useEffect(() => {
    if (session) getProfile()
  }, [session])

  async function getProfile() {
    try {
      setLoading(true)
      if (!session?.user) throw new Error('No user on the session!')

      const { data, error, status } = await supabase
        .from('profiles')
        .select(`username, website, avatar_url`)
        .eq('id', session.user.id)
        .single()
      if (error && status !== 406) {
        throw error
      }

      if (data) {
        setUsername(data.username)
        setAvatarUrl(data.avatar_url)
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  async function updateProfile({
    username,
    avatar_url,
  }: {
    username: string
    avatar_url: string
  }) {
    try {
      setLoading(true)
      if (!session?.user) throw new Error('No user on the session!')

      const updates = {
        id: session.user.id,
        username,
        avatar_url,
        updated_at: new Date(),
      }

      const { error } = await supabase.from('profiles').upsert(updates)

      if (error) throw error
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <View>
        <Text h3>Welcome {username || 'User'}!</Text>
      </View>

      <View style={{ flex: 2, flexDirection: 'row', justifyContent: 'space-between', padding: 10, top: 250 }}>
        <Button
          title="Host Meal"
          icon={{ type: 'font-awesome', name: 'cutlery', color: '#2089dc' }}
          iconContainerStyle={{ padding: 8 }}
          iconPosition="top"
          type="outline"
          buttonStyle={{ borderRadius: 5, height: 100 }}
          onPress={() => navigation.navigate('HostMeal')}
        />
        <Button
          title="Find Meals"
          icon={{ type: 'font-awesome', name: 'location-arrow', color: '#2089dc' }}
          iconContainerStyle={{ padding: 8 }}
          iconPosition="top"
          type="outline"
          buttonStyle={{ borderRadius: 5, height: 100 }}
          onPress={() => navigation.navigate('FindMeals')}
        />
        <Button
          title="Sign Out"
          icon={{ type: 'font-awesome', name: 'sign-out', color: '#2089dc' }}
          iconContainerStyle={{ padding: 8 }}
          iconPosition="top"
          type="outline"
          buttonStyle={{ borderRadius: 5, height: 100 }}
          onPress={() => supabase.auth.signOut()}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: 'stretch',
  },
  mt20: {
    marginTop: 20,
  },
})
