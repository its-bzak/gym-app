import { Text, View } from "react-native";
import { mockUser } from "../../mock/user";

export default function ProfileScreen() {
  return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#ECEDEE", fontSize: 24, fontWeight: "bold" }}>
          {mockUser.username}
        </Text>
        <Text style={{ color: "#ECEDEE", fontSize: 16, marginTop: 8 }}>
          {mockUser.bio}
        </Text>
      </View>
  );
}

const styles = {
};