import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { Colors } from '@/theme';
import NeonCard from './NeonCard';

type Props = {
  name: string;
  category?: string;
  distanceLabel?: string;
};

export default function BusinessGridCard({ name, category, distanceLabel }: Props) {
  const displayCategory = category?.trim() || 'Category not specified';

  return (
    <NeonCard style={styles.card}>
      <Text style={styles.name} numberOfLines={2}>
        {name}
      </Text>
      <Text style={styles.category} numberOfLines={1}>
        {displayCategory}
      </Text>
      {distanceLabel ? <Text style={styles.distance}>{distanceLabel}</Text> : null}
    </NeonCard>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 180,
    gap: 6,
  },
  name: {
    color: Colors.text.primary,
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 20,
  },
  category: {
    color: Colors.text.secondary,
    fontSize: 14,
    fontWeight: '700',
  },
  distance: {
    color: Colors.text.secondary,
    fontSize: 13,
    fontWeight: '600',
  },
});
