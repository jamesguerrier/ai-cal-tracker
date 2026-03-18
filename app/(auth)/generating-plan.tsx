import { useAuth } from '@clerk/clerk-expo';
import { GoogleGenerativeAI } from '@google/generative-ai';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore';
import { Sparkles } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Colors from '../../constants/Colors';
import { db } from '../../utils/firebase';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

export default function GeneratingPlanScreen() {
  const { userId } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState('Analyzing your profile...');
  const spinValue = new Animated.Value(0);

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    generatePlan();
  }, []);

  const generatePlan = async () => {
    try {
      if (!userId) {
        throw new Error('User not authenticated');
      }

      setStatus('Reading your health data...');
      const localData = await AsyncStorage.getItem('user_health_data');
      if (!localData) {
        throw new Error('No health data found');
      }
      const healthData = JSON.parse(localData);

      setStatus('Gemini is crafting your plan...');
      
      if (!GEMINI_API_KEY) {
        throw new Error('Gemini API key is missing');
      }

      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

      const prompt = `
        As a professional fitness and nutrition coach, generate a personalized daily plan for a user based on these details:
        - Gender: ${healthData.gender}
        - Goal: ${healthData.goal}
        - Workout Frequency: ${healthData.workoutDays}
        - Birthday: ${healthData.birthday}
        - Height: ${healthData.height}
        - Weight: ${healthData.weightKg} kg

        Please provide the following in JSON format ONLY:
        {
          "dailyCalories": number,
          "proteinGrams": number,
          "carbsGrams": number,
          "fatGrams": number,
          "dailyWaterLiters": number,
          "fitnessTips": [string, string, string],
          "motivationalQuote": string
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Clean the response if it contains markdown code blocks
      const jsonStr = text.replace(/```json|```/g, '').trim();
      const planData = JSON.parse(jsonStr);

      setStatus('Saving your plan...');
      
      const finalData = {
        ...healthData,
        plan: planData,
        onboardingCompleted: true,
        updatedAt: new Date().toISOString(),
      };

      // Save to Firestore
      await setDoc(doc(db, 'users', userId), finalData, { merge: true });

      // Save to AsyncStorage
      await AsyncStorage.setItem('user_health_data', JSON.stringify(finalData));

      setStatus('All set! Redirecting...');
      setTimeout(() => {
        router.replace('/');
      }, 1000);

    } catch (error) {
      console.error('Generation error:', error);
      setStatus('Something went wrong. Retrying...');
      setTimeout(() => {
        router.replace('/(auth)/onboarding');
      }, 3000);
    }
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Sparkles size={60} color={Colors.primary} />
        </Animated.View>
        
        <Text style={styles.title}>Creating Your Plan</Text>
        <Text style={styles.subtitle}>{status}</Text>
        
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Our AI is calculating your optimal macronutrients, hydration needs, and personalized fitness goals.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 40,
  },
  loaderContainer: {
    height: 60,
    justifyContent: 'center',
  },
  infoBox: {
    backgroundColor: Colors.backgroundLight,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 60,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
