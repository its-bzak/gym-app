import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

const macroItems = [
  { label: "Protein", value: "172g" },
  { label: "Fat", value: "58g" },
  { label: "Carbs", value: "244g" },
  { label: "Calories", value: "2,460" },
];

const metricCards = [
  { icon: "fitness-center", title: "Workout Volume", value: "12,480 lb" },
  { icon: "schedule", title: "Workout Duration", value: "73 min" },
];

export default function WorkoutScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        <View style={styles.screen}>
          <View style={styles.datePill}>
            <MaterialIcons name="chevron-left" size={34} color="#656565" />
            <View style={styles.dateFill} />
            <MaterialIcons name="chevron-right" size={34} color="#656565" />
          </View>

          <View style={styles.macroBar} />

          <View style={styles.metricsHeader}>
            {macroItems.map((item) => (
              <View key={item.label} style={styles.macroTextItem}>
                <Text style={styles.macroLabel}>{item.label}</Text>
                <Text style={styles.macroValue}>{item.value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.metricsRow}>
            {metricCards.map((item) => (
              <View key={item.title} style={styles.metricCard}>
                <View style={styles.metricIconWrap}>
                  <MaterialIcons name={item.icon as any} size={22} color="#6A6A6A" />
                </View>
                <View style={styles.metricTextWrap}>
                  <Text style={styles.metricTitle}>{item.title}</Text>
                  <Text style={styles.metricValue}>{item.value}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.chartRow}>
            <View style={styles.smallPanel}>
              <Text style={styles.panelTitle}>Weight Trend</Text>
            </View>
            <View style={styles.smallPanel}>
              <Text style={styles.panelTitle}>Goal Bar</Text>
            </View>
          </View>

          <View style={styles.mainPanel}>
            <Text style={styles.panelTitle}>Daily Summary</Text>
          </View>

          <View style={styles.actionRow}>
            <Pressable style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Log Food</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Log Weight</Text>
            </Pressable>
          </View>

          <Pressable style={styles.startButton} onPress={() => router.push("/workout/active")}>
            <Text style={styles.startButtonText}>Start Workout</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#151515",
  },
  screen: {
    backgroundColor: "#151515",
    paddingHorizontal: 36,
    paddingTop: 18,
  },
  contentContainer: {
    paddingBottom: 128,
  },
  datePill: {
    height: 42,
    borderRadius: 22,
    backgroundColor: "#202020",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  dateFill: {
    flex: 1,
    height: "100%",
    marginHorizontal: 10,
    borderRadius: 22,
    backgroundColor: "#202020",
  },
  macroBar: {
    marginTop: 28,
    height: 24,
    borderRadius: 8,
    backgroundColor: "#202020",
  },
  metricsHeader: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  macroTextItem: {
    alignItems: "center",
    minWidth: 64,
  },
  macroLabel: {
    color: "#6A6A6A",
    fontSize: 11,
  },
  macroValue: {
    color: "#7C7C7C",
    fontSize: 14,
    marginTop: 3,
  },
  metricsRow: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metricCard: {
    width: "47.5%",
    height: 95,
    borderRadius: 20,
    backgroundColor: "#202020",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  metricIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#151515",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  metricTextWrap: {
    flex: 1,
  },
  metricTitle: {
    color: "#6A6A6A",
    fontSize: 12,
  },
  metricValue: {
    color: "#7C7C7C",
    fontSize: 18,
    marginTop: 6,
  },
  chartRow: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  smallPanel: {
    width: "47.5%",
    height: 90,
    borderRadius: 20,
    backgroundColor: "#202020",
    padding: 16,
  },
  mainPanel: {
    marginTop: 20,
    height: 360,
    borderRadius: 24,
    backgroundColor: "#202020",
    padding: 18,
  },
  panelTitle: {
    color: "#6A6A6A",
    fontSize: 16,
  },
  actionRow: {
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  secondaryButton: {
    width: "47.5%",
    height: 54,
    borderRadius: 18,
    backgroundColor: "#333333",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#7C7C7C",
    fontSize: 17,
  },
  startButton: {
    marginTop: 12,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#333333",
    alignItems: "center",
    justifyContent: "center",
  },
  startButtonText: {
    color: "#7C7C7C",
    fontSize: 17,
  },
});