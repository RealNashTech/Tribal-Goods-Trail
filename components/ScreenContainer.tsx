import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import GradientBackground from './GradientBackground';
import { Colors } from '@/theme';

type ScreenContainerProps = {
  children: React.ReactNode;
};

export default function ScreenContainer({ children }: ScreenContainerProps) {
  return (
    <GradientBackground>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        {children}
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 0,
    backgroundColor: Colors.palette.surfaceBackground,
  },
  card: {
    backgroundColor: Colors.surface,
  },
});
