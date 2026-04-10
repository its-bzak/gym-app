import "../global.css";
import { ThemeProvider } from '@react-navigation/native';
import { router, Stack, useRootNavigationState, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { ActiveWorkoutProvider } from "@/context/ActiveWorkoutContext";
import { LibraryProvider } from "@/context/LibraryContext";
import { useAppTheme } from '@/design/hooks/use-app-theme';
import { createNavigationTheme } from '@/design/themes/navigation-theme';
import { supabase } from "@/lib/supabase";

import { initDB } from '@/db/sqlite';
import { syncPendingLocalChanges } from '@/services/localSyncService';
import { ActivityIndicator, AppState, StyleSheet, View } from "react-native";

export const unstable_settings = {
  anchor: '(tabs)',
};

function AuthGate() {
  const { isDark, theme } = useAppTheme();
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
      <View
        style={[
          styles.loadingScreen,
          { backgroundColor: theme.colors.background },
        ]}>
        <ActivityIndicator size="large" color={isDark ? theme.colors.textPrimary : theme.colors.accent} />
      </View>
    );
  }

  return null;
}

export default function RootLayout() {
  const { isDark, theme } = useAppTheme();
  const navigationTheme = createNavigationTheme(theme);

  useEffect(() => {
    initDB(); //init on app load
    void syncPendingLocalChanges();

    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void syncPendingLocalChanges();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        void syncPendingLocalChanges({ force: true });
      }
    });

    return () => {
      appStateSubscription.remove();
      subscription.unsubscribe();
    };
  }, []);

  return (
    <LibraryProvider>
      <ActiveWorkoutProvider>
        <ThemeProvider value={navigationTheme}>
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
            <Stack.Screen name="history" options={{ headerShown: false }} />
            <Stack.Screen name="settings" options={{ headerShown: false }} />
            <Stack.Screen name="badges" options={{ headerShown: false }} />
            <Stack.Screen name="food-library" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style={isDark ? 'light' : 'dark'} />
        </ThemeProvider>
      </ActiveWorkoutProvider>
    </LibraryProvider>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
});