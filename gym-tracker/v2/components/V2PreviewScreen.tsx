import type { ComponentProps, ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "@/design/hooks/use-app-theme";
import { createThemedStyles } from "@/design/utils/create-themed-styles";

type V2PreviewAction = {
  id: string;
  label: string;
  onPress: () => void;
  tone?: "primary" | "secondary" | "danger";
  iconName?: ComponentProps<typeof Ionicons>["name"];
};

type V2PreviewScreenProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  statusMessage?: string;
  actions?: V2PreviewAction[];
  children: ReactNode;
};

export default function V2PreviewScreen({
  eyebrow,
  title,
  subtitle,
  statusMessage,
  actions,
  children,
}: V2PreviewScreenProps) {
  const { theme } = useAppTheme();
  const styles = createThemedStyles(theme, (currentTheme) => ({
    safeArea: {
      flex: 1,
      backgroundColor: currentTheme.colors.background,
    },
    content: {
      paddingHorizontal: currentTheme.spacing.lg,
      paddingTop: currentTheme.spacing.md,
      paddingBottom: currentTheme.spacing["3xl"],
      gap: currentTheme.spacing.md,
    },
    hero: {
      gap: currentTheme.spacing.xs,
    },
    eyebrow: {
      color: currentTheme.colors.textSecondary,
      fontSize: currentTheme.typography.caption.fontSize,
      lineHeight: currentTheme.typography.caption.lineHeight,
      fontWeight: currentTheme.typography.caption.fontWeight,
      textTransform: "uppercase" as const,
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
    statusBanner: {
      borderRadius: currentTheme.radii.md,
      backgroundColor: currentTheme.colors.backgroundSubtle,
      borderWidth: 1,
      borderColor: currentTheme.colors.borderMuted,
      paddingHorizontal: currentTheme.spacing.md,
      paddingVertical: currentTheme.spacing.sm,
    },
    statusText: {
      color: currentTheme.colors.textPrimary,
      fontSize: currentTheme.typography.caption.fontSize,
      lineHeight: currentTheme.typography.caption.lineHeight,
      fontWeight: currentTheme.typography.caption.fontWeight,
    },
    actionRow: {
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
      gap: currentTheme.spacing.sm,
    },
    actionButton: {
      minHeight: currentTheme.components.button.height,
      borderRadius: currentTheme.components.button.radius,
      paddingHorizontal: currentTheme.spacing.md,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: currentTheme.spacing.xs,
    },
    actionButtonPrimary: {
      backgroundColor: currentTheme.colors.surface,
      borderWidth: 1,
      borderColor: currentTheme.colors.borderMuted,
    },
    actionButtonSecondary: {
      backgroundColor: currentTheme.colors.surface,
      borderWidth: 1,
      borderColor: currentTheme.colors.borderMuted,
    },
    actionButtonDanger: {
      backgroundColor: currentTheme.colors.dangerSoft,
      borderWidth: 1,
      borderColor: currentTheme.colors.danger,
    },
    actionTextPrimary: {
      color: currentTheme.colors.textPrimary,
    },
    actionTextSecondary: {
      color: currentTheme.colors.textPrimary,
    },
    actionTextDanger: {
      color: currentTheme.colors.danger,
    },
    actionText: {
      fontSize: currentTheme.typography.label.fontSize,
      lineHeight: currentTheme.typography.label.lineHeight,
      fontWeight: currentTheme.typography.label.fontWeight,
    },
  }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        {statusMessage ? (
          <View style={styles.statusBanner}>
            <Text style={styles.statusText}>{statusMessage}</Text>
          </View>
        ) : null}

        {actions?.length ? (
          <View style={styles.actionRow}>
            {actions.map((action) => {
              const buttonStyle =
                action.tone === "danger"
                  ? styles.actionButtonDanger
                  : action.tone === "secondary"
                    ? styles.actionButtonSecondary
                    : styles.actionButtonPrimary;
              const textStyle =
                action.tone === "danger"
                  ? styles.actionTextDanger
                  : action.tone === "secondary"
                    ? styles.actionTextSecondary
                    : styles.actionTextPrimary;

              return (
                <Pressable key={action.id} onPress={action.onPress} style={[styles.actionButton, buttonStyle]}>
                  {action.iconName ? <Ionicons color={textStyle.color} name={action.iconName} size={18} /> : null}
                  <Text style={[styles.actionText, textStyle]}>{action.label}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {children}
      </ScrollView>
    </SafeAreaView>
  );
}