import { SafeAreaView, Text, View } from "react-native";

export default function SocialScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#151515" }}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#ECEDEE" }}>social screen</Text>
      </View>
    </SafeAreaView>
  );
}