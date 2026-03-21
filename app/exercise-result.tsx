import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions,
  Platform,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Flame, CheckCircle2 } from 'lucide-react-native';
import { useAuth } from '@clerk/clerk-expo';
import { db } from '../utils/firebase';
import { doc, collection, addDoc, updateDoc, increment, getDoc, setDoc } from 'firebase/firestore';
import Colors from '../constants/Colors';

const { width } = Dimensions.get('window');

export default function ExerciseResultScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const { calories, name, type, duration, intensity } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);

  const handleLog = async () => {
    if (!userId) return;
    setLoading(true);

    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const totalsRef = doc(db, 'users', userId, 'dailyLogs', dateStr);
      const entriesRef = collection(db, 'users', userId, 'dailyLogs', dateStr, 'entries');
      
      const calValue = parseInt(calories as string);

      // 1. Add entry
      await addDoc(entriesRef, {
        name: name || 'Exercise',
        calories: calValue,
        type: 'exercise',
        createdAt: new Date().toISOString(),
        duration: parseInt(duration as string),
        intensity: intensity as string,
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

      router.replace('/'); 
    } catch (e) {
      console.error('Error logging exercise from result', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.resultCard}>
          <View style={styles.iconContainer}>
            <View style={styles.fireOuter}>
              <View style={styles.fireInner}>
                <Flame size={60} color="#fff" />
              </View>
            </View>
          </View>

          <Text style={styles.summaryTitle}>Your Workout Burned</Text>
          
          <View style={styles.caloriesContainer}>
            <Text style={styles.caloriesValue}>{calories}</Text>
            <Text style={styles.caloriesUnit}>Cals</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Activity</Text>
              <Text style={styles.statValue}>{type === 'run' ? 'Cardio' : 'Strength'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Duration</Text>
              <Text style={styles.statValue}>{duration} min</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Intensity</Text>
              <Text style={styles.statValue}>{intensity}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.logButton, loading && styles.disabledButton]}
            onPress={handleLog}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <CheckCircle2 size={24} color="#fff" />
                <Text style={styles.logButtonText}>Log Activity</Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 40,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 32,
  },
  fireOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fireInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textMuted,
    marginBottom: 12,
  },
  caloriesContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 40,
  },
  caloriesValue: {
    fontSize: 64,
    fontWeight: '900',
    color: Colors.text,
  },
  caloriesUnit: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textMuted,
    marginLeft: 8,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    paddingTop: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  footer: {
    width: '100%',
    marginTop: 60,
    gap: 16,
  },
  logButton: {
    backgroundColor: Colors.primary,
    padding: 20,
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  logButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.7,
  },
});
