import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useSignUp, useOAuth } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { ArrowLeft, Mail, Lock, User } from 'lucide-react-native';
import { db } from '../../utils/firebase';
import { doc, setDoc } from 'firebase/firestore';
import Colors from '../../constants/Colors';

WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const saveUserToFirestore = async (userId: string, email: string, firstName?: string, lastName?: string) => {
    try {
      const savePromise = setDoc(doc(db, 'users', userId), {
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        createdAt: new Date().toISOString(),
      }, { merge: true });

      // Add a 5 second timeout so it doesn't hang the UI if network fails
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Firestore save timeout')), 5000)
      );

      await Promise.race([savePromise, timeoutPromise]);
    } catch (error) {
      console.error('Error saving user to firestore:', error);
      // We don't throw here so that the user still gets logged in 
      // even if the firestore sync fails temporarily
    }
  };

  const onSignUpPress = async () => {
    if (!isLoaded) return;
    setLoading(true);

    try {
      await signUp.create({
        firstName,
        lastName,
        emailAddress,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      console.error(err);
      alert(err.errors[0]?.message || 'Failed to sign up.');
    } finally {
      setLoading(false);
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded) return;
    setLoading(true);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === 'complete') {
        await saveUserToFirestore(
          completeSignUp.createdUserId!,
          emailAddress,
          firstName,
          lastName
        );
        await setActive({ session: completeSignUp.createdSessionId });
        router.replace('/');
      } else {
        console.error(JSON.stringify(completeSignUp, null, 2));
      }
    } catch (err: any) {
      console.error(err);
      alert(err.errors[0]?.message || 'Failed to verify email.');
    } finally {
      setLoading(false);
    }
  };

  const onGoogleSignUpPress = async () => {
    try {
      const { createdSessionId, setActive: setOAuthActive, signUp: oauthSignUp } = await startOAuthFlow();
      if (createdSessionId && setOAuthActive) {
        if (oauthSignUp?.createdUserId && oauthSignUp?.emailAddress) {
           await saveUserToFirestore(
             oauthSignUp.createdUserId,
             oauthSignUp.emailAddress,
             oauthSignUp.firstName || '',
             oauthSignUp.lastName || ''
           );
        }
        await setOAuthActive({ session: createdSessionId });
        router.replace('/');
      }
    } catch (err) {
      console.error('OAuth error', err);
    }
  };

  if (pendingVerification) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setPendingVerification(false)} style={styles.backButton}>
            <ArrowLeft color={Colors.text} size={24} />
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>Confirm Email</Text>
          <Text style={styles.subtitle}>Enter the verification code sent to {emailAddress}</Text>
          
          <View style={styles.inputContainer}>
            <Lock color={Colors.textMuted} size={20} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={code}
              placeholder="Verification Code"
              placeholderTextColor={Colors.textMuted}
              keyboardType="number-pad"
              onChangeText={setCode}
            />
          </View>

          <TouchableOpacity 
            style={[styles.primaryButton, loading && styles.buttonDisabled]} 
            onPress={onPressVerify}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Verifying...' : 'Verify Email'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={Colors.text} size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Image 
          source={require('../../assets/images/icon.png')} 
          style={styles.logo} 
          resizeMode="contain"
        />
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Start your AI Calorie tracking journey</Text>

        <TouchableOpacity style={styles.googleButton} onPress={onGoogleSignUpPress}>
            <Text style={styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or continue with email</Text>
            <View style={styles.divider} />
        </View>

        <View style={styles.inputContainer}>
          <User color={Colors.textMuted} size={20} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={firstName}
            placeholder="First Name"
            placeholderTextColor={Colors.textMuted}
            onChangeText={setFirstName}
          />
        </View>

        <View style={styles.inputContainer}>
          <User color={Colors.textMuted} size={20} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={lastName}
            placeholder="Last Name"
            placeholderTextColor={Colors.textMuted}
            onChangeText={setLastName}
          />
        </View>

        <View style={styles.inputContainer}>
          <Mail color={Colors.textMuted} size={20} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            value={emailAddress}
            placeholder="Email address"
            placeholderTextColor={Colors.textMuted}
            onChangeText={setEmailAddress}
          />
        </View>

        <View style={styles.inputContainer}>
          <Lock color={Colors.textMuted} size={20} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={password}
            placeholder="Password"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity 
          style={[styles.primaryButton, loading && styles.buttonDisabled]} 
          onPress={onSignUpPress}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/(auth)/sign-in" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  content: {
    paddingHorizontal: 32,
    flex: 1,
    paddingTop: 10,
  },
  logo: {
    width: 64,
    height: 64,
    marginBottom: 16,
    borderRadius: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textMuted,
    marginBottom: 32,
  },
  googleButton: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 16,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: Colors.textInverse,
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    color: Colors.textMuted,
    fontSize: 15,
  },
  footerLink: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
});
