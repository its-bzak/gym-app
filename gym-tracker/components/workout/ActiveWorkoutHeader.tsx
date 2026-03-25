import { Text, View } from "react-native";

export default function ActiveWorkoutHeader() {
	return (
		<View style={{ padding: 16, borderWidth: 1, borderColor: "#d4d4d8", borderRadius: 12 }}>
			<Text style={{ fontSize: 18, fontWeight: "600" }}>Active Workout Header</Text>
			<Text>Workout title and timer placeholder</Text>
		</View>
	);
}
