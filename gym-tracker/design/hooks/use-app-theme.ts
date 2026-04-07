import { useColorScheme } from "@/hooks/use-color-scheme";
import { getTheme } from "@/design/themes";
import type { ThemeMode } from "@/design/tokens";

export function useAppTheme() {
  const colorScheme = useColorScheme();
  const mode: ThemeMode = colorScheme === "dark" ? "dark" : "light";
  const theme = getTheme(mode);

  return {
    colorScheme: mode,
    isDark: mode === "dark",
    isLight: mode === "light",
    theme,
  };
}