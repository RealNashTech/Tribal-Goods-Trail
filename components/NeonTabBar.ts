import { Colors } from "@/theme";

export const neonTabBar = {
  tabBarStyle: {
    backgroundColor: Colors.palette.cardBackground,
    borderTopColor: Colors.palette.divider,
    borderTopWidth: 1,
    shadowColor: Colors.palette.shadowMedium,
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 10,
  },
  tabBarActiveTintColor: Colors.palette.primary,
  tabBarInactiveTintColor: Colors.text.secondary,
};
