import { Text, View } from "react-native";

export default function ReviewSummaryCard() {
	return (
		<View style={{ padding: 16, borderWidth: 1, borderColor: "#d4d4d8", borderRadius: 12 }}>
			<Text style={{ fontSize: 18, fontWeight: "600" }}>Review Summary Card</Text>
			<Text>Workout summary placeholder</Text>
		</View>
	);
}
