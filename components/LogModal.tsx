import React, { useState } from 'react';
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
import { X, Plus, Utensils } from 'lucide-react-native';
import Colors from '../constants/Colors';

interface LogModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (data: { name: string; calories: number; protein: number; fat: number; carbs: number; water: number }) => void;
}

export default function LogModal({ isVisible, onClose, onSave }: LogModalProps) {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [carbs, setCarbs] = useState('');
  const [water, setWater] = useState('');

  const handleSave = () => {
    onSave({
      name: name || 'Quick Log',
      calories: parseInt(calories) || 0,
      protein: parseInt(protein) || 0,
      fat: parseInt(fat) || 0,
      carbs: parseInt(carbs) || 0,
      water: parseFloat(water) || 0,
    });
    // Reset state
    setName('');
    setCalories('');
    setProtein('');
    setFat('');
    setCarbs('');
    setWater('');
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
                <Utensils size={24} color={Colors.primary} />
              </View>
              <Text style={styles.title}>Quick Log</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Food Name (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Chicken Salad"
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <View style={styles.grid}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.label}>Calories</Text>
                    <TextInput
                    style={styles.input}
                    placeholder="0"
                    value={calories}
                    onChangeText={setCalories}
                    keyboardType="numeric"
                    placeholderTextColor={Colors.textMuted}
                    />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Protein (g)</Text>
                    <TextInput
                    style={styles.input}
                    placeholder="0"
                    value={protein}
                    onChangeText={setProtein}
                    keyboardType="numeric"
                    placeholderTextColor={Colors.textMuted}
                    />
                </View>
              </View>

              <View style={styles.grid}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.label}>Fat (g)</Text>
                    <TextInput
                    style={styles.input}
                    placeholder="0"
                    value={fat}
                    onChangeText={setFat}
                    keyboardType="numeric"
                    placeholderTextColor={Colors.textMuted}
                    />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Carbs (g)</Text>
                    <TextInput
                    style={styles.input}
                    placeholder="0"
                    value={carbs}
                    onChangeText={setCarbs}
                    keyboardType="numeric"
                    placeholderTextColor={Colors.textMuted}
                    />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Water (Liters)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.0"
                  value={water}
                  onChangeText={setWater}
                  keyboardType="numeric"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Plus size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Add to Daily Log</Text>
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
    marginLeft: 4,
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
    gap: 8,
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
