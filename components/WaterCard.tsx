import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions } from 'react-native';
import { Edit2 } from 'lucide-react-native';
import Colors from '../constants/Colors';

interface WaterCardProps {
  currentLiters: number;
  goalLiters: number;
  onEdit?: () => void;
}

export default function WaterCard({ currentLiters, goalLiters, onEdit }: WaterCardProps) {
  const GLASS_SIZE = 0.25; // Standard glass is 250ml
  const totalGlasses = Math.ceil(goalLiters / GLASS_SIZE);
  const filledGlasses = currentLiters / GLASS_SIZE;
  
  const glasses = [];
  for (let i = 0; i < totalGlasses; i++) {
    let status = 'empty';
    if (filledGlasses >= i + 1) {
      status = 'full';
    } else if (filledGlasses > i) {
      status = 'half';
    }
    glasses.push(status);
  }

  const glassesLeft = Math.max(0, totalGlasses - Math.floor(filledGlasses));

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Water</Text>
        <TouchableOpacity onPress={onEdit} style={styles.editButton}>
          <Edit2 size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.glassesContainer}
      >
        <View style={styles.glassesGrid}>
          {glasses.map((status, index) => (
            <View key={index} style={styles.glassWrapper}>
              <Image 
                source={
                  status === 'full' 
                    ? require('../assets/images/full_glass.png') 
                    : status === 'half'
                    ? require('../assets/images/half_glass.png')
                    : require('../assets/images/empty_glass.png')
                } 
                style={styles.glassImage}
                resizeMode="contain"
              />
            </View>
          ))}
        </View>
      </ScrollView>

      {glassesLeft > 0 ? (
        <Text style={styles.footerText}>
          {glassesLeft} {glassesLeft === 1 ? 'glass' : 'glasses'} left to stay hydrated
        </Text>
      ) : (
        <Text style={[styles.footerText, { color: Colors.primary }]}>
          Daily hydration goal reached! 💧
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    width: '100%',
    borderRadius: 24,
    padding: 20,
    paddingTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  editButton: {
    padding: 5,
  },
  glassesContainer: {
    paddingVertical: 10,
    minWidth: '100%',
  },
  glassesGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    // We don't need a strict grid if we have horizontal scroll, 
    // but the user said "maximum in one row 8 glasses if more add a scroll behavior".
    // This usually means if > 8, we scroll.
  },
  glassWrapper: {
    width: 45,
    height: 60,
    marginHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassImage: {
    width: '100%',
    height: '100%',
  },
  footerText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
});
