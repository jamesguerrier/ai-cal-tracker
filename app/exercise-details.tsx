import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  TextInput,
  Platform,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Info } from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import { useAuth } from '@clerk/clerk-expo';
import { db } from '../utils/firebase';
import { doc, collection, addDoc, updateDoc, increment, getDoc, setDoc } from 'firebase/firestore';
import Colors from '../constants/Colors';

const { width } = Dimensions.get('window');

export default function ExerciseDetailsScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const { type, title, subtitle } = useLocalSearchParams();
  
  const [intensity, setIntensity] = useState(1); // 0: Low, 1: Medium, 2: High
  const [duration, setDuration] = useState('30');
  const [selectedChip, setSelectedChip] = useState('30');
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  const durationChips = ['15', '30', '60', '90'];

  React.useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const plan = userSnap.data().userPlan;
        setUserProfile(plan);
      }
    };
    fetchUserData();
  }, [userId]);

  const calculateCalories = () => {
    const mins = parseInt(duration) || 0;
    const weight = userProfile?.weight || 70; // fallback to 70kg
    
    let met = 5;
    if (type === 'run') {
      // MET values for Running
      met = intensity === 2 ? 13.5 : intensity === 1 ? 10.0 : 7.0;
    } else {
      // MET values for Weight Lifting
      met = intensity === 2 ? 8.5 : intensity === 1 ? 6.0 : 3.5;
    }
    
    // Core MET formula: Calories = MET * weight_kg * (duration_hours)
    let burned = met * weight * (mins / 60);

    // Minor adjustments for Gender (using simple BMR-like factors if needed, 
    // but MET*Weight is standard for active burn)
    // If gender is female, active burn can be ~10% lower due to body composition standard
    if (userProfile?.gender === 'female') {
      burned *= 0.9;
    }
    
    return Math.round(burned);
  };

  const handleLogExercise = async () => {
    if (!userId) return;
    
    const calValue = calculateCalories();
    
    router.push({
      pathname: '/exercise-result',
      params: {
        calories: calValue.toString(),
        name: `${title}`,
        type: type as string,
        duration: duration,
        intensity: getIntensityLabel(intensity)
      }
    });
  };

  const getIntensityLabel = (value: number) => {
    if (value === 0) return 'Low';
    if (value === 1) return 'Medium';
    return 'High';
  };

  const handleChipPress = (val: string) => {
    setSelectedChip(val);
    setDuration(val);
  };

  const handleManualDuration = (val: string) => {
    setDuration(val);
    if (!durationChips.includes(val)) {
      setSelectedChip('');
    } else {
      setSelectedChip(val);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          <ArrowLeft size={28} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{title || 'Exercise Details'}</Text>
          <Text style={styles.headerSubtitle}>{subtitle || 'Specify your workout details'}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Intensity Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Intensity</Text>
            <Info size={18} color={Colors.textMuted} />
          </View>
          
          <View style={styles.intensityContainer}>
            <View style={styles.sliderLabels}>
              <Text style={[styles.intensityLabel, intensity === 0 && styles.activeIntensity]}>Low</Text>
              <Text style={[styles.intensityLabel, intensity === 1 && styles.activeIntensity]}>Medium</Text>
              <Text style={[styles.intensityLabel, intensity === 2 && styles.activeIntensity]}>High</Text>
            </View>
            
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={2}
              step={1}
              value={intensity}
              onValueChange={setIntensity}
              minimumTrackTintColor={Colors.primary}
              maximumTrackTintColor={Colors.border}
              thumbTintColor={Colors.primary}
            />
          </View>
        </View>

        {/* Duration Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Duration (minutes)</Text>
          </View>
          
          <View style={styles.chipsContainer}>
            {durationChips.map((chip) => (
              <TouchableOpacity 
                key={chip}
                style={[
                  styles.chip,
                  selectedChip === chip && styles.activeChip
                ]}
                onPress={() => handleChipPress(chip)}
              >
                <Text style={[
                  styles.chipText,
                  selectedChip === chip && styles.activeChipText
                ]}>{chip} min</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.manualInputContainer}>
            <Text style={styles.manualLabel}>Or enter manually:</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 45"
              value={duration}
              onChangeText={handleManualDuration}
              keyboardType="numeric"
              placeholderTextColor={Colors.textMuted}
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.continueButton, loading && styles.disabledButton]}
          onPress={handleLogExercise}
          disabled={loading}
        >
          <Text style={styles.continueButtonText}>
            {loading ? 'Logging...' : 'Log Exercise'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 2,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  intensityContainer: {
    paddingVertical: 10,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 5,
  },
  intensityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
    width: 60,
    textAlign: 'center',
  },
  activeIntensity: {
    color: Colors.primary,
    fontWeight: '800',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeChip: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  activeChipText: {
    color: '#fff',
  },
  manualInputContainer: {
    gap: 8,
  },
  manualLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
    marginLeft: 4,
  },
  input: {
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
  },
  continueButton: {
    backgroundColor: Colors.primary,
    padding: 18,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.7,
  },
});
