import { darkTheme } from "@/design/themes/dark";
import { lightTheme } from "@/design/themes/light";
import type { ThemeMode, ThemeTokens } from "@/design/tokens";

export function getTheme(mode: ThemeMode): ThemeTokens {
  return mode === "dark" ? darkTheme : lightTheme;
}

export { darkTheme, lightTheme };