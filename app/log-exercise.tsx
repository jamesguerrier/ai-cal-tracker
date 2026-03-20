import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Activity, Dumbbell, Flame, ChevronRight } from 'lucide-react-native';
import Colors from '../constants/Colors';

export default function LogExerciseScreen() {
  const router = useRouter();

  const exerciseOptions = [
    {
      id: 'run',
      title: 'Run',
      subtitle: 'Running, walking, cycling, etc.',
      icon: Activity,
      color: '#F87171',
    },
    {
      id: 'weights',
      title: 'Weight Lifting',
      subtitle: 'Gym, Machine, etc.',
      icon: Dumbbell,
      color: '#60A5FA',
    },
    {
      id: 'manual',
      title: 'Manual',
      subtitle: 'Enter calories burned manually.',
      icon: Flame,
      color: '#F59E0B',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          <ArrowLeft size={28} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Log Exercise</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Select Exercise Type</Text>
        
        <View style={styles.optionsList}>
          {exerciseOptions.map((option) => (
            <TouchableOpacity 
              key={option.id} 
              style={styles.optionCard}
              onPress={() => {
                if (option.id === 'manual') {
                  router.push('/manual-exercise');
                } else {
                  router.push({
                    pathname: '/exercise-details',
                    params: { 
                      type: option.id, 
                      title: option.title, 
                      subtitle: option.subtitle 
                    }
                  });
                }
              }}
            >
              <View style={[styles.iconContainer, { backgroundColor: option.color + '15' }]}>
                <option.icon size={24} color={option.color} />
              </View>
              
              <View style={styles.textContainer}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
              </View>

              <ChevronRight size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
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
    padding: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 20,
    marginLeft: 4,
  },
  optionsList: {
    gap: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 20,
  },
});
