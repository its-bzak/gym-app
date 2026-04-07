export type AvatarHeroStat = {
  label: string;
  value: string;
};

export type AvatarHeroProps = {
  displayName: string;
  username: string;
  avatarUri?: string | null;
  verified?: boolean;
  stats: AvatarHeroStat[];
};