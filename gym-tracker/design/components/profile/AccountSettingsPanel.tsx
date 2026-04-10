import { View } from "react-native";
import { SettingsRow, SurfaceCard } from "@/design/components/primitives";
import { useAppTheme } from "@/design/hooks/use-app-theme";
import { createThemedStyles } from "@/design/utils/create-themed-styles";
import type { AccountSettingsPanelProps } from "@/design/components/profile/types";

export default function AccountSettingsPanel({ items }: AccountSettingsPanelProps) {
  const { theme } = useAppTheme();
  const styles = createThemedStyles(theme, (currentTheme) => ({
    list: {
      gap: currentTheme.spacing.sm,
    },
  }));

  return (
    <SurfaceCard padding="md">
      <View style={styles.list}>
        {items.map((item, index) => (
          <SettingsRow
            key={`${item.id}-${index}`}
            iconName={item.iconName}
            label={item.label}
            value={item.value}
            tone={item.tone}
            showChevron={item.showChevron}
            onPress={item.onPress ?? (() => undefined)}
          />
        ))}
      </View>
    </SurfaceCard>
  );
}