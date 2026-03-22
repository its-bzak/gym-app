import { View, Text } from "react-native";

// The profile screen will show current user streak, trophies, metrics and a body / muscle map
// There will also be a profile header and friend count

export default function Profile() {
  return (
    <View className="flex-1 items-center justify-center bg-black">
      <Text className="text-white text-xl">Profile Screen</Text>
    </View>
  );
}