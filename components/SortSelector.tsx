import React, { useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Colors } from '@/theme';

type Props = {
  value: 'nearest' | 'az';
  onChange: (v: 'nearest' | 'az') => void;
};

export default function SortSelector({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.container}>
      <Pressable style={styles.button} onPress={() => setOpen(!open)}>
        <Text style={styles.buttonText}>
          Sort: {value === 'nearest' ? 'Nearest' : 'A → Z'} ▼
        </Text>
      </Pressable>

      {open && (
        <View style={styles.menu}>
          <Pressable style={styles.item} onPress={() => { onChange('nearest'); setOpen(false); }}>
            <Text style={styles.itemText}>Nearest</Text>
          </Pressable>
          <Pressable style={styles.item} onPress={() => { onChange('az'); setOpen(false); }}>
            <Text style={styles.itemText}>A → Z</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignSelf: 'flex-start', marginBottom: 8 },

  button: {
    backgroundColor: '#0D1440',                 // Deep Indiglo Navy
    borderWidth: 1,
    borderColor: Colors.accent,                // Neon outline
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  buttonText: {
    color: Colors.text.primary,
    fontWeight: '700',
    fontSize: 13,
  },

  menu: {
    marginTop: 4,
    backgroundColor: '#0D1440',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.accent,
    overflow: 'hidden',
  },

  item: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  itemText: {
    color: Colors.text.secondary,
    fontSize: 13,
  },
});
