export type ThemeMode = "light" | "dark";

export type ThemeFontWeight =
  | "300"
  | "400"
  | "500"
  | "600"
  | "700"
  | "800";

export type Tone = "default" | "accent" | "success" | "warning" | "danger" | "info";

export type MetricTone = Tone | "protein" | "fat" | "carbs";

export type ColorScale = {
  background: string;
  backgroundSubtle: string;
  surface: string;
  surfaceMuted: string;
  surfaceElevated: string;
  surfaceOverlay: string;

  border: string;
  borderMuted: string;
  divider: string;

  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  accent: string;
  accentHover: string;
  accentPressed: string;
  accentSoft: string;
  onAccent: string;

  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  info: string;
  infoSoft: string;

  iconPrimary: string;
  iconSecondary: string;
  iconMuted: string;
  iconInverse: string;

  inputBackground: string;
  inputBorder: string;
  inputPlaceholder: string;

  tabBarBackground: string;
  tabBarBorder: string;
  tabIconDefault: string;
  tabIconActive: string;
  tabIndicator: string;

  chartGrid: string;
  chartLinePrimary: string;
  chartLineSecondary: string;

  macroProtein: string;
  macroFat: string;
  macroCarbs: string;
  macroCaloriesTrack: string;

  badgeEarned: string;
  badgeLocked: string;

  focusRing: string;
};

export type SpacingScale = {
  xxs: number;
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  "2xl": number;
  "3xl": number;
};

export type RadiusScale = {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  pill: number;
  round: number;
};

export type TypographyToken = {
  fontSize: number;
  lineHeight: number;
  fontWeight: ThemeFontWeight;
};

export type TypographyScale = {
  hero: TypographyToken;
  title: TypographyToken;
  section: TypographyToken;
  body: TypographyToken;
  label: TypographyToken;
  caption: TypographyToken;
  metric: TypographyToken;
};

export type ShadowToken = {
  shadowColor: string;
  shadowOpacity: number;
  shadowRadius: number;
  shadowOffset: {
    width: number;
    height: number;
  };
  elevation: number;
};

export type ShadowScale = {
  card: ShadowToken;
  floating: ShadowToken;
};

export type ComponentTokens = {
  header: {
    height: number;
    avatarSize: number;
    iconSize: number;
  };
  tabBar: {
    height: number;
    iconSize: number;
    activeIndicatorHeight: number;
  };
  card: {
    padding: number;
    gap: number;
  };
  button: {
    height: number;
    radius: number;
  };
  input: {
    height: number;
    radius: number;
  };
  listRow: {
    minHeight: number;
    radius: number;
  };
};

export type ThemeTokens = {
  mode: ThemeMode;
  colors: ColorScale;
  spacing: SpacingScale;
  radii: RadiusScale;
  typography: TypographyScale;
  shadows: ShadowScale;
  components: ComponentTokens;
};