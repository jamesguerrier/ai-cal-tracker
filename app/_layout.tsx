import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import { Stack } from 'expo-router';
import { tokenCache } from '../utils/clerk';

// Replace this with your Clerk Publishable Key
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_placeholder_key';

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
