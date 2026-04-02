import { useEffect, useMemo, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import {
    ActivityIndicator,
    Keyboard,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableWithoutFeedback,
    useWindowDimensions,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import {
    appendFoodLogEntry,
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
import type { FoodLogDaySummary, FoodLogEntry, FoodLogMealSlot } from "@/types/dashboard";
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

function formatNowTimeInput() {
    return formatEntryTimeLabel(new Date().toISOString());
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
    const clampedProgress = Math.max(0, Math.min(progress, 1));
    const center = size / 2;
    const radius = center - DATE_CIRCLE_STROKE;
    const fillRadius = radius * Math.sqrt(clampedProgress);
    const ringColor = isComplete ? "#9ED0FF" : "#343434";

    return (
        <Svg
            width={size}
            height={size}
            style={styles.dateCircleRing}
            pointerEvents="none">
            <Circle cx={center} cy={center} r={radius} fill="#1A1A1A" />
            {fillRadius > 0 ? (
                <Circle cx={center} cy={center} r={fillRadius} fill="#6EA8FF" fillOpacity={0.28} />
            ) : null}
            <Circle cx={center} cy={center} r={radius} fill="none" stroke={ringColor} strokeWidth={DATE_CIRCLE_STROKE} />
        </Svg>
    );
}

export default function DiscoverScreen() {
    const { width: windowWidth } = useWindowDimensions();
    const quickAddParams = useLocalSearchParams<{
        quickAdd?: string;
        date?: string;
        hour?: string;
    }>();
    const [selectedDate, setSelectedDate] = useState(() => new Date(getCurrentDate()));
    const [authenticatedUserId, setAuthenticatedUserId] = useState<string | null>(null);
    const [summary, setSummary] = useState<FoodLogDaySummary>(EMPTY_SUMMARY);
    const [entries, setEntries] = useState<FoodLogEntry[]>([]);
    const [dateSummariesByKey, setDateSummariesByKey] = useState<DateStripSummaryMap>({});
    const [isLoadingFoodLog, setIsLoadingFoodLog] = useState(true);
    const [foodLogError, setFoodLogError] = useState<string | null>(null);
    const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
    const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
    const [quickAddModalMode, setQuickAddModalMode] = useState<QuickAddModalMode>(null);
    const [isSavingEntry, setIsSavingEntry] = useState(false);
    const [quickAddError, setQuickAddError] = useState<string | null>(null);
    const [quickAddForm, setQuickAddForm] = useState({
        name: "",
        time: formatNowTimeInput(),
        energyKcal: "",
        protein: "",
        fat: "",
        carbs: "",
    });

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

    useEffect(() => {
        if (quickAddParams.quickAdd !== "1") {
            return;
        }

        const requestedDate = Array.isArray(quickAddParams.date) ? quickAddParams.date[0] : quickAddParams.date;

        if (requestedDate && requestedDate !== getDateKey(selectedDate)) {
            setSelectedDate(new Date(`${requestedDate}T12:00:00`));
            return;
        }

        openQuickAdd(getQuickAddSlotFromHour(quickAddParams.hour));
        router.setParams({ quickAdd: undefined, date: undefined, hour: undefined });
    }, [quickAddParams.date, quickAddParams.hour, quickAddParams.quickAdd, selectedDate]);

    useEffect(() => {
        if (selectedEntryId && !entries.some((entry) => entry.id === selectedEntryId)) {
            setSelectedEntryId(null);
        }
    }, [entries, selectedEntryId]);

    const selectedEntry = useMemo(
        () => entries.find((entry) => entry.id === selectedEntryId) ?? null,
        [entries, selectedEntryId]
    );
    const editingEntry = useMemo(
        () => entries.find((entry) => entry.id === editingEntryId) ?? null,
        [editingEntryId, entries]
    );

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

    const openQuickAdd = (timeSlot: TimeSlot) => {
        const nextTime = formatNowTimeInput();
        setQuickAddForm({
            name: "",
            time: nextTime,
            energyKcal: "",
            protein: "",
            fat: "",
            carbs: "",
        });
        setEditingEntryId(null);
        setSelectedEntryId(null);
        setQuickAddError(null);
        setQuickAddModalMode("create");
    };

    const openEditEntry = (entry: FoodLogEntry) => {
        setQuickAddForm({
            name: entry.name,
            time: formatEntryTimeLabel(entry.loggedAt),
            energyKcal: String(Math.round(entry.energyKcal)),
            protein: String(entry.protein),
            fat: String(entry.fat),
            carbs: String(entry.carbs),
        });
        setEditingEntryId(entry.id);
        setSelectedEntryId(null);
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
        setQuickAddModalMode("time");
        setQuickAddError(null);
    };

    const closeQuickAdd = () => {
        if (isSavingEntry) {
            return;
        }

        setQuickAddModalMode(null);
        setEditingEntryId(null);
        setQuickAddError(null);
    };

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
                        <Ionicons name="chevron-back" size={22} color="#F4F4F4" />
                    </Pressable>

                    <Text style={styles.headerTitle}>{formatHeaderTitle(selectedDate)}</Text>

                    <Pressable
                        style={styles.headerIconButton}
                        onPress={() => {
                            const nextDate = new Date(selectedDate);
                            nextDate.setDate(selectedDate.getDate() + 1);
                            setSelectedDate(nextDate);
                        }}>
                        <Ionicons name="chevron-forward" size={22} color="#F4F4F4" />
                    </Pressable>
                </View>

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
                        <ActivityIndicator size="small" color="#BFBFBF" />
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
                                    <Pressable style={styles.timelineHourHeaderContent} onPress={() => openQuickAdd(slot)}>
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
                            <Pressable style={styles.searchPlaceholder}>
                                <Ionicons name="search" size={20} color="#8C8C8C" />
                                <Text style={styles.searchPlaceholderText}>Search for a food</Text>
                            </Pressable>

                            <Pressable style={styles.quickAddButton} onPress={() => openQuickAdd(TIME_SLOTS[DEFAULT_QUICK_ADD_SLOT_INDEX])}>
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
                <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback onPress={() => {}} accessible={false}>
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
                                    <TextInput
                                        style={styles.modalInput}
                                        value={quickAddForm.name}
                                        onChangeText={(value) => setQuickAddForm((current) => ({ ...current, name: value }))}
                                        placeholder="Name"
                                        placeholderTextColor="#6F6F6F"
                                        editable={!isSavingEntry}
                                    />
                                ) : null}

                                <View style={styles.modalGrid}>
                                    <TextInput
                                        style={styles.modalInputHalf}
                                        value={quickAddForm.time}
                                        onChangeText={(value) => setQuickAddForm((current) => ({ ...current, time: value }))}
                                        placeholder="7:34pm"
                                        placeholderTextColor="#6F6F6F"
                                        autoCapitalize="none"
                                        editable={!isSavingEntry}
                                    />

                                    {quickAddModalMode !== "time" ? (
                                        <>
                                            <TextInput
                                                style={styles.modalInputHalf}
                                                value={quickAddForm.energyKcal}
                                                onChangeText={(value) => setQuickAddForm((current) => ({ ...current, energyKcal: value }))}
                                                placeholder="Calories"
                                                placeholderTextColor="#6F6F6F"
                                                keyboardType="numeric"
                                                editable={!isSavingEntry}
                                            />
                                            <View style={styles.modalBottomRow}>
                                                <TextInput
                                                    style={styles.modalInputThirds}
                                                    value={quickAddForm.protein}
                                                    onChangeText={(value) => setQuickAddForm((current) => ({ ...current, protein: value }))}
                                                    placeholder="Protein"
                                                    placeholderTextColor="#6F6F6F"
                                                    keyboardType="numeric"
                                                    editable={!isSavingEntry}
                                                />
                                                <TextInput
                                                    style={styles.modalInputThirds}
                                                    value={quickAddForm.fat}
                                                    onChangeText={(value) => setQuickAddForm((current) => ({ ...current, fat: value }))}
                                                    placeholder="Fat"
                                                    placeholderTextColor="#6F6F6F"
                                                    keyboardType="numeric"
                                                    editable={!isSavingEntry}
                                                />
                                                <TextInput
                                                    style={styles.modalInputThirds}
                                                    value={quickAddForm.carbs}
                                                    onChangeText={(value) => setQuickAddForm((current) => ({ ...current, carbs: value }))}
                                                    placeholder="Carbs"
                                                    placeholderTextColor="#6F6F6F"
                                                    keyboardType="numeric"
                                                    editable={!isSavingEntry}
                                                />
                                            </View>
                                        </>
                                    ) : null}
                                </View>

                                {quickAddError ? <Text style={styles.quickAddError}>{quickAddError}</Text> : null}

                                <View style={styles.modalButtonRow}>
                                    <Pressable style={styles.modalSecondaryButton} onPress={closeQuickAdd}>
                                        <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
                                    </Pressable>
                                    <Pressable style={styles.modalPrimaryButton} onPress={handleSaveQuickAdd}>
                                        {isSavingEntry ? (
                                            <ActivityIndicator size="small" color="#F4F4F4" />
                                        ) : (
                                            <Text style={styles.modalPrimaryButtonText}>
                                                {quickAddModalMode === "create" ? "Confirm" : "Save"}
                                            </Text>
                                        )}
                                    </Pressable>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
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
        paddingHorizontal: 18,
        paddingTop: 12,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 2,
    },
    headerIconButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "#1F1F1F",
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        color: "#F4F4F4",
        fontSize: 24,
        fontWeight: "600",
    },
    dateStrip: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        paddingVertical: 2,
        paddingBottom: 4,
        alignItems: "flex-start",
    },
    dateCircleItem: {
        alignItems: "center",
        flex: 1,
    },
    dateCircle: {
        backgroundColor: "#1A1A1A",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
    },
    dateCircleRing: {
        position: "absolute",
        top: 0,
        left: 0,
    },
    dateCircleContent: {
        alignItems: "center",
        justifyContent: "center",
    },
    dateCircleDay: {
        color: "#9E9E9E",
        fontSize: 11,
        lineHeight: 12,
        textTransform: "uppercase",
    },
    dateCircleNumber: {
        color: "#F4F4F4",
        fontSize: 18,
        fontWeight: "600",
        lineHeight: 20,
        marginTop: 2,
    },
    dateCircleTextSelected: {
        color: "#F4F4F4",
    },
    dateCircleIndicatorSlot: {
        height: 10,
        marginTop: 4,
        alignItems: "center",
        justifyContent: "flex-end",
    },
    dateCircleIndicatorDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#D9D9D9",
    },
    statusRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    statusText: {
        color: "#7C7C7C",
        fontSize: 13,
        textAlign: "center",
        marginTop: 2,
        marginBottom: 0,
    },
    summaryRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginTop: 2,
        marginBottom: 2,
    },
    summaryMetricCard: {
        flex: 1,
        maxWidth: "33.3%",
        width: "33.3%",
        borderRadius: 20,
        padding: 14,
    },
    summaryMetricTextRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 2,
    },
    summaryMetricLabel: {
        color: "#FFFFFF",
        fontSize: 13,
    },
    summaryMetricValue: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "600",
        textAlign: "right",
    },
    summaryProgressTrack: {
        height: 6,
        borderRadius: 999,
        backgroundColor: "#2A2A2A",
        overflow: "hidden",
    },
    summaryProgressFill: {
        height: "100%",
        borderRadius: 999,
    },
    calorieFill: {
        backgroundColor: "#6EA8FF",
    },
    proteinFill: {
        backgroundColor: "#E8B5B8",
    },
    fatFill: {
        
        backgroundColor: "#E6E0AE",
    },
    carbFill: {
        backgroundColor: "#6EC1DF",
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
        flexDirection: "row",
        alignItems: "center",
        minHeight: TIMELINE_HOUR_HEIGHT,
    },
    timeSlotLabel: {
        width: TIMELINE_LEFT_GUTTER,
        color: "#B0B0B0",
        fontSize: 12,
        lineHeight: 14,
    },
    timelineHourHeaderContent: {
        flex: 1,
        minHeight: TIMELINE_HOUR_HEIGHT,
        justifyContent: "flex-start",
        paddingTop: 12,
    },
    timelineHourRule: {
        height: 1,
        backgroundColor: "#242424",
        marginLeft: 12,
    },
    timelineHourTotals: {
        color: "#5E5E5E",
        alignSelf: "flex-end",
        fontSize: 12,
        fontWeight: "500",
        marginTop: 8,
        marginLeft: 12,
    },
    timelineEmptyState: {
        paddingTop: 48,
        paddingLeft: TIMELINE_LEFT_GUTTER + 24,
        paddingBottom: 24,
        alignItems: "flex-start",
    },
    timelineHourEntries: {
        paddingTop: 2,
    },
    timelineEntryRow: {
        height: TIMELINE_ENTRY_HEIGHT,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: TIMELINE_ENTRY_GAP,
    },
    entryTimeLabel: {
        width: TIMELINE_LEFT_GUTTER,
        color: "#666666",
        fontSize: 11,
    },
    timelineEntryCard: {
        flex: 1,
        minHeight: TIMELINE_ENTRY_HEIGHT,
        borderRadius: 14,
        backgroundColor: "#1F1F1F",
        marginLeft: 12,
        paddingHorizontal: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
    },
    timelineEntryCardSelected: {
        borderWidth: 1,
        borderColor: "#7E7E7E",
    },
    timelineEntryName: {
        color: "#F4F4F4",
        fontSize: 13,
        fontWeight: "600",
        flex: 1,
    },
    timelineEntryMeta: {
        color: "#6E6E6E",
        fontSize: 12,
        flexShrink: 0,
    },
    emptySlotText: {
        color: "#666666",
        fontSize: 13,
    },
    actionButton: {
        width: "22.75%",
        minHeight: 58,
        borderRadius: 28,
        backgroundColor: "#2A2A2A",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 8,
    },
    actionButtonText: {
        color: "#F4F4F4",
        fontSize: 14,
        fontWeight: "600",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        justifyContent: "flex-end",
    },
    modalSheet: {
        backgroundColor: "#161616",
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 18,
        paddingTop: 12,
        paddingBottom: 28,
    },
    modalHandle: {
        alignSelf: "center",
        width: 46,
        height: 5,
        borderRadius: 999,
        backgroundColor: "#3A3A3A",
        marginBottom: 16,
    },
    modalBottomRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 12,
    },
    modalTitle: {
        color: "#F4F4F4",
        fontSize: 24,
        fontWeight: "600",
    },
    modalSubtitle: {
        color: "#8E8E8E",
        fontSize: 14,
        lineHeight: 20,
        marginTop: 6,
        marginBottom: 16,
    },
    modalInput: {
        minHeight: 50,
        borderRadius: 16,
        backgroundColor: "#202020",
        color: "#F4F4F4",
        paddingHorizontal: 16,
        fontSize: 16,
        marginBottom: 12,
    },
    modalGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    modalInputHalf: {
        width: "48.25%",
        minHeight: 50,
        borderRadius: 16,
        backgroundColor: "#202020",
        color: "#F4F4F4",
        paddingHorizontal: 16,
        fontSize: 16,
    },
    modalInputThirds: {
        width: "31.25%",
        minHeight: 50,
        borderRadius: 16,
        backgroundColor: "#202020",
        color: "#F4F4F4",
        paddingHorizontal: 16,
        fontSize: 16,
    },
    bottomActionBar: {
        position: "absolute",
        left: 18,
        right: 18,
        bottom: 50,
        flexDirection: "row",
        gap: 10,
    },
    searchPlaceholder: {
        flex: 1,
        minHeight: 58,
        borderRadius: 28,
        backgroundColor: "#2A2A2A",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 18,
        gap: 10,
    },
    searchPlaceholderText: {
        color: "#8C8C8C",
        fontSize: 18,
    },
    quickAddButton: {
        minWidth: 126,
        minHeight: 58,
        borderRadius: 28,
        backgroundColor: "#F4F4F4",
        alignItems: "center",
        justifyContent: "center",
    },
    quickAddButtonText: {
        color: "#151515",
        fontSize: 18,
        fontWeight: "600",
    },
    quickAddError: {
        color: "#F28B82",
        fontSize: 13,
        marginTop: 12,
    },
    modalButtonRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 18,
    },
    modalSecondaryButton: {
        flex: 1,
        minHeight: 48,
        borderRadius: 16,
        backgroundColor: "#202020",
        alignItems: "center",
        justifyContent: "center",
    },
    modalPrimaryButton: {
        flex: 1,
        minHeight: 48,
        borderRadius: 16,
        backgroundColor: "#F4F4F4",
        alignItems: "center",
        justifyContent: "center",
    },
    modalSecondaryButtonText: {
        color: "#B0B0B0",
        fontSize: 15,
        fontWeight: "600",
    },
    modalPrimaryButtonText: {
        color: "#111111",
        fontSize: 15,
        fontWeight: "700",
    },
});