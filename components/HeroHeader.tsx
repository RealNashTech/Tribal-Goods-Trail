import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/theme';

type HeroHeaderProps = {
  title: string;
  subtitle: string;
  logo?: any;
};

export default function HeroHeader({ title, subtitle, logo }: HeroHeaderProps) {
  return (
    <View style={styles.wrapper}>
      {logo ? <Image source={logo} style={styles.logo} resizeMode="contain" /> : null}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  logo: {
    width: 300,
    height: 230,
  },
  title: {
    color: Colors.text.primary,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  subtitle: {
    color: Colors.text.secondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 20,
  },
});
