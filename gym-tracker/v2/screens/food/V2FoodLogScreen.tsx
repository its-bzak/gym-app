import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { useFocusEffect, router } from "expo-router";
import { loadV2FoodLogPreview } from "@/v2/adapters/overview";
import V2LinkRow from "@/v2/components/V2LinkRow";
import V2PreviewScreen from "@/v2/components/V2PreviewScreen";
import V2SectionCard from "@/v2/components/V2SectionCard";
import V2StatPill from "@/v2/components/V2StatPill";
import { V2_ROUTES } from "@/v2/navigation/routes";
import type { V2FoodLogPreview } from "@/v2/types";
import { useAppTheme } from "@/design/hooks/use-app-theme";
import { createThemedStyles } from "@/design/utils/create-themed-styles";

export default function V2FoodLogScreen() {
  const { theme } = useAppTheme();
  const [preview, setPreview] = useState<V2FoodLogPreview | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | undefined>("Loading nutrition preview");

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const loadPreview = async () => {
        try {
          const nextPreview = await loadV2FoodLogPreview();

          if (!isMounted) {
            return;
          }

          setPreview(nextPreview);
          setStatusMessage(nextPreview ? `Using live food-log data for ${nextPreview.dateLabel}.` : "No authenticated user found for the food log preview.");
        } catch (error) {
          if (!isMounted) {
            return;
          }

          setStatusMessage(error instanceof Error ? error.message : "Could not load the food log preview.");
        }
      };

      void loadPreview();

      return () => {
        isMounted = false;
      };
    }, [])
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
      title="Food Log"
      subtitle="Minimal food log scaffold."
      statusMessage={statusMessage}
      actions={[
        {
          id: "open-library",
          label: "Food library",
          iconName: "book-outline",
          onPress: () => router.push(V2_ROUTES.foodLibrary),
        },
        {
          id: "dashboard",
          label: "Dashboard",
          tone: "secondary",
          iconName: "grid-outline",
          onPress: () => router.push(V2_ROUTES.dashboard),
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
        title="Notes"
        subtitle="Placeholder copy only.">
        <Text style={styles.paragraph}>
          This screen exists to verify the route and data connection without setting a design direction.
        </Text>
      </V2SectionCard>

      <V2SectionCard title="Routes" subtitle="Connected destinations.">
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