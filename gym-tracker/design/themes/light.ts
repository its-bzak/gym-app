import { lightColors, lightShadows, radii, spacing, typography } from "@/design/tokens";
import type { ThemeTokens } from "@/design/tokens";

export const lightTheme: ThemeTokens = {
  mode: "light",
  colors: lightColors,
  spacing,
  radii,
  typography,
  shadows: lightShadows,
  components: {
    header: {
      height: 56,
      avatarSize: 40,
      iconSize: 22,
    },
    tabBar: {
      height: 68,
      iconSize: 24,
      activeIndicatorHeight: 3,
    },
    card: {
      padding: 16,
      gap: 12,
    },
    button: {
      height: 48,
      radius: 14,
    },
    input: {
      height: 48,
      radius: 14,
    },
    listRow: {
      minHeight: 56,
      radius: 16,
    },
  },
};