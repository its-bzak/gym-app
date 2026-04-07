import type { PropsWithChildren } from "react";
import { View } from "react-native";
import { useAppTheme } from "@/design/hooks/use-app-theme";
import { createThemedStyles } from "@/design/utils/create-themed-styles";
import type { SurfaceCardPadding, SurfaceCardProps, SurfaceCardVariant } from "@/design/components/primitives/types";

function getBackgroundColor(variant: SurfaceCardVariant, isDark: boolean, colors: ReturnType<typeof useAppTheme>["theme"]["colors"]) {
  switch (variant) {
    case "muted":
      return colors.surfaceMuted;
    case "elevated":
      return isDark ? colors.surfaceElevated : colors.surface;
    default:
      return colors.surface;
  }
}

function getPaddingValue(padding: SurfaceCardPadding, space: ReturnType<typeof useAppTheme>["theme"]["spacing"]) {
  switch (padding) {
    case "sm":
      return space.sm;
    case "lg":
      return space.lg;
    default:
      return space.md;
  }
}

export default function SurfaceCard({
  children,
  variant = "default",
  padding = "md",
}: PropsWithChildren<SurfaceCardProps>) {
  const { theme, isDark } = useAppTheme();
  const styles = createThemedStyles(theme, (currentTheme) => ({
    card: {
      borderRadius: currentTheme.radii.xl,
      borderWidth: 1,
      borderColor: currentTheme.colors.borderMuted,
      backgroundColor: getBackgroundColor(variant, isDark, currentTheme.colors),
      padding: getPaddingValue(padding, currentTheme.spacing),
      gap: currentTheme.components.card.gap,
      ...currentTheme.shadows.card,
    },
  }));

  return <View style={styles.card}>{children}</View>;
}