import V2LegacyBridgeScreen from "@/v2/screens/shared/V2LegacyBridgeScreen";
import { V2_ROUTES } from "@/v2/navigation/routes";

export default function V2HistoryRoute() {
  return (
    <V2LegacyBridgeScreen
      legacyHref={V2_ROUTES.legacyHistory}
      subtitle="Workout history remains attached to the V2 profile IA, but the current implementation can continue handling the detail view until its redesign is ready."
      title="History Preview"
    />
  );
}