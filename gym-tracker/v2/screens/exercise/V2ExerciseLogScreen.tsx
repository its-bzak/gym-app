import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { useFocusEffect, router } from "expo-router";
import { useDisplayUnitPreference } from "@/hooks/use-display-unit-preference";
import { useActiveWorkout } from "@/context/ActiveWorkoutContext";
import { loadV2ExerciseLogPreview } from "@/v2/adapters/overview";
import V2LinkRow from "@/v2/components/V2LinkRow";
import V2PreviewScreen from "@/v2/components/V2PreviewScreen";
import V2SectionCard from "@/v2/components/V2SectionCard";
import V2StatPill from "@/v2/components/V2StatPill";
import { V2_ROUTES } from "@/v2/navigation/routes";
import type { V2ExerciseLogPreview } from "@/v2/types";
import { useAppTheme } from "@/design/hooks/use-app-theme";
import { createThemedStyles } from "@/design/utils/create-themed-styles";

export default function V2ExerciseLogScreen() {
  const { theme } = useAppTheme();
  const { unitPreference } = useDisplayUnitPreference();
  const { workout, startWorkout } = useActiveWorkout();
  const [preview, setPreview] = useState<V2ExerciseLogPreview | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | undefined>("Loading exercise preview");

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const loadPreview = async () => {
        try {
          const nextPreview = await loadV2ExerciseLogPreview(unitPreference);

          if (!isMounted) {
            return;
          }

          setPreview(nextPreview);
          setStatusMessage(
            nextPreview
              ? `Current active workout has ${workout.exercises.length} exercises.`
              : "No authenticated user found for the exercise log preview."
          );
        } catch (error) {
          if (!isMounted) {
            return;
          }

          setStatusMessage(error instanceof Error ? error.message : "Could not load the exercise log preview.");
        }
      };

      void loadPreview();

      return () => {
        isMounted = false;
      };
    }, [unitPreference, workout.exercises.length])
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

  const handleOpenWorkout = () => {
    if (!workout.startedAt) {
      startWorkout();
    }

    router.push(V2_ROUTES.legacyWorkoutActive);
  };

  return (
    <V2PreviewScreen
      eyebrow="V2"
      title="Exercise Log"
      subtitle="Minimal exercise log scaffold."
      statusMessage={statusMessage}
      actions={[
        {
          id: "start-workout",
          label: workout.startedAt ? "Resume workout" : "Start workout",
          iconName: "play-outline",
          onPress: handleOpenWorkout,
        },
        {
          id: "routines",
          label: "Routines",
          tone: "secondary",
          iconName: "albums-outline",
          onPress: () => router.push(V2_ROUTES.legacyWorkoutRoutines),
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

      <V2SectionCard title="Notes" subtitle="Placeholder copy only.">
        <Text style={styles.paragraph}>
          This screen exists to verify the route and action wiring without committing to layout or interaction design.
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