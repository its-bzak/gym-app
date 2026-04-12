import { Redirect } from "expo-router";
import { V2_ROUTES } from "@/v2/navigation/routes";

export default function V2Index() {
  return <Redirect href={V2_ROUTES.splash} />;
}