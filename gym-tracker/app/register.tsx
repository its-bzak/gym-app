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

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const handleRegister = async () => {
    const trimmedName = name.trim();
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedUsername || !trimmedEmail || !password || !confirmPassword) {
      Alert.alert("Missing information", "Complete every field before creating an account.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Weak password", "Use a password with at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Passwords do not match", "Re-enter your password and try again.");
      return;
    }

    setIsSubmitting(true);

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: {
          name: trimmedName,
          username: trimmedUsername,
        },
      },
    });

    setIsSubmitting(false);

    if (error) {
      Alert.alert("Registration failed", error.message);
      return;
    }

    if (data.session) {
      router.replace("/(tabs)/profile");
      return;
    }

    Alert.alert(
      "Check your email",
      "Your account was created. Confirm your email address, then log in."
    );
    router.replace("/login");
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
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>

          <View style={styles.heroCard}>
            <View style={styles.iconBadge}>
              <Ionicons name="sparkles-outline" size={26} color="#F4F4F4" />
            </View>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>
              Set up secure Supabase auth for your training data and sign in across devices.
            </Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.cardTitle}>Register</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Ryan Barczak"
                placeholderTextColor="#6E6E6E"
                style={styles.input}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="ryan123"
                placeholderTextColor="#6E6E6E"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </View>

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
                placeholder="At least 6 characters"
                placeholderTextColor="#6E6E6E"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.passwordLabelRow}>
                <Text style={styles.label}>Confirm password</Text>
                <Pressable onPress={() => setShowConfirmPassword((current) => !current)}>
                  <Text style={styles.inlineActionText}>
                    {showConfirmPassword ? "Hide" : "Show"}
                  </Text>
                </Pressable>
              </View>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter your password"
                placeholderTextColor="#6E6E6E"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </View>

            <Pressable
              style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
              onPress={() => void handleRegister()}
              disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator color="#151515" />
              ) : (
                <Text style={styles.primaryButtonText}>Create account</Text>
              )}
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={() => router.replace("/login")}>
              <Text style={styles.secondaryButtonText}>Already have an account? Log in</Text>
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
  },
  backButton: {
    width: 64,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  backButtonText: {
    color: "#F4F4F4",
    fontSize: 15,
    fontWeight: "500",
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