import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import ScreenContainer from '@/components/ScreenContainer';
import { Colors } from '@/theme';

export default function DonationThankYouScreen() {
  return (
    <ScreenContainer>
      <View style={styles.card}>
        <Text style={styles.kicker}>Thank you</Text>
        <Text style={styles.title}>Your support matters</Text>
        <Text style={styles.body}>
          Your contribution keeps Tribal Goods Trail updated and free for Native-owned businesses. We appreciate you for helping the
          community discover and support Native entrepreneurs.
        </Text>
        <Text style={styles.body}>You can close this screen or continue browsing businesses.</Text>
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
  kicker: {
    color: Colors.accent,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    color: Colors.text.primary,
    fontSize: 22,
    fontWeight: '800',
  },
  body: {
    color: Colors.text.secondary,
    lineHeight: 20,
  },
});
