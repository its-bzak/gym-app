import { Pressable, Text, View } from "react-native";
import { useState } from "react";
import Ionicons from "@expo/vector-icons/build/Ionicons";
import { useAppTheme } from "@/design/hooks/use-app-theme";
import { createThemedStyles } from "@/design/utils/create-themed-styles";
import { getCurrentDate } from "@/utils/dateFormat";

type DateCarouselProps = {
    selectedDate?: Date;
    onChangeDate?: (date: Date) => void;
};

export default function DateCarousel({ selectedDate, onChangeDate }: DateCarouselProps) {
    const { theme } = useAppTheme();

    const [internalSelectedDate, setInternalSelectedDate] = useState(
        () => new Date(getCurrentDate())
    );

    const activeDate = selectedDate ?? internalSelectedDate;

    function formatDate(date: Date) {
        return date.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
        });
    }

    function changeDay (amt: number) {
        const next = new Date(activeDate);
        next.setDate(activeDate.getDate() + amt);

        if (!selectedDate) {
            setInternalSelectedDate(next);
        }

        onChangeDate?.(next);
    }

        const styles = createThemedStyles(theme, (currentTheme) => ({
            datePill: {
                width: "100%",
                flexDirection: "row" as const,
                alignItems: "center" as const,
                justifyContent: "space-between" as const,
                backgroundColor: currentTheme.colors.surface,
                borderRadius: currentTheme.radii.xl,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderWidth: 1,
                borderColor: currentTheme.colors.borderMuted,
            },
            dateText: {
                flex: 1,
                textAlign: "center" as const,
                color: currentTheme.colors.textSecondary,
                fontSize: currentTheme.typography.body.fontSize,
                lineHeight: currentTheme.typography.body.lineHeight,
                fontWeight: currentTheme.typography.body.fontWeight,
            },
        }));

    return (
        <View style={styles.datePill}>
            <Pressable onPress={() => changeDay(-1)}>
                                <Ionicons name="chevron-back" size={20} color={theme.colors.iconSecondary} />
            </Pressable>
            <Text style={styles.dateText}>{formatDate(activeDate)}</Text>
            <Pressable onPress={() => changeDay(1)}>
                                <Ionicons name="chevron-forward" size={20} color={theme.colors.iconSecondary} />
            </Pressable>
        </View>
    );
}