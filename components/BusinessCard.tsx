import React from 'react';
import { Image, StyleSheet, Text } from 'react-native';

import { Colors } from '@/theme';
import NeonCard from './NeonCard';

export type BusinessCardProps = {
  name?: string;
  category?: string;
  cityState?: string;
};

export default function BusinessCard({ name = 'Business Name', category = 'Category', cityState = 'City, ST' }: BusinessCardProps) {
  return (
    <NeonCard style={styles.card}>
      <Image source={{ uri: 'https://via.placeholder.com/300x200.png?text=Image' }} style={styles.image} />
      <Text style={styles.category}>{category}</Text>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.location}>{cityState}</Text>
    </NeonCard>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    gap: 6,
  },
  image: {
    width: '100%',
    height: 160,
  },
  content: {
    padding: 12,
    gap: 4,
  },
  category: {
    color: Colors.accent,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  name: {
    color: Colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  location: {
    color: Colors.text.secondary,
    fontSize: 14,
  },
});
