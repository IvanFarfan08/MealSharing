import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ghnavogwqqqfesescbzy.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobmF2b2d3cXFxZmVzZXNjYnp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4NTc2OTcsImV4cCI6MjA1ODQzMzY5N30.IPNur3uKOCxHnHI2-VRdUbLYVmoRUFtqFdTl83TJPEs'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})