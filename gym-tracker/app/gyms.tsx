import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function GymsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <Pressable style={styles.returnButton} onPress={() => router.back()}>
          <Text style={styles.returnButtonText}>back</Text>
        </Pressable>
        <Text>gyms screen</Text>
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
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#151515",
    paddingHorizontal: 18,
    paddingTop: 9,
  },
  returnButton: {
    position: "absolute",
    top: 18,
    left: 18,
    zIndex: 10,
    width: 64,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
  },
  returnButtonText: {
    color: "#F4F4F4",
    fontSize: 16,
    fontWeight: "500",
  },
  confirmChangesButton: {
    marginTop: 20,
    width: "100%",
    height: 50,
    borderRadius: 25,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmChangesButtonText: {
    color: "#F4F4F4",
    fontSize: 16,
    fontWeight: "500",
  },

});