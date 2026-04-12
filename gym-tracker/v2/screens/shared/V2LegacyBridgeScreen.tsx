import { router } from "expo-router";
import V2PreviewScreen from "@/v2/components/V2PreviewScreen";
import V2SectionCard from "@/v2/components/V2SectionCard";
import { V2_ROUTES } from "@/v2/navigation/routes";

type V2LegacyBridgeScreenProps = {
  title: string;
  subtitle: string;
  legacyHref: string;
};

export default function V2LegacyBridgeScreen({
  title,
  subtitle,
  legacyHref,
}: V2LegacyBridgeScreenProps) {
  return (
    <V2PreviewScreen
      eyebrow="V2 Bridge"
      title={title}
      subtitle={subtitle}
      statusMessage="Bridge route."
      actions={[
        {
          id: "open-legacy",
          label: "Open current screen",
          iconName: "open-outline",
          onPress: () => router.push(legacyHref),
        },
        {
          id: "back-dashboard",
          label: "Back to dashboard",
          tone: "secondary",
          iconName: "grid-outline",
          onPress: () => router.replace(V2_ROUTES.dashboard),
        },
      ]}>
      <V2SectionCard
        title="Status"
        subtitle="This route currently forwards to the connected legacy screen.">
        {null}
      </V2SectionCard>
    </V2PreviewScreen>
  );
}