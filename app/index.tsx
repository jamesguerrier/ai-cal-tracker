import { SignedIn, SignedOut, useAuth } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, useRouter } from 'expo-router';
import { doc, getDoc, onSnapshot, setDoc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';
import { BarChart2, Home, Plus, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import HomeHeader from '../components/HomeHeader';
import LogModal from '../components/LogModal';
import ActionModal from '../components/ActionModal';
import EditPlanModal from '../components/EditPlanModal';
import NutritionCard from '../components/NutritionCard';
import WaterCard from '../components/WaterCard';
import RecentActivity from '../components/RecentActivity';
import WeeklyCalendar from '../components/WeeklyCalendar';
import Colors from '../constants/Colors';
import { db } from '../utils/firebase';

export default function Index() {
  const { signOut, isSignedIn, isLoaded, userId } = useAuth();
  const router = useRouter();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [userPlan, setUserPlan] = useState<any>(null);
  const [dailyTotals, setDailyTotals] = useState<any>({
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    water: 0
  });
  const [activities, setActivities] = useState<any[]>([]);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showEditPlanModal, setShowEditPlanModal] = useState(false);

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!isLoaded) return;
      
      if (isSignedIn && userId) {
        try {
          const localData = await AsyncStorage.getItem('user_health_data');
          if (localData) {
            const parsedData = JSON.parse(localData);
            if (parsedData.onboardingCompleted) {
              setCheckingOnboarding(false);
              return;
            }
          }

          // Check Firestore if local storage is empty or incomplete
          const docRef = doc(db, 'users', userId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().onboardingCompleted) {
            // Sync to local storage
            await AsyncStorage.setItem('user_health_data', JSON.stringify(docSnap.data()));
            setCheckingOnboarding(false);
            return;
          }

          // If neither has it or it's incomplete, redirect to onboarding
          router.replace('/(auth)/onboarding');
          return;
        } catch (e) {
          console.error("Error checking onboarding status", e);
        }
      }
      setCheckingOnboarding(false);
    };

    checkOnboarding();
  }, [isSignedIn, isLoaded, router, userId]);

  // Fetch Goals
  useEffect(() => {
    if (!userId || !isSignedIn) return;

    const fetchGoals = async () => {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            setUserPlan(docSnap.data().plan);
        }
    };
    fetchGoals();
  }, [userId, isSignedIn]);

  // Fetch/Sync Daily Totals
  useEffect(() => {
    if (!userId || !isSignedIn) return;

    const dateStr = formatDate(selectedDate);
    const totalsRef = doc(db, 'users', userId, 'dailyLogs', dateStr);
    const entriesRef = collection(db, 'users', userId, 'dailyLogs', dateStr, 'entries');

    const unsubscribeTotals = onSnapshot(totalsRef, (doc) => {
      if (doc.exists()) {
        setDailyTotals(doc.data());
      } else {
        setDailyTotals({
          calories: 0,
          protein: 0,
          fat: 0,
          carbs: 0,
          water: 0,
          exerciseCalories: 0
        });
      }
    });

    const unsubscribeActivities = onSnapshot(entriesRef, (snapshot) => {
      const activityList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort by createdAt descending
      activityList.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setActivities(activityList);
    });

    return () => {
      unsubscribeTotals();
      unsubscribeActivities();
    };
  }, [userId, isSignedIn, selectedDate]);

  const handleSaveLog = async (data: any) => {
    if (!userId) return;

    const dateStr = formatDate(selectedDate);
    const totalsRef = doc(db, 'users', userId, 'dailyLogs', dateStr);
    const entriesRef = collection(db, 'users', userId, 'dailyLogs', dateStr, 'entries');

    try {
      // 1. Add entry
      await addDoc(entriesRef, {
        ...data,
        createdAt: new Date().toISOString()
      });

      // 2. Update totals (atomically)
      const docSnap = await getDoc(totalsRef);
      if (!docSnap.exists()) {
        await setDoc(totalsRef, {
          calories: data.calories,
          protein: data.protein,
          fat: data.fat,
          carbs: data.carbs,
          water: data.water || 0
        });
      } else {
        await updateDoc(totalsRef, {
          calories: increment(data.calories),
          protein: increment(data.protein),
          fat: increment(data.fat),
          carbs: increment(data.carbs),
          water: increment(data.water || 0)
        });
      }
      setShowLogModal(false);
    } catch (e) {
      console.error("Error saving log", e);
    }
  };

  const handleUpdatePlan = async (newPlan: any) => {
    if (!userId) return;

    try {
      const docRef = doc(db, 'users', userId);
      await updateDoc(docRef, {
        plan: newPlan,
        updatedAt: new Date().toISOString()
      });
      setUserPlan(newPlan);
      // Also update local storage to keep it in sync
      const localData = await AsyncStorage.getItem('user_health_data');
      if (localData) {
        const parsedData = JSON.parse(localData);
        await AsyncStorage.setItem('user_health_data', JSON.stringify({
          ...parsedData,
          plan: newPlan
        }));
      }
      setShowEditPlanModal(false);
    } catch (e) {
      console.error("Error updating plan", e);
    }
  };

  const handleActionSelect = (action: string) => {
    if (action === 'food' || action === 'water') {
      setShowLogModal(true);
    }
    // Exercise and Scan can be stubs for now
    if (action === 'exercise') {
      console.log('Exercise logging coming soon');
    }
    if (action === 'scan') {
      alert('Scan Food is a Pro feature!');
    }
  };

  if (!isLoaded || (isSignedIn && checkingOnboarding)) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SignedIn>
        <View style={styles.content}>
          {activeTab === 'home' && (
            <ScrollView 
              style={styles.tabContent} 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <HomeHeader />
              <WeeklyCalendar 
                selectedDate={selectedDate} 
                onDateSelect={setSelectedDate} 
              />
              
              <NutritionCard 
                caloriesRemaining={Math.max(0, (userPlan?.dailyCalories || 0) - dailyTotals.calories + (dailyTotals.exerciseCalories || 0))}
                caloriesTotal={userPlan?.dailyCalories || 2000}
                protein={{ current: dailyTotals.protein, total: userPlan?.proteinGrams || 150 }}
                fat={{ current: dailyTotals.fat, total: userPlan?.fatGrams || 70 }}
                carbs={{ current: dailyTotals.carbs, total: userPlan?.carbsGrams || 250 }}
                onEdit={() => setShowEditPlanModal(true)}
              />

              <WaterCard 
                currentLiters={dailyTotals.water || 0}
                goalLiters={userPlan?.dailyWaterLiters || 2.0}
                onEdit={() => setShowEditPlanModal(true)}
              />

              <RecentActivity activities={activities} />

              <TouchableOpacity style={styles.buttonError} onPress={() => signOut()}>
                <Text style={styles.buttonText}>Sign Out</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {activeTab === 'analytics' && (
            <View style={styles.tabContent}>
              <Text style={styles.title}>Analytics</Text>
              <Text style={styles.subtitle}>Your progress at a glance</Text>
              <View style={styles.placeholderCard}>
                <BarChart2 size={48} color={Colors.primary} />
                <Text style={styles.placeholderText}>Charts and insights will appear here.</Text>
              </View>
            </View>
          )}

          {activeTab === 'profile' && (
            <View style={styles.tabContent}>
              <Text style={styles.title}>Your Profile</Text>
              <Text style={styles.subtitle}>Manage your health settings</Text>
              <View style={styles.placeholderCard}>
                <User size={48} color={Colors.primary} />
                <Text style={styles.placeholderText}>Profile details and settings coming soon.</Text>
              </View>
            </View>
          )}
        </View>

        {/* Floating Navigation */}
        <View style={styles.floatingNavContainer}>
          <View style={styles.floatingNav}>
            <TouchableOpacity 
              style={[styles.navItem, activeTab === 'home' && styles.navItemActive]} 
              onPress={() => setActiveTab('home')}
            >
              <Home size={28} color={activeTab === 'home' ? Colors.primary : Colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.navItem, activeTab === 'analytics' && styles.navItemActive]} 
              onPress={() => setActiveTab('analytics')}
            >
              <BarChart2 size={28} color={activeTab === 'analytics' ? Colors.primary : Colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.navItem, activeTab === 'profile' && styles.navItemActive]} 
              onPress={() => setActiveTab('profile')}
            >
              <User size={28} color={activeTab === 'profile' ? Colors.primary : Colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.navDivider} />

            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowActionModal(true)}
            >
              <Plus size={32} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </SignedIn>
      
      <ActionModal
        isVisible={showActionModal}
        onClose={() => setShowActionModal(false)}
        onSelect={handleActionSelect}
      />

      <LogModal 
        isVisible={showLogModal}
        onClose={() => setShowLogModal(false)}
        onSave={handleSaveLog}
      />

      <EditPlanModal
        isVisible={showEditPlanModal}
        onClose={() => setShowEditPlanModal(false)}
        onSave={handleUpdatePlan}
        initialData={userPlan}
      />

      <SignedOut>
        <View style={styles.authContainer}>
          <Image 
            source={require('../assets/images/icon.png')} 
            style={styles.logo} 
            resizeMode="contain"
          />
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
          <Link href="/(auth)/sign-in" asChild>
            <TouchableOpacity style={styles.buttonPrimary}>
              <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>
          </Link>
          <Link href="/(auth)/sign-up" asChild>
            <TouchableOpacity style={styles.buttonSecondary}>
              <Text style={[styles.buttonText, { color: Colors.text }]}>Create Account</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </SignedOut>
    </View>
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
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
  },
  tabContent: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120, // Space for floating nav
    alignItems: 'center',
    width: '100%',
  },
  placeholderCard: {
    backgroundColor: Colors.backgroundLight,
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 40,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  placeholderText: {
    marginTop: 16,
    color: Colors.textMuted,
    fontSize: 16,
    textAlign: 'center',
  },
  floatingNavContainer: {
    position: 'absolute',
    bottom: 30,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: '5%',
  },
  floatingNav: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 30,
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 20,
    marginHorizontal: 1,
  },
  navItemActive: {
    backgroundColor: Colors.primary + '10', // 10% opacity
  },
  navDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
    marginHorizontal: 1,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginRight: 4,
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 24,
    borderRadius: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: Colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textMuted,
    marginBottom: 32,
  },
  buttonError: {
    backgroundColor: Colors.error,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    width: '100%',
  },
  buttonPrimary: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonSecondary: {
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
