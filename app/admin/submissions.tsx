import { useFocusEffect } from "@react-navigation/native";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import ScreenContainer from "@/components/ScreenContainer";
import { db } from "@/firebase/config";
import { Colors } from "@/theme";

/* ---------------------------------------------------------
   FINAL CATEGORY SYSTEM (6)
---------------------------------------------------------- */

const NEW_CATEGORIES = [
  "Cultural Goods & Handmade Items",
  "Traditional Foods, Crafts & Firewood",
  "Restaurants, Food Carts & Coffee",
  "Professional Services",
  "Business Storefronts & Retail",
  "Tribal Enterprises",
];

/* ---------------------------------------------------------
   TYPES
---------------------------------------------------------- */

type Submission = {
  id: string;
  name: string;
  owner?: string;
  category?: string;
  description?: string;
  address?: string;
  phone?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  isCommunitySeller?: boolean;
  status?: string;
  createdAt?: { seconds: number; nanoseconds: number };
};

/* ---------------------------------------------------------
   STATUS COLORS
---------------------------------------------------------- */

const STATUS_STYLES: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  pending: { label: "Pending", color: "#8a6d1f", bg: "#f6eac3" },
  approved: { label: "Approved", color: "#0a6640", bg: "#c8f7dc" },
  rejected: { label: "Rejected", color: "#8b1e3f", bg: "#f5c7d1" },
};

/* ---------------------------------------------------------
   SCREEN COMPONENT
---------------------------------------------------------- */

export default function AdminSubmissionsScreen() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  /* LOAD SUBMISSIONS */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "submissions"),
        orderBy("createdAt", "desc")
      );

      const snap = await getDocs(q);
      const items = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      })) as Submission[];

      setSubmissions(items);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Unable to load submissions.");
    } finally {
      setLoading(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  /* ---------------------------------------------------------
     APPROVE SUBMISSION - strict 6 categories + writes tag
  ---------------------------------------------------------- */

  const approve = async (submission: Submission) => {
    if (submission.status === "approved" || submission.publishedBusinessId) {
      Alert.alert("Already approved", "This submission has already been published.");
      return;
    }

    setProcessingId(submission.id);

    try {
      if (!NEW_CATEGORIES.includes(submission.category ?? "")) {
        Alert.alert(
          "Category Error",
          "Invalid category — update it before approving."
        );
        return;
      }

      if (!submission.latitude || !submission.longitude) {
        Alert.alert(
          "Missing location",
          "This listing does not have coordinates."
        );
        return;
      }

      // Create business entry
      const bizRef = await addDoc(collection(db, "businesses"), {
        name: submission.name,
        owner: submission.owner ?? "",
        category: submission.category ?? "",
        description: submission.description ?? "",
        website: submission.website ?? "",
        address: submission.address ?? "",
        phone: submission.phone ?? "",
        latitude: submission.latitude,
        longitude: submission.longitude,
        isCommunitySeller: submission.isCommunitySeller ?? false,
        createdAt: serverTimestamp(),
        approvedAt: serverTimestamp(),
        sourceSubmissionId: submission.id,
      });

      // Mark submission as approved
      await updateDoc(doc(db, "submissions", submission.id), {
        status: "approved",
        approvedAt: serverTimestamp(),
        publishedBusinessId: bizRef.id,
      });

      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submission.id ? { ...s, status: "approved" } : s
        )
      );
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not approve submission.");
    } finally {
      setProcessingId(null);
    }
  };

  /* ---------------------------------------------------------
     REJECT SUBMISSION
  ---------------------------------------------------------- */

  const reject = async (submission: Submission) => {
    setProcessingId(submission.id);

    try {
      await updateDoc(doc(db, "submissions", submission.id), {
        status: "rejected",
        rejectedAt: serverTimestamp(),
      });

      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submission.id ? { ...s, status: "rejected" } : s
        )
      );
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not reject submission.");
    } finally {
      setProcessingId(null);
    }
  };

  /* ---------------------------------------------------------
     DELETE SUBMISSION
  ---------------------------------------------------------- */

  const remove = async (submission: Submission) => {
    setProcessingId(submission.id);

    try {
      await deleteDoc(doc(db, "submissions", submission.id));

      setSubmissions((prev) =>
        prev.filter((s) => s.id !== submission.id)
      );
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Unable to delete submission.");
    } finally {
      setProcessingId(null);
    }
  };

  /* ---------------------------------------------------------
     RENDER ITEM
  ---------------------------------------------------------- */

  const renderItem = ({ item }: { item: Submission }) => {
    const statusMeta =
      STATUS_STYLES[item.status ?? "pending"] ?? STATUS_STYLES.pending;

    const createdDate = item.createdAt?.seconds
      ? new Date(item.createdAt.seconds * 1000)
      : null;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>{item.category}</Text>

            {item.isCommunitySeller ? (
              <Text style={styles.communityBadge}>Community Seller</Text>
            ) : null}

            <Text style={styles.meta}>{item.address}</Text>
            <Text style={styles.meta}>
              Submitted: {createdDate ? createdDate.toLocaleDateString() : "—"}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusMeta.bg, borderColor: statusMeta.bg },
            ]}
          >
            <Text style={[styles.statusLabel, { color: statusMeta.color }]}>
              {statusMeta.label}
            </Text>
          </View>
        </View>

        {item.description ? (
          <Text style={styles.body}>{item.description}</Text>
        ) : null}

        {item.website ? (
          <Text style={styles.meta}>Website: {item.website}</Text>
        ) : null}

        {item.phone ? <Text style={styles.meta}>Phone: {item.phone}</Text> : null}

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
              {processingId === item.id ? "Working..." : "Approve"}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.delete]}
            onPress={() => remove(item)}
            disabled={processingId === item.id}
          >
            <Text style={styles.buttonLabel}>Delete</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  /* ---------------------------------------------------------
     RENDER SCREEN
  ---------------------------------------------------------- */

  return (
    <ScreenContainer>
      <Text style={styles.screenTitle}>Submissions Review</Text>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={Colors.accent} />
          <Text style={styles.body}>Loading submissions…</Text>
        </View>
      ) : (
        <FlatList
          data={submissions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 24, gap: 12 }}
          ListEmptyComponent={
            <Text style={styles.body}>No submissions yet.</Text>
          }
        />
      )}
    </ScreenContainer>
  );
}

/* ---------------------------------------------------------
   STYLES
---------------------------------------------------------- */

const styles = StyleSheet.create({
  screenTitle: {
    color: Colors.text.primary,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 12,
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
    gap: 8,
  },
  cardHeader: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  name: {
    color: Colors.text.primary,
    fontSize: 18,
    fontWeight: "800",
  },
  meta: {
    color: Colors.text.secondary,
  },
  body: {
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  communityBadge: {
    color: Colors.accent,
    fontWeight: "800",
    fontSize: 13,
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusLabel: {
    fontWeight: "800",
    fontSize: 12,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  button: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  approve: {
    backgroundColor: Colors.palette.primary,
    borderColor: Colors.palette.primary,
  },
  approveLabel: {
    color: Colors.text.inverse,
    fontWeight: "800",
  },
  reject: {
    backgroundColor: Colors.palette.cardBackground,
    borderColor: Colors.palette.divider,
  },
  delete: {
    backgroundColor: Colors.palette.cardBackground,
    borderColor: Colors.palette.divider,
  },
  buttonLabel: {
    color: Colors.text.primary,
    fontWeight: "800",
  },
});
