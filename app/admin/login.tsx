import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';

import { getFirebaseAuth } from '@/firebase/auth';
import ScreenContainer from '@/components/ScreenContainer';
import { Colors } from '@/theme';

export default function AdminLoginScreen() {
  const router = useRouter();
  const auth = getFirebaseAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Enter email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace('/(tabs)/admin');
    } catch (err: any) {
      setError(err?.message ?? 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.box}>
        <Text style={styles.title}>Admin Login</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          placeholder="admin@example.com"
          placeholderTextColor="#666"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor="#666"
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>{loading ? 'Logging in…' : 'Login'}</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  box: {
    padding: 20,
    marginTop: 40,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderColor: Colors.accent,
    borderWidth: 1,
    gap: 12,
  },
  title: {
    color: Colors.text.primary,
    fontWeight: '800',
    fontSize: 20,
    marginBottom: 10,
  },
  label: {
    color: Colors.text.primary,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: 12,
    padding: 10,
    backgroundColor: Colors.palette.cardBackground,
    color: Colors.text.primary,
  },
  button: {
    backgroundColor: Colors.accent,
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#0D1440',
    fontWeight: '800',
    fontSize: 16,
  },
  error: {
    color: '#ff7373',
    fontSize: 12,
  },
});
