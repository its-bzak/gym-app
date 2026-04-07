export type AvatarHeroStat = {
  label: string;
  value: string;
};

export type ProfileBadgeCardProps = {
  id: string;
  name: string;
  tier?: "I" | "II" | "III" | "IV" | "V";
  isAchieved: boolean;
};

export type ProfileBadgeRailProps = {
  badges: ProfileBadgeCardProps[];
  onPressBadge?: (badgeId: string) => void;
};

export type ProfileSettingsItem = {
  id: string;
  iconName: string;
  label: string;
  value?: string;
  tone?: "default" | "danger";
  showChevron?: boolean;
  onPress?: () => void;
};

export type AccountSettingsPanelProps = {
  items: ProfileSettingsItem[];
};

export type AvatarHeroProps = {
  displayName: string;
  username: string;
  avatarUri?: string | null;
  verified?: boolean;
  stats: AvatarHeroStat[];
};

export type RedesignProfileScreenProps = {
  appTitle?: string;
  displayName: string;
  username: string;
  avatarUri?: string | null;
  verified?: boolean;
  stats: AvatarHeroStat[];
  badges: ProfileBadgeCardProps[];
  settingsItems: ProfileSettingsItem[];
  statusMessage?: string;
  isLoading?: boolean;
  onPressMenu?: () => void;
  onPressAvatar?: () => void;
  onPressViewAllBadges?: () => void;
  onPressBadge?: (badgeId: string) => void;
};