import { Pressable, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAppTheme } from "@/design/hooks/use-app-theme";
import { createThemedStyles } from "@/design/utils/create-themed-styles";
import type {
  AppHeaderProps,
  HeaderAvatarAction,
  HeaderTrailingIconAction,
} from "@/design/components/navigation/types";

function renderTrailingAction(
  action: AppHeaderProps["rightAction"],
  avatarSize: number,
  iconColor: string,
  surfaceColor: string,
  borderColor: string
) {
  if (!action) {
    return <View style={{ width: avatarSize, height: avatarSize }} />;
  }

  if (action.type === "avatar") {
    const avatarAction = action as HeaderAvatarAction;

    return (
      <Pressable
        accessibilityLabel={avatarAction.accessibilityLabel}
        onPress={avatarAction.onPress}
        style={{
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
          backgroundColor: surfaceColor,
          borderWidth: 1,
          borderColor,
          alignItems: "center",
          justifyContent: "center",
        }}>
        <Ionicons name="person" size={Math.round(avatarSize * 0.52)} color={iconColor} />
      </Pressable>
    );
  }

  const iconAction = action as HeaderTrailingIconAction;

  return (
    <Pressable
      accessibilityLabel={iconAction.accessibilityLabel}
      onPress={iconAction.onPress}
      style={{
        width: avatarSize,
        height: avatarSize,
        borderRadius: avatarSize / 2,
        alignItems: "center",
        justifyContent: "center",
      }}>
      <Ionicons name={iconAction.icon as never} size={20} color={iconColor} />
    </Pressable>
  );
}

export default function AppHeader({
  title,
  leftAction,
  rightAction,
  variant = "default",
}: AppHeaderProps) {
  const { theme } = useAppTheme();
  const styles = createThemedStyles(theme, (currentTheme) => ({
    container: {
      minHeight: variant === "compact" ? currentTheme.components.header.height - 8 : currentTheme.components.header.height,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: currentTheme.spacing.md,
    },
    leading: {
      width: currentTheme.components.header.avatarSize,
      height: currentTheme.components.header.avatarSize,
      borderRadius: currentTheme.radii.round,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      color: currentTheme.colors.textPrimary,
      fontSize: currentTheme.typography.title.fontSize,
      lineHeight: currentTheme.typography.title.lineHeight,
      fontWeight: currentTheme.typography.title.fontWeight,
      flex: 1,
    },
  }));

  return (
    <View style={styles.container}>
      {leftAction ? (
        <Pressable
          accessibilityLabel={leftAction.accessibilityLabel}
          onPress={leftAction.onPress}
          style={styles.leading}>
          <Ionicons
            name={leftAction.icon as never}
            size={theme.components.header.iconSize}
            color={theme.colors.iconPrimary}
          />
        </Pressable>
      ) : (
        <View style={styles.leading} />
      )}

      <Text style={styles.title}>{title}</Text>

      {renderTrailingAction(
        rightAction,
        theme.components.header.avatarSize,
        theme.colors.iconPrimary,
        theme.colors.surface,
        theme.colors.borderMuted
      )}
    </View>
  );
}