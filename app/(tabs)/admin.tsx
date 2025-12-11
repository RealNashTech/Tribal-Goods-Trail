import React, { Suspense, useEffect, useState } from "react";
import { View, Text } from "react-native";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "expo-router";

import { getFirebaseAuth } from "@/firebase/auth";

import ScreenContainer from "@/components/ScreenContainer";

const AdminScreenContent = React.lazy(() => import("@/components/AdminScreenContent"));

export default function AdminScreen() {
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      const allowed = user?.email?.toLowerCase() === "a.gentry88@icloud.com";
      setIsAdmin(allowed);
      setAuthReady(true);
      if (!allowed) {
        router.replace("/");
      }
    });
    return unsub;
  }, [router]);

  if (!authReady) {
    return null;
  }

  if (!isAdmin) {
    return (
      <ScreenContainer>
        <View style={{ padding: 40 }}>
          <Text style={{ fontSize: 18, fontWeight: "700" }}>
            Access Denied
          </Text>
          <Text>You do not have permission to view this page.</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Suspense fallback={<Text>Loading admin...</Text>}>
        <AdminScreenContent />
      </Suspense>
    </ScreenContainer>
  );
}
