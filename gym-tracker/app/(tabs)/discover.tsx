import { useEffect, useMemo, useRef, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import {
    ActivityIndicator,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    TouchableWithoutFeedback,
    useWindowDimensions,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import AppDatePicker from "@/components/ui/AppDatePicker";
import CustomKeypad, { type CustomKeypadMode } from "@/components/ui/CustomKeypad";
import { useAppTheme } from "@/design/hooks/use-app-theme";
import { createThemedStyles } from "@/design/utils/create-themed-styles";
import {
    appendFoodLogEntry,
    buildSavedFoodLogEntry,
    deleteFoodLogEntry,
    getDateKey,
    getFoodLogDays,
    type FoodLogInput,
    updateFoodLogEntry,
} from "@/services/dashboardService";
import { getAuthenticatedUserId } from "@/services/profileService";
import {
    appendFoodLogEntryDetailed as appendMockFoodLogEntryDetailed,
    deleteFoodLogEntryDetailed as deleteMockFoodLogEntryDetailed,
    getFoodLogDay as getMockFoodLogDay,
    updateFoodLogEntryDetailed as updateMockFoodLogEntryDetailed,
} from "@/mock/MainScreen/DailyMetricsSection";
import type { FoodLogDaySummary, FoodLogEntry, FoodLogMealSlot, FoodLogSourceType } from "@/types/dashboard";
import { getCurrentDate } from "@/utils/dateFormat";

type TimeSlot = {
    hour: number;
    label: string;
};

type TimelineHourGroup = {
    slot: TimeSlot;
    entries: FoodLogEntry[];
    totals: Pick<FoodLogEntry, "protein" | "fat" | "carbs" | "energyKcal">;
};

type QuickAddModalMode = "create" | "edit" | "time" | null;
type QuickAddField = "time" | "massGrams" | "energyKcal" | "protein" | "fat" | "carbs" | null;

type QuickAddSourceSelection = {
    sourceType: Extract<FoodLogSourceType, "saved_food" | "recipe">;
    sourceId: string;
    label: string;
};

type DateStripSummaryMap = Record<string, FoodLogDaySummary>;

const EMPTY_SUMMARY: FoodLogDaySummary = {
    protein: 0,
    proteinGoal: 0,
    fat: 0,
    fatGoal: 0,
    carbs: 0,
    carbsGoal: 0,
    calorieGoal: 0,
    consumedCalories: 0,
};

const DEFAULT_QUICK_ADD_SLOT_INDEX = 12;

function formatTimeSlotLabel(hour: number): string {
    const period = hour >= 12 ? "PM" : "AM";
    const hourOnClock = hour % 12 === 0 ? 12 : hour % 12;

    return `${hourOnClock} ${period}`;
}

const TIME_SLOTS: TimeSlot[] = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    label: formatTimeSlotLabel(hour),
}));

const MAX_DATE_CIRCLE_SIZE = 58;
const MIN_DATE_CIRCLE_SIZE = 38;
const DATE_CIRCLE_STROKE = 4;
const TIMELINE_HOUR_HEIGHT = 44;
const TIMELINE_LEFT_GUTTER = 48;
const TIMELINE_ENTRY_HEIGHT = 28;
const TIMELINE_ENTRY_GAP = 6;
const TIME_PERIOD_OPTIONS = ["AM", "PM"] as const;
const TIME_HOUR_OPTIONS = Array.from({ length: 12 }, (_, index) => `${index + 1}`);
const TIME_MINUTE_OPTIONS = Array.from({ length: 60 }, (_, index) => index.toString().padStart(2, "0"));
const TIME_PICKER_ITEM_HEIGHT = 54;
const TIME_PICKER_VISIBLE_HEIGHT = 216;
const TIME_PICKER_VERTICAL_INSET = (TIME_PICKER_VISIBLE_HEIGHT - TIME_PICKER_ITEM_HEIGHT) / 2;

function formatNowTimeInput() {
    return formatEntryTimeLabel(new Date().toISOString());
}

function parseTimeInput(value: string) {
    const normalizedValue = value.trim().toLowerCase();
    const match = normalizedValue.match(/^(\d{1,2})(?::(\d{2}))?(am|pm)?$/i);

    if (!match) {
        return {
            hour: "12",
            minute: "00",
            period: "PM" as typeof TIME_PERIOD_OPTIONS[number],
        };
    }

    const hour = Math.min(Math.max(Number(match[1]) || 12, 1), 12).toString();
    const minute = `${Math.min(Math.max(Number(match[2] ?? "0"), 0), 59)}`.padStart(2, "0");
    const period = (match[3]?.toUpperCase() === "AM" ? "AM" : "PM") as typeof TIME_PERIOD_OPTIONS[number];

    return { hour, minute, period };
}

function buildTimeInputValue(
    hour: string,
    minute: string,
    period: typeof TIME_PERIOD_OPTIONS[number]
) {
    return `${hour}:${minute}${period.toLowerCase()}`;
}

function getClosestPickerIndex(offsetY: number, itemCount: number) {
    return Math.max(0, Math.min(itemCount - 1, Math.round(offsetY / TIME_PICKER_ITEM_HEIGHT)));
}

function buildDateStrip(selectedDate: Date) {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());

    return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + index);
        return date;
    });
}

function formatHeaderTitle(date: Date): string {
    const todayKey = getCurrentDate();
    const selectedKey = getDateKey(date);

    if (todayKey === selectedKey) {
        return "Today";
    }

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });
}

function formatDayPillLabel(date: Date) {
    return {
        day: date.toLocaleDateString("en-US", { weekday: "narrow" }),
        number: date.getDate().toString(),
    };
}

function formatEntryMeta(entry: FoodLogEntry) {
    return `${Math.round(entry.energyKcal)} kcal  ${entry.protein}P  ${entry.fat}F  ${entry.carbs}C`;
}

function formatCompactEntryMeta(entry: Pick<FoodLogEntry, "protein" | "fat" | "carbs" | "energyKcal">) {
    return `P ${entry.protein}  F ${entry.fat}  C ${entry.carbs}  ${Math.round(entry.energyKcal)}kcal`;
}

function formatEntryTimeLabel(loggedAt: string) {
    return new Date(loggedAt)
        .toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
        })
        .replace(" ", "")
        .toLowerCase();
}

function formatAxisHourLabel(hour: number) {
    return formatTimeSlotLabel(hour).replace(" ", "").toLowerCase();
}

function buildLoggedAtForSlot(date: Date, hour: number): string {
    const nextDate = new Date(date);
    nextDate.setHours(hour, 0, 0, 0);

    return nextDate.toISOString();
}

function buildLoggedAtForInput(date: Date, value: string): string | null {
    const normalizedValue = value.trim().toLowerCase();

    if (!normalizedValue) {
        return null;
    }

    const twelveHourMatch = normalizedValue.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
    const twentyFourHourMatch = normalizedValue.match(/^(\d{1,2}):(\d{2})$/);
    let hours: number | null = null;
    let minutes = 0;

    if (twelveHourMatch) {
        const parsedHours = Number(twelveHourMatch[1]);
        minutes = Number(twelveHourMatch[2] ?? "0");
        const period = twelveHourMatch[3];

        if (parsedHours < 1 || parsedHours > 12 || minutes < 0 || minutes > 59) {
            return null;
        }

        hours = parsedHours % 12;

        if (period === "pm") {
            hours += 12;
        }
    } else if (twentyFourHourMatch) {
        hours = Number(twentyFourHourMatch[1]);
        minutes = Number(twentyFourHourMatch[2]);

        if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
            return null;
        }
    }

    if (hours === null) {
        return null;
    }

    const nextDate = new Date(date);
    nextDate.setHours(hours, minutes, 0, 0);

    return nextDate.toISOString();
}

function inferMealSlot(hour: number): FoodLogMealSlot {
    if (hour < 11) {
        return "breakfast";
    }

    if (hour < 15) {
        return "lunch";
    }

    if (hour < 19) {
        return "dinner";
    }

    return "snack";
}

function calculateMetricProgress(value: number, goal: number) {
    if (goal <= 0) {
        return value > 0 ? 1 : 0;
    }

    return Math.min(value / goal, 1);
}

function getQuickAddSlotFromHour(rawHour?: string | string[]) {
    const parsedHour = Number(Array.isArray(rawHour) ? rawHour[0] : rawHour);

    if (!Number.isFinite(parsedHour)) {
        return TIME_SLOTS[DEFAULT_QUICK_ADD_SLOT_INDEX];
    }

    return TIME_SLOTS.reduce((closestSlot, currentSlot) => {
        const currentDistance = Math.abs(currentSlot.hour - parsedHour);
        const closestDistance = Math.abs(closestSlot.hour - parsedHour);

        return currentDistance < closestDistance ? currentSlot : closestSlot;
    }, TIME_SLOTS[DEFAULT_QUICK_ADD_SLOT_INDEX]);
}

function buildDateSummaryMap(summaries: Array<{ date: string; summary: FoodLogDaySummary }>): DateStripSummaryMap {
    return summaries.reduce<DateStripSummaryMap>((aggregate, snapshot) => {
        aggregate[snapshot.date] = snapshot.summary;
        return aggregate;
    }, {});
}

