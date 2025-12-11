import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Colors } from "@/theme";

type SearchBarProps = {
  value: string;
  placeholder?: string;
  onChangeText: (text: string) => void;
  sortValue: "nearest" | "name" | "recent";
  onChangeSort: (sort: "nearest" | "name" | "recent") => void;
};

export default function SearchBar({
  value,
  placeholder = "Search businesses...",
  onChangeText,
  sortValue,
  onChangeSort,
}: SearchBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSelect = (sort: "nearest" | "name" | "recent") => {
    onChangeSort(sort);
    setMenuOpen(false);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <Ionicons
          name="search"
          size={18}
          color="#9CA3AF"
          style={{ marginRight: 8 }}
        />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Search businesses"
        />
        <Pressable
          hitSlop={14}
          style={styles.iconButton}
          onPress={() => setMenuOpen(!menuOpen)}
          accessibilityLabel="Open sort menu"
          accessibilityRole="button"
        >
          <Ionicons
            name="swap-vertical"
            size={20}
            color={
              menuOpen || sortValue !== "nearest"
                ? Colors.accent
                : Colors.text.secondary
            }
          />
        </Pressable>
      </View>

      {menuOpen && (
        <View style={styles.menu}>
          <Pressable style={styles.menuItem} onPress={() => handleSelect("nearest")}>
            <Text style={[styles.menuText, sortValue === "nearest" && styles.menuTextActive]}>
              Sort: Nearest
            </Text>
          </Pressable>
          <Pressable style={styles.menuItem} onPress={() => handleSelect("name")}>
            <Text style={[styles.menuText, sortValue === "name" && styles.menuTextActive]}>
              Name (A - Z)
            </Text>
          </Pressable>
          <Pressable style={styles.menuItem} onPress={() => handleSelect("recent")}>
            <Text style={[styles.menuText, sortValue === "recent" && styles.menuTextActive]}>
              Recently Added
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 14,
    backgroundColor: Colors.palette.cardBackground,
    paddingHorizontal: 14,
    height: 52,
    justifyContent: "center",
    shadowColor: Colors.palette.shadowSoft,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    color: Colors.text.primary,
    fontSize: 15,
    fontWeight: "600",
    paddingVertical: 0,
    flex: 1,
  },
  iconButton: {
    padding: 8,
    borderRadius: 10,
  },
  menu: {
    marginTop: 6,
    backgroundColor: Colors.palette.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.palette.divider,
    overflow: "hidden",
    shadowColor: Colors.palette.shadowSoft,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  menuItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  menuText: {
    color: Colors.text.secondary,
    fontWeight: "700",
    fontSize: 13,
  },
  menuTextActive: {
    color: Colors.accent,
  },
});
