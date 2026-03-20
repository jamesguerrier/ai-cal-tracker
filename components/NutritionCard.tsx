import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Edit2, Circle, Droplets, Zap } from 'lucide-react-native';
import HalfProgressBar from './HalfProgressBar';
import Colors from '../constants/Colors';

interface MacroProps {
  label: string;
  value: string;
  target: string;
  icon: React.ElementType;
  color: string;
}

const MacroItem = ({ label, value, target, icon: Icon, color }: MacroProps) => (
  <View style={styles.macroItem}>
    <View style={[styles.macroIconContainer, { backgroundColor: color + '15' }]}>
      <Icon color={color} size={20} />
    </View>
    <View style={styles.macroTextContainer}>
      <Text style={styles.macroValue}>{value}</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  </View>
);

interface NutritionCardProps {
  caloriesRemaining: number;
  caloriesTotal: number;
  protein: { current: number; total: number };
  fat: { current: number; total: number };
  carbs: { current: number; total: number };
  onEdit?: () => void;
}

export default function NutritionCard({
  caloriesRemaining,
  caloriesTotal,
  protein,
  fat,
  carbs,
  onEdit
}: NutritionCardProps) {
  const calorieProgress = Math.max(0, 1 - (caloriesRemaining / caloriesTotal));

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Calories</Text>
        <TouchableOpacity onPress={onEdit} style={styles.editButton}>
          <Edit2 size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.progressContainer}>
        <HalfProgressBar 
          progress={calorieProgress} 
          value={caloriesRemaining.toString()} 
          label="Remaining" 
        />
      </View>

      <View style={styles.footer}>
        <MacroItem 
          label="Protein Left" 
          value={`${Math.max(0, protein.total - protein.current)}g`} 
          target={`${protein.total}g`} 
          icon={Circle} 
          color="#3B82F6" 
        />
        <View style={styles.divider} />
        <MacroItem 
          label="Fat Left" 
          value={`${Math.max(0, fat.total - fat.current)}g`} 
          target={`${fat.total}g`} 
          icon={Droplets} 
          color="#F59E0B" 
        />
        <View style={styles.divider} />
        <MacroItem 
          label="Carbs Left" 
          value={`${Math.max(0, carbs.total - carbs.current)}g`} 
          target={`${carbs.total}g`} 
          icon={Zap} 
          color="#10B981" 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    width: '100%',
    borderRadius: 24,
    padding: 20,
    paddingTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  editButton: {
    padding: 5,
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
    marginTop: -10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
  },
  macroIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  macroTextContainer: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  macroTarget: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  macroLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 5,
  },
});
