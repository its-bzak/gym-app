import { Text, View } from "react-native";

export default function ExerciseCard() {
	return (
		<View style={{ padding: 16, borderWidth: 1, borderColor: "#d4d4d8", borderRadius: 12 }}>
			<Text style={{ fontSize: 18, fontWeight: "600" }}>Exercise Card</Text>
			<Text>Exercise details placeholder</Text>
		</View>
	);
}
