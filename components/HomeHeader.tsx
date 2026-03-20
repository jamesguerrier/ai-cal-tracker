import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { Bell } from 'lucide-react-native';
import Colors from '../constants/Colors';

export default function HomeHeader() {
  const { user } = useUser();

  if (!user) return null;

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <Image 
          source={{ uri: user.imageUrl }} 
          style={styles.profileImage} 
        />
        <View style={styles.textContainer}>
          <Text style={styles.welcomeText}>Welcome</Text>
          <Text style={styles.userName}>{user.firstName || user.username}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.notificationButton}>
        <View style={styles.notificationBadge} />
        <Bell size={24} color={Colors.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 10,
    marginBottom: 20,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  textContainer: {
    marginLeft: 12,
  },
  welcomeText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notificationBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
    zIndex: 1,
    borderWidth: 1,
    borderColor: Colors.backgroundLight,
  },
});
