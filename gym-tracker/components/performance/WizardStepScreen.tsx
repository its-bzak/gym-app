import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WizardStepScreen({
  title,
  subtitle,
  step,
  totalSteps,
  onBack,
  onNext,
  backLabel,
  nextLabel,
  error,
  children,
  isSaving = false,
}: {
  title: string;
  subtitle: string;
  step: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  backLabel: string;
  nextLabel: string;
  error?: string | null;
  children: ReactNode;
  isSaving?: boolean;
}) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <Text style={styles.stepText}>{`Step ${step} of ${totalSteps}`}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.footerRow}>
          <Pressable style={styles.secondaryButton} onPress={onBack}>
            <Text style={styles.secondaryButtonText}>{backLabel}</Text>
          </Pressable>
          <Pressable style={styles.primaryButton} onPress={onNext}>
            <Text style={styles.primaryButtonText}>{isSaving ? "Saving..." : nextLabel}</Text>
          </Pressable>
        </View>
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
  },
  stepText: {
    color: "#8E8E8E",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 14,
  },
  title: {
    color: "#F4F4F4",
    fontSize: 30,
    fontWeight: "700",
    lineHeight: 36,
  },
  subtitle: {
    color: "#9C9C9C",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  content: {
    paddingTop: 24,
    paddingBottom: 18,
  },
  error: {
    color: "#F28B82",
    fontSize: 13,
    marginBottom: 10,
  },
  footerRow: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 18,
    backgroundColor: "#222222",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 18,
    backgroundColor: "#F4F4F4",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#C6C6C6",
    fontSize: 15,
    fontWeight: "600",
  },
  primaryButtonText: {
    color: "#111111",
    fontSize: 15,
    fontWeight: "700",
  },
});