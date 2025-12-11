import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getFirebaseAuth } from "@/firebase/auth";
import { neonTabBar } from "@/components/NeonTabBar";

export default function TabsLayout() {
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const { bottom } = useSafeAreaInsets();
  const isAndroid = Platform.OS === "android";
  const androidBottomInset = isAndroid ? Math.max(bottom, 20) : bottom;
  const tabBarBaseHeight = isAndroid ? 90 : 64;
  const tabBarHeight = tabBarBaseHeight + androidBottomInset;

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsAdmin(user?.email?.toLowerCase() === "a.gentry88@icloud.com");
      setAuthReady(true);
    });
    return unsub;
  }, []);

  // Wait until Firebase auth finishes loading
  if (!authReady) return null;

  return (
    <Tabs
      initialRouteName="map"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: neonTabBar.tabBarActiveTintColor,
        tabBarInactiveTintColor: neonTabBar.tabBarInactiveTintColor,
        tabBarStyle: {
          ...neonTabBar.tabBarStyle,
          paddingBottom: androidBottomInset,
          paddingTop: isAndroid ? 10 : 6,
          height: tabBarHeight,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          letterSpacing: 0.2,
        },
      }}
    >
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarAccessibilityLabel: "Map tab",
          tabBarIcon: ({ color }) => (
            <Ionicons name="map" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="browse"
        options={{
          title: "Browse",
          tabBarAccessibilityLabel: "Browse tab",
          tabBarIcon: ({ color }) => (
            <Ionicons name="list" size={22} color={color} />
          ),
        }}
      />

      {/* Hide legacy index route if present */}
      <Tabs.Screen
        name="add"
        options={{
          title: "Submit",
          tabBarIcon: ({ color }) => (
            <Ionicons name="create-outline" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="donations"
        options={{
          title: "About",
          tabBarIcon: ({ color }) => (
            <Ionicons name="heart" size={22} color={color} />
          ),
        }}
      />

      {/* Admin tab ALWAYS declared — hidden when not admin */}
      <Tabs.Screen
        name="admin"
        options={{
          href: isAdmin ? "/(tabs)/admin" : null, // ← hides tab completely
          title: "Admin",
          tabBarIcon: ({ color }) => (
            <Ionicons name="settings" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="about/index"
        options={{
          href: null, // hide stray index tab
        }}
      />
    </Tabs>
  );
}
