const palette = {
  primary: "#2563EB",
  primaryDark: "#1E3A8A",
  primaryLight: "#60A5FA",

  surfaceBackground: "#F3F4F6",
  cardBackground: "#FFFFFF",
  inputBackground: "#FFFFFF",
  divider: "#E5E7EB",

  textPrimary: "#111827",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  textInverse: "#FFFFFF",

  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",

  shadowSoft: "rgba(0, 0, 0, 0.05)",
  shadowMedium: "rgba(0, 0, 0, 0.12)",

  mapPins: {
    cat1: "#E53935", // deep red
    cat2: "#2962FF", // vivid blue
    cat3: "#2E7D32", // green
    cat4: "#FB8C00", // orange
    cat5: "#8E24AA", // purple
    cat6: "#00838F", // teal
  },
};

export const Colors = {
  palette,
  gradient: [palette.primary, palette.primaryDark], // only for optional hero
  accent: palette.primary,
  surface: palette.surfaceBackground,
  text: {
    primary: palette.textPrimary,
    secondary: palette.textSecondary,
    inverse: palette.textInverse,
    meta: palette.textMuted,
  },
};

// Legacy aliases (for any existing imports)
export const gradientColors = Colors.gradient;
export const surfaceColor = Colors.surface;
export const accentGlow = Colors.accent;
export const textColors = Colors.text;
