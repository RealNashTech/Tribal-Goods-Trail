import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import ScreenContainer from '@/components/ScreenContainer';
import { Colors } from '@/theme';

export default function AboutScreen() {
  return (
    <ScreenContainer>
      <View style={styles.card}>
        <Text style={styles.title}>About TribalGoodsTrail</Text>
        <Text style={styles.body}>Mission, feature highlights, and CTAs will be showcased here.</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.accent,
    gap: 8,
  },
  title: {
    color: Colors.text.primary,
    fontSize: 22,
    fontWeight: '800',
  },
  body: {
    color: Colors.text.secondary,
  },
});
