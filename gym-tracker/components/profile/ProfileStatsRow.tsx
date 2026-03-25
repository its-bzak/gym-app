import { Text, View } from "react-native";

export default function ProfileStatsRow() {
	return (
		<View style={{ padding: 16, borderWidth: 1, borderColor: "#d4d4d8", borderRadius: 12 }}>
			<Text style={{ fontSize: 18, fontWeight: "600" }}>Profile Stats Row</Text>
			<Text>Streak, lifts, and progress placeholder</Text>
		</View>
	);
}
