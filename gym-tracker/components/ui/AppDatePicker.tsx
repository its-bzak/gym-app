import { useEffect, useState } from "react";
import { Modal, Platform, Pressable, Text, View } from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useAppTheme } from "@/design/hooks/use-app-theme";
import { createThemedStyles } from "@/design/utils/create-themed-styles";

type AppDatePickerProps = {
  visible: boolean;
  value: Date;
  onClose: () => void;
  onConfirm: (date: Date) => void;
};

function normalizeSelectedDate(date: Date) {
  const nextDate = new Date(date);
  nextDate.setHours(12, 0, 0, 0);
  return nextDate;
}

export default function AppDatePicker({
  visible,
  value,
  onClose,
  onConfirm,
}: AppDatePickerProps) {
  const { theme } = useAppTheme();
  const [draftDate, setDraftDate] = useState(value);
  const styles = createThemedStyles(theme, (currentTheme) => ({
    modalOverlay: {
      flex: 1,
      backgroundColor: currentTheme.colors.surfaceOverlay,
      justifyContent: "flex-end" as const,
    },
    modalSheet: {
      backgroundColor: currentTheme.colors.surfaceElevated,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 18,
      paddingTop: 12,
      paddingBottom: 28,
      borderTopWidth: 1,
      borderColor: currentTheme.colors.borderMuted,
    },
    modalHandle: {
      alignSelf: "center" as const,
      width: 46,
      height: 5,
      borderRadius: currentTheme.radii.pill,
      backgroundColor: currentTheme.colors.border,
      marginBottom: 16,
    },
    modalHeader: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      marginBottom: 10,
    },
    modalTitle: {
      color: currentTheme.colors.textPrimary,
      fontSize: currentTheme.typography.title.fontSize,
      lineHeight: currentTheme.typography.title.lineHeight,
      fontWeight: currentTheme.typography.title.fontWeight,
    },
    modalActionText: {
      color: currentTheme.colors.accent,
      fontSize: currentTheme.typography.label.fontSize,
      lineHeight: currentTheme.typography.label.lineHeight,
      fontWeight: currentTheme.typography.label.fontWeight,
    },
  }));

  useEffect(() => {
    if (visible) {
      setDraftDate(value);
    }
  }, [value, visible]);

  const handleAndroidChange = (event: DateTimePickerEvent, nextDate?: Date) => {
    if (event.type === "dismissed") {
      onClose();
      return;
    }

    if (nextDate) {
      onConfirm(normalizeSelectedDate(nextDate));
    }

    onClose();
  };

  const handleIOSConfirm = () => {
    onConfirm(normalizeSelectedDate(draftDate));
    onClose();
  };

  if (!visible) {
    return null;
  }

  if (Platform.OS === "android") {
    return (
      <DateTimePicker
        mode="date"
        display="default"
        value={value}
        onChange={handleAndroidChange}
      />
    );
  }

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <Pressable onPress={onClose}>
              <Text style={styles.modalActionText}>Cancel</Text>
            </Pressable>

            <Text style={styles.modalTitle}>Select date</Text>

            <Pressable onPress={handleIOSConfirm}>
              <Text style={styles.modalActionText}>Done</Text>
            </Pressable>
          </View>

          <DateTimePicker
            mode="date"
            display="spinner"
            value={draftDate}
            onChange={(_event, nextDate) => {
              if (nextDate) {
                setDraftDate(nextDate);
              }
            }}
          />
        </View>
      </View>
    </Modal>
  );
}