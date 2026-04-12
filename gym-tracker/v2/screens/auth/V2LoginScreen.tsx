import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { useAppTheme } from "@/design/hooks/use-app-theme";
import { createThemedStyles } from "@/design/utils/create-themed-styles";
import { getV2SessionState, signInToV2 } from "@/v2/adapters/auth";
import V2AuthScaffold from "@/v2/components/V2AuthScaffold";
import { V2_ROUTES } from "@/v2/navigation/routes";

export default function V2LoginScreen() {
  const { theme } = useAppTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      const sessionState = await getV2SessionState();

      if (!isMounted || !sessionState.isAuthenticated) {
        return;
      }

      router.replace(V2_ROUTES.dashboard);
    };

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const styles = createThemedStyles(theme, (currentTheme) => ({
    card: {
      borderRadius: currentTheme.radii.xl,
      backgroundColor: currentTheme.colors.surface,
      borderWidth: 1,
      borderColor: currentTheme.colors.borderMuted,
      padding: currentTheme.spacing.lg,
      gap: currentTheme.spacing.md,
    },
    fieldGroup: {
      gap: currentTheme.spacing.xs,
    },
    label: {
      color: currentTheme.colors.textSecondary,
      fontSize: currentTheme.typography.caption.fontSize,
      lineHeight: currentTheme.typography.caption.lineHeight,
      fontWeight: currentTheme.typography.caption.fontWeight,
    },
    input: {
      minHeight: currentTheme.components.input.height,
      borderRadius: currentTheme.components.input.radius,
      backgroundColor: currentTheme.colors.inputBackground,
      borderWidth: 1,
      borderColor: currentTheme.colors.inputBorder,
      color: currentTheme.colors.textPrimary,
      paddingHorizontal: currentTheme.spacing.md,
      fontSize: currentTheme.typography.body.fontSize,
      lineHeight: currentTheme.typography.body.lineHeight,
      fontWeight: currentTheme.typography.body.fontWeight,
    },
    primaryButton: {
      minHeight: currentTheme.components.button.height,
      borderRadius: currentTheme.components.button.radius,
      backgroundColor: currentTheme.colors.accent,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    primaryButtonDisabled: {
      opacity: 0.7,
    },
    primaryButtonText: {
      color: currentTheme.colors.onAccent,
      fontSize: currentTheme.typography.label.fontSize,
      lineHeight: currentTheme.typography.label.lineHeight,
      fontWeight: currentTheme.typography.label.fontWeight,
    },
    secondaryButton: {
      minHeight: currentTheme.components.button.height,
      borderRadius: currentTheme.components.button.radius,
      backgroundColor: currentTheme.colors.backgroundSubtle,
      borderWidth: 1,
      borderColor: currentTheme.colors.borderMuted,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    secondaryButtonText: {
      color: currentTheme.colors.textPrimary,
      fontSize: currentTheme.typography.label.fontSize,
      lineHeight: currentTheme.typography.label.lineHeight,
      fontWeight: currentTheme.typography.label.fontWeight,
    },
  }));

  const handleLogin = async () => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !password) {
      Alert.alert("Missing information", "Enter both email and password.");
      return;
    }

    setIsSubmitting(true);
    const result = await signInToV2({ email: trimmedEmail, password });
    setIsSubmitting(false);

    if (!result.success) {
      Alert.alert("Login failed", result.error ?? "Could not sign in.");
      return;
    }

    router.replace(V2_ROUTES.dashboard);
  };

  return (
    <V2AuthScaffold
      iconName="barbell-outline"
      title="Login"
      subtitle="Connected to the current auth flow.">
      <View style={styles.card}>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={theme.colors.inputPlaceholder}
            style={styles.input}
            value={email}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor={theme.colors.inputPlaceholder}
            secureTextEntry
            style={styles.input}
            value={password}
          />
        </View>

        <Pressable
          disabled={isSubmitting}
          onPress={() => void handleLogin()}
          style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}>
          {isSubmitting ? (
            <ActivityIndicator color={theme.colors.onAccent} />
          ) : (
            <Text style={styles.primaryButtonText}>Open V2</Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.push(V2_ROUTES.register)} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Create an account</Text>
        </Pressable>
      </View>
    </V2AuthScaffold>
  );
}