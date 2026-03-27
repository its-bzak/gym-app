import { Text, View } from "react-native";
import { StyleSheet } from "react-native";
import { mockExercises } from "@/mock/exercises";
import ExerciseCard from "@/components/workout/ExerciseCard";

export default function ExercisesScreen() {
	return (
        <View style={styles.mainContainer}>
            
        </View>
	);
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#151515"
    }
});