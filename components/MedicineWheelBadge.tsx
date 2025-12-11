import React from "react";
import { StyleSheet, View } from "react-native";

/**
 * Clean SVG-style medicine wheel built using React Native Views
 * (No dependencies—safe for Expo + React Native Maps)
 */
export default function MedicineWheelBadge({
  size = 22,
}: {
  size?: number;
}) {
  const ring = size;
  const quadrant = size / 2.1;

  return (
    <View
      style={[
        styles.container,
        {
          width: ring,
          height: ring,
          borderRadius: ring / 2,
        },
      ]}
    >
      {/* Top-Left — Yellow */}
      <View
        style={[
          styles.quad,
          {
            width: quadrant,
            height: quadrant,
            backgroundColor: "#FFD447",
            borderTopLeftRadius: ring / 2,
          },
        ]}
      />

      {/* Top-Right — Red */}
      <View
        style={[
          styles.quad,
          {
            width: quadrant,
            height: quadrant,
            backgroundColor: "#B40000",
            borderTopRightRadius: ring / 2,
          },
        ]}
      />

      {/* Bottom-Left — Black */}
      <View
        style={[
          styles.quad,
          {
            width: quadrant,
            height: quadrant,
            backgroundColor: "#1A1A1A",
            borderBottomLeftRadius: ring / 2,
          },
        ]}
      />

      {/* Bottom-Right — White */}
      <View
        style={[
          styles.quad,
          {
            width: quadrant,
            height: quadrant,
            backgroundColor: "#FFFFFF",
            borderBottomRightRadius: ring / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#333",
    backgroundColor: "#FFF",
  },
  quad: {
    borderWidth: 0,
  },
});
