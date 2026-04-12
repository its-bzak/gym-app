import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { useAppTheme } from "@/design/hooks/use-app-theme";
import { createThemedStyles } from "@/design/utils/create-themed-styles";

type V2SectionCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export default function V2SectionCard({ title, subtitle, children }: V2SectionCardProps) {
  const { theme } = useAppTheme();
  const styles = createThemedStyles(theme, (currentTheme) => ({
    card: {
      borderRadius: currentTheme.radii.md,
      backgroundColor: currentTheme.colors.backgroundSubtle,
      borderWidth: 1,
      borderColor: currentTheme.colors.borderMuted,
      padding: currentTheme.spacing.md,
      gap: currentTheme.spacing.sm,
    },
    title: {
      color: currentTheme.colors.textPrimary,
      fontSize: currentTheme.typography.body.fontSize,
      lineHeight: currentTheme.typography.body.lineHeight,
      fontWeight: currentTheme.typography.label.fontWeight,
    },
    subtitle: {
      color: currentTheme.colors.textSecondary,
      fontSize: currentTheme.typography.body.fontSize,
      lineHeight: currentTheme.typography.body.lineHeight,
      fontWeight: currentTheme.typography.body.fontWeight,
    },
  }));

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}