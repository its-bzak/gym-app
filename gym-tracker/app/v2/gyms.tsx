import V2LegacyBridgeScreen from "@/v2/screens/shared/V2LegacyBridgeScreen";
import { V2_ROUTES } from "@/v2/navigation/routes";

export default function V2GymsRoute() {
  return (
    <V2LegacyBridgeScreen
      legacyHref={V2_ROUTES.legacyGyms}
      subtitle="This preserves the /profile -> /gyms subflow inside the V2 namespace without forcing its redesign into the first migration pass."
      title="Gyms Preview"
    />
  );
}