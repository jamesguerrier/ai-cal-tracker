import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Image,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
  Platform,
  Animated,
  Easing
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Sparkles, Check, Droplet, Dumbbell, Activity, Edit2, Save } from 'lucide-react-native';
import Colors from '../constants/Colors';
import { useAuth } from '@clerk/clerk-expo';
import { doc, getDoc, setDoc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

interface FoodMacros {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export default function AnalyzeResultScreen() {
  const { imageUri, source } = useLocalSearchParams<{ imageUri: string, source: string }>();
  const router = useRouter();
  const { userId } = useAuth();
  
  const [step, setStep] = useState<'analyzing' | 'result'>('analyzing');
  const [currentProgressStep, setCurrentProgressStep] = useState(1);
  const [isLogging, setIsLogging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [servings, setServings] = useState(1);
  const [macros, setMacros] = useState<FoodMacros | null>(null);
  
  const updateMacro = (key: keyof FoodMacros, value: string) => {
    if (!macros) return;
    if (key === 'name') {
      setMacros({ ...macros, [key]: value });
    } else {
      const numValue = value === '' ? 0 : parseFloat(value);
      setMacros({ ...macros, [key]: isNaN(numValue) ? 0 : numValue });
    }
  };
  const progressWidth = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (imageUri) {
      startAnalysis(imageUri);
    }
  }, [imageUri]);

  const startAnalysis = async (uri: string) => {
    try {
      if (!GEMINI_API_KEY) throw new Error('Gemini API key is missing');

      // Phase 1: Analyse picture
      setCurrentProgressStep(1);
      animateProgress(0.33);
      
      const analysisPromise = analyzeImage(uri);
      
      // Delay for UX
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Phase 2: Extract ingredient
      setCurrentProgressStep(2);
      animateProgress(0.66);
      
      const result = await analysisPromise;
      
      // Delay for UX
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Phase 3: Analyse complete
      setMacros(result);
      setCurrentProgressStep(3);
      animateProgress(1);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
       console.error('Analysis error:', error);
       Alert.alert('Analysis Failed', 'Could not analyze the food image. Please try again.');
       router.back();
    }
  };

  const animateProgress = (toValue: number) => {
    Animated.timing(progressWidth, {
      toValue,
      duration: 1000,
      easing: Easing.out(Easing.exp),
      useNativeDriver: false,
    }).start();
  };

  const analyzeImage = async (uri: string): Promise<FoodMacros> => {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    });

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const prompt = `
      Analyze this food image and provide the estimated nutritional information.
      Return ONLY a JSON object in this format:
      {
        "name": "Food Name",
        "calories": number,
        "protein": number,
        "carbs": number,
        "fat": number
      }
    `;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64, mimeType: "image/jpeg" } },
    ]);

    const text = result.response.text();
    const jsonStr = text.replace(/```json|```/g, '').trim();
    return JSON.parse(jsonStr);
  };

  const handleLogFood = async () => {
    if (!userId || !macros) return;

    setIsLogging(true);
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const totalsRef = doc(db, 'users', userId, 'dailyLogs', dateStr);
      const entriesRef = collection(db, 'users', userId, 'dailyLogs', dateStr, 'entries');

      await addDoc(entriesRef, {
        type: 'food',
        title: macros.name,
        calories: Number(macros.calories * servings),
        protein: Number(macros.protein * servings),
        carbs: Number(macros.carbs * servings),
        fat: Number(macros.fat * servings),
        servings: servings,
        source: source || 'camera', // Default to camera if missing
        imageUrl: imageUri,
        createdAt: new Date().toISOString()
      });

      const totalCals = Number(macros.calories * servings);
      const totalProtein = Number(macros.protein * servings);
      const totalCarbs = Number(macros.carbs * servings);
      const totalFat = Number(macros.fat * servings);

      const docSnap = await getDoc(totalsRef);
      if (!docSnap.exists()) {
        await setDoc(totalsRef, {
          calories: totalCals,
          protein: totalProtein,
          carbs: totalCarbs,
          fat: totalFat,
          water: 0,
          exerciseCalories: 0
        });
      } else {
        await updateDoc(totalsRef, {
          calories: increment(totalCals),
          protein: increment(totalProtein),
          carbs: increment(totalCarbs),
          fat: increment(totalFat)
        });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/');
    } catch (e) {
      console.error("Error logging food", e);
      Alert.alert('Error', 'Failed to log food.');
    } finally {
      setIsLogging(false);
    }
  };

  if (step === 'analyzing') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={28} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Analyzing Photo</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.analyzingContent}>
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
          
          <View style={styles.progressSection}>
            <View style={styles.progressBarContainer}>
              <Animated.View 
                style={[
                  styles.progressBar, 
                  { 
                    width: progressWidth.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%']
                    }) 
                  }
                ]} 
              />
            </View>

            <View style={styles.stepsContainer}>
              <ProgressStep 
                label="Analyse picture" 
                active={currentProgressStep >= 1} 
                completed={currentProgressStep > 1} 
              />
              <ProgressStep 
                label="Extract ingredient" 
                active={currentProgressStep >= 2} 
                completed={currentProgressStep > 2} 
              />
              <ProgressStep 
                label="Analyse complete" 
                active={currentProgressStep >= 3} 
                completed={currentProgressStep >= 3} 
              />
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.continueButton, currentProgressStep < 3 && styles.buttonDisabled]} 
            onPress={() => setStep('result')}
            disabled={currentProgressStep < 3}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => setStep('analyzing')}>
            <ChevronLeft size={28} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditing ? 'Edit Result' : 'Analysis Result'}</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={[styles.editButton, isEditing && styles.editButtonActive, { marginRight: 8 }]} 
              onPress={() => setIsEditing(!isEditing)}
            >
              {isEditing ? <Save size={20} color="#fff" /> : <Edit2 size={20} color={Colors.primary} />}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.servingsContainer}>
             <Text style={styles.servingsLabel}>Servings</Text>
             <View style={styles.servingsControls}>
                <TouchableOpacity 
                  style={styles.servingBtn} 
                  onPress={() => setServings(Math.max(0.5, servings - 0.5))}
                >
                  <Text style={styles.servingBtnText}>-</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.servingsInput}
                  value={servings.toString()}
                  onChangeText={(v) => {
                    const n = parseFloat(v);
                    if (!isNaN(n)) setServings(n);
                    else if (v === '') setServings(0);
                  }}
                  keyboardType="numeric"
                />
                <TouchableOpacity 
                  style={styles.servingBtn} 
                  onPress={() => setServings(servings + 0.5)}
                >
                  <Text style={styles.servingBtnText}>+</Text>
                </TouchableOpacity>
             </View>
          </View>
          <View style={styles.resultImageContainer}>
            <Image source={{ uri: imageUri }} style={styles.resultImage} />
            <View style={styles.badge}>
              <Sparkles size={16} color="#fff" />
              <Text style={styles.badgeText}>AI Identified</Text>
            </View>
          </View>
          
          <View style={styles.resultCard}>
            {isEditing ? (
              <View style={styles.editForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Food Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={macros?.name}
                    onChangeText={(v) => updateMacro('name', v)}
                    placeholder="Food Name"
                  />
                </View>
                
                <View style={styles.editGrid}>
                  <EditMacroItem label="Calories" value={macros?.calories.toString() || '0'} unit="kcal" onChange={(v) => updateMacro('calories', v)} />
                  <EditMacroItem label="Protein" value={macros?.protein.toString() || '0'} unit="g" onChange={(v) => updateMacro('protein', v)} />
                  <EditMacroItem label="Fat" value={macros?.fat.toString() || '0'} unit="g" onChange={(v) => updateMacro('fat', v)} />
                  <EditMacroItem label="Carbs" value={macros?.carbs.toString() || '0'} unit="g" onChange={(v) => updateMacro('carbs', v)} />
                </View>
              </View>
            ) : (
              <>
                <Text style={styles.foodTitle} numberOfLines={2} ellipsizeMode="tail">{macros?.name}</Text>
                
                <View style={styles.macroRow}>
                  <DetailedMacro label="Protein" value={parseFloat(((macros?.protein || 0) * servings).toFixed(1))} unit="g" color="#F87171" />
                  <DetailedMacro label="Fat" value={parseFloat(((macros?.fat || 0) * servings).toFixed(1))} unit="g" color="#FBBF24" />
                  <DetailedMacro label="Carbs" value={parseFloat(((macros?.carbs || 0) * servings).toFixed(1))} unit="g" color="#60A5FA" />
                </View>

                <View style={styles.totalCals}>
                   <Text style={styles.calLabel}>Total Calories</Text>
                   <Text style={styles.calValue}>{Math.round((macros?.calories || 0) * servings)} kcal</Text>
                </View>
              </>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.logButton, isLogging && styles.buttonDisabled]} 
            onPress={handleLogFood}
            disabled={isLogging}
          >
            {isLogging ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.buttonInner}>
                <Check size={24} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>Log to Diary</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function EditMacroItem({ label, value, unit, onChange }: { label: string, value: string, unit: string, onChange: (v: string) => void }) {
  return (
    <View style={styles.editMacroItem}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputWithUnit}>
        <TextInput
          style={styles.numberInput}
          value={value}
          onChangeText={onChange}
          keyboardType="numeric"
          selectTextOnFocus
        />
        <Text style={styles.unitText}>{unit}</Text>
      </View>
    </View>
  );
}

