import { View, Text, Button } from "react-native";
import { db } from "../db/sqlite";
import { v4 as uuidv4 } from "uuid";

export default function Home() {
  const addWorkout = () => {
    db.runSync(
      "INSERT INTO workouts (id, name, created_at) VALUES (?, ?, ?)",
      [uuidv4(), "Chest Day 💪", new Date().toISOString()]
    );

    const result = db.getAllSync("SELECT * FROM workouts");
    console.log(result);
  };

  return (
    <View className="flex-1 items-center justify-center">
      <Text>Gym Tracker</Text>
      <Button title="Add workout" onPress={addWorkout} />
    </View>
  );
}