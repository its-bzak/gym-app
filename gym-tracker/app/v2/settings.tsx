import V2LegacyBridgeScreen from "@/v2/screens/shared/V2LegacyBridgeScreen";
import { V2_ROUTES } from "@/v2/navigation/routes";

export default function V2SettingsRoute() {
  return (
    <V2LegacyBridgeScreen
      legacyHref={V2_ROUTES.legacySettings}
      subtitle="This is the future /profile -> /settings entry in V2. The route exists now so IA, copy, and visual hierarchy can evolve before the real migration."
      title="Settings Preview"
    />
  );
}