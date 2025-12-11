import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Colors } from "@/theme";

type Props = {
  name: string;
  category?: string;
  owner?: string;
  description?: string;
  onPress?: () => void;
};

export default function BusinessListCard({
  name,
  category,
  owner,
  description,
  onPress,
}: Props) {
  const displayCategory = category?.trim() || "Category not specified";
  const displayDescription =
    description?.trim() || "No description provided.";

  return (
    <Pressable
      style={[styles.card, onPress && styles.clickable]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>
        <Text style={styles.category} numberOfLines={1}>
          {displayCategory}
        </Text>
        {owner ? (
          <Text style={styles.owner} numberOfLines={1}>
            Owner: {owner}
          </Text>
        ) : null}
        <Text style={styles.body} numberOfLines={2}>
          {displayDescription}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    minHeight: 120,
    width: "100%",
    backgroundColor: Colors.palette.cardBackground,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: Colors.palette.shadowMedium,
    shadowOpacity: 0.6,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.palette.divider,
  },
  clickable: {
    opacity: 0.98,
  },
  content: {
    flex: 1,
    padding: 14,
    gap: 6,
  },
  name: {
    color: Colors.text.primary,
    fontSize: 17,
    fontWeight: "800",
  },
  category: {
    color: Colors.palette.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  owner: {
    color: Colors.text.secondary,
    fontSize: 13,
    fontWeight: "700",
  },
  body: {
    color: Colors.text.secondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
});
