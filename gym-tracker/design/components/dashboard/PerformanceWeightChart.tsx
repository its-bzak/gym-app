import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Circle, Defs, Line, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { useAppTheme } from "@/design/hooks/use-app-theme";
import { createThemedStyles } from "@/design/utils/create-themed-styles";
import type { PerformanceTrendPoint } from "@/design/components/dashboard/types";

type PerformanceWeightChartProps = {
  title: string;
  currentWeight: string;
  currentWeightSupportingText: string;
  trendValue: string;
  trendSupportingText: string;
  trendPoints?: PerformanceTrendPoint[];
};

type PlottedPoint = PerformanceTrendPoint & {
  x: number;
  y: number;
};

function getNiceNumber(value: number, round: boolean) {
  const safeValue = value <= 0 ? 1 : value;
  const exponent = Math.floor(Math.log10(safeValue));
  const fraction = safeValue / 10 ** exponent;

  if (round) {
    if (fraction < 1.5) {
      return 1 * 10 ** exponent;
    }

    if (fraction < 3) {
      return 2 * 10 ** exponent;
    }

    if (fraction < 7) {
      return 5 * 10 ** exponent;
    }

    return 10 * 10 ** exponent;
  }

  if (fraction <= 1) {
    return 1 * 10 ** exponent;
  }

  if (fraction <= 2) {
    return 2 * 10 ** exponent;
  }

  if (fraction <= 5) {
    return 5 * 10 ** exponent;
  }

  return 10 * 10 ** exponent;
}

function getChartScale(minValue: number, maxValue: number, tickCount = 4) {
  if (!Number.isFinite(minValue) || !Number.isFinite(maxValue)) {
    return {
      min: 0,
      max: 1,
      ticks: [0, 0.5, 1],
    };
  }

  const minPadding = Math.max(Math.abs(minValue) * 0.03, 0.8);
  const maxPadding = Math.max(Math.abs(maxValue) * 0.03, 0.8);
  const adjustedMin = minValue === maxValue ? minValue - minPadding : minValue - minPadding;
  const adjustedMax = minValue === maxValue ? maxValue + maxPadding : maxValue + maxPadding;
  const range = getNiceNumber(adjustedMax - adjustedMin, false);
  const step = getNiceNumber(range / Math.max(tickCount - 1, 1), true);
  const niceMin = Math.floor(adjustedMin / step) * step;
  const niceMax = Math.ceil(adjustedMax / step) * step;
  const tickTotal = Math.max(Math.round((niceMax - niceMin) / step), 1);

  return {
    min: niceMin,
    max: niceMax,
    ticks: Array.from({ length: tickTotal + 1 }, (_, index) => niceMin + index * step),
  };
}

function formatAxisValue(value: number) {
  if (Math.abs(value) >= 100 || Math.abs(value % 1) < 0.05) {
    return value.toFixed(0);
  }

  return value.toFixed(1);
}

function buildSmoothPath(points: PlottedPoint[]) {
  if (!points.length) {
    return "";
  }

  if (points.length === 1) {
    return `M${points[0].x} ${points[0].y}`;
  }

  return points.reduce((path, point, index, source) => {
    if (index === 0) {
      return `M${point.x} ${point.y}`;
    }

    const previousPoint = source[index - 1];
    const controlPointX = (previousPoint.x + point.x) / 2;

    return `${path} C${controlPointX} ${previousPoint.y}, ${controlPointX} ${point.y}, ${point.x} ${point.y}`;
  }, "");
}

function buildAreaPath(linePath: string, points: PlottedPoint[], baseline: number) {
  if (!linePath || !points.length) {
    return "";
  }

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];

  return `${linePath} L${lastPoint.x} ${baseline} L${firstPoint.x} ${baseline} Z`;
}

