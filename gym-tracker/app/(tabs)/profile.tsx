import { SafeAreaView, Text, View } from "react-native";

export default function ProfileScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#151515" }}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#ECEDEE" }}>profile screen</Text>
      </View>
    </SafeAreaView>
  );
}