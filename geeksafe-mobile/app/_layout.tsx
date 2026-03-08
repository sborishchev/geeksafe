import React, { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreenNative from 'expo-splash-screen';
import SplashScreenCustom from '../screens/EntrySplashScreen';
import { AppProvider } from '../services/AppState';

// Keep the native splash screen visible while we load our custom one
SplashScreenNative.preventAutoHideAsync();

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    // Tell the native splash screen to hide once our JS is loaded
    SplashScreenNative.hideAsync();
  }, []);

  if (!appIsReady) {
    return <SplashScreenCustom onFinish={() => setAppIsReady(true)} />;
  }

  // 2. Wrap everything in the AppProvider
  return (
    <AppProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* This renders your (tabs) folder automatically */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </AppProvider>
  );
}