import "../global.css";
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { router, Stack, useRootNavigationState, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { ActiveWorkoutProvider } from "@/context/ActiveWorkoutContext";
import { LibraryProvider } from "@/context/LibraryContext";
import { supabase } from "@/lib/supabase";

import { useColorScheme } from '@/hooks/use-color-scheme';
import { initDB } from '@/db/sqlite';
import { ActivityIndicator, StyleSheet, View } from "react-native";

export const unstable_settings = {
  anchor: '(tabs)',
};

function AuthGate() {
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (!error) {
        setIsAuthenticated(Boolean(data.session));
      }

      setIsAuthReady(true);
    };

    void initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session));
      setIsAuthReady(true);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!navigationState?.key || !isAuthReady) {
      return;
    }

    const inAuthFlow = segments[0] === 'login' || segments[0] === 'register';

    if (!isAuthenticated && !inAuthFlow) {
      router.replace('/login');
      return;
    }

    if (isAuthenticated && inAuthFlow) {
      router.replace('/(tabs)/profile');
    }
  }, [isAuthReady, isAuthenticated, navigationState?.key, segments]);

  if (!isAuthReady) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#F4F4F4" />
      </View>
    );
  }

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    initDB(); //init on app load
  }, []);

  return (
    <LibraryProvider>
      <ActiveWorkoutProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AuthGate />
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="register" options={{ headerShown: false }} />
            <Stack.Screen name="workout/active" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            <Stack.Screen name="workout/summary" options={{ headerShown: false }} />
            <Stack.Screen name="workout/exercises" options={{ headerShown: false }} />
            <Stack.Screen name="workout/new-exercise" options={{ headerShown: false }} />
            <Stack.Screen name="workout/routines" options={{ headerShown: false }} />
            <Stack.Screen name="workout/new-routine" options={{ headerShown: false }} />
            <Stack.Screen name="gyms" options={{ headerShown: false }} />
            <Stack.Screen name="settings" options={{ headerShown: false }} />
            <Stack.Screen name="badges" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </ActiveWorkoutProvider>
    </LibraryProvider>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#151515',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
});