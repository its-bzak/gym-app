import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line } from "react-native-svg";

export default function NutritionSplitDonut({
  calories,
  protein,
  carbs,
  fat,
}: {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}) {
  const size = 240;
  const center = size / 2;
  const outerRadius = 82;
  const innerRadius = 34;

  return (
    <View style={styles.container}>
      <View style={styles.chartWrap}>
        <Svg width={size} height={size}>
          <Circle cx={center} cy={center} r={outerRadius} fill="#D6D6D6" />
          <Circle cx={center} cy={center} r={innerRadius} fill="#1A1A1A" />
          <Line x1={center} y1={center - outerRadius} x2={center - 40} y2={center - 80} stroke="#909090" strokeWidth={1} />
          <Line x1={center} y1={center} x2={center + outerRadius} y2={center} stroke="#909090" strokeWidth={1} />
          <Line x1={center} y1={center} x2={center} y2={center + outerRadius} stroke="#909090" strokeWidth={1} />
        </Svg>

        <View style={styles.centerLabel}>
          <Text style={styles.centerValue}>{calories}</Text>
          <Text style={styles.centerUnit}>kcal</Text>
        </View>

        <Text style={[styles.axisLabel, styles.carbsLabel]}>Carbs</Text>
        <Text style={[styles.axisLabel, styles.proteinLabel]}>Protein</Text>
        <Text style={[styles.axisLabel, styles.fatLabel]}>Fat</Text>
      </View>

      <View style={styles.legendRow}>
        <Text style={styles.legendText}>{`${protein}g protein`}</Text>
        <Text style={styles.legendText}>{`${carbs}g carbs`}</Text>
        <Text style={styles.legendText}>{`${fat}g fat`}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  chartWrap: {
    width: 240,
    height: 240,
    alignItems: "center",
    justifyContent: "center",
  },
  centerLabel: {
    position: "absolute",
    alignItems: "center",
  },
  centerValue: {
    color: "#F4F4F4",
    fontSize: 16,
    fontWeight: "700",
  },
  centerUnit: {
    color: "#F4F4F4",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2,
  },
  axisLabel: {
    position: "absolute",
    color: "#1A1A1A",
    fontSize: 13,
    fontWeight: "500",
  },
  carbsLabel: {
    top: 70,
    right: 58,
  },
  proteinLabel: {
    left: 42,
    top: 130,
  },
  fatLabel: {
    right: 62,
    bottom: 46,
  },
  legendRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  legendText: {
    color: "#BEBEBE",
    fontSize: 12,
  },
});