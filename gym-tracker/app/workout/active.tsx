import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const router = useRouter();

function formatElapsedTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

export default function ActiveScreen() {
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [workoutStartTime] = useState(() => Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const updateElapsedTime = () => {
      setElapsedSeconds(Math.floor((Date.now() - workoutStartTime) / 1000));
    };

    updateElapsedTime();

    const timerId = setInterval(updateElapsedTime, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, [workoutStartTime]);

  const handleCancelWorkout = () => {
    setIsCancelModalVisible(true);
  };

  const handleDismissCancelModal = () => {
    setIsCancelModalVisible(false);
  };

  const handleConfirmCancel = () => {
    setIsCancelModalVisible(false);
    router.push("/workout");
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.topRow}>
          <Pressable style={styles.cancelButton} onPress={handleCancelWorkout}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Text style={styles.timerText}>{formatElapsedTime(elapsedSeconds)}</Text>
        </View>

        <ScrollView style={styles.exercisePanel}>

          <Pressable style={styles.addExerciseButton} onPress={() => {router.push("/workout/exercises")}}>
            <Text style={styles.addExerciseText}>+</Text>
          </Pressable>

        </ScrollView>

        <ScrollView style={styles.setsSection}>

          <Pressable style={styles.addSetButton}>
            <Text style={styles.addSetText}>Add Set</Text>
          </Pressable>

        </ScrollView>

        <View style={styles.finishButtonContainer}>
          <Pressable style={styles.finishButton} onPress={() => {router.push("/workout")}}>
            <Text style={styles.finishButtonText}>
              Finish Workout</Text>
          </Pressable>
        </View>

        <Modal
          animationType="slide"
          transparent
          visible={isCancelModalVisible}
          onRequestClose={handleDismissCancelModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Cancel workout?</Text>
              <Text style={styles.modalMessage}>
                Cancelling will discard your active workout. This action cannot be undone.
              </Text>

              <View style={styles.modalButtonRow}>
                <Pressable style={styles.modalSecondaryButton} onPress={handleDismissCancelModal}>
                  <Text style={styles.modalSecondaryButtonText}>Nevermind</Text>
                </Pressable>
                <Pressable style={styles.modalPrimaryButton} onPress={handleConfirmCancel}>
                  <Text style={styles.modalPrimaryButtonText}>Confirm</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
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
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#151515",
    paddingHorizontal: 18,
    paddingTop: 9,
  },
  topRow: {
    flexDirection: "row",
    marginTop: 12,
    alignItems: "center",
    justifyContent: "space-between",
  },
  cancelButton: {
    height: 40,
    width: 120,
    borderRadius: 16,
    backgroundColor: "#212121",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  cancelText: {
    color: "#7C7C7C",
    fontSize: 16,
  },
  timerText: {
    color: "#7C7C7C",
    fontSize: 17,
  },
  exercisePanel: {
    marginTop: 12,
    height: 300,
    borderRadius: 24,
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 14,
  },
  exerciseRow: {
    height: 40,
    borderRadius: 16,
    backgroundColor: "#212121",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  exerciseRowSelected: {
    borderWidth: 1,
    borderColor: "#656565",
  },
  exerciseText: {
    flex: 1,
    textAlign: "center",
    color: "#7C7C7C",
    fontSize: 15,
  },
  removeText: {
    color: "#7C7C7C",
    fontSize: 16,
    width: 14,
    textAlign: "center",
  },
  addExerciseButton: {
    alignSelf: "center",
    marginTop: 10,
    height: 42,
    width: "50%",
    borderRadius: 16,
    backgroundColor: "#212121",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  addExerciseText: {
    color: "#7C7C7C",
    fontSize: 20,
    fontWeight: "500",
  },
  paginationRow: {
    marginTop: "auto",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  paginationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#2D2D2D",
  },
  paginationDotActive: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#F4F4F4",
  },
  setsSection: {
    marginTop: 18,
    height: 118,
    marginBottom: 12,
  },
  setRow: {
    minHeight: 46,
    borderRadius: 16,
    backgroundColor: "#212121",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  setIndex: {
    width: 34,
    color: "#7C7C7C",
    fontSize: 15,
  },
  metricGroup: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },
  metricLabel: {
    color: "#7C7C7C",
    fontSize: 15,
    marginRight: 6,
  },
  metricValuePill: {
    minWidth: 72,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#333333",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  repsValuePill: {
    minWidth: 42,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#333333",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  metricValueText: {
    color: "#7C7C7C",
    fontSize: 14,
  },
  addSetButton: {
    height: 44,
    borderRadius: 16,
    width: "90%",
    marginBottom: 8,
    backgroundColor: "#212121",
    alignSelf: "center",
    justifyContent: "center",
  },
  addSetText: {
    color: "#7C7C7C",
    alignSelf: "center",
    fontSize: 16,
  },
  finishButtonContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
  },
  finishButton: {
    marginBottom: 45,
    height: 50,
    borderRadius: 18,
    backgroundColor: "#333333",
    alignItems: "center",
    justifyContent: "center",
  },
  finishButtonText: {
    color: "#7C7C7C",
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    borderRadius: 24,
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 18,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  modalTitle: {
    color: "#F4F4F4",
    fontSize: 20,
    fontWeight: "600",
  },
  modalMessage: {
    marginTop: 10,
    color: "#A0A0A0",
    fontSize: 15,
    lineHeight: 22,
  },
  modalButtonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 22,
  },
  modalSecondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#212121",
    alignItems: "center",
    justifyContent: "center",
  },
  modalPrimaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: "hsl(0, 37%, 44%)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalSecondaryButtonText: {
    color: "#B0B0B0",
    fontSize: 15,
    fontWeight: "500",
  },
  modalPrimaryButtonText: {
    color: "hsl(0, 100%, 80%)",
    fontSize: 15,
    fontWeight: "600",
  },
});