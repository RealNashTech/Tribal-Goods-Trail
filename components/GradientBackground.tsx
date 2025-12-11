import React from "react";
import { StyleSheet, View } from "react-native";

import { Colors } from "@/theme";

type GradientBackgroundProps = {
  children: React.ReactNode;
};

export default function GradientBackground({ children }: GradientBackgroundProps) {
  return <View style={styles.container}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.palette.surfaceBackground,
  },
});