function DayCircleProgressFill({ progress, isComplete, size }: { progress: number; isComplete: boolean; size: number }) {
    const { theme } = useAppTheme();
    const styles = createThemedStyles(theme, () => ({
        dateCircleRing: {
            position: "absolute" as const,
            top: 0,
            left: 0,
        },
    }));
    const clampedProgress = Math.max(0, Math.min(progress, 1));
    const center = size / 2;
    const radius = center - DATE_CIRCLE_STROKE;
    const fillRadius = radius * Math.sqrt(clampedProgress);
    const ringColor = isComplete ? theme.colors.accent : theme.colors.border;

    return (
        <Svg
            width={size}
            height={size}
            style={styles.dateCircleRing}
            pointerEvents="none">
            <Circle cx={center} cy={center} r={radius} fill={theme.colors.surface} />
            {fillRadius > 0 ? (
                <Circle cx={center} cy={center} r={fillRadius} fill={theme.colors.accent} fillOpacity={0.28} />
            ) : null}
            <Circle cx={center} cy={center} r={radius} fill="none" stroke={ringColor} strokeWidth={DATE_CIRCLE_STROKE} />
        </Svg>
    );
}

function TimePickerFadeMask() {
    const { theme } = useAppTheme();
    const styles = createThemedStyles(theme, () => ({
        timePickerFadeOverlay: {
            position: "absolute" as const,
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
        },
    }));

    return (
        <View pointerEvents="none" style={styles.timePickerFadeOverlay}>
            <Svg width="100%" height="100%">
                <Defs>
                    <LinearGradient id="time-picker-fade-top" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={theme.colors.surfaceElevated} />
                        <Stop offset="60%" stopColor={theme.colors.surfaceElevated} stopOpacity="0" />
                    </LinearGradient>
                    <LinearGradient id="time-picker-fade-bottom" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={theme.colors.surfaceElevated} stopOpacity="0" />
                        <Stop offset="60%" stopColor={theme.colors.surfaceElevated} />
                    </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width="100%" height="55%" fill="url(#time-picker-fade-top)" />
                <Rect x="0" y="45%" width="100%" height="55%" fill="url(#time-picker-fade-bottom)" />
            </Svg>
        </View>
    );
}

