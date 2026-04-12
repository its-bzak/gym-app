import V2LegacyBridgeScreen from "@/v2/screens/shared/V2LegacyBridgeScreen";
import { V2_ROUTES } from "@/v2/navigation/routes";

export default function V2BadgesRoute() {
  return (
    <V2LegacyBridgeScreen
      legacyHref={V2_ROUTES.legacyBadges}
      subtitle="Badges can stay reachable from the new shell while the redesign focuses on higher-traffic surfaces first."
      title="Badges Preview"
    />
  );
}