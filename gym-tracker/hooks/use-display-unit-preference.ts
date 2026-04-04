import {
  getDisplayUnitPreference as getMockDisplayUnitPreference,
  type DisplayUnitPreference,
} from "@/mock/mockDataService";
import {
  getAuthenticatedUserId,
  getDisplayUnitPreference as getSupabaseDisplayUnitPreference,
} from "@/services/profileService";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";

const CURRENT_USER_ID = "user_ryan";

export function useDisplayUnitPreference() {
  const [unitPreference, setUnitPreference] = useState<DisplayUnitPreference>(() =>
    getMockDisplayUnitPreference(CURRENT_USER_ID)
  );
  const [isLoadingUnitPreference, setIsLoadingUnitPreference] = useState(true);

  const resolveUnitPreference = useCallback(async (): Promise<DisplayUnitPreference> => {
    try {
      const authenticatedUserId = await getAuthenticatedUserId();

      if (!authenticatedUserId) {
        return getMockDisplayUnitPreference(CURRENT_USER_ID);
      }

      return await getSupabaseDisplayUnitPreference(authenticatedUserId);
    } catch {
      return getMockDisplayUnitPreference(CURRENT_USER_ID);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    const syncUnitPreference = async () => {
      const nextUnitPreference = await resolveUnitPreference();

      if (!isActive) {
        return;
      }

      setUnitPreference(nextUnitPreference);
      setIsLoadingUnitPreference(false);
    };

    void syncUnitPreference();

    return () => {
      isActive = false;
    };
  }, [resolveUnitPreference]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const syncUnitPreference = async () => {
        const nextUnitPreference = await resolveUnitPreference();

        if (!isActive) {
          return;
        }

        setUnitPreference(nextUnitPreference);
        setIsLoadingUnitPreference(false);
      };

      void syncUnitPreference();

      return () => {
        isActive = false;
      };
    }, [resolveUnitPreference])
  );

  return {
    unitPreference,
    isLoadingUnitPreference,
  };
}