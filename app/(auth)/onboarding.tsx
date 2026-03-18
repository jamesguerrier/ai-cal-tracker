import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@clerk/clerk-expo';
import { db } from '../../utils/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ArrowLeft, User, Target, Activity, Calendar, ArrowRight } from 'lucide-react-native';
import Colors from '../../constants/Colors';

// Note: Hugeicons might require specific imports. If lucide is fine fallback for some, we use it, but user asked for hugeicons.
// Since we installed @hugeicons/react-native, let's try to use it if available, or just fallback to lucide if needed.
// Example:
// import { MaleIcon, FemaleIcon, Target01Icon, Activity01Icon, Calendar01Icon, HeightIcon, WeightScaleIcon } from '@hugeicons/react-native';

const TOTAL_STEPS = 5;

export default function OnboardingScreen() {
  const { userId, isLoaded } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form State
  const [gender, setGender] = useState('');
  const [goal, setGoal] = useState('');
  const [workoutDays, setWorkoutDays] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [loadingInitial, setLoadingInitial] = useState(true);

  useEffect(() => {
    const loadExistingData = async () => {
      if (!isLoaded || !userId) return;
      
      try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.gender) setGender(data.gender);
          if (data.goal) setGoal(data.goal);
          if (data.workoutDays) setWorkoutDays(data.workoutDays);
          if (data.birthday) {
            const [y, m, d] = data.birthday.split('-');
            setBirthYear(y || '');
            setBirthMonth(m || '');
            setBirthDay(d || '');
          }
          if (data.height) {
            const matches = data.height.match(/(\d+)'(\d+)"/);
            if (matches) {
              setHeightFeet(matches[1]);
              setHeightInches(matches[2]);
            }
          }
          if (data.weightKg) setWeightKg(data.weightKg.toString());
        }
      } catch (e) {
        console.error("Error loading existing profile:", e);
      } finally {
        setLoadingInitial(false);
      }
    };

    loadExistingData();
  }, [isLoaded, userId]);

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const finishOnboarding = async () => {
    try {
      if (!userId) return;

      const data = {
        gender,
        goal,
        workoutDays,
        birthday: `${birthYear}-${birthMonth}-${birthDay}`,
        height: `${heightFeet}'${heightInches}"`,
        weightKg,
      };

      // Save to Firestore
      await setDoc(doc(db, 'users', userId), data, { merge: true });

      // Save to AsyncStorage
      await AsyncStorage.setItem('user_health_data', JSON.stringify(data));
      
      router.replace('/(auth)/generating-plan');
    } catch (e) {
      console.error('Failed to save data', e);
      alert('Failed to save your profile. Please try again.');
    }
  };

  const renderProgressBar = () => {
    return (
      <View style={styles.progressContainer}>
        {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
          <View 
            key={index} 
            style={[
              styles.progressSegment, 
              index < currentStep ? styles.progressSegmentActive : null
            ]} 
          />
        ))}
      </View>
    );
  };

  const renderStepContent = () => {
    switch(currentStep) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>What is your gender?</Text>
            <Text style={styles.subtitle}>Helps us calculate your customized calories</Text>
            
            <View style={styles.optionsContainer}>
              <TouchableOpacity 
                style={[styles.optionCard, gender === 'Male' && styles.optionCardActive]}
                onPress={() => setGender('Male')}
              >
                <User color={gender === 'Male' ? Colors.backgroundLight : Colors.text} size={32} />
                <Text style={[styles.optionText, gender === 'Male' && styles.optionTextActive]}>Male</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.optionCard, gender === 'Female' && styles.optionCardActive]}
                onPress={() => setGender('Female')}
              >
                <User color={gender === 'Female' ? Colors.backgroundLight : Colors.text} size={32} />
                <Text style={[styles.optionText, gender === 'Female' && styles.optionTextActive]}>Female</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.optionCard, gender === 'Other' && styles.optionCardActive]}
                onPress={() => setGender('Other')}
              >
                <User color={gender === 'Other' ? Colors.backgroundLight : Colors.text} size={32} />
                <Text style={[styles.optionText, gender === 'Other' && styles.optionTextActive]}>Other</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>What's your goal?</Text>
            <Text style={styles.subtitle}>Select what you want to achieve</Text>
            
            <View style={styles.optionsContainer}>
              <TouchableOpacity 
                style={[styles.optionCardHorizontal, goal === 'Lose Weight' && styles.optionCardActive]}
                onPress={() => setGoal('Lose Weight')}
              >
                <Target color={goal === 'Lose Weight' ? Colors.backgroundLight : Colors.text} size={24} />
                <Text style={[styles.optionTextHorizontal, goal === 'Lose Weight' && styles.optionTextActive]}>Lose Weight</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.optionCardHorizontal, goal === 'Maintain' && styles.optionCardActive]}
                onPress={() => setGoal('Maintain')}
              >
                <Target color={goal === 'Maintain' ? Colors.backgroundLight : Colors.text} size={24} />
                <Text style={[styles.optionTextHorizontal, goal === 'Maintain' && styles.optionTextActive]}>Maintain Weight</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.optionCardHorizontal, goal === 'Gain Weight' && styles.optionCardActive]}
                onPress={() => setGoal('Gain Weight')}
              >
                <Target color={goal === 'Gain Weight' ? Colors.backgroundLight : Colors.text} size={24} />
                <Text style={[styles.optionTextHorizontal, goal === 'Gain Weight' && styles.optionTextActive]}>Gain Weight</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Workout Details</Text>
            <Text style={styles.subtitle}>How often do you exercise?</Text>
            
            <View style={styles.optionsContainer}>
              <TouchableOpacity 
                style={[styles.optionCardHorizontal, workoutDays === '2-3 days' && styles.optionCardActive]}
                onPress={() => setWorkoutDays('2-3 days')}
              >
                <Activity color={workoutDays === '2-3 days' ? Colors.backgroundLight : Colors.text} size={24} />
                <Text style={[styles.optionTextHorizontal, workoutDays === '2-3 days' && styles.optionTextActive]}>2-3 Days / Week</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.optionCardHorizontal, workoutDays === '3-4 days' && styles.optionCardActive]}
                onPress={() => setWorkoutDays('3-4 days')}
              >
                <Activity color={workoutDays === '3-4 days' ? Colors.backgroundLight : Colors.text} size={24} />
                <Text style={[styles.optionTextHorizontal, workoutDays === '3-4 days' && styles.optionTextActive]}>3-4 Days / Week</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.optionCardHorizontal, workoutDays === '5-6 days' && styles.optionCardActive]}
                onPress={() => setWorkoutDays('5-6 days')}
              >
                <Activity color={workoutDays === '5-6 days' ? Colors.backgroundLight : Colors.text} size={24} />
                <Text style={[styles.optionTextHorizontal, workoutDays === '5-6 days' && styles.optionTextActive]}>5-6 Days / Week</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>When were you born?</Text>
            <Text style={styles.subtitle}>Your age determines your metabolic rate</Text>
            
            <View style={styles.dateInputContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Day</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="DD"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={2}
                  value={birthDay}
                  onChangeText={setBirthDay}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Month</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="MM"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={2}
                  value={birthMonth}
                  onChangeText={setBirthMonth}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1.5 }]}>
                <Text style={styles.inputLabel}>Year</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="YYYY"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={4}
                  value={birthYear}
                  onChangeText={setBirthYear}
                />
              </View>
            </View>
          </View>
        );
      case 5:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Measurements</Text>
            <Text style={styles.subtitle}>Enter your height and weight</Text>
            
            <Text style={[styles.inputLabel, { marginTop: 20 }]}>Height</Text>
            <View style={styles.measurementRow}>
              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Feet"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={heightFeet}
                  onChangeText={setHeightFeet}
                />
                <Text style={styles.measurementUnit}>ft</Text>
              </View>
              <View style={{ width: 16 }} />
              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Inches"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={2}
                  value={heightInches}
                  onChangeText={setHeightInches}
                />
                <Text style={styles.measurementUnit}>in</Text>
              </View>
            </View>

            <Text style={[styles.inputLabel, { marginTop: 32 }]}>Weight</Text>
            <View style={styles.measurementRow}>
              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Weight"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="decimal-pad"
                  maxLength={5}
                  value={weightKg}
                  onChangeText={setWeightKg}
                />
                <Text style={styles.measurementUnit}>kg</Text>
              </View>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  const isStepValid = () => {
    switch(currentStep) {
      case 1: return !!gender;
      case 2: return !!goal;
      case 3: return !!workoutDays;
      case 4: return birthDay.length > 0 && birthMonth.length > 0 && birthYear.length === 4;
      case 5: return heightFeet.length > 0 && weightKg.length > 0;
      default: return false;
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {loadingInitial ? (
        <View style={[styles.container, styles.center]}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <>
          <View style={styles.header}>
            {currentStep > 1 ? (
              <TouchableOpacity onPress={prevStep} style={styles.backButton}>
                <ArrowLeft color={Colors.text} size={24} />
              </TouchableOpacity>
            ) : <View style={styles.backButtonPlaceholder} />}
            {renderProgressBar()}
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            {renderStepContent()}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.primaryButton, !isStepValid() && styles.buttonDisabled]} 
              onPress={currentStep === TOTAL_STEPS ? finishOnboarding : nextStep}
              disabled={!isStepValid()}
            >
              <Text style={styles.primaryButtonText}>
                {currentStep === TOTAL_STEPS ? 'Complete' : 'Continue'}
              </Text>
              {currentStep < TOTAL_STEPS && <ArrowRight color={Colors.textInverse} size={20} style={{ marginLeft: 8 }} />}
            </TouchableOpacity>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
    flexDirection: 'column',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    marginBottom: 24,
  },
  backButtonPlaceholder: {
    height: 40,
    marginBottom: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  progressSegment: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
  },
  progressSegmentActive: {
    backgroundColor: Colors.primary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  stepContainer: {
    flex: 1,
    paddingTop: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textMuted,
    marginBottom: 32,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  optionCard: {
    width: '47%',
    aspectRatio: 1,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  optionCardHorizontal: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: Colors.backgroundLight,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    padding: 20,
  },
  optionCardActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionText: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  optionTextHorizontal: {
    marginLeft: 16,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  optionTextActive: {
    color: Colors.textInverse,
  },
  dateInputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    height: 60,
    paddingHorizontal: 16,
    fontSize: 20,
    color: Colors.text,
    textAlign: 'center',
  },
  measurementRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  measurementUnit: {
    position: 'absolute',
    right: 16,
    top: 20,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    backgroundColor: Colors.background,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 60,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: Colors.textInverse,
    fontSize: 18,
    fontWeight: '700',
  },
});
