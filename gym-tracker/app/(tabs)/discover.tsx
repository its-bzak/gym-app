import { SafeAreaView } from "react-native-safe-area-context";
import { Text, View } from "react-native";

export default function DiscoverScreen() {
    return (
        <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <View style={{ padding: 20, backgroundColor: "#1A1A1A", borderRadius: 10 }}>
                <Text style={{ color: "#F4F4F4", fontSize: 18 }}>This is a placeholder screen for the Discover tab.</Text>
                <Text style={{ color: "#7C7C7C", fontSize: 14, marginTop: 10 }}>Discover functionality is coming soon!</Text>
            </View>
        </SafeAreaView>
    );
}