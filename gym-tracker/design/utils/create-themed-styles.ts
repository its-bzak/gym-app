import { StyleSheet } from "react-native";
import type { ThemeTokens } from "@/design/tokens";

export function createThemedStyles<T extends Record<string, unknown>>(
  theme: ThemeTokens,
  factory: (theme: ThemeTokens) => T
): T {
  return StyleSheet.create(factory(theme) as never) as T;
}