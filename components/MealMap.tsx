//mealmap
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { View, Alert, TouchableOpacity, StyleSheet, Text, ScrollView, Switch, Dimensions, Modal } from 'react-native'
import { Image, Button, Dialog, Slider, CheckBox, Divider, ButtonGroup, ListItem, Card } from '@rneui/themed'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Ionicons } from '@expo/vector-icons'
import MapView, { Marker, Callout } from 'react-native-maps'
import { supabase } from '../lib/supabase'
import { Session } from '@supabase/supabase-js'
import BottomSheet, { BottomSheetView, BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import moment from 'moment-timezone'

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

const INITIAL_REGION: Region = {
  latitude: 37.78825,
  longitude: -122.4324,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
}

interface Meal {
  id: string;
  name: string;
  price: number;
  location: {
    latitude: number;
    longitude: number;
  };
  meal_date: string;
  max_guests: number;
  joined_guests?: any[];
  image_url?: string;
  // Add other meal properties as needed
}

interface MealMapProps {
  userLocation: Region;
  session: Session;
}

export default function MealMap({ userLocation, session }: MealMapProps) {
  const [region, setRegion] = useState<Region>(userLocation);
  const [loading, setLoading] = useState(false);
  const [meals, setMeals] = useState<any[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<any>(null);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Bottom sheet refs and snap points
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['25%', '50%', '90%'], []);

  // Filter states
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [filterTime, setFilterTime] = useState(false);

  // Event handler wrappers
  const handleRefresh = () => fetchMeals();
  const handleResetFilters = () => {
    setDateFilter(null);
    setSelectedIngredients([]);
    setFilterTime(false);
    fetchMeals();
    setShowFilterDialog(false);
  };

  // Bottom sheet callbacks
  const handleSheetChanges = useCallback((index: number) => {
    console.log('handleSheetChanges', index);
  }, []);

  const handleMealSelect = (meal: any) => {
    // Create a safe copy of the meal data with default values for missing properties
    const safeMeal = {
      id: meal.id || '',
      name: meal.name || 'Unnamed Meal',
      location: typeof meal.location === 'string' ? meal.location : 
                (meal.location_address || 'Location not specified'),
      location_coords: typeof meal.location === 'object' ? meal.location : 
                      (meal.location_coords || { latitude: 0, longitude: 0 }),
      price: meal.price || 0,
      meal_date: meal.meal_date || new Date().toISOString(),
      max_guests: meal.max_guests || 1,
      joined_guests: Array.isArray(meal.joined_guests) ? meal.joined_guests : [],
      image_url: meal.image_url || null,
      description: meal.description || '',
      courses: Array.isArray(meal.courses) ? meal.courses : [],
      ingredients: Array.isArray(meal.ingredients) ? meal.ingredients : [],
      dietary_restrictions: meal.dietary_restrictions || '',
      host_id: meal.host_id || ''
    };
    
    setSelectedMeal(safeMeal);
    setModalVisible(true);
  };

  // Extract unique ingredients from the meals table
  const fetchFilterOptions = async () => {
    try {
      // Fetch all meals to extract unique ingredients
      const { data: mealsData, error: mealsError } = await supabase
        .from('meals')
        .select('ingredients');

      if (mealsError) {
        console.error('Error fetching meal data:', mealsError);
        return;
      }

      // Extract unique ingredients from all meals
      const uniqueIngredients = new Set<string>();

      mealsData.forEach(meal => {
        // Handle ingredients (assuming it's an array in your database)
        if (meal.ingredients && Array.isArray(meal.ingredients)) {
          meal.ingredients.forEach(ingredient => {
            if (ingredient) uniqueIngredients.add(ingredient);
          });
        } else if (meal.ingredients && typeof meal.ingredients === 'string') {
          // Handle case where ingredients might be a string
          try {
            const parsedIngredients = JSON.parse(meal.ingredients);
            if (Array.isArray(parsedIngredients)) {
              parsedIngredients.forEach(ingredient => {
                if (ingredient) uniqueIngredients.add(ingredient);
              });
            }
          } catch (e) {
            // If it's not valid JSON, treat it as a single ingredient
            uniqueIngredients.add(meal.ingredients);
          }
        }
      });

      // Convert Set to Array and update state
      setIngredients(Array.from(uniqueIngredients));

    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const fetchMeals = async (filters?: {
    date?: Date | null,
    ingredients?: string[],
    filterTime?: boolean
  }) => {
    setLoading(true);

    let query = supabase
      .from('meals')
      .select('*');

    // Apply filters if provided
    if (filters) {
      // Date filter
      if (filters.date) {
        const filterDate = new Date(filters.date);
        filterDate.setHours(0, 0, 0, 0);

        // If filterTime is false, filter only by date
        if (!filters.filterTime) {
          const nextDay = new Date(filterDate);
          nextDay.setDate(nextDay.getDate() + 1);

          query = query
            .gte('meal_date', filterDate.toISOString())
            .lt('meal_date', nextDay.toISOString());
        } else {
          // If filterTime is true, filter by exact date/time
          query = query.eq('meal_date', filterDate.toISOString());
        }
      }

      // Ingredients filter
      if (filters.ingredients && filters.ingredients.length > 0) {
        // For each selected ingredient, create an "ingredients ?" condition
        // This handles each ingredient individually to avoid JSON syntax errors
        console.log(filters.ingredients)
        
        // Create a single contains query with all ingredients
        query = query.contains('ingredients', filters.ingredients);
      }
    }

    const { data, error } = await query;

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setMeals(data);
    }

    setLoading(false);
  }

  const handleFilter = () => {
    // Fetch filter options when opening the dialog
    fetchFilterOptions();
    setShowFilterDialog(true);
  }

  const applyFilters = () => {
    // Apply all selected filters
    fetchMeals({
      date: dateFilter,
      ingredients: selectedIngredients.length > 0 ? selectedIngredients : undefined,
      filterTime: filterTime
    });
    setShowFilterDialog(false);
  }

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDateFilter(selectedDate);
    }
  };

  const toggleIngredient = (ingredient: string) => {
    setSelectedIngredients(current =>
      current.includes(ingredient)
        ? current.filter(i => i !== ingredient)
        : [...current, ingredient]
    );
  };


  const handleJoinMeal = async () => {
    if (!selectedMeal) return

    if (selectedMeal.host_id === session.user.id) {
      Alert.alert('Not Allowed', 'You cannot join a meal you are hosting.')
      return
    }

    // Check if user profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', session.user.id)
      .single()

    if (profileError || !profile) {
      Alert.alert('Account Error', 'Your account profile could not be found. Please contact support.')
      return
    }

    const alreadyRequested = selectedMeal.requested_guests?.includes(session.user.id)
    const alreadyJoined = selectedMeal.joined_guests?.includes(session.user.id)

    if (alreadyJoined) {
      Alert.alert('Already Joined', 'You have already joined this meal.')
      return
    }

    if (alreadyRequested) {
      Alert.alert('Already Requested', 'Wait for the host to admit you.')
      return
    }

    const updatedRequests = [...(selectedMeal.requested_guests || []), session.user.id]

    const { error } = await supabase
      .from('meals')
      .update({ requested_guests: updatedRequests })
      .eq('id', selectedMeal.id)

    if (error) {
      Alert.alert('Request Failed', error.message)
    } else {
      // Create a notification for the host
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: selectedMeal.host_id,
          type: 'join_request',
          meal_id: selectedMeal.id,
          meal_name: selectedMeal.name,
          guest_id: session.user.id,
          guest_name: profile.full_name || 'Guest',
          read: false,
          created_at: new Date().toISOString(),
        })

      if (notificationError) {
        console.error('Error creating notification:', notificationError)
      }

      Alert.alert('Request Sent', 'Your join request has been sent to the host!')
      fetchMeals()
    }
  }

  useEffect(() => {
    // Initial fetch
    fetchMeals();
    fetchFilterOptions();
    
    // Set up auto-refresh interval (every 30 seconds)
    const refreshInterval = setInterval(() => {
      fetchMeals();
    }, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    setRegion(userLocation);
  }, [userLocation]);

  const styles = StyleSheet.create({
    refreshButton: {
      position: 'absolute',
      top: 100,
      right: 20,
      backgroundColor: '#ffb31a',
      borderRadius: 30,
      width: 60,
      height: 60,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      zIndex: 1000
    },
    filterButton: {
      position: 'absolute',
      top: 170,
      right: 20,
      backgroundColor: '#ffb31a',
      borderRadius: 30,
      width: 60,
      height: 60,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      zIndex: 1000
    },
    callout: {
      width: 200
    },
    calloutContainer: {
      backgroundColor: 'white',
      borderRadius: 10,
      padding: 15,
      width: 200,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5
    },
    calloutTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 5
    },
    calloutPrice: {
      fontSize: 16,
      color: '#ffb31a',
      fontWeight: 'bold',
      marginBottom: 5
    },
    calloutTime: {
      fontSize: 14,
      marginBottom: 5
    },
    calloutGuests: {
      fontSize: 14,
      marginBottom: 10
    },
    calloutImage: {
      width: 170,
      height: 100,
      borderRadius: 5
    },
    calloutImageContainer: {
      alignItems: 'center',
      marginBottom: 10
    },
    calloutButton: {
      backgroundColor: '#ffb31a',
      padding: 10,
      borderRadius: 5,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 5
    },
    calloutButtonText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 14
    },
    dialogContainer: {
      borderRadius: 10,
      width: '80%',
      padding: 20
    },
    filterLabel: {
      fontSize: 16,
      marginVertical: 10,
      textAlign: 'center'
    },
    filterSection: {
      marginVertical: 15
    },
    filterSectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 10
    },
    dateButton: {
      backgroundColor: '#ffb31a',
      padding: 10,
      borderRadius: 5,
      marginVertical: 10
    },
    dateButtonText: {
      color: 'white',
      textAlign: 'center',
      fontWeight: 'bold'
    },
    dateDisplay: {
      textAlign: 'center',
      fontSize: 16,
      marginVertical: 5
    },
    filterScroll: {
      maxHeight: 400
    },
    timeFilterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 5
    },
    bottomSheetContainer: {
      flex: 1,
      backgroundColor: '#fff',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      maxHeight: '80%',
    },
    bottomSheetHeader: {
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#fff',
    },
    bottomSheetTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
    },
    mealCard: {
      borderRadius: 12,
      marginBottom: 15,
      padding: 15,
      backgroundColor: '#fff',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    },
    mealImage: {
      width: '100%',
      height: 150,
      borderRadius: 8,
      marginBottom: 10,
    },
    mealTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 5,
    },
    mealInfo: {
      fontSize: 14,
      color: '#666',
      marginBottom: 3,
    },
    mealPrice: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#ffb31a',
      marginBottom: 5,
    },
    joinButton: {
      backgroundColor: '#ffb31a',
      borderRadius: 20,
      marginTop: 10,
    },
    pullIndicator: {
      width: 40,
      height: 5,
      backgroundColor: '#ddd',
      borderRadius: 3,
      alignSelf: 'center',
      marginTop: 10,
    },
    pullUpButton: {
      position: 'absolute',
      bottom: 20,
      alignSelf: 'center',
      backgroundColor: '#ffb31a',
      borderRadius: 20,
      paddingHorizontal: 20,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    pullUpButtonText: {
      color: 'white',
      fontWeight: 'bold',
      marginLeft: 5,
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: 20,
    },
    modalContent: {
      backgroundColor: 'white',
      borderRadius: 15,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    modalImage: {
      width: '100%',
      height: 200,
      borderRadius: 10,
      marginBottom: 15,
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      marginBottom: 10,
    },
    modalInfo: {
      fontSize: 16,
      marginBottom: 5,
    },
    modalPrice: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#ffb31a',
      marginBottom: 10,
    },
    modalButton: {
      backgroundColor: '#ffb31a',
      borderRadius: 20,
      marginTop: 15,
    },
    modalInfoContainer: {
      marginBottom: 10,
    },
    modalInfoLabel: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#666',
      marginBottom: 2,
    },
    modalCourse: {
      fontSize: 14,
      color: '#333',
      marginLeft: 10,
      marginBottom: 2,
    },
    modalButtonContainer: {
      marginTop: 15,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
  });

  // Filter meals to show only those that are available to join and not in the past
  const visibleMeals = meals.filter(meal => {
    const count = meal.joined_guests?.length || 0;
    const alreadyJoined = meal.joined_guests?.includes(session.user.id);
    const mealDate = new Date(meal.meal_date);
    const now = new Date();
    
    // Check if meal is in the future (including today) and not full
    return count < meal.max_guests && !alreadyJoined && mealDate >= now;
  });

  const displayDate = (dateString: string) => {
    return moment.tz(dateString, 'America/New_York').format('dddd, MMMM Do YYYY, h:mm A');
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, width: '100%', height: '100%' }}>
        <MapView
          style={{ flex: 1, width: '100%', height: '100%' }}
          initialRegion={INITIAL_REGION}
          region={region}
          showsUserLocation={true}
          showsMyLocationButton={true}
          followsUserLocation={true}
          zoomEnabled={true}
          zoomTapEnabled={true}
          zoomControlEnabled={true}
        >
          {visibleMeals.map(meal => {
            // Handle both object and string formats for location
            const location = typeof meal.location === 'object' ? meal.location : 
                            (meal.location_coords || { latitude: 0, longitude: 0 });
            
            return (
              <Marker
                key={meal.id}
                coordinate={{
                  latitude: location.latitude,
                  longitude: location.longitude
                }}
                onCalloutPress={() => {
                  // Handle the callout press
                  console.log('Join meal pressed:', meal);
                  handleMealSelect(meal);
                }}
              >
                <Callout tooltip style={styles.callout}>
                  <View style={styles.calloutContainer}>
                    <Text style={styles.calloutTitle}>{meal.name}</Text>
                    <Text style={styles.calloutPrice}>${meal.price}</Text>
                    <View style={styles.calloutImageContainer}>
                      <Image
                        source={{ uri: meal.image_url }}
                        style={styles.calloutImage}
                      />
                    </View>
                    <Text style={styles.calloutTime}>
                      {displayDate(meal.meal_date)}
                    </Text>
                    <Text style={styles.calloutGuests}>
                      Guests: {meal.joined_guests && meal.joined_guests.length > 0 ? meal.joined_guests.length : 0} / {meal.max_guests}
                    </Text>
                    <View style={styles.calloutButton}>
                      <Text style={styles.calloutButtonText}>View Details</Text>
                    </View>
                  </View>
                </Callout>
              </Marker>
            );
          })}
        </MapView>

        {/* Refresh Button */}
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
        >
          <Ionicons name="refresh" size={24} color="white" />
        </TouchableOpacity>

        {/* Filter Button */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={handleFilter}
        >
          <Ionicons name="filter" size={24} color="white" />
        </TouchableOpacity>

        {/* Bottom Sheet with Meal Cards */}
        <BottomSheet
          ref={bottomSheetRef}
          index={0}
          snapPoints={snapPoints}
          onChange={handleSheetChanges}
          enablePanDownToClose={false}
          backgroundStyle={styles.bottomSheetContainer}
          handleIndicatorStyle={{ backgroundColor: '#999' }}
        >
          <View style={styles.pullIndicator} />
          <View style={styles.bottomSheetHeader}>
            <Text style={styles.bottomSheetTitle}>Available Meals</Text>
            <Text>{visibleMeals.length} meals found</Text>
          </View>
          <BottomSheetScrollView contentContainerStyle={{ padding: 15, backgroundColor: '#fff' }}>
            {visibleMeals.length > 0 ? (
              visibleMeals.map(meal => (
                <TouchableOpacity key={meal.id} onPress={() => handleMealSelect(meal)}>
                  <Card containerStyle={styles.mealCard}>
                    {meal.image_url && (
                      <Image source={{ uri: meal.image_url }} style={styles.mealImage} />
                    )}
                    <Text style={styles.mealTitle}>{meal.name}</Text>
                    <Text style={styles.mealInfo}>
                      {displayDate(meal.meal_date)}
                    </Text>
                    <Text style={styles.mealPrice}>${meal.price}</Text>
                    <Text style={styles.mealInfo}>
                      {`Guests: ${meal.joined_guests?.length || 0}/${meal.max_guests}`}
                    </Text>
                    <Button 
                      title="Join Meal" 
                      onPress={() => handleMealSelect(meal)} 
                      buttonStyle={styles.joinButton} 
                    />
                  </Card>
                </TouchableOpacity>
              ))
            ) : (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ fontSize: 16, color: '#666' }}>No upcoming meals available</Text>
              </View>
            )}
          </BottomSheetScrollView>
        </BottomSheet>

        {/* Pull Up Button (visible when bottom sheet is at minimum height) */}
        <TouchableOpacity 
          style={styles.pullUpButton}
          onPress={() => bottomSheetRef.current?.expand()}
        >
          <Ionicons name="chevron-up" size={20} color="white" />
          <Text style={styles.pullUpButtonText}>Show Meals</Text>
        </TouchableOpacity>

        {/* Meal Detail Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              {selectedMeal && (
                <>
                  {selectedMeal.image_url && (
                    <Image source={{ uri: selectedMeal.image_url }} style={styles.modalImage} />
                  )}
                  <Text style={styles.modalTitle}>{selectedMeal.name}</Text>
                  
                  <View style={styles.modalInfoContainer}>
                    <Text style={styles.modalInfoLabel}>Location:</Text>
                    <Text style={styles.modalInfo}>{selectedMeal.location}</Text>
                  </View>
                  
                  <View style={styles.modalInfoContainer}>
                    <Text style={styles.modalInfoLabel}>Date & Time:</Text>
                    <Text style={styles.modalInfo}>
                      {displayDate(selectedMeal.meal_date)}
                    </Text>
                  </View>
                  
                  <View style={styles.modalInfoContainer}>
                    <Text style={styles.modalInfoLabel}>Price:</Text>
                    <Text style={styles.modalPrice}>${selectedMeal.price}</Text>
                  </View>
                  
                  <View style={styles.modalInfoContainer}>
                    <Text style={styles.modalInfoLabel}>Guests:</Text>
                    <Text style={styles.modalInfo}>
                      {selectedMeal.joined_guests?.length || 0}/{selectedMeal.max_guests}
                    </Text>
                  </View>
                  
                  {selectedMeal.description && (
                    <View style={styles.modalInfoContainer}>
                      <Text style={styles.modalInfoLabel}>Description:</Text>
                      <Text style={styles.modalInfo}>{selectedMeal.description}</Text>
                    </View>
                  )}
                  
                  {selectedMeal.courses && selectedMeal.courses.length > 0 && (
                    <View style={styles.modalInfoContainer}>
                      <Text style={styles.modalInfoLabel}>Courses:</Text>
                      {selectedMeal.courses.map((course: string, index: number) => (
                        <Text key={index} style={styles.modalCourse}>• {course}</Text>
                      ))}
                    </View>
                  )}
                  
                  {selectedMeal.ingredients && selectedMeal.ingredients.length > 0 && (
                    <View style={styles.modalInfoContainer}>
                      <Text style={styles.modalInfoLabel}>Ingredients:</Text>
                      <Text style={styles.modalInfo}>{selectedMeal.ingredients.join(', ')}</Text>
                    </View>
                  )}
                  
                  {selectedMeal.dietary_restrictions && (
                    <View style={styles.modalInfoContainer}>
                      <Text style={styles.modalInfoLabel}>Dietary Restrictions:</Text>
                      <Text style={styles.modalInfo}>{selectedMeal.dietary_restrictions}</Text>
                    </View>
                  )}
                  
                  <View style={styles.modalButtonContainer}>
                    <Button 
                      title="Join Meal" 
                      onPress={() => {
                        setModalVisible(false);
                        handleJoinMeal();
                      }} 
                      buttonStyle={styles.modalButton} 
                    />
                    <Button 
                      title="Close" 
                      onPress={() => setModalVisible(false)} 
                      type="clear" 
                    />
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>

        <Dialog
          isVisible={showFilterDialog}
          onBackdropPress={() => setShowFilterDialog(false)}
          overlayStyle={styles.dialogContainer}
        >
          <Dialog.Title title="Filter Meals" titleStyle={{ textAlign: 'center' }} />

          <ScrollView style={styles.filterScroll}>

            {/* Date Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Date</Text>

              {dateFilter && (
                <Text style={styles.dateDisplay}>
                  {dateFilter.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </Text>
              )}

              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {dateFilter ? 'Change Date' : 'Select Date'}
                </Text>
              </TouchableOpacity>

              {dateFilter && (
                <TouchableOpacity
                  onPress={() => setDateFilter(null)}
                >
                  <Text style={{ textAlign: 'center', color: '#999' }}>
                    Clear Date Filter
                  </Text>
                </TouchableOpacity>
              )}

              {showDatePicker && (
                <DateTimePicker
                  value={dateFilter || new Date()}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                />
              )}

              {dateFilter && (
                <View style={styles.timeFilterRow}>
                  <Text>Also filter by time</Text>
                  <Switch
                    value={filterTime}
                    onValueChange={setFilterTime}
                    trackColor={{ false: '#767577', true: '#ffb31a' }}
                    thumbColor="white"
                  />
                </View>
              )}
            </View>

            <Divider width={1} />

            {/* Ingredients Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Ingredients</Text>
              {ingredients.map((ingredient, index) => (
                <CheckBox
                  key={index}
                  title={ingredient}
                  checked={selectedIngredients.includes(ingredient)}
                  onPress={() => toggleIngredient(ingredient)}
                  containerStyle={{ backgroundColor: 'transparent', borderWidth: 0 }}
                  checkedColor="#ffb31a"
                />
              ))}
            </View>

          </ScrollView>

          <Dialog.Actions>
            <Dialog.Button
              title="RESET"
              onPress={handleResetFilters}
            />
            <Dialog.Button
              title="APPLY"
              titleStyle={{ color: '#ffb31a' }}
              onPress={applyFilters}
            />
          </Dialog.Actions>
        </Dialog>
      </View>
    </GestureHandlerRootView>
  )
}

