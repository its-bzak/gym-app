import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "@/design/hooks/use-app-theme";
import { createThemedStyles } from "@/design/utils/create-themed-styles";

type V2AuthScaffoldProps = {
  iconName: "sparkles-outline" | "barbell-outline";
  title: string;
  subtitle: string;
  onBack?: () => void;
  children: ReactNode;
};

export default function V2AuthScaffold({
  iconName,
  title,
  subtitle,
  onBack,
  children,
}: V2AuthScaffoldProps) {
  const { theme } = useAppTheme();
  const styles = createThemedStyles(theme, (currentTheme) => ({
    safeArea: {
      flex: 1,
      backgroundColor: currentTheme.colors.background,
    },
    keyboardWrapper: {
      flex: 1,
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: currentTheme.spacing.lg,
      paddingTop: currentTheme.spacing.md,
      paddingBottom: currentTheme.spacing["3xl"],
      justifyContent: "center" as const,
      gap: currentTheme.spacing.md,
    },
    backButton: {
      width: 68,
      minHeight: 36,
      borderRadius: currentTheme.radii.md,
      backgroundColor: currentTheme.colors.backgroundSubtle,
      borderWidth: 1,
      borderColor: currentTheme.colors.borderMuted,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    backButtonText: {
      color: currentTheme.colors.textPrimary,
      fontSize: currentTheme.typography.label.fontSize,
      lineHeight: currentTheme.typography.label.lineHeight,
      fontWeight: currentTheme.typography.label.fontWeight,
    },
    heroCard: {
      gap: currentTheme.spacing.sm,
    },
    iconBadge: {
      width: 56,
      height: 56,
      borderRadius: currentTheme.radii.md,
      backgroundColor: currentTheme.colors.backgroundSubtle,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      marginBottom: currentTheme.spacing.xs,
    },
    title: {
      color: currentTheme.colors.textPrimary,
      fontSize: currentTheme.typography.title.fontSize,
      lineHeight: currentTheme.typography.title.lineHeight,
      fontWeight: currentTheme.typography.title.fontWeight,
    },
    subtitle: {
      color: currentTheme.colors.textSecondary,
      fontSize: currentTheme.typography.body.fontSize,
      lineHeight: currentTheme.typography.body.lineHeight,
      fontWeight: currentTheme.typography.body.fontWeight,
    },
  }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardWrapper}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {onBack ? (
            <Pressable onPress={onBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>Back</Text>
            </Pressable>
          ) : null}

          <View style={styles.heroCard}>
            <View style={styles.iconBadge}>
              <Ionicons color={theme.colors.accent} name={iconName} size={28} />
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}