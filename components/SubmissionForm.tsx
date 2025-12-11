import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  addDoc,
  collection,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { getFirebaseApp } from "@/firebase";
import { Colors } from "@/theme";

/* REQUIRED FIELDS */
const REQUIRED_FIELDS = ["name", "owner", "category", "description", "address"];

/* FINAL 6 CATEGORY SET */
const CATEGORY_OPTIONS = [
  "Cultural Goods & Handmade Items",
  "Traditional Foods, Crafts & Firewood",
  "Restaurants, Food Carts & Coffee",
  "Professional Services",
  "Business Storefronts & Retail",
  "Tribal Enterprises",
] as const;

export default function SubmissionForm() {
  const [form, setForm] = useState({
    name: "",
    owner: "",
    category: "",
    description: "",
    website: "",
    address: "",
    phone: "",
    latitude: "",
    longitude: "",
    isCommunitySeller: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);

  const db = useMemo(() => getFirestore(getFirebaseApp()), []);
  const googleMapsApiKey =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";

  const updateField = (key, value) =>
    setForm((prev) => ({
      ...prev,
      [key]: key === "isCommunitySeller" ? Boolean(value) : value,
    }));

  const toggleCommunitySeller = () =>
    setForm((prev) => ({
      ...prev,
      isCommunitySeller: !prev.isCommunitySeller,
    }));

  const hasMissingRequired = REQUIRED_FIELDS.some(
    (field) => !form[field].trim()
  );

  /* ---------------------------------------------------------
     FIXED SANITIZER — SAFE FOR ALL DATA TYPES
  ---------------------------------------------------------- */
const sanitize = (value) => {
  if (value == null) return "";

  // Preserve booleans — DO NOT convert them to strings
  if (typeof value === "boolean") return value;

  // Preserve numbers (for latitude / longitude)
  if (typeof value === "number") return value;

  // Sanitize strings
  if (typeof value === "string")
    return value.replace(/<[^>]*>/g, "").trim();

  // Fallback — return as-is
  return value;
};

  /* ---------------------------------------------------------
     SUBMIT FORM
  ---------------------------------------------------------- */

  const handleSubmit = async () => {
    if (hasMissingRequired) {
      Alert.alert("Missing info", "Please fill out all required fields.");
      return;
    }

    const sanitized = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, sanitize(v)])
    );

    setSubmitting(true);

    try {
      // anti-spam
      const lastSubmission = await AsyncStorage.getItem("lastSubmissionTime");
      if (lastSubmission && Date.now() - Number(lastSubmission) < 30000) {
        Alert.alert("Slow down", "Wait 30 seconds before submitting again.");
        return;
      }

      // check duplicates
      const duplicateQuery = query(
        collection(db, "submissions"),
        where("name", "==", sanitized.name),
        where("address", "==", sanitized.address)
      );
      const dupSnap = await getDocs(duplicateQuery);
      if (!dupSnap.empty) {
        Alert.alert(
          "Duplicate",
          "This business at this address was already submitted."
        );
        return;
      }

      // determine location
      let loc = null;
      const hasManual =
        sanitized.latitude &&
        sanitized.longitude &&
        !isNaN(Number(sanitized.latitude)) &&
        !isNaN(Number(sanitized.longitude));

      if (hasManual) {
        loc = {
          lat: Number(sanitized.latitude),
          lng: Number(sanitized.longitude),
        };
      } else {
        if (!googleMapsApiKey) {
          Alert.alert(
            "Location needed",
            "Enter coordinates manually or provide a Google Maps API key."
          );
          return;
        }

        const geoResp = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
            sanitized.address
          )}&key=${googleMapsApiKey}`
        );

        const geo = await geoResp.json();
        loc = geo?.results?.[0]?.geometry?.location ?? null;

        if (!loc) {
          Alert.alert("Address not found", "Please check the address.");
          return;
        }
      }

      // SAVE TO FIRESTORE
      await addDoc(collection(db, "submissions"), {
        ...sanitized,
        latitude: loc.lat,
        longitude: loc.lng,
        createdAt: serverTimestamp(),
        status: "pending",
      });

      await AsyncStorage.setItem("lastSubmissionTime", Date.now().toString());

      Alert.alert(
        "Submitted",
        "Your listing will appear on the map once approved."
      );

      // reset form
      setForm({
        name: "",
        owner: "",
        category: "",
        description: "",
        website: "",
        address: "",
        phone: "",
        latitude: "",
        longitude: "",
        isCommunitySeller: false,
      });
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Unable to submit.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------------------------------------------------
     RENDER
  ---------------------------------------------------------- */

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Business Submission Form</Text>

      <View style={styles.fields}>
        <FormField
          label="Business name"
          required
          value={form.name}
          onChangeText={(v) => updateField("name", v)}
        />

        <FormField
          label="Owner"
          required
          value={form.owner}
          onChangeText={(v) => updateField("owner", v)}
        />

        {/* Category */}
        <PickerField
          label="Category"
          required
          value={form.category}
          options={CATEGORY_OPTIONS}
          open={categoryOpen}
          setOpen={setCategoryOpen}
          onValueChange={(v) => updateField("category", v)}
        />

        {/* COMMUNITY SELLER */}
        <Pressable style={styles.toggleRow} onPress={toggleCommunitySeller}>
          <View
            style={[
              styles.toggleBox,
              form.isCommunitySeller && styles.toggleBoxActive,
            ]}
          />
          <Text style={styles.toggleLabel}>This is a community seller</Text>
        </Pressable>

        <FormField
          label="Description"
          required
          multiline
          value={form.description}
          onChangeText={(v) => updateField("description", v)}
        />

        <FormField
          label="Website / Social Media Page"
          placeholder="https://..."
          value={form.website}
          onChangeText={(v) => updateField("website", v)}
        />

        <FormField
          label="Address"
          required
          value={form.address}
          onChangeText={(v) => updateField("address", v)}
        />

        <FormField
          label="Phone"
          keyboardType="phone-pad"
          value={form.phone}
          onChangeText={(v) => updateField("phone", v)}
        />

        <FormField
          label="Latitude (optional)"
          keyboardType="decimal-pad"
          value={form.latitude}
          onChangeText={(v) => updateField("latitude", v)}
        />

        <FormField
          label="Longitude (optional)"
          keyboardType="decimal-pad"
          value={form.longitude}
          onChangeText={(v) => updateField("longitude", v)}
        />
      </View>

      {/* SUBMIT BUTTON */}
      <Pressable
        onPress={handleSubmit}
        disabled={submitting}
        style={[
          styles.submitButton,
          submitting && styles.submitButtonDisabled,
        ]}
      >
        {submitting ? (
          <ActivityIndicator color="#0D1440" />
        ) : (
          <Text style={styles.submitLabel}>Submit for Review</Text>
        )}
      </Pressable>
    </View>
  );
}

/* ---------------------------------------------------------
   FORM FIELD COMPONENTS
---------------------------------------------------------- */

function FormField({
  label,
  value,
  onChangeText,
  required,
  placeholder,
  multiline,
  keyboardType,
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label} {required && <Text style={{ color: Colors.accent }}>*</Text>}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#777"
        keyboardType={keyboardType ?? "default"}
        multiline={multiline}
        style={[styles.input, multiline && styles.inputMultiline]}
      />
    </View>
  );
}

function PickerField({
  label,
  value,
  onValueChange,
  options,
  required,
  open,
  setOpen,
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label} {required && <Text style={{ color: Colors.accent }}>*</Text>}
      </Text>

      <Pressable style={styles.pickerTrigger} onPress={() => setOpen(true)}>
        <Text
          style={!value ? styles.placeholderText : styles.pickerTriggerText}
        >
          {value || "Select a category"}
        </Text>
      </Pressable>

      <Modal transparent visible={open} animationType="fade">
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setOpen(false)}
        />

        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Choose Category</Text>

          <ScrollView style={{ maxHeight: "70%" }}>
            {options.map((opt) => (
              <Pressable
                key={opt}
                onPress={() => {
                  onValueChange(opt);
                  setOpen(false);
                }}
                style={styles.optionRow}
              >
                <Text style={styles.optionText}>{opt}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

/* ---------------------------------------------------------
   STYLES
---------------------------------------------------------- */

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.palette.cardBackground,
    padding: 20,
    borderRadius: 16,
    borderColor: Colors.palette.divider,
    borderWidth: 1,
    gap: 12,
    shadowColor: Colors.palette.shadowSoft,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  title: {
    color: Colors.text.primary,
    fontSize: 22,
    fontWeight: "700",
  },
  fields: {
    gap: 12,
  },
  field: {
    gap: 6,
  },
  label: {
    color: Colors.text.primary,
    fontWeight: "700",
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.palette.divider,
    borderRadius: 12,
    padding: 12,
    color: Colors.text.primary,
    backgroundColor: Colors.palette.inputBackground,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  pickerTrigger: {
    borderWidth: 1,
    borderColor: Colors.palette.divider,
    borderRadius: 12,
    padding: 12,
    backgroundColor: Colors.palette.inputBackground,
  },
  pickerTriggerText: {
    color: Colors.text.primary,
    fontWeight: "600",
  },
  placeholderText: {
    color: Colors.text.meta,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalCard: {
    margin: 24,
    padding: 16,
    borderRadius: 14,
    backgroundColor: Colors.palette.cardBackground,
    borderWidth: 1,
    borderColor: Colors.palette.divider,
  },
  modalTitle: {
    color: Colors.text.primary,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  optionRow: {
    paddingVertical: 10,
  },
  optionText: {
    color: Colors.text.primary,
    fontSize: 15,
  },

  submitButton: {
    backgroundColor: Colors.palette.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitLabel: {
    color: Colors.text.inverse,
    fontWeight: "700",
  },

  /* COMMUNITY SELLER */
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },
  toggleBox: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderColor: Colors.palette.divider,
    borderRadius: 6,
    backgroundColor: Colors.palette.inputBackground,
  },
  toggleBoxActive: {
    backgroundColor: Colors.palette.primary,
  },
  toggleLabel: {
    color: Colors.text.primary,
    fontSize: 15,
  },
});
