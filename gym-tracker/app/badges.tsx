import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Pressable } from "react-native";
import { router } from "expo-router";

export default function BadgesScreen() {
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.screen}>
                <Pressable style={styles.returnButton} onPress={() => router.back()}>
                    <Text style={styles.returnButtonText}>back</Text>
                </Pressable>
                <Text style={styles.title}>Badges</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#151515",
        alignItems: "center",
        justifyContent: "center",
    },
    screen: {
        flex: 1,
        backgroundColor: "#151515",
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        color: "#F4F4F4",
        fontSize: 24,
        fontWeight: "500",
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
});