export default function DiscoverScreen() {
    const { theme } = useAppTheme();
    const { width: windowWidth } = useWindowDimensions();
    const quickAddParams = useLocalSearchParams<{
        quickAdd?: string;
        date?: string;
        hour?: string;
        time?: string;
        sourceType?: string;
        sourceId?: string;
        massGrams?: string;
    }>();
    const [selectedDate, setSelectedDate] = useState(() => new Date(getCurrentDate()));
    const [authenticatedUserId, setAuthenticatedUserId] = useState<string | null>(null);
    const [summary, setSummary] = useState<FoodLogDaySummary>(EMPTY_SUMMARY);
    const [entries, setEntries] = useState<FoodLogEntry[]>([]);
    const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
    const [dateSummariesByKey, setDateSummariesByKey] = useState<DateStripSummaryMap>({});
    const [isLoadingFoodLog, setIsLoadingFoodLog] = useState(true);
    const [foodLogError, setFoodLogError] = useState<string | null>(null);
    const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
    const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
    const [quickAddModalMode, setQuickAddModalMode] = useState<QuickAddModalMode>(null);
    const [isSavingEntry, setIsSavingEntry] = useState(false);
    const [quickAddError, setQuickAddError] = useState<string | null>(null);
    const [activeQuickAddField, setActiveQuickAddField] = useState<QuickAddField>(null);
    const [isNameFocused, setIsNameFocused] = useState(false);
    const [selectedQuickAddSource, setSelectedQuickAddSource] = useState<QuickAddSourceSelection | null>(null);
    const hourPickerRef = useRef<ScrollView | null>(null);
    const minutePickerRef = useRef<ScrollView | null>(null);
    const periodPickerRef = useRef<ScrollView | null>(null);
    const [quickAddForm, setQuickAddForm] = useState({
        name: "",
        time: formatNowTimeInput(),
        massGrams: "",
        energyKcal: "",
        protein: "",
        fat: "",
        carbs: "",
    });
    const styles = createThemedStyles(theme, (currentTheme) => ({
        safeArea: {
            flex: 1,
            backgroundColor: currentTheme.colors.background,
        },
        screen: {
            flex: 1,
            backgroundColor: currentTheme.colors.background,
            paddingHorizontal: 18,
            paddingTop: 12,
        },
        headerRow: {
            flexDirection: "row" as const,
            alignItems: "center" as const,
            justifyContent: "space-between" as const,
            marginBottom: 2,
        },
        headerIconButton: {
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: currentTheme.colors.surface,
            alignItems: "center" as const,
            justifyContent: "center" as const,
            borderWidth: 1,
            borderColor: currentTheme.colors.borderMuted,
        },
        headerTitle: {
            color: currentTheme.colors.textPrimary,
            fontSize: currentTheme.typography.title.fontSize,
            lineHeight: currentTheme.typography.title.lineHeight,
            fontWeight: currentTheme.typography.title.fontWeight,
        },
        headerTitleButton: {
            flex: 1,
            alignItems: "center" as const,
            justifyContent: "center" as const,
        },
        dateStrip: {
            flexDirection: "row" as const,
            justifyContent: "space-between" as const,
            width: "100%",
            paddingVertical: 2,
            paddingBottom: 4,
            alignItems: "flex-start" as const,
        },
        dateCircleItem: {
            alignItems: "center" as const,
            flex: 1,
        },
        dateCircle: {
            backgroundColor: "transparent",
            alignItems: "center" as const,
            justifyContent: "center" as const,
            position: "relative" as const,
        },
        dateCircleContent: {
            alignItems: "center" as const,
            justifyContent: "center" as const,
        },
        dateCircleDay: {
            color: currentTheme.colors.textSecondary,
            fontSize: currentTheme.typography.caption.fontSize - 1,
            lineHeight: currentTheme.typography.caption.lineHeight - 2,
            textTransform: "uppercase" as const,
            fontWeight: currentTheme.typography.caption.fontWeight,
        },
        dateCircleNumber: {
            color: currentTheme.colors.textPrimary,
            fontSize: currentTheme.typography.section.fontSize + 2,
            lineHeight: currentTheme.typography.section.lineHeight + 2,
            fontWeight: currentTheme.typography.section.fontWeight,
            marginTop: 2,
        },
        dateCircleTextSelected: {
            color: currentTheme.colors.textPrimary,
        },
        dateCircleIndicatorSlot: {
            height: 10,
            marginTop: 4,
            alignItems: "center" as const,
            justifyContent: "flex-end" as const,
        },
        dateCircleIndicatorDot: {
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: currentTheme.colors.textPrimary,
        },
        statusRow: {
            flexDirection: "row" as const,
            alignItems: "center" as const,
            justifyContent: "center" as const,
            gap: 8,
        },
        statusText: {
            color: currentTheme.colors.textSecondary,
            fontSize: currentTheme.typography.caption.fontSize,
            lineHeight: currentTheme.typography.caption.lineHeight,
            fontWeight: currentTheme.typography.caption.fontWeight,
            textAlign: "center" as const,
            marginTop: 2,
            marginBottom: 0,
        },
        summaryRow: {
            flexDirection: "row" as const,
            flexWrap: "wrap" as const,
            gap: 10,
            marginTop: 2,
            marginBottom: 2,
        },
        summaryMetricCard: {
            flex: 1,
            maxWidth: "33.3%",
            width: "33.3%",
            borderRadius: currentTheme.radii.xl,
            padding: 14,
            backgroundColor: currentTheme.colors.surface,
            borderWidth: 1,
            borderColor: currentTheme.colors.borderMuted,
        },
        summaryMetricTextRow: {
            flexDirection: "row" as const,
            alignItems: "center" as const,
            justifyContent: "space-between" as const,
            marginBottom: 2,
        },
        summaryMetricLabel: {
            color: currentTheme.colors.textPrimary,
            fontSize: currentTheme.typography.caption.fontSize + 1,
            lineHeight: currentTheme.typography.caption.lineHeight + 1,
            fontWeight: currentTheme.typography.label.fontWeight,
        },
        summaryMetricValue: {
            color: currentTheme.colors.textPrimary,
            fontSize: currentTheme.typography.caption.fontSize,
            lineHeight: currentTheme.typography.caption.lineHeight,
            fontWeight: currentTheme.typography.label.fontWeight,
            textAlign: "right" as const,
        },
        summaryProgressTrack: {
            height: 6,
            borderRadius: currentTheme.radii.pill,
            backgroundColor: currentTheme.colors.macroCaloriesTrack,
            overflow: "hidden" as const,
        },
        summaryProgressFill: {
            height: "100%",
            borderRadius: currentTheme.radii.pill,
        },
        proteinFill: {
            backgroundColor: currentTheme.colors.macroProtein,
        },
        fatFill: {
            backgroundColor: currentTheme.colors.macroFat,
        },
        carbFill: {
            backgroundColor: currentTheme.colors.macroCarbs,
        },
        timeline: {
            flex: 1,
        },
        timelineContent: {
            paddingBottom: 300,
        },
        timelineHourBlock: {
            minHeight: TIMELINE_HOUR_HEIGHT,
            marginBottom: 2,
        },
        timelineHourBlockExpanded: {
            marginBottom: 8,
        },
        timelineHourHeaderRow: {
            flexDirection: "row" as const,
            alignItems: "center" as const,
            minHeight: TIMELINE_HOUR_HEIGHT,
        },
        timeSlotLabel: {
            width: TIMELINE_LEFT_GUTTER,
            color: currentTheme.colors.textSecondary,
            fontSize: currentTheme.typography.caption.fontSize,
            lineHeight: currentTheme.typography.caption.lineHeight,
            fontWeight: currentTheme.typography.caption.fontWeight,
        },
        timelineHourHeaderContent: {
            flex: 1,
            minHeight: TIMELINE_HOUR_HEIGHT,
            justifyContent: "flex-start" as const,
            paddingTop: 12,
        },
        timelineHourRule: {
            height: 1,
            backgroundColor: currentTheme.colors.divider,
            marginLeft: 12,
        },
        timelineHourTotals: {
            color: currentTheme.colors.textMuted,
            alignSelf: "flex-end" as const,
            fontSize: currentTheme.typography.caption.fontSize,
            lineHeight: currentTheme.typography.caption.lineHeight,
            fontWeight: currentTheme.typography.label.fontWeight,
            marginTop: 8,
            marginLeft: 12,
        },
        timelineEmptyState: {
            paddingTop: 48,
            paddingLeft: TIMELINE_LEFT_GUTTER + 24,
            paddingBottom: 24,
            alignItems: "flex-start" as const,
        },
        timelineHourEntries: {
            paddingTop: 2,
        },
        timelineEntryRow: {
            height: TIMELINE_ENTRY_HEIGHT,
            flexDirection: "row" as const,
            alignItems: "center" as const,
            marginBottom: TIMELINE_ENTRY_GAP,
        },
        entryTimeLabel: {
            width: TIMELINE_LEFT_GUTTER,
            color: currentTheme.colors.textMuted,
            fontSize: currentTheme.typography.caption.fontSize - 1,
            lineHeight: currentTheme.typography.caption.lineHeight - 1,
            fontWeight: currentTheme.typography.caption.fontWeight,
        },
        timelineEntryCard: {
            flex: 1,
            minHeight: TIMELINE_ENTRY_HEIGHT,
            borderRadius: currentTheme.radii.lg,
            backgroundColor: currentTheme.colors.surface,
            marginLeft: 12,
            paddingHorizontal: 12,
            flexDirection: "row" as const,
            alignItems: "center" as const,
            justifyContent: "space-between" as const,
            gap: 10,
            borderWidth: 1,
            borderColor: currentTheme.colors.borderMuted,
        },
        timelineEntryCardSelected: {
            borderWidth: 1,
            borderColor: currentTheme.colors.accent,
        },
        timelineEntryName: {
            color: currentTheme.colors.textPrimary,
            fontSize: currentTheme.typography.body.fontSize - 1,
            lineHeight: currentTheme.typography.body.lineHeight - 1,
            fontWeight: currentTheme.typography.label.fontWeight,
            flex: 1,
        },
        timelineEntryMeta: {
            color: currentTheme.colors.textMuted,
            fontSize: currentTheme.typography.caption.fontSize,
            lineHeight: currentTheme.typography.caption.lineHeight,
            flexShrink: 0,
        },
        emptySlotText: {
            color: currentTheme.colors.textMuted,
            fontSize: currentTheme.typography.body.fontSize - 1,
            lineHeight: currentTheme.typography.body.lineHeight - 1,
            fontWeight: currentTheme.typography.body.fontWeight,
        },
        actionButton: {
            width: "22.75%",
            minHeight: 58,
            borderRadius: 28,
            backgroundColor: currentTheme.colors.surface,
            alignItems: "center" as const,
            justifyContent: "center" as const,
            paddingHorizontal: 8,
            borderWidth: 1,
            borderColor: currentTheme.colors.borderMuted,
        },
        actionButtonText: {
            color: currentTheme.colors.textPrimary,
            fontSize: currentTheme.typography.body.fontSize,
            lineHeight: currentTheme.typography.body.lineHeight,
            fontWeight: currentTheme.typography.label.fontWeight,
        },
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
        modalBottomRow: {
            flexDirection: "row" as const,
            gap: 10,
            marginTop: 12,
        },
        modalTitle: {
            color: currentTheme.colors.textPrimary,
            fontSize: currentTheme.typography.title.fontSize,
            lineHeight: currentTheme.typography.title.lineHeight,
            fontWeight: currentTheme.typography.title.fontWeight,
        },
        modalSubtitle: {
            color: currentTheme.colors.textSecondary,
            fontSize: currentTheme.typography.body.fontSize,
            lineHeight: currentTheme.typography.body.lineHeight,
            fontWeight: currentTheme.typography.body.fontWeight,
            marginTop: 6,
            marginBottom: 16,
        },
        sourceBadgeRow: {
            flexDirection: "row" as const,
            alignItems: "center" as const,
            justifyContent: "space-between" as const,
            marginBottom: 12,
        },
        sourceBadge: {
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: currentTheme.radii.pill,
            backgroundColor: currentTheme.colors.accentSoft,
            borderWidth: 1,
            borderColor: currentTheme.colors.accent,
        },
        sourceBadgeText: {
            color: currentTheme.colors.textPrimary,
            fontSize: currentTheme.typography.caption.fontSize,
            lineHeight: currentTheme.typography.caption.lineHeight,
            fontWeight: currentTheme.typography.caption.fontWeight,
        },
        sourceClearButton: {
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: currentTheme.radii.pill,
            backgroundColor: currentTheme.colors.surface,
            borderWidth: 1,
            borderColor: currentTheme.colors.borderMuted,
        },
        sourceClearButtonText: {
            color: currentTheme.colors.textSecondary,
            fontSize: currentTheme.typography.caption.fontSize,
            lineHeight: currentTheme.typography.caption.lineHeight,
            fontWeight: currentTheme.typography.caption.fontWeight,
        },
        modalInput: {
            minHeight: 50,
            borderRadius: currentTheme.radii.lg,
            backgroundColor: currentTheme.colors.inputBackground,
            color: currentTheme.colors.textPrimary,
            paddingHorizontal: 16,
            fontSize: currentTheme.typography.body.fontSize,
            lineHeight: currentTheme.typography.body.lineHeight,
            fontWeight: currentTheme.typography.body.fontWeight,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: currentTheme.colors.inputBorder,
        },
        modalInputFocused: {
            borderColor: currentTheme.colors.accent,
        },
        modalGrid: {
            flexDirection: "row" as const,
            flexWrap: "wrap" as const,
            gap: 10,
        },
        modalInputHalf: {
            width: "48.25%",
            minHeight: 50,
            borderRadius: currentTheme.radii.lg,
            backgroundColor: currentTheme.colors.inputBackground,
            color: currentTheme.colors.textPrimary,
            paddingHorizontal: 16,
            fontSize: currentTheme.typography.body.fontSize,
            lineHeight: currentTheme.typography.body.lineHeight,
            fontWeight: currentTheme.typography.body.fontWeight,
            borderWidth: 1,
            borderColor: currentTheme.colors.inputBorder,
        },
        modalInputThirds: {
            width: "31.25%",
            minHeight: 50,
            borderRadius: currentTheme.radii.lg,
            backgroundColor: currentTheme.colors.inputBackground,
            color: currentTheme.colors.textPrimary,
            paddingHorizontal: 16,
            fontSize: currentTheme.typography.body.fontSize,
            lineHeight: currentTheme.typography.body.lineHeight,
            fontWeight: currentTheme.typography.body.fontWeight,
            borderWidth: 1,
            borderColor: currentTheme.colors.inputBorder,
        },
        modalPressableField: {
            justifyContent: "center" as const,
        },
        modalPressableFieldText: {
            color: currentTheme.colors.textPrimary,
            fontSize: currentTheme.typography.body.fontSize,
            lineHeight: currentTheme.typography.body.lineHeight,
            fontWeight: currentTheme.typography.body.fontWeight,
        },
        modalPlaceholderText: {
            color: currentTheme.colors.inputPlaceholder,
        },
        timePickerColumns: {
            flexDirection: "row" as const,
            gap: 10,
            marginTop: 12,
        },
        timePickerColumn: {
            flex: 1,
        },
        timePickerPeriodColumn: {
            width: 88,
        },
        timePickerLabel: {
            color: currentTheme.colors.textSecondary,
            fontSize: currentTheme.typography.caption.fontSize,
            lineHeight: currentTheme.typography.caption.lineHeight,
            fontWeight: currentTheme.typography.caption.fontWeight,
            marginBottom: 10,
        },
        timePickerScroll: {
            height: TIME_PICKER_VISIBLE_HEIGHT,
            maxHeight: TIME_PICKER_VISIBLE_HEIGHT,
        },
        timePickerScrollContent: {
            paddingVertical: TIME_PICKER_VERTICAL_INSET,
        },
        timePickerScrollContainer: {
            position: "relative" as const,
            height: TIME_PICKER_VISIBLE_HEIGHT,
            justifyContent: "center" as const,
        },
        timePickerCenterHighlight: {
            position: "absolute" as const,
            top: TIME_PICKER_VERTICAL_INSET,
            left: 0,
            right: 0,
            height: TIME_PICKER_ITEM_HEIGHT,
            borderRadius: currentTheme.radii.lg,
            backgroundColor: currentTheme.colors.accentSoft,
            borderWidth: 1,
            borderColor: currentTheme.colors.accent,
        },
        timePickerOption: {
            height: TIME_PICKER_ITEM_HEIGHT,
            borderRadius: currentTheme.radii.lg,
            backgroundColor: "transparent",
            alignItems: "center" as const,
            justifyContent: "center" as const,
            paddingHorizontal: 10,
        },
        timePickerOptionSelected: {
            transform: [{ scale: 1.08 }],
        },
        timePickerOptionText: {
            color: currentTheme.colors.textSecondary,
            fontSize: currentTheme.typography.body.fontSize - 1,
            lineHeight: currentTheme.typography.body.lineHeight - 1,
            fontWeight: currentTheme.typography.body.fontWeight,
        },
        timePickerOptionTextSelected: {
            color: currentTheme.colors.textPrimary,
            fontWeight: currentTheme.typography.title.fontWeight,
            fontSize: currentTheme.typography.body.fontSize + 1,
        },
        bottomActionBar: {
            position: "absolute" as const,
            left: 18,
            right: 18,
            bottom: 50,
            flexDirection: "row" as const,
            justifyContent: "flex-end" as const,
            gap: 10,
        },
        searchPlaceholder: {
            flex: 1,
            minHeight: 58,
            borderRadius: 28,
            backgroundColor: currentTheme.colors.surface,
            flexDirection: "row" as const,
            alignItems: "center" as const,
            paddingHorizontal: 18,
            gap: 10,
            borderWidth: 1,
            borderColor: currentTheme.colors.borderMuted,
        },
        searchPlaceholderText: {
            color: currentTheme.colors.textMuted,
            fontSize: currentTheme.typography.section.fontSize,
            lineHeight: currentTheme.typography.section.lineHeight,
            fontWeight: currentTheme.typography.body.fontWeight,
        },
        quickAddButton: {
            minWidth: 126,
            minHeight: 58,
            borderRadius: 28,
            backgroundColor: currentTheme.colors.accent,
            alignItems: "center" as const,
            justifyContent: "center" as const,
        },
        quickAddButtonText: {
            color: currentTheme.colors.onAccent,
            fontSize: currentTheme.typography.section.fontSize,
            lineHeight: currentTheme.typography.section.lineHeight,
            fontWeight: currentTheme.typography.label.fontWeight,
        },
        quickAddError: {
            color: currentTheme.colors.danger,
            fontSize: currentTheme.typography.caption.fontSize,
            lineHeight: currentTheme.typography.caption.lineHeight,
            fontWeight: currentTheme.typography.caption.fontWeight,
            marginTop: 12,
        },
        modalButtonRow: {
            flexDirection: "row" as const,
            gap: 10,
            marginTop: 18,
        },
        modalSecondaryButton: {
            flex: 1,
            minHeight: 48,
            borderRadius: currentTheme.radii.lg,
            backgroundColor: currentTheme.colors.surface,
            alignItems: "center" as const,
            justifyContent: "center" as const,
            borderWidth: 1,
            borderColor: currentTheme.colors.borderMuted,
        },
        modalPrimaryButton: {
            flex: 1,
            minHeight: 48,
            borderRadius: currentTheme.radii.lg,
            backgroundColor: currentTheme.colors.accent,
            alignItems: "center" as const,
            justifyContent: "center" as const,
        },
        modalSecondaryButtonText: {
            color: currentTheme.colors.textSecondary,
            fontSize: currentTheme.typography.label.fontSize,
            lineHeight: currentTheme.typography.label.lineHeight,
            fontWeight: currentTheme.typography.label.fontWeight,
        },
        modalPrimaryButtonText: {
            color: currentTheme.colors.onAccent,
            fontSize: currentTheme.typography.label.fontSize,
            lineHeight: currentTheme.typography.label.lineHeight,
            fontWeight: currentTheme.typography.title.fontWeight,
        },
    }));

    const dateStrip = useMemo(() => buildDateStrip(selectedDate), [selectedDate]);
    const dateCircleSize = useMemo(() => {
        const availableWidth = windowWidth - 36;
        const nextSize = availableWidth / 7;

        return Math.max(MIN_DATE_CIRCLE_SIZE, Math.min(MAX_DATE_CIRCLE_SIZE, nextSize));
    }, [windowWidth]);

    const applyFoodLogSnapshots = (
        date: Date,
        snapshots: Array<{ date: string; summary: FoodLogDaySummary; entries: FoodLogEntry[] }>,
        nextError: string | null
    ) => {
        const selectedDateKey = getDateKey(date);
        const selectedSnapshot = snapshots.find((snapshot) => snapshot.date === selectedDateKey);

        setSummary(selectedSnapshot?.summary ?? EMPTY_SUMMARY);
        setEntries(selectedSnapshot?.entries ?? []);
        setDateSummariesByKey(buildDateSummaryMap(snapshots));
        setFoodLogError(nextError);
    };

    const loadFoodLog = async (date: Date) => {
        setIsLoadingFoodLog(true);

        const stripDates = buildDateStrip(date);

        try {
            const nextAuthenticatedUserId = await getAuthenticatedUserId();
            setAuthenticatedUserId(nextAuthenticatedUserId);

            if (!nextAuthenticatedUserId) {
                const fallbackSnapshots = stripDates.map((stripDate) => getMockFoodLogDay(stripDate));
                applyFoodLogSnapshots(date, fallbackSnapshots, "Using local food log data right now.");
                return;
            }

            const snapshots = await getFoodLogDays(nextAuthenticatedUserId, stripDates);
            applyFoodLogSnapshots(date, snapshots, null);
        } catch {
            const fallbackSnapshots = stripDates.map((stripDate) => getMockFoodLogDay(stripDate));
            applyFoodLogSnapshots(date, fallbackSnapshots, "Using local food log data right now.");
        } finally {
            setIsLoadingFoodLog(false);
        }
    };

    useEffect(() => {
        void loadFoodLog(selectedDate);
    }, [selectedDate]);

    const handleSelectDate = (nextDate: Date) => {
        setSelectedDate(nextDate);
    };

    useEffect(() => {
        if (quickAddParams.quickAdd !== "1") {
            return;
        }

        const requestedDate = Array.isArray(quickAddParams.date) ? quickAddParams.date[0] : quickAddParams.date;

        if (requestedDate && requestedDate !== getDateKey(selectedDate)) {
            setSelectedDate(new Date(`${requestedDate}T12:00:00`));
            return;
        }

        const requestedTime = Array.isArray(quickAddParams.time) ? quickAddParams.time[0] : quickAddParams.time;
        const requestedSourceType = Array.isArray(quickAddParams.sourceType) ? quickAddParams.sourceType[0] : quickAddParams.sourceType;
        const requestedSourceId = Array.isArray(quickAddParams.sourceId) ? quickAddParams.sourceId[0] : quickAddParams.sourceId;
        const requestedMassGrams = Array.isArray(quickAddParams.massGrams) ? quickAddParams.massGrams[0] : quickAddParams.massGrams;

        const openRequestedQuickAdd = async () => {
            if (
                authenticatedUserId
                && (requestedSourceType === "saved_food" || requestedSourceType === "recipe")
                && requestedSourceId
            ) {
                const defaultMassGrams = Number(requestedMassGrams ?? "0");
                const result = await buildSavedFoodLogEntry(
                    authenticatedUserId,
                    requestedSourceType,
                    requestedSourceId,
                    Number.isFinite(defaultMassGrams) && defaultMassGrams > 0 ? defaultMassGrams : 1
                );

                if (result.success && result.data) {
                    openQuickAdd({
                        timeSlot: requestedTime ? undefined : getQuickAddSlotFromHour(quickAddParams.hour),
                        timeInput: requestedTime,
                        prefill: {
                            name: result.data.name,
                            massGrams: String(result.data.massGrams),
                            energyKcal: String(Math.round(result.data.energyKcal)),
                            protein: String(result.data.protein),
                            fat: String(result.data.fat),
                            carbs: String(result.data.carbs),
                        },
                    });
                    setSelectedQuickAddSource({
                        sourceType: requestedSourceType,
                        sourceId: requestedSourceId,
                        label: result.data.name,
                    });
                    setActiveQuickAddField("massGrams");
                } else {
                    openQuickAdd({
                        timeSlot: requestedTime ? undefined : getQuickAddSlotFromHour(quickAddParams.hour),
                        timeInput: requestedTime,
                    });
                    setQuickAddError(result.error ?? "Could not load that saved food item.");
                }
            } else {
                openQuickAdd({
                    timeSlot: requestedTime ? undefined : getQuickAddSlotFromHour(quickAddParams.hour),
                    timeInput: requestedTime,
                });
            }

            router.setParams({
                quickAdd: undefined,
                date: undefined,
                hour: undefined,
                time: undefined,
                sourceType: undefined,
                sourceId: undefined,
                massGrams: undefined,
            });
        };

        void openRequestedQuickAdd();
    }, [authenticatedUserId, quickAddParams.date, quickAddParams.hour, quickAddParams.massGrams, quickAddParams.quickAdd, quickAddParams.sourceId, quickAddParams.sourceType, quickAddParams.time, selectedDate]);

    useEffect(() => {
        if (selectedEntryId && !entries.some((entry) => entry.id === selectedEntryId)) {
            setSelectedEntryId(null);
        }
    }, [entries, selectedEntryId]);

    useEffect(() => {
        const keyboardShowSubscription = Keyboard.addListener("keyboardDidShow", () => {
            if (isNameFocused) {
                setActiveQuickAddField(null);
            }
        });

        return () => {
            keyboardShowSubscription.remove();
        };
    }, [isNameFocused]);

    useEffect(() => {
        if (activeQuickAddField !== "time") {
            return;
        }

        const frameId = requestAnimationFrame(() => {
            hourPickerRef.current?.scrollTo({
                y: TIME_HOUR_OPTIONS.indexOf(selectedQuickAddTime.hour) * TIME_PICKER_ITEM_HEIGHT,
                animated: false,
            });
            minutePickerRef.current?.scrollTo({
                y: TIME_MINUTE_OPTIONS.indexOf(selectedQuickAddTime.minute) * TIME_PICKER_ITEM_HEIGHT,
                animated: false,
            });
            periodPickerRef.current?.scrollTo({
                y: TIME_PERIOD_OPTIONS.indexOf(selectedQuickAddTime.period) * TIME_PICKER_ITEM_HEIGHT,
                animated: false,
            });
        });

        return () => {
            cancelAnimationFrame(frameId);
        };
    }, [activeQuickAddField]);

    const selectedEntry = useMemo(
        () => entries.find((entry) => entry.id === selectedEntryId) ?? null,
        [entries, selectedEntryId]
    );
    const editingEntry = useMemo(
        () => entries.find((entry) => entry.id === editingEntryId) ?? null,
        [editingEntryId, entries]
    );
    const selectedQuickAddTime = useMemo(() => parseTimeInput(quickAddForm.time), [quickAddForm.time]);

    useEffect(() => {
        if (!authenticatedUserId || !selectedQuickAddSource || activeQuickAddField === "time") {
            return;
        }

        const nextMassGrams = Number(quickAddForm.massGrams || 0);

        if (!Number.isFinite(nextMassGrams) || nextMassGrams <= 0) {
            return;
        }

        const loadDerivedValues = async () => {
            const result = await buildSavedFoodLogEntry(
                authenticatedUserId,
                selectedQuickAddSource.sourceType,
                selectedQuickAddSource.sourceId,
                nextMassGrams
            );

            if (!result.success || !result.data) {
                return;
            }

            setQuickAddForm((current) => ({
                ...current,
                name: result.data.name,
                energyKcal: String(Math.round(result.data.energyKcal)),
                protein: String(result.data.protein),
                fat: String(result.data.fat),
                carbs: String(result.data.carbs),
            }));
        };

        void loadDerivedValues();
    }, [activeQuickAddField, authenticatedUserId, quickAddForm.massGrams, selectedQuickAddSource]);

    const timelineGroups = useMemo<TimelineHourGroup[]>(() => {
        return TIME_SLOTS.map((slot) => {
            const hourEntries = entries
                .filter((entry) => new Date(entry.loggedAt).getHours() === slot.hour)
                .sort((left, right) => left.loggedAt.localeCompare(right.loggedAt));

            const totals = hourEntries.reduce<Pick<FoodLogEntry, "protein" | "fat" | "carbs" | "energyKcal">>(
                (aggregate, entry) => {
                    aggregate.protein += entry.protein;
                    aggregate.fat += entry.fat;
                    aggregate.carbs += entry.carbs;
                    aggregate.energyKcal += entry.energyKcal;
                    return aggregate;
                },
                {
                    protein: 0,
                    fat: 0,
                    carbs: 0,
                    energyKcal: 0,
                }
            );

            return {
                slot,
                entries: hourEntries,
                totals,
            };
        });
    }, [entries]);

    const openQuickAdd = ({
        timeSlot,
        timeInput,
        prefill,
    }: {
        timeSlot?: TimeSlot;
        timeInput?: string;
        prefill?: Partial<typeof quickAddForm>;
    } = {}) => {
        const nextTime = timeInput
            ? timeInput
            : timeSlot
                ? formatEntryTimeLabel(buildLoggedAtForSlot(selectedDate, timeSlot.hour))
                : formatNowTimeInput();
        setQuickAddForm({
            name: "",
            time: nextTime,
            massGrams: "",
            energyKcal: "",
            protein: "",
            fat: "",
            carbs: "",
            ...prefill,
        });
        setEditingEntryId(null);
        setSelectedEntryId(null);
        setSelectedQuickAddSource(null);
        setQuickAddError(null);
        setActiveQuickAddField("energyKcal");
        setIsNameFocused(false);
        setQuickAddModalMode("create");
    };

    const openEditEntry = (entry: FoodLogEntry) => {
        setQuickAddForm({
            name: entry.name,
            time: formatEntryTimeLabel(entry.loggedAt),
            massGrams: entry.massGrams ? String(entry.massGrams) : "",
            energyKcal: String(Math.round(entry.energyKcal)),
            protein: String(entry.protein),
            fat: String(entry.fat),
            carbs: String(entry.carbs),
        });
        setSelectedQuickAddSource(
            entry.sourceType === "saved_food" || entry.sourceType === "recipe"
                ? {
                    sourceType: entry.sourceType,
                    sourceId: entry.sourceId ?? "",
                    label: entry.name,
                }
                : null
        );
        setEditingEntryId(entry.id);
        setSelectedEntryId(null);
        setActiveQuickAddField("energyKcal");
        setIsNameFocused(false);
        setQuickAddModalMode("edit");
        setQuickAddError(null);
    };

    const openTimeEntry = (entry: FoodLogEntry) => {
        setQuickAddForm((current) => ({
            ...current,
            time: formatEntryTimeLabel(entry.loggedAt),
        }));
        setEditingEntryId(entry.id);
        setSelectedEntryId(null);
        setSelectedQuickAddSource(
            entry.sourceType === "saved_food" || entry.sourceType === "recipe"
                ? {
                    sourceType: entry.sourceType,
                    sourceId: entry.sourceId ?? "",
                    label: entry.name,
                }
                : null
        );
        setActiveQuickAddField("time");
        setIsNameFocused(false);
        setQuickAddModalMode("time");
        setQuickAddError(null);
    };

    const closeQuickAdd = () => {
        if (isSavingEntry) {
            return;
        }

        setQuickAddModalMode(null);
        setEditingEntryId(null);
        setSelectedQuickAddSource(null);
        setQuickAddError(null);
        setActiveQuickAddField(null);
        setIsNameFocused(false);
    };

    const dismissQuickAddInputs = () => {
        Keyboard.dismiss();
        setActiveQuickAddField(null);
        setIsNameFocused(false);
    };

    const handleQuickAddFieldChange = (field: Exclude<QuickAddField, null>, value: string) => {
        setQuickAddForm((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const handleTimePickerSelection = (
        field: "hour" | "minute" | "period",
        index: number
    ) => {
        const safeHour = TIME_HOUR_OPTIONS[Math.max(0, Math.min(TIME_HOUR_OPTIONS.length - 1, index))] ?? selectedQuickAddTime.hour;
        const safeMinute = TIME_MINUTE_OPTIONS[Math.max(0, Math.min(TIME_MINUTE_OPTIONS.length - 1, index))] ?? selectedQuickAddTime.minute;
        const safePeriod = TIME_PERIOD_OPTIONS[Math.max(0, Math.min(TIME_PERIOD_OPTIONS.length - 1, index))] ?? selectedQuickAddTime.period;

        const nextTime = buildTimeInputValue(
            field === "hour" ? safeHour : selectedQuickAddTime.hour,
            field === "minute" ? safeMinute : selectedQuickAddTime.minute,
            field === "period" ? safePeriod : selectedQuickAddTime.period
        );

        if (nextTime !== quickAddForm.time) {
            handleQuickAddFieldChange("time", nextTime);
        }
    };

    const scrollTimePickerToIndex = (
        ref: React.RefObject<ScrollView | null>,
        index: number
    ) => {
        ref.current?.scrollTo({
            y: index * TIME_PICKER_ITEM_HEIGHT,
            animated: true,
        });
    };

    const activeQuickAddMode: CustomKeypadMode = activeQuickAddField === "time" ? "time" : "decimal";

    const handleSaveQuickAdd = async () => {
        const loggedAt = buildLoggedAtForInput(selectedDate, quickAddForm.time);

        if (!loggedAt) {
            setQuickAddError("Enter a valid time like 7:34pm.");
            return;
        }

        const loggedAtDate = new Date(loggedAt);

        if ((quickAddModalMode === "edit" || quickAddModalMode === "time") && !editingEntry) {
            setQuickAddError("Could not find the selected food entry.");
            return;
        }

        const entryInput: FoodLogInput = {
            name: quickAddModalMode === "time" ? editingEntry?.name : quickAddForm.name,
            energyKcal:
                quickAddModalMode === "time"
                    ? editingEntry?.energyKcal ?? null
                    : quickAddForm.energyKcal ? Number(quickAddForm.energyKcal) : null,
            protein: quickAddModalMode === "time" ? editingEntry?.protein ?? 0 : Number(quickAddForm.protein || 0),
            fat: quickAddModalMode === "time" ? editingEntry?.fat ?? 0 : Number(quickAddForm.fat || 0),
            carbs: quickAddModalMode === "time" ? editingEntry?.carbs ?? 0 : Number(quickAddForm.carbs || 0),
            loggedAt,
            mealSlot: inferMealSlot(loggedAtDate.getHours()),
            sourceType: quickAddModalMode === "time" ? editingEntry?.sourceType : selectedQuickAddSource?.sourceType,
            sourceId: quickAddModalMode === "time" ? editingEntry?.sourceId : selectedQuickAddSource?.sourceId,
            massGrams:
                quickAddModalMode === "time"
                    ? editingEntry?.massGrams ?? null
                    : quickAddForm.massGrams
                        ? Number(quickAddForm.massGrams)
                        : null,
        };

        const hasInvalidValue = [
            entryInput.energyKcal ?? 0,
            entryInput.protein,
            entryInput.fat,
            entryInput.carbs,
        ].some((value) => !Number.isFinite(value) || value < 0);
        const hasAnyPositiveValue = [
            entryInput.energyKcal ?? 0,
            entryInput.protein,
            entryInput.fat,
            entryInput.carbs,
        ].some((value) => value > 0);

        if (hasInvalidValue) {
            setQuickAddError("Enter valid non-negative food values.");
            return;
        }

        if (!hasAnyPositiveValue) {
            setQuickAddError("Enter at least one food value greater than zero.");
            return;
        }

        if (selectedQuickAddSource && (!Number.isFinite(entryInput.massGrams) || (entryInput.massGrams ?? 0) <= 0)) {
            setQuickAddError("Enter a mass greater than zero.");
            return;
        }

        setIsSavingEntry(true);
        setQuickAddError(null);

        try {
            if (editingEntryId) {
                if (authenticatedUserId) {
                    const result = await updateFoodLogEntry(authenticatedUserId, editingEntryId, selectedDate, entryInput);

                    if (result.success) {
                        try {
                            updateMockFoodLogEntryDetailed(editingEntryId, selectedDate, {
                                name: entryInput.name,
                                loggedAt: entryInput.loggedAt,
                                energyKcal: entryInput.energyKcal ?? undefined,
                                protein: entryInput.protein,
                                fat: entryInput.fat,
                                carbs: entryInput.carbs,
                                mealSlot: entryInput.mealSlot,
                            });
                        } catch {
                            // Best-effort local mirror only.
                        }

                        await loadFoodLog(selectedDate);
                        setQuickAddModalMode(null);
                        return;
                    }

                    if (!result.shouldFallback) {
                        setQuickAddError(result.error ?? "Could not update food entry.");
                        return;
                    }
                }

                updateMockFoodLogEntryDetailed(editingEntryId, selectedDate, {
                    name: entryInput.name,
                    loggedAt: entryInput.loggedAt,
                    energyKcal: entryInput.energyKcal ?? undefined,
                    protein: entryInput.protein,
                    fat: entryInput.fat,
                    carbs: entryInput.carbs,
                    mealSlot: entryInput.mealSlot,
                });
            } else {
                if (authenticatedUserId) {
                    const result = await appendFoodLogEntry(authenticatedUserId, selectedDate, entryInput);

                    if (result.success) {
                        try {
                            appendMockFoodLogEntryDetailed(selectedDate, {
                                name: entryInput.name,
                                loggedAt: entryInput.loggedAt,
                                energyKcal: entryInput.energyKcal ?? undefined,
                                protein: entryInput.protein,
                                fat: entryInput.fat,
                                carbs: entryInput.carbs,
                                mealSlot: entryInput.mealSlot,
                            });
                        } catch {
                            // Best-effort local mirror only.
                        }

                        await loadFoodLog(selectedDate);
                        setQuickAddModalMode(null);
                        return;
                    }

                    if (!result.shouldFallback) {
                        setQuickAddError(result.error ?? "Could not save food entry.");
                        return;
                    }
                }

                appendMockFoodLogEntryDetailed(selectedDate, {
                    name: entryInput.name,
                    loggedAt: entryInput.loggedAt,
                    energyKcal: entryInput.energyKcal ?? undefined,
                    protein: entryInput.protein,
                    fat: entryInput.fat,
                    carbs: entryInput.carbs,
                    mealSlot: entryInput.mealSlot,
                });
            }

            await loadFoodLog(selectedDate);
            setQuickAddModalMode(null);
        } finally {
            setIsSavingEntry(false);
        }
    };

    const handleCopyEntry = async () => {
        if (!selectedEntry) {
            return;
        }

        setSelectedEntryId(null);

        const entryInput: FoodLogInput = {
            name: selectedEntry.name,
            loggedAt: selectedEntry.loggedAt,
            mealSlot: selectedEntry.mealSlot,
            energyKcal: selectedEntry.energyKcal,
            protein: selectedEntry.protein,
            fat: selectedEntry.fat,
            carbs: selectedEntry.carbs,
            alcoholGrams: selectedEntry.alcoholGrams,
            sourceType: selectedEntry.sourceType,
            sourceId: selectedEntry.sourceId,
            massGrams: selectedEntry.massGrams,
        };

        setIsSavingEntry(true);
        setQuickAddError(null);

        try {
            if (authenticatedUserId) {
                const result = await appendFoodLogEntry(authenticatedUserId, selectedDate, entryInput);

                if (result.success) {
                    try {
                        appendMockFoodLogEntryDetailed(selectedDate, {
                            name: entryInput.name,
                            loggedAt: entryInput.loggedAt,
                            energyKcal: entryInput.energyKcal ?? undefined,
                            protein: entryInput.protein,
                            fat: entryInput.fat,
                            carbs: entryInput.carbs,
                            mealSlot: entryInput.mealSlot,
                        });
                    } catch {
                        // Best-effort local mirror only.
                    }

                    await loadFoodLog(selectedDate);
                    return;
                }

                if (!result.shouldFallback) {
                    setQuickAddError(result.error ?? "Could not copy food entry.");
                    return;
                }
            }

            appendMockFoodLogEntryDetailed(selectedDate, {
                name: entryInput.name,
                loggedAt: entryInput.loggedAt,
                energyKcal: entryInput.energyKcal ?? undefined,
                protein: entryInput.protein,
                fat: entryInput.fat,
                carbs: entryInput.carbs,
                mealSlot: entryInput.mealSlot,
            });
            await loadFoodLog(selectedDate);
        } finally {
            setIsSavingEntry(false);
        }
    };

    const handleDeleteEntry = async () => {
        if (!selectedEntry) {
            return;
        }

        setSelectedEntryId(null);

        setIsSavingEntry(true);
        setQuickAddError(null);

        try {
            if (authenticatedUserId) {
                const result = await deleteFoodLogEntry(authenticatedUserId, selectedEntry.id, selectedDate);

                if (result.success) {
                    try {
                        deleteMockFoodLogEntryDetailed(selectedEntry.id);
                    } catch {
                        // Best-effort local mirror only.
                    }

                    setSelectedEntryId(null);
                    await loadFoodLog(selectedDate);
                    return;
                }

                if (!result.shouldFallback) {
                    setQuickAddError(result.error ?? "Could not delete food entry.");
                    return;
                }
            }

            deleteMockFoodLogEntryDetailed(selectedEntry.id);
            setSelectedEntryId(null);
            await loadFoodLog(selectedDate);
        } finally {
            setIsSavingEntry(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.screen}>
                <View style={styles.headerRow}>
                    <Pressable
                        style={styles.headerIconButton}
                        onPress={() => {
                            const nextDate = new Date(selectedDate);
                            nextDate.setDate(selectedDate.getDate() - 1);
                            setSelectedDate(nextDate);
                        }}>
                        <Ionicons name="chevron-back" size={22} color={theme.colors.iconPrimary} />
                    </Pressable>

                    <Pressable style={styles.headerTitleButton} onPress={() => setIsDatePickerVisible(true)}>
                        <Text style={styles.headerTitle}>{formatHeaderTitle(selectedDate)}</Text>
                    </Pressable>

                    <Pressable
                        style={styles.headerIconButton}
                        onPress={() => {
                            const nextDate = new Date(selectedDate);
                            nextDate.setDate(selectedDate.getDate() + 1);
                            setSelectedDate(nextDate);
                        }}>
                        <Ionicons name="chevron-forward" size={22} color={theme.colors.iconPrimary} />
                    </Pressable>
                </View>

                <AppDatePicker
                    visible={isDatePickerVisible}
                    value={selectedDate}
                    onClose={() => setIsDatePickerVisible(false)}
                    onConfirm={handleSelectDate}
                />

                <View style={styles.dateStrip}>
                    {dateStrip.map((date) => {
                        const labels = formatDayPillLabel(date);
                        const dateKey = getDateKey(date);
                        const isSelected = getDateKey(date) === getDateKey(selectedDate);
                        const dateSummary = dateSummariesByKey[dateKey];
                        const dateProgress = calculateMetricProgress(
                            dateSummary?.consumedCalories ?? 0,
                            dateSummary?.calorieGoal ?? 0
                        );
                        const isComplete = (dateSummary?.calorieGoal ?? 0) > 0
                            && (dateSummary?.consumedCalories ?? 0) >= (dateSummary?.calorieGoal ?? 0);

                        return (
                            <View key={date.toISOString()} style={styles.dateCircleItem}>
                                <Pressable
                                    style={[styles.dateCircle, { width: dateCircleSize, height: dateCircleSize, borderRadius: dateCircleSize / 2 }]}
                                    onPress={() => setSelectedDate(date)}>
                                    <DayCircleProgressFill progress={dateProgress} isComplete={isComplete} size={dateCircleSize} />
                                    <View style={styles.dateCircleContent}>
                                        <Text style={[styles.dateCircleDay, isSelected && styles.dateCircleTextSelected]}>
                                            {labels.day}
                                        </Text>
                                        <Text style={[styles.dateCircleNumber, isSelected && styles.dateCircleTextSelected]}>
                                            {labels.number}
                                        </Text>
                                    </View>
                                </Pressable>
                                <View style={styles.dateCircleIndicatorSlot}>
                                    {isSelected ? <View style={styles.dateCircleIndicatorDot} /> : null}
                                </View>
                            </View>
                        );
                    })}
                </View>

                {isLoadingFoodLog ? (
                    <View style={styles.statusRow}>
                        <ActivityIndicator size="small" color={theme.colors.iconSecondary} />
                        <Text style={styles.statusText}>Syncing food log</Text>
                    </View>
                ) : null}
                {foodLogError ? <Text style={styles.statusText}>{foodLogError}</Text> : null}

                <View style={styles.summaryRow}>

                    <View style={styles.summaryMetricCard}>
                        <View style={styles.summaryMetricTextRow}>
                            <Text style={styles.summaryMetricLabel}>P</Text>
                            <Text style={styles.summaryMetricValue}>{summary.protein} / {summary.proteinGoal}</Text>
                        </View>
                        <View style={styles.summaryProgressTrack}>
                            <View
                                style={[
                                    styles.summaryProgressFill,
                                    styles.proteinFill,
                                    { width: `${calculateMetricProgress(summary.protein, summary.proteinGoal) * 100}%` },
                                ]}
                            />
                        </View>
                    </View>

                    <View style={styles.summaryMetricCard}>
                        <View style={styles.summaryMetricTextRow}>
                            <Text style={styles.summaryMetricLabel}>F</Text>
                            <Text style={styles.summaryMetricValue}>{summary.fat} / {summary.fatGoal}</Text>
                        </View>
                        <View style={styles.summaryProgressTrack}>
                            <View
                                style={[
                                    styles.summaryProgressFill,
                                    styles.fatFill,
                                    { width: `${calculateMetricProgress(summary.fat, summary.fatGoal) * 100}%` },
                                ]}
                            />
                        </View>
                    </View>

                    <View style={styles.summaryMetricCard}>
                        <View style={styles.summaryMetricTextRow}>
                            <Text style={styles.summaryMetricLabel}>C</Text>
                            <Text style={styles.summaryMetricValue}>{summary.carbs} / {summary.carbsGoal}</Text>
                        </View>
                        <View style={styles.summaryProgressTrack}>
                            <View
                                style={[
                                    styles.summaryProgressFill,
                                    styles.carbFill,
                                    { width: `${calculateMetricProgress(summary.carbs, summary.carbsGoal) * 100}%` },
                                ]}
                            />
                        </View>
                        
                    </View>
                </View>

                <ScrollView
                    style={styles.timeline}
                    contentContainerStyle={styles.timelineContent}
                    showsVerticalScrollIndicator={false}>
                    {entries.length === 0 ? (
                        <View style={styles.timelineEmptyState}>
                            <Text style={styles.emptySlotText}>No foods logged for this day yet.</Text>
                        </View>
                    ) : null}

                    {timelineGroups.map(({ slot, entries: hourEntries, totals }) => {
                        const hasEntries = hourEntries.length > 0;

                        return (
                            <View key={slot.label} style={[styles.timelineHourBlock, hasEntries && styles.timelineHourBlockExpanded]}>
                                <View style={styles.timelineHourHeaderRow}>
                                    <Text style={styles.timeSlotLabel}>{formatAxisHourLabel(slot.hour)}</Text>
                                    <Pressable style={styles.timelineHourHeaderContent} onPress={() => openQuickAdd({ timeSlot: slot })}>
                                        <View style={styles.timelineHourRule} />
                                        {hasEntries ? (
                                            <Text style={styles.timelineHourTotals} numberOfLines={1}>
                                                {formatCompactEntryMeta(totals)}
                                            </Text>
                                        ) : null}
                                    </Pressable>
                                </View>

                                {hasEntries ? (
                                    <View style={styles.timelineHourEntries}>
                                        {hourEntries.map((entry) => {
                                            const isSelected = entry.id === selectedEntryId;

                                            return (
                                                <View key={entry.id} style={styles.timelineEntryRow}>
                                                    <Text style={styles.entryTimeLabel}>{formatEntryTimeLabel(entry.loggedAt)}</Text>
                                                    <Pressable
                                                        style={[styles.timelineEntryCard, isSelected && styles.timelineEntryCardSelected]}
                                                        onPress={() => {
                                                            setSelectedEntryId((current) => (current === entry.id ? null : entry.id));
                                                            setQuickAddModalMode(null);
                                                            setEditingEntryId(null);
                                                            setQuickAddError(null);
                                                        }}>
                                                        <Text style={styles.timelineEntryName} numberOfLines={1}>
                                                            {entry.name}
                                                        </Text>
                                                        <Text style={styles.timelineEntryMeta} numberOfLines={1}>
                                                            {formatCompactEntryMeta(entry)}
                                                        </Text>
                                                    </Pressable>
                                                </View>
                                            );
                                        })}
                                    </View>
                                ) : null}
                            </View>
                        );
                    })}
                </ScrollView>

                <View style={styles.bottomActionBar}>
                    {selectedEntry && quickAddModalMode === null ? (
                        <>
                            <Pressable style={styles.actionButton} onPress={() => openTimeEntry(selectedEntry)}>
                                <Text style={styles.actionButtonText}>Time</Text>
                            </Pressable>
                            <Pressable style={styles.actionButton} onPress={() => openEditEntry(selectedEntry)}>
                                <Text style={styles.actionButtonText}>Edit</Text>
                            </Pressable>
                            <Pressable style={styles.actionButton} onPress={handleCopyEntry}>
                                <Text style={styles.actionButtonText}>Copy</Text>
                            </Pressable>
                            <Pressable style={styles.actionButton} onPress={handleDeleteEntry}>
                                <Text style={styles.actionButtonText}>Delete</Text>
                            </Pressable>
                        </>
                    ) : (
                        <>
                            <Pressable
                                style={styles.actionButton}
                                onPress={() => {
                                    if (!authenticatedUserId) {
                                        setQuickAddError("Sign in to use saved foods.");
                                        return;
                                    }

                                    router.push({
                                        pathname: "/food-library",
                                        params: {
                                            mode: "pick",
                                            date: getDateKey(selectedDate),
                                        },
                                    });
                                }}>
                                <Text style={styles.actionButtonText}>Saved</Text>
                            </Pressable>

                            <Pressable style={styles.quickAddButton} onPress={() => openQuickAdd()}>
                                <Text style={styles.quickAddButtonText}>Quick Add</Text>
                            </Pressable>
                        </>
                    )}
                </View>
            </View>

            <Modal
                animationType="slide"
                transparent
                visible={quickAddModalMode !== null}
                onRequestClose={closeQuickAdd}>
                <TouchableWithoutFeedback onPress={dismissQuickAddInputs} accessible={false}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback onPress={dismissQuickAddInputs} accessible={false}>
                            <KeyboardAvoidingView
                                behavior={Platform.OS === "ios" ? "padding" : "height"}
                                keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}>
                            <View style={styles.modalSheet}>
                                <View style={styles.modalHandle} />
                                <Text style={styles.modalTitle}>
                                    {quickAddModalMode === "create"
                                        ? "Quick Add Food"
                                        : quickAddModalMode === "time"
                                            ? "Update Time"
                                            : "Edit Food Entry"}
                                </Text>
                                <Text style={styles.modalSubtitle}>
                                    {quickAddModalMode === "time"
                                        ? "Adjust only the time for this food entry."
                                        : "Add or update a food entry for this day."}
                                </Text>

                                {quickAddModalMode !== "time" ? (
                                    <>
                                        {selectedQuickAddSource ? (
                                            <View style={styles.sourceBadgeRow}>
                                                <View style={styles.sourceBadge}>
                                                    <Text style={styles.sourceBadgeText}>
                                                        {selectedQuickAddSource.sourceType === "saved_food" ? "Saved Food" : "Recipe"}
                                                    </Text>
                                                </View>
                                                <Pressable
                                                    style={styles.sourceClearButton}
                                                    onPress={() => {
                                                        setSelectedQuickAddSource(null);
                                                        setQuickAddForm((current) => ({
                                                            ...current,
                                                            massGrams: "",
                                                        }));
                                                    }}>
                                                    <Text style={styles.sourceClearButtonText}>Manual</Text>
                                                </Pressable>
                                            </View>
                                        ) : null}
                                        <TextInput
                                            style={[styles.modalInput, isNameFocused && styles.modalInputFocused]}
                                            value={quickAddForm.name}
                                            onChangeText={(value) => setQuickAddForm((current) => ({ ...current, name: value }))}
                                            placeholder="Name"
                                            placeholderTextColor="#6F6F6F"
                                            editable={!isSavingEntry && !selectedQuickAddSource}
                                            onFocus={() => {
                                                setIsNameFocused(true);
                                                setActiveQuickAddField(null);
                                            }}
                                            onBlur={() => setIsNameFocused(false)}
                                        />
                                    </>
                                ) : null}

                                <View style={styles.modalGrid}>
                                    <Pressable
                                        style={[
                                            styles.modalInputHalf,
                                            styles.modalPressableField,
                                            activeQuickAddField === "time" && styles.modalInputFocused,
                                        ]}
                                        onFocus={() => {
                                            Keyboard.dismiss();
                                        }}
                                        onPress={() => {
                                            Keyboard.dismiss();
                                            setIsNameFocused(false);
                                            setActiveQuickAddField("time");
                                        }}>
                                        <Text style={[styles.modalPressableFieldText, !quickAddForm.time && styles.modalPlaceholderText]}>
                                            {quickAddForm.time || "7:34pm"}
                                        </Text>
                                    </Pressable>

                                    {quickAddModalMode !== "time" ? (
                                        <>
                                            <TextInput
                                                style={[styles.modalInputHalf, activeQuickAddField === "massGrams" && styles.modalInputFocused]}
                                                value={quickAddForm.massGrams}
                                                onChangeText={(value) => setQuickAddForm((current) => ({ ...current, massGrams: value }))}
                                                placeholder="Grams"
                                                placeholderTextColor="#6F6F6F"
                                                keyboardType="numeric"
                                                editable={!isSavingEntry}
                                                showSoftInputOnFocus={false}
                                                onFocus={() => {
                                                    Keyboard.dismiss();
                                                    setIsNameFocused(false);
                                                    setActiveQuickAddField("massGrams");
                                                }}
                                            />
                                            <TextInput
                                                style={[styles.modalInputHalf, activeQuickAddField === "energyKcal" && styles.modalInputFocused]}
                                                value={quickAddForm.energyKcal}
                                                onChangeText={(value) => setQuickAddForm((current) => ({ ...current, energyKcal: value }))}
                                                placeholder="Calories"
                                                placeholderTextColor="#6F6F6F"
                                                keyboardType="numeric"
                                                editable={!isSavingEntry && !selectedQuickAddSource}
                                                showSoftInputOnFocus={false}
                                                onFocus={() => {
                                                    Keyboard.dismiss();
                                                    setIsNameFocused(false);
                                                    setActiveQuickAddField("energyKcal");
                                                }}
                                            />
                                            <View style={styles.modalBottomRow}>
                                                <TextInput
                                                    style={[styles.modalInputThirds, activeQuickAddField === "protein" && styles.modalInputFocused]}
                                                    value={quickAddForm.protein}
                                                    onChangeText={(value) => setQuickAddForm((current) => ({ ...current, protein: value }))}
                                                    placeholder="Protein"
                                                    placeholderTextColor="#6F6F6F"
                                                    keyboardType="numeric"
                                                    editable={!isSavingEntry && !selectedQuickAddSource}
                                                    showSoftInputOnFocus={false}
                                                    onFocus={() => {
                                                        Keyboard.dismiss();
                                                        setIsNameFocused(false);
                                                        setActiveQuickAddField("protein");
                                                    }}
                                                />
                                                <TextInput
                                                    style={[styles.modalInputThirds, activeQuickAddField === "fat" && styles.modalInputFocused]}
                                                    value={quickAddForm.fat}
                                                    onChangeText={(value) => setQuickAddForm((current) => ({ ...current, fat: value }))}
                                                    placeholder="Fat"
                                                    placeholderTextColor="#6F6F6F"
                                                    keyboardType="numeric"
                                                    editable={!isSavingEntry && !selectedQuickAddSource}
                                                    showSoftInputOnFocus={false}
                                                    onFocus={() => {
                                                        Keyboard.dismiss();
                                                        setIsNameFocused(false);
                                                        setActiveQuickAddField("fat");
                                                    }}
                                                />
                                                <TextInput
                                                    style={[styles.modalInputThirds, activeQuickAddField === "carbs" && styles.modalInputFocused]}
                                                    value={quickAddForm.carbs}
                                                    onChangeText={(value) => setQuickAddForm((current) => ({ ...current, carbs: value }))}
                                                    placeholder="Carbs"
                                                    placeholderTextColor="#6F6F6F"
                                                    keyboardType="numeric"
                                                    editable={!isSavingEntry && !selectedQuickAddSource}
                                                    showSoftInputOnFocus={false}
                                                    onFocus={() => {
                                                        Keyboard.dismiss();
                                                        setIsNameFocused(false);
                                                        setActiveQuickAddField("carbs");
                                                    }}
                                                />
                                            </View>
                                        </>
                                    ) : null}
                                </View>

                                {activeQuickAddField === "time" ? (
                                    <View style={styles.timePickerColumns}>
                                        <View style={styles.timePickerColumn}>
                                            <Text style={styles.timePickerLabel}>Hour</Text>
                                            <View style={styles.timePickerScrollContainer}>
                                                <View style={styles.timePickerCenterHighlight} pointerEvents="none" />
                                                <ScrollView
                                                    ref={hourPickerRef}
                                                    style={styles.timePickerScroll}
                                                    contentContainerStyle={styles.timePickerScrollContent}
                                                    showsVerticalScrollIndicator={false}
                                                    snapToInterval={TIME_PICKER_ITEM_HEIGHT}
                                                    decelerationRate="normal"
                                                    onScroll={(event) =>
                                                        handleTimePickerSelection(
                                                            "hour",
                                                            getClosestPickerIndex(event.nativeEvent.contentOffset.y, TIME_HOUR_OPTIONS.length)
                                                        )
                                                    }
                                                    scrollEventThrottle={16}>
                                                    {TIME_HOUR_OPTIONS.map((hourOption) => {
                                                        const isSelected = selectedQuickAddTime.hour === hourOption;

                                                        return (
                                                            <Pressable
                                                                key={`hour-${hourOption}`}
                                                                style={[styles.timePickerOption, isSelected && styles.timePickerOptionSelected]}
                                                                onPress={() => scrollTimePickerToIndex(hourPickerRef, TIME_HOUR_OPTIONS.indexOf(hourOption))}>
                                                                <Text style={[styles.timePickerOptionText, isSelected && styles.timePickerOptionTextSelected]}>
                                                                    {hourOption}
                                                                </Text>
                                                            </Pressable>
                                                        );
                                                    })}
                                                </ScrollView>
                                                <TimePickerFadeMask />
                                            </View>
                                        </View>

                                        <View style={styles.timePickerColumn}>
                                            <Text style={styles.timePickerLabel}>Minute</Text>
                                            <View style={styles.timePickerScrollContainer}>
                                                <View style={styles.timePickerCenterHighlight} pointerEvents="none" />
                                                <ScrollView
                                                    ref={minutePickerRef}
                                                    style={styles.timePickerScroll}
                                                    contentContainerStyle={styles.timePickerScrollContent}
                                                    showsVerticalScrollIndicator={false}
                                                    snapToInterval={TIME_PICKER_ITEM_HEIGHT}
                                                    decelerationRate="normal"
                                                    onScroll={(event) =>
                                                        handleTimePickerSelection(
                                                            "minute",
                                                            getClosestPickerIndex(event.nativeEvent.contentOffset.y, TIME_MINUTE_OPTIONS.length)
                                                        )
                                                    }
                                                    scrollEventThrottle={16}>
                                                    {TIME_MINUTE_OPTIONS.map((minuteOption) => {
                                                        const isSelected = selectedQuickAddTime.minute === minuteOption;

                                                        return (
                                                            <Pressable
                                                                key={`minute-${minuteOption}`}
                                                                style={[styles.timePickerOption, isSelected && styles.timePickerOptionSelected]}
                                                                onPress={() => scrollTimePickerToIndex(minutePickerRef, TIME_MINUTE_OPTIONS.indexOf(minuteOption))}>
                                                                <Text style={[styles.timePickerOptionText, isSelected && styles.timePickerOptionTextSelected]}>
                                                                    {minuteOption}
                                                                </Text>
                                                            </Pressable>
                                                        );
                                                    })}
                                                </ScrollView>
                                                <TimePickerFadeMask />
                                            </View>
                                        </View>

                                        <View style={styles.timePickerPeriodColumn}>
                                            <Text style={styles.timePickerLabel}>Period</Text>
                                            <View style={styles.timePickerScrollContainer}>
                                                <View style={styles.timePickerCenterHighlight} pointerEvents="none" />
                                                <ScrollView
                                                    ref={periodPickerRef}
                                                    style={styles.timePickerScroll}
                                                    contentContainerStyle={styles.timePickerScrollContent}
                                                    showsVerticalScrollIndicator={false}
                                                    snapToInterval={TIME_PICKER_ITEM_HEIGHT}
                                                    decelerationRate="normal"
                                                    onScroll={(event) =>
                                                        handleTimePickerSelection(
                                                            "period",
                                                            getClosestPickerIndex(event.nativeEvent.contentOffset.y, TIME_PERIOD_OPTIONS.length)
                                                        )
                                                    }
                                                    scrollEventThrottle={16}>
                                                    {TIME_PERIOD_OPTIONS.map((periodOption) => {
                                                        const isSelected = selectedQuickAddTime.period === periodOption;

                                                        return (
                                                            <Pressable
                                                                key={`period-${periodOption}`}
                                                                style={[styles.timePickerOption, isSelected && styles.timePickerOptionSelected]}
                                                                onPress={() => scrollTimePickerToIndex(periodPickerRef, TIME_PERIOD_OPTIONS.indexOf(periodOption))}>
                                                                <Text style={[styles.timePickerOptionText, isSelected && styles.timePickerOptionTextSelected]}>
                                                                    {periodOption}
                                                                </Text>
                                                            </Pressable>
                                                        );
                                                    })}
                                                </ScrollView>
                                                <TimePickerFadeMask />
                                            </View>
                                        </View>
                                    </View>
                                ) : activeQuickAddField ? (
                                    <CustomKeypad
                                        mode={activeQuickAddMode}
                                        value={quickAddForm[activeQuickAddField]}
                                        onChange={(value) => handleQuickAddFieldChange(activeQuickAddField, value)}
                                        onDone={() => setActiveQuickAddField(null)}
                                        showClearKey={false}
                                        showDoneKey={false}
                                    />
                                ) : null}

                                {quickAddError ? <Text style={styles.quickAddError}>{quickAddError}</Text> : null}

                                <View style={styles.modalButtonRow}>
                                    <Pressable style={styles.modalSecondaryButton} onPress={closeQuickAdd}>
                                        <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
                                    </Pressable>
                                    <Pressable style={styles.modalPrimaryButton} onPress={handleSaveQuickAdd}>
                                        {isSavingEntry ? (
                                            <ActivityIndicator size="small" color={theme.colors.onAccent} />
                                        ) : (
                                            <Text style={styles.modalPrimaryButtonText}>
                                                {quickAddModalMode === "create" ? "Confirm" : "Save"}
                                            </Text>
                                        )}
                                    </Pressable>
                                </View>
                            </View>
                            </KeyboardAvoidingView>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </SafeAreaView>
    );
}