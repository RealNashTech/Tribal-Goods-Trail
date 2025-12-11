import React from "react";
import { View, StyleSheet, ViewProps } from "react-native";

import { Colors } from "@/theme";

type NeonCardProps = ViewProps & {
  children: React.ReactNode;
};

// Neutral, reusable card surface used across list/grid/hero tiles.
export default function NeonCard({ children, style, ...rest }: NeonCardProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.palette.cardBackground,
    borderColor: Colors.palette.divider,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    shadowColor: Colors.palette.shadowSoft,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
});