function ProgressStep({ label, active, completed }: { label: string, active: boolean, completed: boolean }) {
  return (
    <View style={styles.stepRow}>
      <View style={[
        styles.stepCircle, 
        active && styles.stepCircleActive,
        completed && styles.stepCircleCompleted
      ]}>
        {completed ? <Check size={14} color="#fff" /> : <View style={active ? styles.innerCircleActive : styles.innerCircle} />}
      </View>
      <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{label}</Text>
    </View>
  );
}

function DetailedMacro({ label, value, unit, color }: { label: string, value: number, unit: string, color: string }) {
  return (
    <View style={styles.detailedMacro}>
      <View style={[styles.macroIconBg, { backgroundColor: color + '15' }]}>
        <Text style={{ color, fontWeight: 'bold' }}>{label[0]}</Text>
      </View>
      <Text style={styles.macroDetailedValue}>{value}{unit}</Text>
      <Text style={styles.macroDetailedLabel}>{label}</Text>
    </View>
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
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  editButtonActive: {
    backgroundColor: Colors.primary,
  },
  editForm: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textMuted,
    marginLeft: 4,
  },
  textInput: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  editGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  editMacroItem: {
    width: '48%',
    gap: 8,
  },
  inputWithUnit: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  numberInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  unitText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
    marginLeft: 4,
  },
  servingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  servingsLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  servingsControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  servingBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  servingBtnText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.primary,
  },
  servingsInput: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    width: 40,
    textAlign: 'center',
  },
  analyzingContent: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 32,
    marginBottom: 40,
  },
  progressSection: {
    width: '100%',
    paddingHorizontal: 10,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    width: '100%',
    marginBottom: 32,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  stepsContainer: {
    gap: 20,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    borderColor: Colors.primary,
  },
  stepCircleCompleted: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  innerCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  innerCircleActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  stepLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  stepLabelActive: {
    color: Colors.text,
  },
  scrollContent: {
    padding: 24,
  },
  resultImageContainer: {
    width: '100%',
    aspectRatio: 1.2,
    marginBottom: 24,
  },
  resultImage: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  badge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
  },
  foodTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  detailedMacro: {
    alignItems: 'center',
    width: '30%',
  },
  macroIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  macroDetailedValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  macroDetailedLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    marginTop: 2,
  },
  totalCals: {
    backgroundColor: Colors.background,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  calLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 4,
  },
  calValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
  },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  continueButton: {
    backgroundColor: Colors.primary,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 4,
  },
  logButton: {
    backgroundColor: Colors.primary,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 4,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  buttonDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
    elevation: 0,
  },
});
