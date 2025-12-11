import React from "react";
import { ImageBackground, StyleSheet, Text, View } from "react-native";

import { Colors } from "@/theme";

type Props = {
  title: string;
  image?: any;
};

export default function CategoryCard({ title, image }: Props) {
  return (
    <View style={styles.card}>
      <ImageBackground
        source={image}
        style={styles.image}
        resizeMode="cover"
        imageStyle={styles.imageRadius}
      >
        {!image ? <View style={styles.placeholder} /> : null}
        <View style={styles.overlay} />
        <View style={styles.labelWrap}>
          <Text style={styles.label}>{title}</Text>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    height: 150,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    backgroundColor: Colors.palette.cardBackground,
    shadowColor: Colors.palette.shadowSoft,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  image: {
    flex: 1,
  },
  imageRadius: {
    borderRadius: 16,
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.palette.surfaceBackground,
    opacity: 0.5,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.32)",
  },
  labelWrap: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
  },
  label: {
    color: Colors.text.inverse,
    fontSize: 24,
    fontWeight: "800",
  },
});
