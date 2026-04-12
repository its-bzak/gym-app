import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { useFocusEffect, router } from "expo-router";
import { useDisplayUnitPreference } from "@/hooks/use-display-unit-preference";
import { loadV2DashboardPreview } from "@/v2/adapters/overview";
import V2LinkRow from "@/v2/components/V2LinkRow";
import V2PreviewScreen from "@/v2/components/V2PreviewScreen";
import V2SectionCard from "@/v2/components/V2SectionCard";
import V2StatPill from "@/v2/components/V2StatPill";
import { V2_ROUTES } from "@/v2/navigation/routes";
import type { V2DashboardPreview } from "@/v2/types";
import { useAppTheme } from "@/design/hooks/use-app-theme";
import { createThemedStyles } from "@/design/utils/create-themed-styles";

export default function V2DashboardScreen() {
  const { theme } = useAppTheme();
  const { unitPreference } = useDisplayUnitPreference();
  const [preview, setPreview] = useState<V2DashboardPreview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | undefined>("Syncing dashboard preview");

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const loadPreview = async () => {
        setIsLoading(true);

        try {
          const nextPreview = await loadV2DashboardPreview(unitPreference);

          if (!isMounted) {
            return;
          }

          setPreview(nextPreview);
          setStatusMessage(nextPreview ? `Using live services for ${nextPreview.dateLabel}.` : "No authenticated user found for V2 preview.");
        } catch (error) {
          if (!isMounted) {
            return;
          }

          setStatusMessage(error instanceof Error ? error.message : "Could not load the dashboard preview.");
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
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
    paragraph: {
      color: currentTheme.colors.textSecondary,
      fontSize: currentTheme.typography.body.fontSize,
      lineHeight: currentTheme.typography.body.lineHeight,
      fontWeight: currentTheme.typography.body.fontWeight,
    },
    list: {
      gap: currentTheme.spacing.sm,
    },
  }));

  return (
    <V2PreviewScreen
      eyebrow="V2"
      title={preview ? preview.displayName : "Dashboard"}
      subtitle="Minimal dashboard scaffold."
      statusMessage={statusMessage}
      actions={[
        {
          id: "food-tab",
          label: "Food log",
          iconName: "restaurant-outline",
          onPress: () => router.push(V2_ROUTES.foodLog),
        },
        {
          id: "profile-tab",
          label: "Profile",
          tone: "secondary",
          iconName: "person-outline",
          onPress: () => router.push(V2_ROUTES.profile),
        },
      ]}>
      <V2SectionCard
        title="Connected Data"
        subtitle={isLoading ? "Loading" : preview?.headline}>
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
        title="Notes"
        subtitle="Placeholder copy only.">
        <Text style={styles.paragraph}>
          This screen exists to verify routing and data hooks while you decide the visual system.
        </Text>
      </V2SectionCard>

      <V2SectionCard
        title="Routes"
        subtitle="Connected V2 destinations.">
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