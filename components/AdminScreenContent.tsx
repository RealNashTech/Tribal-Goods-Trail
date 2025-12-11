import * as Location from "expo-location";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  getFirestore,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import ScreenContainer from "@/components/ScreenContainer";
import { getFirebaseApp } from "@/firebase";
import { getFirebaseAuth } from "@/firebase/auth";
import { Colors } from "@/theme";

type Submission = {
  id: string;
  name: string;
  owner: string;
  category: string;
  description: string;
  website?: string;
  address: string;
  phone?: string;
  status?: string;
};

export default function AdminScreenContent() {
  const db = useMemo(() => getFirestore(getFirebaseApp()), []);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const auth = getFirebaseAuth();

  const load = async () => {
    try {
      const snap = await getDocs(collection(db, "submissions"));
      const pending = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as any) }))
        .filter((d) => (d.status ?? "pending") === "pending") as Submission[];
      setSubmissions(pending);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Unable to load submissions.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async (submission: Submission) => {
    if (submission.status === "approved" || (submission as any).publishedBusinessId) {
      Alert.alert("Already approved", "This submission has already been published.");
      return;
    }

    setProcessingId(submission.id);
    try {
      if (!submission.address?.trim()) {
        Alert.alert("Address required", "Provide an address before approving so we can geocode it.");
        return;
      }

      const geo = await Location.geocodeAsync(submission.address);
      if (!geo.length) {
        Alert.alert("Geocoding failed", "Could not find coordinates for this address. Please double-check it.");
        return;
      }
      const { latitude, longitude } = geo[0];

      const bizRef = await addDoc(collection(db, "businesses"), {
        name: submission.name,
        owner: submission.owner,
        category: submission.category,
        description: submission.description,
        website: submission.website ?? "",
        address: submission.address ?? "",
        phone: submission.phone ?? "",
        latitude,
        longitude,
        createdAt: serverTimestamp(),
        isCommunitySeller: (submission as any).isCommunitySeller ?? false,
      });

      await updateDoc(doc(db, "submissions", submission.id), {
        status: "approved",
        approvedAt: serverTimestamp(),
        latitude,
        longitude,
        publishedBusinessId: bizRef.id,
      });

      setSubmissions((prev) => prev.filter((s) => s.id !== submission.id));
      Alert.alert("Approved", "Listing published to the map and directory.");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Unable to approve this submission right now.");
    } finally {
      setProcessingId(null);
    }
  };

  const reject = async (submission: Submission) => {
    setProcessingId(submission.id);
    try {
      await updateDoc(doc(db, "submissions", submission.id), {
        status: "rejected",
        rejectedAt: serverTimestamp(),
      });
      setSubmissions((prev) => prev.filter((s) => s.id !== submission.id));
      Alert.alert("Rejected", "Submission marked as rejected.");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Unable to reject this submission right now.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.hero}>
        <Text style={styles.kicker}>Internal tools</Text>
        <Text style={styles.title}>Admin Review</Text>
        <Text style={styles.body}>
          Review submissions, geocode addresses automatically, and publish approved businesses to the directory.
        </Text>
        <Text style={styles.helper}>
          Approve a test submission to verify geocoding; then confirm it appears on Browse/Map immediately.
        </Text>
        <Pressable style={styles.refresh} onPress={() => router.push("/admin/submissions")}>
          <Text style={styles.refreshLabel}>Open submissions dashboard</Text>
        </Pressable>
        <Pressable
          style={styles.refresh}
          onPress={async () => {
            try {
              await signOut(auth);
              Alert.alert("Signed out", "Admin session cleared.");
              router.replace("/admin/login");
            } catch (err: any) {
              Alert.alert("Error", err?.message ?? "Unable to sign out.");
            }
          }}
        >
          <Text style={styles.refreshLabel}>Sign out</Text>
        </Pressable>
        <Pressable style={styles.refresh} onPress={() => { setRefreshing(true); load(); }}>
          <Text style={styles.refreshLabel}>{refreshing ? "Refreshing." : "Reload submissions"}</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={Colors.accent} />
          <Text style={styles.body}>Loading submissions...</Text>
        </View>
      ) : submissions.length === 0 ? (
        <View style={styles.loader}>
          <Text style={styles.body}>No pending submissions.</Text>
        </View>
      ) : (
        <FlatList
          data={submissions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 32, gap: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>Owner: {item.owner || "-"}</Text>
              <Text style={styles.meta}>Category: {item.category || "-"}</Text>
              <Text style={styles.meta}>Address: {item.address || "-"}</Text>
              <Text style={styles.meta}>Website: {item.website || "-"}</Text>
              <Text style={styles.meta}>Phone: {item.phone || "-"}</Text>
              <Text style={styles.body} numberOfLines={4}>
                {item.description}
              </Text>

              <View style={styles.actions}>
                <Pressable
                  style={[styles.button, styles.reject]}
                  onPress={() => reject(item)}
                  disabled={processingId === item.id}
                >
                  <Text style={styles.buttonLabel}>Reject</Text>
                </Pressable>
                <Pressable
                  style={[styles.button, styles.approve]}
                  onPress={() => approve(item)}
                  disabled={processingId === item.id}
                >
                  <Text style={[styles.buttonLabel, styles.approveLabel]}>
                    {processingId === item.id ? "Working." : "Approve & publish"}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: Colors.palette.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.palette.divider,
    gap: 8,
    marginBottom: 12,
  },
  kicker: {
    color: Colors.text.secondary,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: {
    color: Colors.text.primary,
    fontSize: 22,
    fontWeight: "800",
  },
  body: {
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  loader: {
    backgroundColor: Colors.palette.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.palette.divider,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  card: {
    backgroundColor: Colors.palette.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.palette.divider,
    gap: 6,
  },
  name: {
    color: Colors.text.primary,
    fontSize: 18,
    fontWeight: "800",
  },
  meta: {
    color: Colors.text.secondary,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  button: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.palette.divider,
  },
  reject: {
    backgroundColor: Colors.palette.cardBackground,
  },
  approve: {
    backgroundColor: Colors.palette.primary,
    borderColor: Colors.palette.primary,
  },
  buttonLabel: {
    color: Colors.text.primary,
    fontWeight: "800",
  },
  approveLabel: {
    color: Colors.text.inverse,
  },
  helper: {
    color: Colors.text.secondary,
    fontSize: 12,
  },
  refresh: {
    marginTop: 4,
    alignSelf: "flex-start",
    backgroundColor: Colors.palette.cardBackground,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.palette.divider,
  },
  refreshLabel: {
    color: Colors.text.primary,
    fontWeight: "700",
    fontSize: 12,
  },
});
