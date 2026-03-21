import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Flame, Info } from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import { useAuth } from '@clerk/clerk-expo';
import { db } from '../utils/firebase';
import { doc, collection, addDoc, serverTimestamp, updateDoc, increment, getDoc, setDoc } from 'firebase/firestore';
import Colors from '../constants/Colors';

export default function ManualExerciseScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  
  const [calories, setCalories] = useState('');
  const [description, setDescription] = useState('');
  const [intensity, setIntensity] = useState(1); // 0: Low, 1: Medium, 2: High
  const [duration, setDuration] = useState('30');
  const [selectedChip, setSelectedChip] = useState('30');
  const [loading, setLoading] = useState(false);

  const durationChips = ['15', '30', '60', '90'];

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

  const handleLogExercise = async () => {
    if (!userId) return;
    if (!calories) {
      Alert.alert('Error', 'Please enter calories burned');
      return;
    }

    setLoading(true);
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const totalsRef = doc(db, 'users', userId, 'dailyLogs', dateStr);
      const entriesRef = collection(db, 'users', userId, 'dailyLogs', dateStr, 'entries');
      
      const calValue = parseInt(calories);

      // 1. Add entry
      await addDoc(entriesRef, {
        name: description || 'Manual Exercise',
        calories: calValue,
        type: 'exercise',
        createdAt: new Date().toISOString(),
        isManual: true,
        duration: parseInt(duration) || 0,
        intensity: getIntensityLabel(intensity),
      });

      // 2. Update totals
      const docSnap = await getDoc(totalsRef);
      if (!docSnap.exists()) {
        await setDoc(totalsRef, {
          calories: 0,
          protein: 0,
          fat: 0,
          carbs: 0,
          water: 0,
          exerciseCalories: calValue
        });
      } else {
        await updateDoc(totalsRef, {
          exerciseCalories: increment(calValue)
        });
      }

      router.replace('/'); // Go back to Home
    } catch (e) {
      console.error('Error logging manual exercise', e);
      Alert.alert('Error', 'Failed to log exercise. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            <View style={styles.header}>
              <TouchableOpacity 
                onPress={() => router.back()} 
                style={styles.backButton}
              >
                <ArrowLeft size={28} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Manual Log</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
              <View style={styles.iconContainer}>
                <View style={styles.iconCircle}>
                  <Flame size={40} color={Colors.primary} />
                </View>
              </View>

              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Calories Burned</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.caloriesInput}
                      placeholder="0"
                      value={calories}
                      onChangeText={setCalories}
                      keyboardType="numeric"
                      placeholderTextColor={Colors.textMuted}
                    />
                    <Text style={styles.unitText}>cal</Text>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Description</Text>
                  <TextInput
                    style={styles.descriptionInput}
                    placeholder="e.g. Afternoon Walk"
                    value={description}
                    onChangeText={setDescription}
                    placeholderTextColor={Colors.textMuted}
                    multiline
                  />
                </View>

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

                  <View style={styles.manualDurationContainer}>
                    <Text style={styles.manualLabel}>Or enter manually:</Text>
                    <TextInput
                      style={styles.durationInput}
                      placeholder="e.g. 45"
                      value={duration}
                      onChangeText={handleManualDuration}
                      keyboardType="numeric"
                      placeholderTextColor={Colors.textMuted}
                    />
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity 
                style={[styles.logButton, loading && styles.disabledButton]} 
                onPress={handleLogExercise}
                disabled={loading}
              >
                <Text style={styles.logButtonText}>
                  {loading ? 'Logging...' : 'Log Exercise'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
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
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    marginLeft: 12,
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 40,
    marginTop: 20,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  form: {
    width: '100%',
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.backgroundLight,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  caloriesInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '800',
    color: Colors.text,
    padding: 0,
  },
  unitText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 6,
    marginLeft: 8,
  },
  descriptionInput: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: 20,
    padding: 20,
    fontSize: 16,
    color: Colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Colors.border,
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
  manualDurationContainer: {
    gap: 8,
  },
  manualLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
    marginLeft: 4,
  },
  durationInput: {
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
  },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  logButton: {
    backgroundColor: Colors.primary,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  logButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.7,
  },
});
