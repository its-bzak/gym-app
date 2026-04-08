import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "@/design/components/navigation";
import { StatusBanner, SurfaceCard } from "@/design/components/primitives";
import NutritionPlanCard from "@/design/components/dashboard/NutritionPlanCard";
import PerformanceWeightChart from "./PerformanceWeightChart";
import { useAppTheme } from "@/design/hooks/use-app-theme";
import { createThemedStyles } from "@/design/utils/create-themed-styles";
import { getToneColor, getToneSoftColor } from "@/design/utils/theme-resolvers";
import type { RedesignPerformanceScreenProps } from "@/design/components/dashboard/types";

export default function RedesignPerformanceScreen({
  pageTitle = "Stats",
  statusMessage,
  isLoading = false,
  targetCompletionLabel,
  targetCompletionDate,
  estimatedCompletionLabel,
  estimatedCompletionDate,
  targetStatusLabel,
  targetStatusTone = "success",
  primaryAction,
  secondaryAction,
  trendTitle,
  trendValue,
  trendSupportingText,
  targetPaceValue,
  targetPaceSupportingText,
  actualPaceValue,
  actualPaceSupportingText,
  trendPoints = [],
  kpis,
  nutritionPlan,
}: RedesignPerformanceScreenProps) {
  const { theme } = useAppTheme();
  const statusColor = getToneColor(theme, targetStatusTone);
  const statusSoftColor = getToneSoftColor(theme, targetStatusTone);

  const styles = createThemedStyles(theme, (currentTheme) => ({
    safeArea: {
      flex: 1,
      backgroundColor: currentTheme.colors.background,
    },
    screen: {
      flex: 1,
      backgroundColor: currentTheme.colors.background,
    },
    content: {
      paddingHorizontal: currentTheme.spacing.md,
      paddingTop: currentTheme.spacing.md,
      paddingBottom: currentTheme.spacing["3xl"],
      gap: currentTheme.spacing.xl,
    },
    hero: {
      gap: currentTheme.spacing.md,
    },
    heroDates: {
      gap: currentTheme.spacing.sm,
      flex: 1,
      minWidth: 0,
    },
    heroDateBlock: {
      gap: currentTheme.spacing.xs,
    },
    eyebrow: {
      color: currentTheme.colors.textSecondary,
      fontSize: currentTheme.typography.caption.fontSize + 1,
      lineHeight: currentTheme.typography.caption.lineHeight + 1,
      fontWeight: currentTheme.typography.caption.fontWeight,
      textTransform: "uppercase" as const,
      letterSpacing: 2,
    },
    heroRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      gap: currentTheme.spacing.md,
    },
    heroDate: {
      color: currentTheme.colors.textPrimary,
      fontSize: currentTheme.typography.title.fontSize + 10,
      lineHeight: currentTheme.typography.title.lineHeight + 10,
      fontWeight: currentTheme.typography.title.fontWeight,
    },
    heroDateSecondary: {
      color: currentTheme.colors.textPrimary,
      fontSize: currentTheme.typography.title.fontSize - 1,
      lineHeight: currentTheme.typography.title.lineHeight - 1,
      fontWeight: currentTheme.typography.title.fontWeight,
    },
    statusPill: {
      borderRadius: currentTheme.radii.pill,
      backgroundColor: statusSoftColor,
      paddingHorizontal: currentTheme.spacing.sm,
      paddingVertical: currentTheme.spacing.xs,
    },
    statusText: {
      color: statusColor,
      fontSize: currentTheme.typography.caption.fontSize,
      lineHeight: currentTheme.typography.caption.lineHeight,
      fontWeight: "700" as const,
    },
    actionsRow: {
      flexDirection: "row" as const,
      gap: currentTheme.spacing.sm,
    },
    primaryAction: {
      flex: 1,
      minHeight: currentTheme.components.button.height,
      borderRadius: currentTheme.components.button.radius,
      backgroundColor: currentTheme.colors.accent,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      paddingHorizontal: currentTheme.spacing.md,
    },
    secondaryAction: {
      flex: 1,
      minHeight: currentTheme.components.button.height,
      borderRadius: currentTheme.components.button.radius,
      borderWidth: 1,
      borderColor: currentTheme.colors.border,
      backgroundColor: currentTheme.colors.surface,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      paddingHorizontal: currentTheme.spacing.md,
    },
    primaryActionText: {
      color: theme.colors.onAccent,
      fontSize: currentTheme.typography.label.fontSize,
      lineHeight: currentTheme.typography.label.lineHeight,
      fontWeight: currentTheme.typography.label.fontWeight,
    },
    secondaryActionText: {
      color: currentTheme.colors.textPrimary,
      fontSize: currentTheme.typography.label.fontSize,
      lineHeight: currentTheme.typography.label.lineHeight,
      fontWeight: currentTheme.typography.label.fontWeight,
    },
    metricsSection: {
      gap: currentTheme.spacing.md,
    },
    metricsRowTwo: {
      flexDirection: "row" as const,
      gap: currentTheme.spacing.md,
    },
    metricsRowBottom: {
      flexDirection: "row" as const,
      gap: currentTheme.spacing.md,
    },
    metricWrapTwo: {
      flex: 1,
      minWidth: 0,
    },
    metricCardTwo: {
      minHeight: 132,
      gap: currentTheme.spacing.xs,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
    },
    metricValueWrapTwo: {
      flex: 1,
      alignSelf: "stretch" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    metricLabel: {
      color: currentTheme.colors.textSecondary,
      fontSize: currentTheme.typography.caption.fontSize - 1,
      lineHeight: currentTheme.typography.caption.lineHeight - 1,
      fontWeight: currentTheme.typography.caption.fontWeight,
      textTransform: "uppercase" as const,
      letterSpacing: 1,
      textAlign: "center" as const,
      alignSelf: "stretch" as const,
    },
    metricValueLarge: {
      color: currentTheme.colors.textPrimary,
      fontSize: currentTheme.typography.title.fontSize + 1,
      lineHeight: currentTheme.typography.title.lineHeight + 1,
      fontWeight: currentTheme.typography.title.fontWeight,
      textAlign: "center" as const,
    },
    metricSupporting: {
      color: currentTheme.colors.textSecondary,
      fontSize: currentTheme.typography.caption.fontSize,
      lineHeight: currentTheme.typography.caption.lineHeight,
      fontWeight: currentTheme.typography.caption.fontWeight,
    },
  }));

  const [firstRow, secondRow] = [kpis.slice(0, 2), kpis.slice(2, 4)];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppHeader title={pageTitle} variant="compact" />

        {statusMessage ? <StatusBanner tone="info" message={statusMessage} loading={isLoading} /> : null}

        <View style={styles.hero}>
          <View style={styles.heroRow}>
            <View style={styles.heroDates}>
              <View style={styles.heroDateBlock}>
                <Text style={styles.eyebrow}>{targetCompletionLabel}</Text>
                <Text style={styles.heroDate}>{targetCompletionDate}</Text>
              </View>
              {estimatedCompletionLabel && estimatedCompletionDate ? (
                <View style={styles.heroDateBlock}>
                  <Text style={styles.eyebrow}>{estimatedCompletionLabel}</Text>
                  <Text style={styles.heroDateSecondary}>{estimatedCompletionDate}</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>{targetStatusLabel}</Text>
            </View>
          </View>
          <View style={styles.actionsRow}>
            {primaryAction ? (
              <Pressable style={styles.primaryAction} onPress={primaryAction.onPress}>
                <Text style={styles.primaryActionText}>{primaryAction.label}</Text>
              </Pressable>
            ) : null}
            {secondaryAction ? (
              <Pressable style={styles.secondaryAction} onPress={secondaryAction.onPress}>
                <Text style={styles.secondaryActionText}>{secondaryAction.label}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <SurfaceCard padding="lg">
          <PerformanceWeightChart
            title={trendTitle}
            targetPaceValue={targetPaceValue}
            targetPaceSupportingText={targetPaceSupportingText}
            actualPaceValue={actualPaceValue}
            actualPaceSupportingText={actualPaceSupportingText}
            trendValue={trendValue}
            trendSupportingText={trendSupportingText}
            trendPoints={trendPoints}
          />
        </SurfaceCard>

        <View style={styles.metricsSection}>
          <View style={styles.metricsRowTwo}>
            {firstRow.map((kpi) => (
              <View key={kpi.id} style={styles.metricWrapTwo}>
                <SurfaceCard padding="lg">
                  <View style={styles.metricCardTwo}>
                    <View style={styles.metricValueWrapTwo}>
                      <Text style={styles.metricValueLarge}>{kpi.value}</Text>
                    </View>
                    <Text style={styles.metricLabel}>{kpi.label}</Text>
                  </View>
                </SurfaceCard>
              </View>
            ))}
          </View>

          <View style={styles.metricsRowBottom}>
            {secondRow.map((kpi) => (
              <View key={kpi.id} style={styles.metricWrapTwo}>
                <SurfaceCard padding="lg">
                  <View style={styles.metricCardTwo}>
                    <View style={styles.metricValueWrapTwo}>
                      <Text style={styles.metricValueLarge}>{kpi.value}</Text>
                    </View>
                    <Text style={styles.metricLabel}>{kpi.label}</Text>
                  </View>
                </SurfaceCard>
              </View>
            ))}
          </View>
        </View>

        <NutritionPlanCard {...nutritionPlan} />
      </ScrollView>
    </SafeAreaView>
  );
}