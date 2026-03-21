import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '@clerk/clerk-expo';
import Colors from '../constants/Colors';
import { Weight, Check, ChevronRight } from 'lucide-react-native';

interface WeeklyStatus {
  day: string;
  dayFull: string;
  active: boolean;
  date: string;
}

export default function AnalyticsView() {
  const { userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [streakData, setStreakData] = useState<WeeklyStatus[]>([]);
  const [userWeight, setUserWeight] = useState<string>('--');
  const [currentStreak, setCurrentStreak] = useState(0);
  const [showStreakModal, setShowStreakModal] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchAnalyticsData();
    }
  }, [userId]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch User Profile for Weight
      const userRef = doc(db, 'users', userId!);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setUserWeight(data.weight || data.healthData?.weight || '--');
      }

      // 2. Fetch Weekly Streak
      const today = new Date();
      const currentDay = today.getDay(); // 0 is Sunday
      const sun = new Date(today);
      sun.setDate(today.getDate() - currentDay);
      
      const days: WeeklyStatus[] = [];
      const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
      
      let streakCount = 0;
      let countingStreak = true;

      // We need to check each day of the current week
      for (let i = 0; i < 7; i++) {
        const d = new Date(sun);
        d.setDate(sun.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        
        const logRef = doc(db, 'users', userId!, 'dailyLogs', dateStr);
        const logSnap = await getDoc(logRef);
        
        const isActive = logSnap.exists() && (
          (logSnap.data().calories || 0) > 0 || 
          (logSnap.data().water || 0) > 0
        );

        days.push({
          day: dayLabels[i],
          dayFull: d.toLocaleDateString('en-US', { weekday: 'short' }),
          active: isActive,
          date: dateStr
        });

        // Simple streak logic (consecutive active days up to today)
        const isToday = dateStr === today.toISOString().split('T')[0];
        const isPast = d < today;
        
        // This is a basic week-streak. For a true multi-week streak, 
        // we'd need more data, but let's fulfill the UI first.
      }

      setStreakData(days);
      
      // Calculate active days in this week as streak for now
      setStreakData(days);
      setCurrentStreak(days.filter(d => d.active).length);

    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.mainTitle}>Progress</Text>
      
      <View style={styles.cardRow}>
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.8}
        onPress={() => setShowStreakModal(true)}
      >
        <Image 
          source={require('../assets/images/fire.png')} 
          style={styles.fireIcon}
          resizeMode="contain"
        />
        <Text style={styles.cardLabel}>Day Streak</Text>
        <Text style={styles.streakValue}>{currentStreak}</Text>
        
        <View style={styles.weekContainer}>
          {streakData.map((item, index) => (
            <View key={index} style={styles.dayItem}>
              <View style={[
                styles.checkbox, 
                item.active && styles.checkboxActive
              ]}>
                {item.active && <Check size={10} color="#fff" strokeWidth={4} />}
              </View>
              <Text style={styles.dayLabel}>{item.day}</Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>

        <TouchableOpacity style={styles.card} activeOpacity={0.7}>
          <View style={styles.chevronBox}>
            <ChevronRight size={16} color={Colors.textMuted} />
          </View>
          <View style={styles.weightIconWrapper}>
             <Weight size={32} color={Colors.primary} />
          </View>
          <Text style={styles.cardLabel}>My weight</Text>
          <View style={styles.weightValueContainer}>
            <Text style={styles.streakValue}>{userWeight}</Text>
            <Text style={styles.unitText}>kg</Text>
          </View>
          <Text style={styles.weightSubtext}>Last updated: Today</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showStreakModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStreakModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowStreakModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                   <Image source={require('../assets/images/fire.png')} style={styles.fireIconLarge} />
                   <View style={styles.modalHeaderTextContainer}>
                      <Text style={styles.modalStreakValue}>{currentStreak}</Text>
                      <Text style={styles.modalCardLabel}>Daily Streak</Text>
                   </View>
                   <Text style={styles.keepItUp}>Keep it up 🔥</Text>
                </View>

                <View style={styles.modalWeekContainer}>
                  {streakData.map((item, index) => (
                    <View key={index} style={styles.modalDayItem}>
                      <View style={[
                        styles.modalCheckbox, 
                        item.active && styles.modalCheckboxActive
                      ]}>
                        {item.active && <Check size={14} color="#fff" strokeWidth={4} />}
                      </View>
                      <Text style={styles.modalDayLabel}>{item.dayFull}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 120,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 24,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  fireIcon: {
    width: 40,
    height: 40,
    marginBottom: 8,
  },
  weightIconWrapper: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 4,
  },
  chevronBox: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  streakValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 12,
  },
  weekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  dayItem: {
    alignItems: 'center',
    gap: 4,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  weightValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  unitText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  weightSubtext: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  fireIconLarge: {
    width: 64,
    height: 64,
    marginRight: 16,
  },
  modalHeaderTextContainer: {
    flex: 1,
  },
  modalStreakValue: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.text,
  },
  modalCardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  keepItUp: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  modalWeekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalDayItem: {
    alignItems: 'center',
    gap: 8,
  },
  modalCheckbox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCheckboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  modalDayLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
  },
});
