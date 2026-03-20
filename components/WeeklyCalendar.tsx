import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import Colors from '../constants/Colors';

interface WeeklyCalendarProps {
  onDateSelect?: (date: Date) => void;
  selectedDate?: Date;
}

export default function WeeklyCalendar({ onDateSelect, selectedDate: externalSelectedDate }: WeeklyCalendarProps) {
  const [internalSelectedDate, setInternalSelectedDate] = useState(new Date());
  
  const selectedDate = externalSelectedDate || internalSelectedDate;

  // Generate 30 days of historical dates (including today)
  const dates = useMemo(() => {
    const d = [];
    for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        d.push(date);
    }
    return d;
  }, []);

  const formatDate = (date: Date) => {
    const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date).toUpperCase();
    const dayNumber = date.getDate().toString();
    const isToday = new Date().toDateString() === date.toDateString();
    const isSelected = selectedDate.toDateString() === date.toDateString();
    
    return { dayName, dayNumber, isToday, isSelected };
  };

  const handleDatePress = (date: Date) => {
    setInternalSelectedDate(date);
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  const renderItem = ({ item }: { item: Date }) => {
    const { dayName, dayNumber, isToday, isSelected } = formatDate(item);

    return (
      <TouchableOpacity 
        onPress={() => handleDatePress(item)}
        style={[
          styles.dayContainer, 
          isToday && !isSelected && styles.todayContainer,
          isSelected && styles.selectedContainer
        ]}
      >
        <Text style={[
          styles.dayName, 
          isSelected && styles.selectedText,
          isToday && !isSelected && styles.todayText
        ]}>
          {dayName}
        </Text>
        <View style={styles.numberCircle}>
          <Text style={styles.dayNumber}>
            {dayNumber}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={dates}
        renderItem={renderItem}
        keyExtractor={(item) => item.toISOString()}
        horizontal
        inverted // Start from today on the right and scroll left for past dates
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    height: 110,
    width: '100%',
    paddingVertical: 5,
  },
  listContent: {
    paddingHorizontal: 10,
  },
  dayContainer: {
    width: 55,
    height: 95,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 30,
    marginHorizontal: 4,
    backgroundColor: '#F8F9F8',
    paddingVertical: 12,
  },
  todayContainer: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  selectedContainer: {
    backgroundColor: '#2D9C5E',
  },
  numberCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dayName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  selectedText: {
    color: '#fff',
  },
  todayText: {
    color: Colors.primary,
  },
});
