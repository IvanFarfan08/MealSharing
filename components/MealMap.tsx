import React, { useState, useEffect } from 'react'
import { View, Alert, TouchableOpacity, StyleSheet, Text, ScrollView, Switch } from 'react-native'
import { Image, Button, Dialog, Slider, CheckBox, Divider, ButtonGroup, ListItem } from '@rneui/themed'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Ionicons } from '@expo/vector-icons'
import MapView, { Marker, Callout } from 'react-native-maps'
import { supabase } from '../lib/supabase'
import { Session } from '@supabase/supabase-js'

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
        filters.ingredients.forEach(ingredient => {
          query = query.contains('ingredients', [ ingredient ]);
        });
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
  
      const alreadyJoined = selectedMeal.joined_guests?.includes(session.user.id)
      if (alreadyJoined) {
        Alert.alert('Already Joined', 'You have already joined this meal.')
        return
      }
  
      const updatedGuests = [...(selectedMeal.joined_guests || []), session.user.id]
  
      const { error } = await supabase
        .from('meals')
        .update({ joined_guests: updatedGuests })
        .eq('id', selectedMeal.id)
  
      if (error) {
        Alert.alert('Join Error', error.message)
      } else {
        Alert.alert('Joined Meal', `You have joined the meal: ${selectedMeal.name}`)
        fetchMeals()
      }
    }

  useEffect(() => {
    fetchMeals();
    // Also fetch filter options when component mounts
    fetchFilterOptions();
  }, []);
  
  useEffect(() => {
    setRegion(userLocation);
  }, [userLocation]);

  const styles = StyleSheet.create({
    refreshButton: {
      position: 'absolute',
      bottom: 20,
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
      elevation: 5
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
    }
  });

  return (
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
        {meals.map(meal => (
          <Marker
            key={meal.id}
            coordinate={{
              latitude: meal.location.latitude,
              longitude: meal.location.longitude
            }}
            onCalloutPress={() => {
              // Handle the callout press
              console.log('Join meal pressed:', meal);
              setSelectedMeal(meal);
              handleJoinMeal();
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
                  {new Date(meal.meal_date).toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour12: true, hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Text style={styles.calloutGuests}>
                  Guests: {meal.joined_guests && meal.joined_guests.length > 0 ? meal.joined_guests.length : 0} / {meal.max_guests}
                </Text>
                <View style={styles.calloutButton}>
                  <Text style={styles.calloutButtonText}>Join Meal</Text>
                </View>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
      
      <TouchableOpacity 
        style={styles.refreshButton} 
        onPress={handleRefresh}
      >
        <Ionicons name="refresh" size={24} color="white" />
      </TouchableOpacity>
      <Button
        icon={<Ionicons name="filter" size={24} color="white" />}
        buttonStyle={{
          backgroundColor: '#ffb31a',
          borderRadius: 30,
          width: 60,
          height: 60,
        }}
        containerStyle={{
          position: 'absolute',
          bottom: 90, 
          right: 20,
        }}
        onPress={handleFilter}
      />
      
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
  )
}