import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native'
import { Text, Card, Button } from '@rneui/themed'
import { supabase } from '../lib/supabase'
import { Session } from '@supabase/supabase-js'
import { useFocusEffect } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Notifications({ session }: { session: Session }) {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userProfiles, setUserProfiles] = useState<{[key: string]: any}>({})

  const fetchNotifications = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      Alert.alert('Error fetching notifications', error.message)
    } else {
      setNotifications(data || [])
      
      // Extract unique user IDs from notifications
      const userIds = new Set<string>()
      data?.forEach(notification => {
        if (notification.host_id) userIds.add(notification.host_id)
        if (notification.guest_id) userIds.add(notification.guest_id)
      })
      
      // Fetch user profiles for all IDs
      if (userIds.size > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', Array.from(userIds))
        
        if (!profilesError && profiles) {
          const profileMap: {[key: string]: any} = {}
          profiles.forEach(profile => {
            profileMap[profile.id] = profile
          })
          setUserProfiles(profileMap)
        }
      }
    }
    setLoading(false)
  }

  useFocusEffect(
    React.useCallback(() => {
      fetchNotifications()
    }, [])
  )

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    if (error) {
      Alert.alert('Error updating notification', error.message)
    } else {
      fetchNotifications()
    }
  }

  const deleteNotification = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (error) {
      Alert.alert('Error deleting notification', error.message)
    } else {
      fetchNotifications()
    }
  }

  const handleAcceptRequest = async (notification: any) => {
    // First, get the current meal data
    const { data: mealData, error: fetchError } = await supabase
      .from('meals')
      .select('requested_guests, joined_guests')
      .eq('id', notification.meal_id)
      .single()
    
    if (fetchError) {
      Alert.alert('Error fetching meal data', fetchError.message)
      return
    }
    
    // Update the arrays
    const updatedRequested = (mealData.requested_guests || []).filter((id: string) => id !== notification.guest_id)
    const updatedJoined = [...(mealData.joined_guests || []), notification.guest_id]
    
    const { error } = await supabase
      .from('meals')
      .update({
        requested_guests: updatedRequested,
        joined_guests: updatedJoined
      })
      .eq('id', notification.meal_id)

    if (error) {
      Alert.alert('Error accepting request', error.message)
    } else {
      // Create a notification for the accepted guest
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: notification.guest_id,
          type: 'request_accepted',
          meal_id: notification.meal_id,
          meal_name: notification.meal_name,
          host_id: session.user.id,
          host_name: userProfiles[session.user.id]?.full_name || 'Host',
          read: false,
          created_at: new Date().toISOString(),
        })

      if (notificationError) {
        console.error('Error creating notification:', notificationError)
      }

      // Delete the original request notification
      await deleteNotification(notification.id)
      
      Alert.alert('Success', 'Guest request accepted')
    }
  }

  const handleDenyRequest = async (notification: any) => {
    // Implementation for denying a request
    Alert.alert('Request denied', 'This feature is not implemented yet')
  }

  const renderNotificationContent = (notification: any) => {
    // Get the full name from our profiles cache or use the stored name
    const hostName = userProfiles[notification.host_id]?.full_name || notification.host_name || 'Host'
    const guestName = userProfiles[notification.guest_id]?.full_name || notification.guest_name || 'Guest'
    
    switch (notification.type) {
      case 'request_denied':
        return (
          <View>
            <Text style={styles.notificationText}>
              Your request to join <Text style={styles.bold}>{notification.meal_name}</Text> has been denied by <Text style={styles.bold}>{hostName}</Text>.
            </Text>
            <Text style={styles.notificationDate}>
              {new Date(notification.created_at).toLocaleString()}
            </Text>
          </View>
        )
      case 'request_accepted':
        return (
          <View>
            <Text style={styles.notificationText}>
              Your request to join <Text style={styles.bold}>{notification.meal_name}</Text> has been accepted by <Text style={styles.bold}>{hostName}</Text>.
            </Text>
            <Text style={styles.notificationDate}>
              {new Date(notification.created_at).toLocaleString()}
            </Text>
          </View>
        )
      case 'join_request':
        return (
          <View>
            <Text style={styles.notificationText}>
              <Text style={styles.bold}>{guestName}</Text> has requested to join your meal <Text style={styles.bold}>{notification.meal_name}</Text>.
            </Text>
            <Text style={styles.notificationDate}>
              {new Date(notification.created_at).toLocaleString()}
            </Text>
            <Button
              title="Accept Request"
              onPress={() => handleAcceptRequest(notification)}
              buttonStyle={styles.acceptButton}
            />
            <Button
              title="Deny Request"
              onPress={() => handleDenyRequest(notification)}
              buttonStyle={styles.denyButton}
            />
          </View>
        )
      default:
        return (
          <Text style={styles.notificationText}>
            {notification.message || 'You have a new notification'}
          </Text>
        )
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Text h3 style={styles.title}>Notifications</Text>
        
        {loading ? (
          <Text style={styles.loadingText}>Loading notifications...</Text>
        ) : notifications.length === 0 ? (
          <Text style={styles.emptyText}>You have no notifications</Text>
        ) : (
          notifications.map((notification) => (
            <Card 
              key={notification.id} 
              containerStyle={[
                styles.notificationCard,
                !notification.read && styles.unreadCard
              ]}
            >
              {renderNotificationContent(notification)}
              
              <View style={styles.actionButtons}>
                {!notification.read && (
                  <Button
                    title="Mark as Read"
                    onPress={() => markAsRead(notification.id)}
                    buttonStyle={styles.readButton}
                  />
                )}
                <Button
                  title="Delete"
                  onPress={() => deleteNotification(notification.id)}
                  buttonStyle={styles.deleteButton}
                />
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF3E0',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFF3E0',
    padding: 16,
    paddingBottom: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#ffb31a',
    textAlign: 'center',
    paddingTop: 10,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  notificationCard: {
    borderRadius: 10,
    marginBottom: 15,
    padding: 15,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#ffb31a',
  },
  notificationText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  bold: {
    fontWeight: 'bold',
  },
  notificationDate: {
    fontSize: 12,
    color: '#888',
    marginBottom: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  readButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  deleteButton: {
    backgroundColor: '#f44336',
    borderRadius: 20,
    paddingHorizontal: 15,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    paddingHorizontal: 15,
    marginTop: 10,
  },
  denyButton: {
    backgroundColor: '#f44336',
    borderRadius: 20,
    paddingHorizontal: 15,
    marginTop: 10,
    marginLeft: 10,
  },
}) 