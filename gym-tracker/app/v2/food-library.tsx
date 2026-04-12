import V2LegacyBridgeScreen from "@/v2/screens/shared/V2LegacyBridgeScreen";
import { V2_ROUTES } from "@/v2/navigation/routes";

export default function V2FoodLibraryRoute() {
  return (
    <V2LegacyBridgeScreen
      legacyHref={V2_ROUTES.legacyFoodLibrary}
      subtitle="Saved foods and recipes already exist behind current services, so V2 can bridge here instead of rebuilding the management flow immediately."
      title="Food Library Preview"
    />
  );
}