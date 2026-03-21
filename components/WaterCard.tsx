import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions } from 'react-native';
import { Edit2, Droplet } from 'lucide-react-native';
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

  const glassesLeft = Math.max(0, totalGlasses - filledGlasses);
  const formattedGlassesLeft = glassesLeft % 1 === 0 ? glassesLeft.toString() : glassesLeft.toFixed(1);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Water Intake</Text>
          <Text style={styles.headerSubtitle}>{currentLiters.toFixed(2)}L / {goalLiters.toFixed(1)}L Goal</Text>
        </View>
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

      <View style={styles.footer}>
        {glassesLeft > 0 ? (
          <View style={styles.footerContent}>
            <Droplet size={16} color={Colors.primary} />
            <Text style={styles.footerText}>
              <Text style={styles.highlightText}>{formattedGlassesLeft}</Text> {glassesLeft === 1 ? 'glass' : 'glasses'} left to reach your goal
            </Text>
          </View>
        ) : (
          <View style={styles.footerContent}>
            <Text style={[styles.footerText, { color: Colors.primary, fontWeight: '700' }]}>
              Goal reached! You're fully hydrated 💧
            </Text>
          </View>
        )}
      </View>
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
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '500',
    marginTop: 2,
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
  footer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  highlightText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
});
