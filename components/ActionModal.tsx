import React from 'react';
import { 
  Modal, 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { X, Dumbbell, Droplet, Search, Camera, Crown, Image as ImageIcon, ChevronLeft } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import Colors from '../constants/Colors';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface ActionModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (action: 'exercise' | 'water' | 'food' | 'scan') => void;
}

export default function ActionModal({ isVisible, onClose, onSelect }: ActionModalProps) {
  const router = useRouter();
  const [showScanOptions, setShowScanOptions] = React.useState(false);

  const actions = [
    { id: 'exercise', title: 'Log Exercise', icon: Dumbbell, color: '#F87171' },
    { id: 'water', title: 'Add Water', icon: Droplet, color: '#60A5FA' },
    { id: 'food', title: 'Food Database', icon: Search, color: '#34D399' },
    { id: 'scan', title: 'Scan Food', icon: Camera, color: '#A78BFA', isPremium: true },
  ];

  const handlePickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      onClose();
      setShowScanOptions(false);
      router.push({
        pathname: '/analyze-result',
        params: { imageUri: result.assets[0].uri, source: 'gallery' }
      });
    }
  };

  const handleCamera = () => {
    onClose();
    setShowScanOptions(false);
    router.push({
      pathname: '/camera-view',
      params: { source: 'camera' }
    });
  };

  React.useEffect(() => {
    if (!isVisible) {
      setShowScanOptions(false);
    }
  }, [isVisible]);

  return (
    <Modal
      visible={isVisible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.headerRow}>
            {showScanOptions && (
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => setShowScanOptions(false)}
              >
                <ChevronLeft size={24} color={Colors.text} />
              </TouchableOpacity>
            )}
            <Text style={styles.headerTitle}>
              {showScanOptions ? 'Choose Source' : 'What would you like to log?'}
            </Text>
            {showScanOptions && <View style={{ width: 40 }} />}
          </View>
          
          <View style={styles.grid}>
            {!showScanOptions ? (
              actions.map((action) => (
                <TouchableOpacity 
                  key={action.id} 
                  style={styles.actionCard}
                  onPress={() => {
                    if (action.id === 'exercise') {
                      onClose();
                      router.push('/log-exercise');
                    } else if (action.id === 'water') {
                      onClose();
                      router.push('/log-water');
                    } else if (action.id === 'food') {
                      onClose();
                      router.push('/food-search');
                    } else if (action.id === 'scan') {
                      setShowScanOptions(true);
                    } else {
                      onSelect(action.id as any);
                      onClose();
                    }
                  }}
                >
                  <View style={[styles.iconWrapper, { backgroundColor: action.color + '15' }]}>
                    <action.icon size={32} color={action.color} />
                  </View>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  
                  {action.isPremium && (
                    <View style={styles.premiumBadge}>
                      <Crown size={10} color="#fff" />
                      <Text style={styles.premiumText}>PRO</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <>
                <TouchableOpacity 
                  style={styles.actionCard}
                  onPress={handleCamera}
                >
                  <View style={[styles.iconWrapper, { backgroundColor: '#A78BFA15' }]}>
                    <Camera size={32} color="#A78BFA" />
                  </View>
                  <Text style={styles.actionTitle}>Open Camera</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.actionCard}
                  onPress={handlePickImage}
                >
                  <View style={[styles.iconWrapper, { backgroundColor: '#34D39915' }]}>
                    <ImageIcon size={32} color="#34D399" />
                  </View>
                  <Text style={styles.actionTitle}>Upload Picture</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={28} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Glassmorphism-ish transparent background
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width,
    padding: 24,
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
    width: '100%',
  },
  actionCard: {
    width: (width - 68) / 2,
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  premiumBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  premiumText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  closeButton: {
    marginTop: 60,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
});
