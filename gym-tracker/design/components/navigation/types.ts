export type HeaderIconAction = {
  icon: string;
  onPress: () => void;
  accessibilityLabel: string;
};

export type HeaderAvatarAction = {
  type: "avatar";
  avatarUri?: string | null;
  onPress: () => void;
  accessibilityLabel: string;
};

export type HeaderTrailingIconAction = {
  type: "icon";
  icon: string;
  onPress: () => void;
  accessibilityLabel: string;
};

export type AppHeaderProps = {
  title: string;
  leftAction?: HeaderIconAction;
  rightAction?: HeaderAvatarAction | HeaderTrailingIconAction;
  variant?: "default" | "compact";
};

export type TabBarItemVisualProps = {
  label: string;
  iconName: string;
  focused: boolean;
};