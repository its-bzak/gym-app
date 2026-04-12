import { useCallback, useState } from "react";
import { View } from "react-native";
import { useFocusEffect, router } from "expo-router";
import { useDisplayUnitPreference } from "@/hooks/use-display-unit-preference";
import { loadV2ProfilePreview } from "@/v2/adapters/overview";
import { signOutFromV2 } from "@/v2/adapters/auth";
import V2LinkRow from "@/v2/components/V2LinkRow";
import V2PreviewScreen from "@/v2/components/V2PreviewScreen";
import V2SectionCard from "@/v2/components/V2SectionCard";
import V2StatPill from "@/v2/components/V2StatPill";
import { V2_ROUTES } from "@/v2/navigation/routes";
import type { V2ProfilePreview } from "@/v2/types";
import { useAppTheme } from "@/design/hooks/use-app-theme";
import { createThemedStyles } from "@/design/utils/create-themed-styles";

export default function V2ProfileScreen() {
  const { theme } = useAppTheme();
  const { unitPreference } = useDisplayUnitPreference();
  const [preview, setPreview] = useState<V2ProfilePreview | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | undefined>("Loading profile preview");

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const loadPreview = async () => {
        try {
          const nextPreview = await loadV2ProfilePreview(unitPreference);

          if (!isMounted) {
            return;
          }

          setPreview(nextPreview);
          setStatusMessage(nextPreview ? `Using current profile services for ${nextPreview.username}.` : "No authenticated user found for the profile preview.");
        } catch (error) {
          if (!isMounted) {
            return;
          }

          setStatusMessage(error instanceof Error ? error.message : "Could not load the profile preview.");
        }
      };

      void loadPreview();

      return () => {
        isMounted = false;
      };
    }, [unitPreference])
  );

  const styles = createThemedStyles(theme, (currentTheme) => ({
    statRow: {
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
      gap: currentTheme.spacing.sm,
    },
    list: {
      gap: currentTheme.spacing.sm,
    },
  }));

  const handleSignOut = async () => {
    await signOutFromV2();
    router.replace(V2_ROUTES.login);
  };

  return (
    <V2PreviewScreen
      eyebrow="V2"
      title={preview?.displayName ?? "Profile"}
      subtitle={preview?.username ?? "Minimal profile scaffold"}
      statusMessage={statusMessage}
      actions={[
        {
          id: "settings",
          label: "Settings",
          iconName: "settings-outline",
          onPress: () => router.push(V2_ROUTES.settings),
        },
        {
          id: "sign-out",
          label: "Sign out",
          tone: "danger",
          iconName: "log-out-outline",
          onPress: () => void handleSignOut(),
        },
      ]}>
      <V2SectionCard title="Connected Data" subtitle={preview?.headline}>
        <View style={styles.statRow}>
          {preview?.stats.map((stat) => (
            <V2StatPill
              helper={stat.helper}
              key={stat.id}
              label={stat.label}
              tone={stat.tone}
              value={stat.value}
            />
          ))}
        </View>
      </V2SectionCard>

      <V2SectionCard
        title="Routes"
        subtitle="Connected destinations.">
        <View style={styles.list}>
          {preview?.quickLinks.map((link) => (
            <V2LinkRow
              description={link.description}
              key={link.id}
              label={link.label}
              onPress={() => router.push(link.href)}
            />
          ))}
        </View>
      </V2SectionCard>
    </V2PreviewScreen>
  );
}