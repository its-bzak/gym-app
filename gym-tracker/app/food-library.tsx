import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "@/design/hooks/use-app-theme";
import { createThemedStyles } from "@/design/utils/create-themed-styles";
import {
  createSavedFoodDefinition,
  createSavedRecipeDefinition,
  deleteSavedFoodDefinition,
  deleteSavedRecipeDefinition,
  getSavedFoodLibrary,
  getSavedRecipeLibrary,
  updateSavedFoodDefinition,
  updateSavedRecipeDefinition,
  type SavedFoodInput,
  type SavedRecipeInput,
} from "@/services/dashboardService";
import { getAuthenticatedUserId } from "@/services/profileService";
import type { SavedFood, SavedRecipe } from "@/types/dashboard";

type FoodFormState = {
  name: string;
  referenceMassGrams: string;
  energyKcal: string;
  protein: string;
  fat: string;
  carbs: string;
};

type RecipeIngredientDraft = {
  savedFoodId: string;
  savedFoodName: string;
  massGrams: string;
  defaultMassGrams: number;
};

const EMPTY_FOOD_FORM: FoodFormState = {
  name: "",
  referenceMassGrams: "",
  energyKcal: "",
  protein: "",
  fat: "",
  carbs: "",
};

export default function FoodLibraryScreen() {
  const { theme } = useAppTheme();
  const params = useLocalSearchParams<{
    mode?: string;
    date?: string;
  }>();
  const [authenticatedUserId, setAuthenticatedUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [savedFoods, setSavedFoods] = useState<SavedFood[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [isFoodModalVisible, setIsFoodModalVisible] = useState(false);
  const [editingSavedFoodId, setEditingSavedFoodId] = useState<string | null>(null);
  const [foodForm, setFoodForm] = useState<FoodFormState>(EMPTY_FOOD_FORM);
  const [foodFormError, setFoodFormError] = useState<string | null>(null);
  const [isSavingFood, setIsSavingFood] = useState(false);
  const [isRecipeComposerVisible, setIsRecipeComposerVisible] = useState(false);
  const [editingSavedRecipeId, setEditingSavedRecipeId] = useState<string | null>(null);
  const [recipeName, setRecipeName] = useState("");
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredientDraft[]>([]);
  const [recipeError, setRecipeError] = useState<string | null>(null);
  const [isSavingRecipe, setIsSavingRecipe] = useState(false);
  const isPickMode = params.mode === "pick";
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };
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
      paddingBottom: 16,
      gap: 14,
    },
    headerRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
    },
    headerButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      backgroundColor: currentTheme.colors.surface,
      borderWidth: 1,
      borderColor: currentTheme.colors.borderMuted,
    },
    headerTitleBlock: {
      flex: 1,
      paddingHorizontal: 12,
    },
    headerTitle: {
      color: currentTheme.colors.textPrimary,
      fontSize: currentTheme.typography.title.fontSize,
      lineHeight: currentTheme.typography.title.lineHeight,
      fontWeight: currentTheme.typography.title.fontWeight,
    },
    headerSubtitle: {
      color: currentTheme.colors.textSecondary,
      fontSize: currentTheme.typography.caption.fontSize,
      lineHeight: currentTheme.typography.caption.lineHeight,
    },
    searchInput: {
      backgroundColor: currentTheme.colors.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: currentTheme.colors.borderMuted,
      color: currentTheme.colors.textPrimary,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: currentTheme.typography.body.fontSize,
      lineHeight: currentTheme.typography.body.lineHeight,
    },
    actionRow: {
      flexDirection: "row" as const,
      gap: 10,
    },
    actionButton: {
      flex: 1,
      minHeight: 48,
      borderRadius: 16,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      backgroundColor: currentTheme.colors.surface,
      borderWidth: 1,
      borderColor: currentTheme.colors.borderMuted,
    },
    actionButtonPrimary: {
      backgroundColor: currentTheme.colors.accent,
      borderColor: currentTheme.colors.accent,
    },
    actionButtonText: {
      color: currentTheme.colors.textPrimary,
      fontSize: currentTheme.typography.body.fontSize,
      fontWeight: "600" as const,
    },
    actionButtonTextPrimary: {
      color: currentTheme.colors.onAccent,
    },
    statusText: {
      color: currentTheme.colors.textSecondary,
      fontSize: currentTheme.typography.caption.fontSize,
      lineHeight: currentTheme.typography.caption.lineHeight,
    },
    sectionTitle: {
      color: currentTheme.colors.textPrimary,
      fontSize: currentTheme.typography.section.fontSize,
      lineHeight: currentTheme.typography.section.lineHeight,
      fontWeight: currentTheme.typography.section.fontWeight,
      marginBottom: 8,
    },
    section: {
      gap: 10,
    },
    inlineComposer: {
      backgroundColor: currentTheme.colors.surface,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: currentTheme.colors.accent,
      padding: 16,
      gap: 12,
    },
    inlineComposerTitle: {
      color: currentTheme.colors.textPrimary,
      fontSize: currentTheme.typography.section.fontSize,
      lineHeight: currentTheme.typography.section.lineHeight,
      fontWeight: currentTheme.typography.section.fontWeight,
    },
    inlineComposerHelper: {
      color: currentTheme.colors.textSecondary,
      fontSize: currentTheme.typography.caption.fontSize,
      lineHeight: currentTheme.typography.caption.lineHeight,
    },
    card: {
      backgroundColor: currentTheme.colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: currentTheme.colors.borderMuted,
      padding: 16,
      gap: 8,
    },
    cardPressed: {
      borderColor: currentTheme.colors.accent,
    },
    cardSelected: {
      borderColor: currentTheme.colors.accent,
      backgroundColor: currentTheme.colors.accentSoft,
    },
    cardTitle: {
      color: currentTheme.colors.textPrimary,
      fontSize: currentTheme.typography.body.fontSize,
      fontWeight: "600" as const,
    },
    cardMeta: {
      color: currentTheme.colors.textSecondary,
      fontSize: currentTheme.typography.caption.fontSize,
      lineHeight: currentTheme.typography.caption.lineHeight,
    },
    recipeIngredientText: {
      color: currentTheme.colors.textSecondary,
      fontSize: currentTheme.typography.caption.fontSize,
      lineHeight: currentTheme.typography.caption.lineHeight,
    },
    emptyState: {
      paddingVertical: 18,
      alignItems: "center" as const,
    },
    emptyStateText: {
      color: currentTheme.colors.textSecondary,
      fontSize: currentTheme.typography.body.fontSize,
      lineHeight: currentTheme.typography.body.lineHeight,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.55)",
      justifyContent: "flex-end" as const,
    },
    modalSheet: {
      backgroundColor: currentTheme.colors.background,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 18,
      paddingTop: 14,
      paddingBottom: 24,
      gap: 12,
      maxHeight: "88%",
    },
    modalHandle: {
      alignSelf: "center" as const,
      width: 46,
      height: 5,
      borderRadius: 999,
      backgroundColor: currentTheme.colors.border,
      marginBottom: 4,
    },
    modalTitle: {
      color: currentTheme.colors.textPrimary,
      fontSize: currentTheme.typography.section.fontSize,
      lineHeight: currentTheme.typography.section.lineHeight,
      fontWeight: currentTheme.typography.section.fontWeight,
    },
    modalInput: {
      backgroundColor: currentTheme.colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: currentTheme.colors.borderMuted,
      color: currentTheme.colors.textPrimary,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: currentTheme.typography.body.fontSize,
      lineHeight: currentTheme.typography.body.lineHeight,
    },
    gridRow: {
      flexDirection: "row" as const,
      gap: 10,
    },
    gridInput: {
      flex: 1,
    },
    modalError: {
      color: currentTheme.colors.error,
      fontSize: currentTheme.typography.caption.fontSize,
      lineHeight: currentTheme.typography.caption.lineHeight,
    },
    modalButtonRow: {
      flexDirection: "row" as const,
      gap: 10,
      marginTop: 4,
    },
    modalButton: {
      flex: 1,
      minHeight: 48,
      borderRadius: 16,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      backgroundColor: currentTheme.colors.surface,
      borderWidth: 1,
      borderColor: currentTheme.colors.borderMuted,
    },
    modalButtonPrimary: {
      backgroundColor: currentTheme.colors.accent,
      borderColor: currentTheme.colors.accent,
    },
    modalButtonText: {
      color: currentTheme.colors.textPrimary,
      fontSize: currentTheme.typography.body.fontSize,
      fontWeight: "600" as const,
    },
    modalButtonTextPrimary: {
      color: currentTheme.colors.onAccent,
    },
    ingredientRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 10,
      backgroundColor: currentTheme.colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: currentTheme.colors.borderMuted,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    ingredientName: {
      flex: 1,
      color: currentTheme.colors.textPrimary,
      fontSize: currentTheme.typography.body.fontSize,
      lineHeight: currentTheme.typography.body.lineHeight,
    },
    ingredientMassInput: {
      width: 88,
      textAlign: "right" as const,
      color: currentTheme.colors.textPrimary,
      fontSize: currentTheme.typography.body.fontSize,
      lineHeight: currentTheme.typography.body.lineHeight,
    },
    ingredientMassLabel: {
      color: currentTheme.colors.textSecondary,
      fontSize: currentTheme.typography.caption.fontSize,
    },
    ingredientPickerCard: {
      backgroundColor: currentTheme.colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: currentTheme.colors.borderMuted,
      padding: 14,
      gap: 4,
    },
    cardActionRow: {
      flexDirection: "row" as const,
      gap: 10,
      marginTop: 4,
    },
    cardActionButton: {
      flex: 1,
      minHeight: 38,
      borderRadius: 14,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      backgroundColor: currentTheme.colors.background,
      borderWidth: 1,
      borderColor: currentTheme.colors.borderMuted,
    },
    cardActionButtonDanger: {
      borderColor: currentTheme.colors.error,
      backgroundColor: currentTheme.colors.surface,
    },
    cardActionText: {
      color: currentTheme.colors.textPrimary,
      fontSize: currentTheme.typography.caption.fontSize,
      lineHeight: currentTheme.typography.caption.lineHeight,
      fontWeight: currentTheme.typography.label.fontWeight,
    },
    cardActionTextDanger: {
      color: currentTheme.colors.error,
    },
    selectedBadge: {
      alignSelf: "flex-start" as const,
      borderRadius: currentTheme.radii.pill,
      backgroundColor: currentTheme.colors.accent,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    selectedBadgeText: {
      color: currentTheme.colors.onAccent,
      fontSize: currentTheme.typography.caption.fontSize,
      lineHeight: currentTheme.typography.caption.lineHeight,
      fontWeight: currentTheme.typography.label.fontWeight,
    },
    composerBottomBar: {
      position: "absolute" as const,
      left: 18,
      right: 18,
      bottom: 16,
      flexDirection: "row" as const,
      gap: 10,
    },
    composerBottomButton: {
      flex: 1,
      minHeight: 52,
      borderRadius: 18,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      backgroundColor: currentTheme.colors.surface,
      borderWidth: 1,
      borderColor: currentTheme.colors.borderMuted,
    },
    composerBottomButtonPrimary: {
      backgroundColor: currentTheme.colors.accent,
      borderColor: currentTheme.colors.accent,
    },
    composerBottomButtonText: {
      color: currentTheme.colors.textPrimary,
      fontSize: currentTheme.typography.body.fontSize,
      lineHeight: currentTheme.typography.body.lineHeight,
      fontWeight: currentTheme.typography.label.fontWeight,
    },
    composerBottomButtonTextPrimary: {
      color: currentTheme.colors.onAccent,
    },
  }));

  const selectedRecipeFoodIds = useMemo(
    () => new Set(recipeIngredients.map((ingredient) => ingredient.savedFoodId)),
    [recipeIngredients]
  );

  const loadLibrary = useCallback(async (searchValue = searchText) => {
    setIsLoading(true);

    try {
      const userId = authenticatedUserId ?? (await getAuthenticatedUserId());
      setAuthenticatedUserId(userId);

      if (!userId) {
        setSavedFoods([]);
        setSavedRecipes([]);
        setLoadError("Sign in to manage saved foods.");
        return;
      }

      const [foods, recipes] = await Promise.all([
        getSavedFoodLibrary(userId, searchValue),
        getSavedRecipeLibrary(userId, searchValue),
      ]);

      setSavedFoods(foods);
      setSavedRecipes(recipes);
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not load your food library.");
    } finally {
      setIsLoading(false);
    }
  }, [authenticatedUserId, searchText]);

  useEffect(() => {
    void loadLibrary("");
  }, [loadLibrary]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadLibrary(searchText);
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [loadLibrary, searchText]);

  const selectForLogging = (sourceType: "saved_food" | "recipe", sourceId: string, defaultMassGrams: number) => {
    router.replace({
      pathname: "/(tabs)/discover",
      params: {
        quickAdd: "1",
        date: params.date,
        sourceType,
        sourceId,
        massGrams: String(defaultMassGrams),
      },
    });
  };

  const closeFoodModal = () => {
    setFoodForm(EMPTY_FOOD_FORM);
    setFoodFormError(null);
    setEditingSavedFoodId(null);
    setIsFoodModalVisible(false);
  };

  const closeRecipeModal = () => {
    setRecipeName("");
    setRecipeIngredients([]);
    setRecipeError(null);
    setEditingSavedRecipeId(null);
    setIsRecipeComposerVisible(false);
  };

  const openCreateFoodModal = () => {
    setFoodForm(EMPTY_FOOD_FORM);
    setFoodFormError(null);
    setEditingSavedFoodId(null);
    setIsFoodModalVisible(true);
  };

  const openEditFoodModal = (savedFood: SavedFood) => {
    setFoodForm({
      name: savedFood.name,
      referenceMassGrams: String(savedFood.referenceMassGrams),
      energyKcal: String(savedFood.energyKcal),
      protein: String(savedFood.protein),
      fat: String(savedFood.fat),
      carbs: String(savedFood.carbs),
    });
    setFoodFormError(null);
    setEditingSavedFoodId(savedFood.id);
    setIsFoodModalVisible(true);
  };

  const openCreateRecipeModal = () => {
    setRecipeName("");
    setRecipeIngredients([]);
    setRecipeError(null);
    setEditingSavedRecipeId(null);
    setIsRecipeComposerVisible(true);
  };

  const openEditRecipeModal = (savedRecipe: SavedRecipe) => {
    setRecipeName(savedRecipe.name);
    setRecipeIngredients(
      savedRecipe.ingredients.map((ingredient) => ({
        savedFoodId: ingredient.savedFoodId,
        savedFoodName: ingredient.savedFoodName,
        massGrams: String(ingredient.massGrams),
        defaultMassGrams: ingredient.massGrams,
      }))
    );
    setRecipeError(null);
    setEditingSavedRecipeId(savedRecipe.id);
    setIsRecipeComposerVisible(true);
  };

  const toggleRecipeIngredient = (savedFood: SavedFood) => {
    setRecipeIngredients((current) => {
      if (current.some((ingredient) => ingredient.savedFoodId === savedFood.id)) {
        return current.filter((ingredient) => ingredient.savedFoodId !== savedFood.id);
      }

      return [
        ...current,
        {
          savedFoodId: savedFood.id,
          savedFoodName: savedFood.name,
          massGrams: String(savedFood.referenceMassGrams),
          defaultMassGrams: savedFood.referenceMassGrams,
        },
      ];
    });
  };

  const handleSaveFood = async () => {
    if (!authenticatedUserId) {
      setFoodFormError("Sign in to save foods.");
      return;
    }

    setIsSavingFood(true);
    setFoodFormError(null);

    const input: SavedFoodInput = {
      name: foodForm.name,
      referenceMassGrams: Number(foodForm.referenceMassGrams),
      energyKcal: Number(foodForm.energyKcal),
      protein: Number(foodForm.protein),
      fat: Number(foodForm.fat),
      carbs: Number(foodForm.carbs),
    };

    try {
      const result = editingSavedFoodId
        ? await updateSavedFoodDefinition(authenticatedUserId, editingSavedFoodId, input)
        : await createSavedFoodDefinition(authenticatedUserId, input);

      if (!result.success) {
        setFoodFormError(result.error ?? "Could not save food.");
        return;
      }

      closeFoodModal();
      await loadLibrary();
    } finally {
      setIsSavingFood(false);
    }
  };

  const handleSaveRecipe = async () => {
    if (!authenticatedUserId) {
      setRecipeError("Sign in to save recipes.");
      return;
    }

    setIsSavingRecipe(true);
    setRecipeError(null);

    const input: SavedRecipeInput = {
      name: recipeName,
      ingredients: recipeIngredients.map((ingredient) => ({
        savedFoodId: ingredient.savedFoodId,
        massGrams: Number(ingredient.massGrams),
      })),
    };

    try {
      const result = editingSavedRecipeId
        ? await updateSavedRecipeDefinition(authenticatedUserId, editingSavedRecipeId, input)
        : await createSavedRecipeDefinition(authenticatedUserId, input);

      if (!result.success) {
        setRecipeError(result.error ?? "Could not save recipe.");
        return;
      }

      closeRecipeModal();
      await loadLibrary();
    } finally {
      setIsSavingRecipe(false);
    }
  };

  const handleDeleteFood = (savedFood: SavedFood) => {
    if (!authenticatedUserId) {
      Alert.alert("Sign in required", "Sign in to manage saved foods.");
      return;
    }

    Alert.alert("Delete saved food", `Delete ${savedFood.name} from your library?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void (async () => {
            const result = await deleteSavedFoodDefinition(authenticatedUserId, savedFood.id);

            if (!result.success) {
              Alert.alert("Could not delete food", result.error ?? "Please try again.");
              return;
            }

            await loadLibrary();
          })();
        },
      },
    ]);
  };

  const handleDeleteRecipe = (savedRecipe: SavedRecipe) => {
    if (!authenticatedUserId) {
      Alert.alert("Sign in required", "Sign in to manage recipes.");
      return;
    }

    Alert.alert("Delete recipe", `Delete ${savedRecipe.name} from your library?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void (async () => {
            const result = await deleteSavedRecipeDefinition(authenticatedUserId, savedRecipe.id);

            if (!result.success) {
              Alert.alert("Could not delete recipe", result.error ?? "Please try again.");
              return;
            }

            await loadLibrary();
          })();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.headerRow}>
          <Pressable style={styles.headerButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={theme.colors.iconPrimary} />
          </Pressable>
          <View style={styles.headerTitleBlock}>
            <Text style={styles.headerTitle}>Food Library</Text>
            <Text style={styles.headerSubtitle}>Create foods, build recipes, and reuse them in Discover.</Text>
          </View>
          <View style={styles.headerButton} />
        </View>

        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search foods and recipes"
          placeholderTextColor={theme.colors.textSecondary}
        />

        <View style={styles.actionRow}>
          <Pressable style={styles.actionButton} onPress={openCreateFoodModal}>
            <Text style={styles.actionButtonText}>New Food</Text>
          </Pressable>
          <Pressable style={styles.actionButton} onPress={openCreateRecipeModal}>
            <Text style={styles.actionButtonText}>New Recipe</Text>
          </Pressable>
        </View>

        {isRecipeComposerVisible ? (
          <View style={styles.inlineComposer}>
            <Text style={styles.inlineComposerTitle}>{editingSavedRecipeId ? "Edit Recipe" : "Build Recipe"}</Text>
            <TextInput
              style={styles.modalInput}
              value={recipeName}
              onChangeText={setRecipeName}
              placeholder="Recipe name"
              placeholderTextColor={theme.colors.textSecondary}
            />
            <Text style={styles.inlineComposerHelper}>Tap foods below to add or remove them from this recipe.</Text>
            {recipeIngredients.map((ingredient) => (
              <View key={`${ingredient.savedFoodId}-${ingredient.savedFoodName}`} style={styles.ingredientRow}>
                <Text style={styles.ingredientName}>{ingredient.savedFoodName}</Text>
                <TextInput
                  style={styles.ingredientMassInput}
                  value={ingredient.massGrams}
                  onChangeText={(value) => {
                    setRecipeIngredients((current) =>
                      current.map((currentIngredient) =>
                        currentIngredient.savedFoodId === ingredient.savedFoodId
                          ? { ...currentIngredient, massGrams: value }
                          : currentIngredient
                      )
                    );
                  }}
                  keyboardType="numeric"
                />
                <Text style={styles.ingredientMassLabel}>g</Text>
                <Pressable
                  onPress={() =>
                    setRecipeIngredients((current) =>
                      current.filter((currentIngredient) => currentIngredient.savedFoodId !== ingredient.savedFoodId)
                    )
                  }>
                  <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
                </Pressable>
              </View>
            ))}
            {recipeError ? <Text style={styles.modalError}>{recipeError}</Text> : null}
          </View>
        ) : null}

        {loadError ? <Text style={styles.statusText}>{loadError}</Text> : null}
        {isPickMode ? <Text style={styles.statusText}>Pick a saved food or recipe to prefill your food log.</Text> : null}

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ gap: 18, paddingBottom: isRecipeComposerVisible ? 110 : 20 }}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Saved Foods</Text>
            {isLoading ? <ActivityIndicator color={theme.colors.iconPrimary} /> : null}
            {!isLoading && savedFoods.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No saved foods yet.</Text>
              </View>
            ) : null}
            {savedFoods.map((savedFood) => (
              <Pressable
                key={savedFood.id}
                style={({ pressed }) => [
                  styles.card,
                  isRecipeComposerVisible && selectedRecipeFoodIds.has(savedFood.id) && styles.cardSelected,
                  pressed && styles.cardPressed,
                ]}
                onPress={() => {
                  if (isRecipeComposerVisible) {
                    toggleRecipeIngredient(savedFood);
                  } else if (isPickMode) {
                    selectForLogging("saved_food", savedFood.id, savedFood.referenceMassGrams);
                  }
                }}>
                <Text style={styles.cardTitle}>{savedFood.name}</Text>
                <Text style={styles.cardMeta}>
                  {Math.round(savedFood.energyKcal)} kcal per {savedFood.referenceMassGrams}g
                </Text>
                <Text style={styles.cardMeta}>
                  P {savedFood.protein}  F {savedFood.fat}  C {savedFood.carbs}
                </Text>
                {isRecipeComposerVisible && selectedRecipeFoodIds.has(savedFood.id) ? (
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedBadgeText}>Selected</Text>
                  </View>
                ) : null}
                {!isPickMode && !isRecipeComposerVisible ? (
                  <View style={styles.cardActionRow}>
                    <Pressable style={styles.cardActionButton} onPress={() => openEditFoodModal(savedFood)}>
                      <Text style={styles.cardActionText}>Edit</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.cardActionButton, styles.cardActionButtonDanger]}
                      onPress={() => handleDeleteFood(savedFood)}>
                      <Text style={[styles.cardActionText, styles.cardActionTextDanger]}>Delete</Text>
                    </Pressable>
                  </View>
                ) : null}
              </Pressable>
            ))}
          </View>

          {!isRecipeComposerVisible ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recipes</Text>
              {!isLoading && savedRecipes.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No recipes yet.</Text>
                </View>
              ) : null}
              {savedRecipes.map((savedRecipe) => (
                <Pressable
                  key={savedRecipe.id}
                  style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                  onPress={() => {
                    if (isPickMode) {
                      selectForLogging("recipe", savedRecipe.id, savedRecipe.totalMassGrams);
                    }
                  }}>
                  <Text style={styles.cardTitle}>{savedRecipe.name}</Text>
                  <Text style={styles.cardMeta}>
                    {Math.round(savedRecipe.energyKcal)} kcal per {savedRecipe.totalMassGrams}g recipe
                  </Text>
                  <Text style={styles.cardMeta}>
                    P {savedRecipe.protein.toFixed(1)}  F {savedRecipe.fat.toFixed(1)}  C {savedRecipe.carbs.toFixed(1)}
                  </Text>
                  <Text style={styles.recipeIngredientText}>
                    {savedRecipe.ingredients.map((ingredient) => `${ingredient.savedFoodName} ${ingredient.massGrams}g`).join(" · ")}
                  </Text>
                  {!isPickMode ? (
                    <View style={styles.cardActionRow}>
                      <Pressable style={styles.cardActionButton} onPress={() => openEditRecipeModal(savedRecipe)}>
                        <Text style={styles.cardActionText}>Edit</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.cardActionButton, styles.cardActionButtonDanger]}
                        onPress={() => handleDeleteRecipe(savedRecipe)}>
                        <Text style={[styles.cardActionText, styles.cardActionTextDanger]}>Delete</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </Pressable>
              ))}
            </View>
          ) : null}
        </ScrollView>

        {isRecipeComposerVisible ? (
          <View style={styles.composerBottomBar}>
            <Pressable style={styles.composerBottomButton} onPress={closeRecipeModal}>
              <Text style={styles.composerBottomButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.composerBottomButton, styles.composerBottomButtonPrimary]}
              onPress={() => void handleSaveRecipe()}>
              {isSavingRecipe ? (
                <ActivityIndicator size="small" color={theme.colors.onAccent} />
              ) : (
                <Text style={[styles.composerBottomButtonText, styles.composerBottomButtonTextPrimary]}>
                  {editingSavedRecipeId ? "Save Changes" : "Confirm Recipe"}
                </Text>
              )}
            </Pressable>
          </View>
        ) : null}
      </View>

      <Modal visible={isFoodModalVisible} transparent animationType="slide" onRequestClose={closeFoodModal}>
        <TouchableWithoutFeedback onPress={dismissKeyboard} accessible={false}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}} accessible={false}>
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}>
                <View style={styles.modalSheet}>
                  <View style={styles.modalHandle} />
                  <Text style={styles.modalTitle}>{editingSavedFoodId ? "Edit Saved Food" : "Create Saved Food"}</Text>
                  <TextInput style={styles.modalInput} value={foodForm.name} onChangeText={(value) => setFoodForm((current) => ({ ...current, name: value }))} placeholder="Food name" placeholderTextColor={theme.colors.textSecondary} />
                  <View style={styles.gridRow}>
                    <TextInput style={[styles.modalInput, styles.gridInput]} value={foodForm.referenceMassGrams} onChangeText={(value) => setFoodForm((current) => ({ ...current, referenceMassGrams: value }))} placeholder="Reference grams" placeholderTextColor={theme.colors.textSecondary} keyboardType="numeric" />
                    <TextInput style={[styles.modalInput, styles.gridInput]} value={foodForm.energyKcal} onChangeText={(value) => setFoodForm((current) => ({ ...current, energyKcal: value }))} placeholder="Calories" placeholderTextColor={theme.colors.textSecondary} keyboardType="numeric" />
                  </View>
                  <View style={styles.gridRow}>
                    <TextInput style={[styles.modalInput, styles.gridInput]} value={foodForm.protein} onChangeText={(value) => setFoodForm((current) => ({ ...current, protein: value }))} placeholder="Protein" placeholderTextColor={theme.colors.textSecondary} keyboardType="numeric" />
                    <TextInput style={[styles.modalInput, styles.gridInput]} value={foodForm.fat} onChangeText={(value) => setFoodForm((current) => ({ ...current, fat: value }))} placeholder="Fat" placeholderTextColor={theme.colors.textSecondary} keyboardType="numeric" />
                    <TextInput style={[styles.modalInput, styles.gridInput]} value={foodForm.carbs} onChangeText={(value) => setFoodForm((current) => ({ ...current, carbs: value }))} placeholder="Carbs" placeholderTextColor={theme.colors.textSecondary} keyboardType="numeric" />
                  </View>
                  {foodFormError ? <Text style={styles.modalError}>{foodFormError}</Text> : null}
                  <View style={styles.modalButtonRow}>
                    <Pressable style={styles.modalButton} onPress={closeFoodModal}>
                      <Text style={styles.modalButtonText}>Cancel</Text>
                    </Pressable>
                    <Pressable style={[styles.modalButton, styles.modalButtonPrimary]} onPress={() => void handleSaveFood()}>
                      {isSavingFood ? <ActivityIndicator size="small" color={theme.colors.onAccent} /> : <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>{editingSavedFoodId ? "Save Changes" : "Save Food"}</Text>}
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
