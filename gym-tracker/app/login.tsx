import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!isMounted || error || !data.session) {
        return;
      }

      router.replace("/(tabs)/profile");
    };

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogin = async () => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !password) {
      Alert.alert("Missing information", "Enter both email and password.");
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    setIsSubmitting(false);

    if (error) {
      Alert.alert("Login failed", error.message);
      return;
    }

    router.replace("/(tabs)/profile");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardWrapper}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={styles.heroCard}>
            <View style={styles.iconBadge}>
              <Ionicons name="barbell-outline" size={28} color="#F4F4F4" />
            </View>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Sign in to sync your workouts, routines, and progress with Supabase.
            </Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.cardTitle}>Log in</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#6E6E6E"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                style={styles.input}
              />
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.passwordLabelRow}>
                <Text style={styles.label}>Password</Text>
                <Pressable onPress={() => setShowPassword((current) => !current)}>
                  <Text style={styles.inlineActionText}>
                    {showPassword ? "Hide" : "Show"}
                  </Text>
                </Pressable>
              </View>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor="#6E6E6E"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </View>

            <Pressable
              style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
              onPress={() => void handleLogin()}
              disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator color="#151515" />
              ) : (
                <Text style={styles.primaryButtonText}>Log in</Text>
              )}
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={() => router.push("/register")}>
              <Text style={styles.secondaryButtonText}>Create an account</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#151515",
  },
  keyboardWrapper: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 28,
    paddingBottom: 36,
    justifyContent: "center",
  },
  heroCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 28,
    padding: 22,
    marginBottom: 14,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#242424",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  title: {
    color: "#F4F4F4",
    fontSize: 30,
    fontWeight: "700",
  },
  subtitle: {
    color: "#9A9A9A",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
  },
  formCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 28,
    padding: 22,
  },
  cardTitle: {
    color: "#F4F4F4",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 18,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    color: "#8B8B8B",
    fontSize: 13,
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderRadius: 18,
    backgroundColor: "#212121",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    color: "#F4F4F4",
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: "500",
  },
  passwordLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inlineActionText: {
    color: "#7CA2FF",
    fontSize: 13,
    fontWeight: "600",
  },
  primaryButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: "#F4F4F4",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#151515",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: "#212121",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  secondaryButtonText: {
    color: "#F4F4F4",
    fontSize: 15,
    fontWeight: "600",
  },
});