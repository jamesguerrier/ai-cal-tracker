import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { X, Save, Flame, Circle, Droplets, Zap } from 'lucide-react-native';
import Colors from '../constants/Colors';

interface EditPlanModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (data: { dailyCalories: number; proteinGrams: number; fatGrams: number; carbsGrams: number; dailyWaterLiters: number }) => void;
  initialData: { dailyCalories: number; proteinGrams: number; fatGrams: number; carbsGrams: number; dailyWaterLiters: number } | null;
}

export default function EditPlanModal({ isVisible, onClose, onSave, initialData }: EditPlanModalProps) {
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [carbs, setCarbs] = useState('');
  const [water, setWater] = useState('');

  useEffect(() => {
    if (initialData) {
      setCalories(initialData.dailyCalories.toString());
      setProtein(initialData.proteinGrams.toString());
      setFat(initialData.fatGrams.toString());
      setCarbs(initialData.carbsGrams.toString());
      setWater(initialData.dailyWaterLiters?.toString() || '2.0');
    }
  }, [initialData, isVisible]);

  const handleSave = () => {
    onSave({
      dailyCalories: parseInt(calories) || 0,
      proteinGrams: parseInt(protein) || 0,
      fatGrams: parseInt(fat) || 0,
      carbsGrams: parseInt(carbs) || 0,
      dailyWaterLiters: parseFloat(water) || 0,
    });
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={styles.modalContent}
          >
            <View style={styles.header}>
              <View style={styles.headerIcon}>
                <Save size={24} color={Colors.primary} />
              </View>
              <Text style={styles.title}>Edit Daily Goals</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                  <Flame size={16} color={Colors.primary} />
                  <Text style={styles.label}>Daily Calories</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="2000"
                  value={calories}
                  onChangeText={setCalories}
                  keyboardType="numeric"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <View style={styles.grid}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                    <View style={styles.labelContainer}>
                      <Circle size={16} color="#3B82F6" />
                      <Text style={styles.label}>Protein (g)</Text>
                    </View>
                    <TextInput
                    style={styles.input}
                    placeholder="150"
                    value={protein}
                    onChangeText={setProtein}
                    keyboardType="numeric"
                    placeholderTextColor={Colors.textMuted}
                    />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                    <View style={styles.labelContainer}>
                      <Droplets size={16} color="#F59E0B" />
                      <Text style={styles.label}>Fat (g)</Text>
                    </View>
                    <TextInput
                    style={styles.input}
                    placeholder="70"
                    value={fat}
                    onChangeText={setFat}
                    keyboardType="numeric"
                    placeholderTextColor={Colors.textMuted}
                    />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                  <Zap size={16} color="#10B981" />
                  <Text style={styles.label}>Carbs (g)</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="250"
                  value={carbs}
                  onChangeText={setCarbs}
                  keyboardType="numeric"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                  <Droplets size={16} color="#3B82F6" />
                  <Text style={styles.label}>Daily Water (Liters)</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="2.0"
                  value={water}
                  onChangeText={setWater}
                  keyboardType="numeric"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Update Goals</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  form: {
    gap: 16,
  },
  grid: {
    flexDirection: 'row',
  },
  inputGroup: {
    gap: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  input: {
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.text,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
