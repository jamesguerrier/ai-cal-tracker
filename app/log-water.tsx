import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Platform
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Plus, Minus, Droplet } from 'lucide-react-native';
import { useAuth } from '@clerk/clerk-expo';
import { doc, getDoc, setDoc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import Colors from '../constants/Colors';

const { width } = Dimensions.get('window');

const GLASS_SIZE_ML = 250;
const HALF_GLASS_ML = 125;
const MAX_GLASSES = 4;
const MAX_WATER_ML = GLASS_SIZE_ML * MAX_GLASSES;

export default function LogWaterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const [waterMl, setWaterMl] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const handleIncrement = () => {
    if (waterMl < MAX_WATER_ML) {
      setWaterMl(prev => prev + HALF_GLASS_ML);
    }
  };

  const handleDecrement = () => {
    if (waterMl > 0) {
      setWaterMl(prev => prev - HALF_GLASS_ML);
    }
  };

  const handleSave = async () => {
    if (!userId || waterMl === 0) return;
    
    setIsSaving(true);
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const totalsRef = doc(db, 'users', userId, 'dailyLogs', dateStr);
      const entriesRef = collection(db, 'users', userId, 'dailyLogs', dateStr, 'entries');

      const waterLiters = waterMl / 1000;

      await addDoc(entriesRef, {
        type: 'water',
        water: waterLiters,
        unit: 'L',
        createdAt: new Date().toISOString(),
        title: `Water Intake (${waterMl}ml)`
      });

      const docSnap = await getDoc(totalsRef);
      if (!docSnap.exists()) {
        await setDoc(totalsRef, {
          calories: 0,
          protein: 0,
          fat: 0,
          carbs: 0,
          water: waterLiters,
          exerciseCalories: 0
        });
      } else {
        await updateDoc(totalsRef, {
          water: increment(waterLiters)
        });
      }
      
      router.back();
    } catch (e) {
      console.error("Error saving water log", e);
    } finally {
      setIsSaving(false);
    }
  };

  const renderGlasses = () => {
    const glassesArray = [];
    const fullGlasses = Math.floor(waterMl / GLASS_SIZE_ML);
    const hasHalfGlass = (waterMl % GLASS_SIZE_ML) >= HALF_GLASS_ML;

    for (let i = 0; i < fullGlasses; i++) {
      glassesArray.push(
        <Image 
          key={`full-${i}`}
          source={require('../assets/images/full_glass.png')} 
          style={styles.glassImage}
          resizeMode="contain"
        />
      );
    }

    if (hasHalfGlass) {
      glassesArray.push(
        <Image 
          key="half"
          source={require('../assets/images/half_glass.png')} 
          style={styles.glassImage}
          resizeMode="contain"
        />
      );
    }

    if (glassesArray.length === 0) {
      return (
        <Image 
          source={require('../assets/images/empty_glass.png')} 
          style={styles.glassImageLarge}
          resizeMode="contain"
        />
      );
    }

    return (
      <View style={styles.glassesGrid}>
        {glassesArray}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={28} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Water Intake</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageContainer}>
          {renderGlasses()}
        </View>

        <View style={styles.controlsContainer}>
          <TouchableOpacity 
            style={[styles.controlButton, waterMl === 0 && styles.disabledButton]} 
            onPress={handleDecrement}
            disabled={waterMl === 0}
          >
            <Minus size={32} color={waterMl === 0 ? Colors.textMuted : Colors.primary} />
          </TouchableOpacity>

          <View style={styles.mlDisplay}>
            <Text style={styles.mlValue}>{waterMl}</Text>
            <Text style={styles.mlUnit}>ml</Text>
          </View>

          <TouchableOpacity 
            style={[styles.controlButton, waterMl >= MAX_WATER_ML && styles.disabledButton]} 
            onPress={handleIncrement}
            disabled={waterMl >= MAX_WATER_ML}
          >
            <Plus size={32} color={waterMl >= MAX_WATER_ML ? Colors.textMuted : Colors.primary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.infoText}>
          {waterMl === 0 ? "Drink some water!" : `You're drinking ${(waterMl / 1000).toFixed(2)}L`}
        </Text>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <TouchableOpacity 
          style={[styles.saveButton, (waterMl === 0 || isSaving) && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={waterMl === 0 || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={styles.saveButtonInner}>
              <Droplet size={20} color="#fff" style={styles.saveIcon} />
              <Text style={styles.saveButtonText}>Log Water</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  imageContainer: {
    marginVertical: 40,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  glassImageLarge: {
    width: width * 0.6,
    height: 300,
  },
  glassImage: {
    width: 100,
    height: 140,
    margin: 10,
  },
  glassesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
    marginTop: 20,
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  disabledButton: {
    opacity: 0.5,
  },
  mlDisplay: {
    alignItems: 'center',
    minWidth: 100,
  },
  mlValue: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.text,
  },
  mlUnit: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textMuted,
    marginTop: -5,
  },
  infoText: {
    marginTop: 40,
    fontSize: 16,
    color: Colors.textMuted,
    fontWeight: '600',
    textAlign: 'center',
  },
  footer: {
    padding: 24,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveIcon: {
    marginRight: 8,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.textMuted,
    shadowOpacity: 0.1,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