export default function PerformanceWeightChart({
  title,
  currentWeight: _currentWeight,
  currentWeightSupportingText: _currentWeightSupportingText,
  trendValue,
  trendSupportingText,
  trendPoints = [],
}: PerformanceWeightChartProps) {
  const { theme } = useAppTheme();
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(trendPoints.length ? trendPoints.length - 1 : null);
  const chartWidth = 352;
  const chartHeight = 224;
  const chartLeft = 14;
  const chartRight = 8;
  const chartTop = 12;
  const chartBottom = 20;
  const innerWidth = chartWidth - chartLeft - chartRight;
  const innerHeight = chartHeight - chartTop - chartBottom;
  const pointValues = trendPoints.map((point) => point.value);
  const minValue = pointValues.length ? Math.min(...pointValues) : 0;
  const maxValue = pointValues.length ? Math.max(...pointValues) : 0;
  const scale = useMemo(() => getChartScale(minValue, maxValue), [maxValue, minValue]);
  const valueRange = scale.max - scale.min || 1;

  useEffect(() => {
    setSelectedPointIndex(trendPoints.length ? trendPoints.length - 1 : null);
  }, [trendPoints]);

  const plottedPoints = useMemo(
    () => trendPoints.map((point, index) => ({
      ...point,
      x: chartLeft + (innerWidth * index) / Math.max(trendPoints.length - 1, 1),
      y: chartTop + innerHeight - ((point.value - scale.min) / valueRange) * innerHeight,
    })),
    [chartLeft, chartTop, innerHeight, innerWidth, scale.min, trendPoints, valueRange]
  );

  const linePath = useMemo(() => buildSmoothPath(plottedPoints), [plottedPoints]);
  const areaPath = useMemo(() => buildAreaPath(linePath, plottedPoints, chartTop + innerHeight), [chartTop, innerHeight, linePath, plottedPoints]);
  const latestPlottedPoint = plottedPoints[plottedPoints.length - 1] ?? null;
  const selectedPoint = selectedPointIndex === null ? latestPlottedPoint : plottedPoints[selectedPointIndex] ?? latestPlottedPoint;
  const yAxisTicks = [...scale.ticks].reverse();

  const styles = createThemedStyles(theme, (currentTheme) => ({
    trendCard: {
      gap: currentTheme.spacing.lg,
    },
    trendHeader: {
      flexDirection: "row" as const,
      alignItems: "flex-start" as const,
      justifyContent: "space-between" as const,
      gap: currentTheme.spacing.md,
    },
    trendTitleWrap: {
      flex: 1,
    },
    trendTitle: {
      color: currentTheme.colors.textPrimary,
      fontSize: currentTheme.typography.section.fontSize + 2,
      lineHeight: currentTheme.typography.section.lineHeight + 2,
      fontWeight: currentTheme.typography.section.fontWeight,
    },
    chartShell: {
      minHeight: 286,
      gap: currentTheme.spacing.md,
    },
    chartFrame: {
      height: 248,
      borderRadius: currentTheme.radii.lg,
      backgroundColor: currentTheme.colors.surfaceMuted,
      borderWidth: 1,
      borderColor: currentTheme.colors.borderMuted,
      overflow: "hidden" as const,
      paddingTop: currentTheme.spacing.xs,
      paddingBottom: currentTheme.spacing.sm,
    },
    chartBody: {
      flexDirection: "row" as const,
      flex: 1,
      paddingLeft: currentTheme.spacing.xs,
      paddingRight: currentTheme.spacing.xxs,
      gap: 2,
    },
    yAxis: {
      width: 28,
      justifyContent: "space-between" as const,
      paddingTop: chartTop,
      paddingBottom: chartBottom,
      alignItems: "flex-end" as const,
    },
    yAxisLabel: {
      color: currentTheme.colors.textMuted,
      fontSize: currentTheme.typography.caption.fontSize - 1,
      lineHeight: currentTheme.typography.caption.lineHeight - 1,
      fontWeight: currentTheme.typography.caption.fontWeight,
    },
    chartCanvasWrap: {
      flex: 1,
    },
    chartCanvas: {
      flex: 1,
    },
    emptyState: {
      flex: 1,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      paddingHorizontal: currentTheme.spacing.lg,
      gap: currentTheme.spacing.xs,
    },
    emptyStateTitle: {
      color: currentTheme.colors.textPrimary,
      fontSize: currentTheme.typography.body.fontSize + 1,
      lineHeight: currentTheme.typography.body.lineHeight + 1,
      fontWeight: "700" as const,
      textAlign: "center" as const,
    },
    emptyStateText: {
      color: currentTheme.colors.textSecondary,
      fontSize: currentTheme.typography.body.fontSize,
      lineHeight: currentTheme.typography.body.lineHeight,
      fontWeight: currentTheme.typography.body.fontWeight,
      textAlign: "center" as const,
    },
    chartTouchRow: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      paddingLeft: chartLeft - 6,
      paddingRight: chartRight - 6,
      marginTop: -(chartHeight + currentTheme.spacing.xs),
      height: chartHeight,
      pointerEvents: "box-none" as const,
    },
    chartTouchTarget: {
      width: 24,
      height: chartHeight,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      backgroundColor: "transparent",
    },
    detailsRow: {
      flexDirection: "row" as const,
      alignItems: "flex-end" as const,
      justifyContent: "space-between" as const,
      gap: currentTheme.spacing.md,
    },
    latestPointWrap: {
      flex: 1,
      gap: currentTheme.spacing.xs,
    },
    latestPointValue: {
      color: currentTheme.colors.textPrimary,
      fontSize: currentTheme.typography.label.fontSize + 1,
      lineHeight: currentTheme.typography.label.lineHeight + 1,
      fontWeight: "700" as const,
    },
    latestPointLabel: {
      color: currentTheme.colors.textSecondary,
      fontSize: currentTheme.typography.caption.fontSize,
      lineHeight: currentTheme.typography.caption.lineHeight,
      fontWeight: currentTheme.typography.caption.fontWeight,
    },
    trendSummaryWrap: {
      alignItems: "flex-end" as const,
      gap: currentTheme.spacing.xs,
    },
    trendSummaryValue: {
      color: currentTheme.colors.accent,
      fontSize: currentTheme.typography.title.fontSize + 8,
      lineHeight: currentTheme.typography.title.lineHeight + 8,
      fontWeight: currentTheme.typography.title.fontWeight,
      textAlign: "right" as const,
    },
    trendSummaryText: {
      color: currentTheme.colors.textSecondary,
      fontSize: currentTheme.typography.caption.fontSize,
      lineHeight: currentTheme.typography.caption.lineHeight,
      fontWeight: currentTheme.typography.caption.fontWeight,
      textAlign: "right" as const,
    },
  }));

  return (
    <View style={styles.trendCard}>
      <View style={styles.trendHeader}>
        <View style={styles.trendTitleWrap}>
          <Text style={styles.trendTitle}>{title}</Text>
        </View>
      </View>

      <View style={styles.chartShell}>
        <View style={styles.chartFrame}>
          {plottedPoints.length >= 2 ? (
            <>
              <View style={styles.chartBody}>
                <View style={styles.yAxis}>
                  {yAxisTicks.map((tick) => (
                    <Text key={tick} style={styles.yAxisLabel}>
                      {formatAxisValue(tick)}
                    </Text>
                  ))}
                </View>
                <View style={styles.chartCanvasWrap}>
                  <Svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={styles.chartCanvas}>
                    <Defs>
                      <LinearGradient id="weightAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0%" stopColor={theme.colors.chartLinePrimary} stopOpacity={0.26} />
                        <Stop offset="100%" stopColor={theme.colors.chartLinePrimary} stopOpacity={0.02} />
                      </LinearGradient>
                    </Defs>

                    {scale.ticks.map((tick) => {
                      const y = chartTop + innerHeight - ((tick - scale.min) / valueRange) * innerHeight;

                      return (
                        <Line
                          key={`grid-${tick}`}
                          x1={chartLeft}
                          x2={chartWidth - chartRight}
                          y1={y}
                          y2={y}
                          stroke={theme.colors.chartGrid}
                          strokeWidth={1}
                          strokeDasharray="4 6"
                        />
                      );
                    })}

                    <Rect
                      x={chartLeft}
                      y={chartTop}
                      width={innerWidth}
                      height={innerHeight}
                      rx={14}
                      fill="transparent"
                      stroke={theme.colors.borderMuted}
                      strokeWidth={1}
                    />

                    {selectedPoint ? (
                      <Line
                        x1={selectedPoint.x}
                        x2={selectedPoint.x}
                        y1={chartTop}
                        y2={chartTop + innerHeight}
                        stroke={theme.colors.border}
                        strokeWidth={1}
                        strokeDasharray="5 6"
                      />
                    ) : null}

                    {areaPath ? <Path d={areaPath} fill="url(#weightAreaGradient)" /> : null}
                    {linePath ? (
                      <Path
                        d={linePath}
                        fill="none"
                        stroke={theme.colors.chartLinePrimary}
                        strokeWidth={4}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ) : null}

                    {plottedPoints.map((point, index) => (
                      <Circle
                        key={`${point.label}-${index}-halo`}
                        cx={point.x}
                        cy={point.y}
                        r={selectedPointIndex === index ? 11 : 0}
                        fill={theme.colors.accentSoft}
                      />
                    ))}

                    {plottedPoints.map((point, index) => (
                      <Circle
                        key={`${point.label}-${index}`}
                        cx={point.x}
                        cy={point.y}
                        r={selectedPointIndex === index ? 5.5 : 4}
                        fill={selectedPointIndex === index ? theme.colors.chartLinePrimary : theme.colors.surface}
                        stroke={theme.colors.chartLinePrimary}
                        strokeWidth={2}
                      />
                    ))}
                  </Svg>

                  <View style={styles.chartTouchRow}>
                    {plottedPoints.map((point, index) => (
                      <Pressable
                        key={`${point.label}-${index}-touch`}
                        accessibilityRole="button"
                        accessibilityLabel={`${point.detailLabel ?? point.label} ${point.displayValue ?? formatAxisValue(point.value)}`}
                        onPress={() => setSelectedPointIndex(index)}
                        style={styles.chartTouchTarget}
                      />
                    ))}
                  </View>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>Add more weigh-ins to unlock the chart</Text>
              <Text style={styles.emptyStateText}>
                Weekly averages will appear here once there is enough data to draw a meaningful trend line.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.latestPointWrap}>
            <Text style={styles.latestPointValue}>{selectedPoint?.detailLabel ?? "No data yet"}</Text>
            <Text style={styles.latestPointLabel}>{selectedPoint?.displayValue ?? "Waiting for weekly average data"}</Text>
          </View>
          <View style={styles.trendSummaryWrap}>
            <Text style={styles.trendSummaryValue}>{trendValue}</Text>
            <Text style={styles.trendSummaryText}>{trendSupportingText}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}