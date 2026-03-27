import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import StartWorkoutBar from "@/components/workout/StartWorkoutBar";
import ActivityCard from "@/components/social/ActivityCard";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { navigate } from "expo-router/build/global-state/routing";
import { useState } from "react";
import DateCarousel from "@/components/workout/DateCarousel";

export default function WorkoutScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        
        <DateCarousel />

        <View style={styles.toggleRow}>
          <Pressable style={styles.segmentButton}>
            <Text style={styles.segmentText}>Exercises</Text>
          </Pressable>
          <Pressable style={styles.segmentButton}>
            <Text style={styles.segmentText}>My Routines</Text>
          </Pressable>
        </View>

        <View style={styles.routinePanel}>

        </View>


        <Pressable style={styles.startButton} onPress={() => {navigate("/workout/active")}}>
          <Text style={styles.startButtonText}>Start Workout</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#151515",
  },
  screen: {
    flex: 1,
    backgroundColor: "#151515",
    paddingHorizontal: 36,
    paddingTop: 18,
  },
  datePill: {
    height: 42,
    borderRadius: 22,
    backgroundColor: "#1A1A1A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  dateText: {
    color: "#7C7C7C",
    fontSize: 16,
    lineHeight: 20,
  },
  toggleRow: {
    marginTop: 34,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  segmentButton: {
    width: "47%",
    height: 40,
    borderRadius: 16,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
  },
  segmentText: {
    color: "#7C7C7C",
    fontSize: 16,
  },
  routinePanel: {
    display: "flex",
    marginTop: 140,
    height: 396,
    borderRadius: 20,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
  },
  addCircle: {
    width: 102,
    height: 102,
    borderRadius: 51,
    backgroundColor: "#3A3A3A",
    alignItems: "center",
    justifyContent: "center",
  },
  addIcon: {
    color: "#7C7C7C",
    fontSize: 54,
    lineHeight: 58,
    marginTop: -2,
  },
  startButton: {
    marginTop: "auto",
    marginBottom: 114,
    height: 66,
    borderRadius: 18,
    backgroundColor: "#333333",
    alignItems: "center",
    justifyContent: "center",
  },
  startButtonText: {
    color: "#7C7C7C",
    fontSize: 22,
  },
});