import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PerformanceScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#151515" }}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#ECEDEE" }}>performance screen</Text>
      </View>
    </SafeAreaView>
  );
}