import { DefaultTheme, type Theme } from '@react-navigation/native';
import type { ThemeTokens } from '@/design/tokens';

export function createNavigationTheme(themeTokens: ThemeTokens): Theme {
  return {
    ...DefaultTheme,
    dark: themeTokens.mode === 'dark',
    colors: {
      ...DefaultTheme.colors,
      primary: themeTokens.colors.accent,
      background: themeTokens.colors.background,
      card: themeTokens.colors.surface,
      text: themeTokens.colors.textPrimary,
      border: themeTokens.colors.border,
      notification: themeTokens.colors.danger,
    },
  };
}