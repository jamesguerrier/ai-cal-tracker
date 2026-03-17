import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SignedIn, SignedOut, useAuth } from '@clerk/clerk-expo';
import { Link } from 'expo-router';
import Colors from '../constants/Colors';

export default function Index() {
  const { signOut } = useAuth();
  return (
    <View style={styles.container}>
      <SignedIn>
        <View style={styles.content}>
          <Text style={styles.title}>AI Calories Tracker</Text>
          <Text style={styles.subtitle}>Welcome to your dashboard!</Text>
          <TouchableOpacity style={styles.buttonError} onPress={() => signOut()}>
            <Text style={styles.buttonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </SignedIn>
      
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
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
