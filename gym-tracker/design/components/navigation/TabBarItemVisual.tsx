import { Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAppTheme } from "@/design/hooks/use-app-theme";
import { createThemedStyles } from "@/design/utils/create-themed-styles";
import type { TabBarItemVisualProps } from "@/design/components/navigation/types";

export default function TabBarItemVisual({ label, iconName, focused }: TabBarItemVisualProps) {
  const { theme } = useAppTheme();
  const iconColor = focused ? theme.colors.tabIconActive : theme.colors.tabIconDefault;

  const styles = createThemedStyles(theme, (currentTheme) => ({
    container: {
      minWidth: 64,
      alignItems: "center",
      justifyContent: "center",
      gap: currentTheme.spacing.xs,
      paddingTop: currentTheme.spacing.xs,
    },
    indicator: {
      width: 28,
      height: currentTheme.components.tabBar.activeIndicatorHeight,
      borderRadius: currentTheme.radii.pill,
      backgroundColor: focused ? currentTheme.colors.tabIndicator : "transparent",
    },
    label: {
      color: iconColor,
      fontSize: currentTheme.typography.caption.fontSize,
      lineHeight: currentTheme.typography.caption.lineHeight,
      fontWeight: focused ? "700" : currentTheme.typography.caption.fontWeight,
    },
  }));

  return (
    <View style={styles.container}>
      <View style={styles.indicator} />
      <Ionicons name={iconName as never} size={theme.components.tabBar.iconSize} color={iconColor} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}