import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "@/design/hooks/use-app-theme";
import { createThemedStyles } from "@/design/utils/create-themed-styles";
import { getV2SessionState } from "@/v2/adapters/auth";
import { V2_ROUTES } from "@/v2/navigation/routes";

export default function V2SplashScreen() {
  const { theme } = useAppTheme();
  const [statusMessage, setStatusMessage] = useState("Checking saved session");

  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const bootstrap = async () => {
      try {
        const sessionState = await getV2SessionState();

        if (!isMounted) {
          return;
        }

        setStatusMessage(sessionState.isAuthenticated ? "Loading V2 dashboard" : "Preparing sign-in preview");

        timeoutId = setTimeout(() => {
          if (sessionState.isAuthenticated) {
            router.replace(V2_ROUTES.dashboard);
            return;
          }

          router.replace(V2_ROUTES.login);
        }, 450);
      } catch {
        if (!isMounted) {
          return;
        }

        setStatusMessage("Opening preview shell");
        timeoutId = setTimeout(() => {
          router.replace(V2_ROUTES.login);
        }, 450);
      }
    };

    void bootstrap();

    return () => {
      isMounted = false;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const styles = createThemedStyles(theme, (currentTheme) => ({
    safeArea: {
      flex: 1,
      backgroundColor: currentTheme.colors.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: currentTheme.spacing.lg,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: currentTheme.spacing.md,
    },
    badge: {
      width: 64,
      height: 64,
      borderRadius: currentTheme.radii.md,
      backgroundColor: currentTheme.colors.backgroundSubtle,
      borderWidth: 1,
      borderColor: currentTheme.colors.borderMuted,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    title: {
      color: currentTheme.colors.textPrimary,
      fontSize: currentTheme.typography.title.fontSize,
      lineHeight: currentTheme.typography.title.lineHeight,
      fontWeight: currentTheme.typography.title.fontWeight,
      textAlign: "center" as const,
    },
    subtitle: {
      color: currentTheme.colors.textSecondary,
      fontSize: currentTheme.typography.body.fontSize,
      lineHeight: currentTheme.typography.body.lineHeight,
      fontWeight: currentTheme.typography.body.fontWeight,
      textAlign: "center" as const,
      maxWidth: 280,
    },
  }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.badge}>
          <Ionicons color={theme.colors.accent} name="sparkles-outline" size={38} />
        </View>
        <Text style={styles.title}>Gym Tracker V2</Text>
        <Text style={styles.subtitle}>
          Bare scaffold. Current auth, storage, and sync remain connected.
        </Text>
        <ActivityIndicator color={theme.colors.accent} size="large" />
        <Text style={styles.subtitle}>{statusMessage}</Text>
      </View>
    </SafeAreaView>
  );
}