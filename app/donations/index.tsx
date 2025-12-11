import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import WebView from 'react-native-webview';

import ScreenContainer from '@/components/ScreenContainer';
import { Colors } from '@/theme';

const DONATION_TIERS = [
  { amount: 1, url: 'https://buy.stripe.com/aFa00lal74Nh0X3fo3cjS00', label: '$1' },
  { amount: 5, url: 'https://buy.stripe.com/9B600lal71B59tzejZcjS01', label: '$5' },
  { amount: 10, url: 'https://buy.stripe.com/4gM5kF0Kx6Vp2174JpcjS02', label: '$10' },
  { amount: 20, url: 'https://buy.stripe.com/00wcN7eBn6Vp0X3dfVcjS03', label: '$20' },
  { amount: 50, url: 'https://buy.stripe.com/dRm5kF0KxfrVaxD7VBcjS04', label: '$50' },
  { amount: 100, url: 'https://buy.stripe.com/5kQ14p50N0x1axD6RxcjS05', label: '$100' },
];

export default function DonationsScreen() {
  const router = useRouter();
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [webViewLoading, setWebViewLoading] = useState(false);
  const successUrl = 'tribalgoodstrail://donationSuccess';

  const handleDonate = (url: string) => {
    setCheckoutUrl(url);
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.title}>About & Support</Text>
          <Text style={styles.body}>
            Your support helps us grow this project across the country.
          </Text>
        </View>

        <View style={styles.tiersCard}>
          <Text style={styles.sectionTitle}>Choose an amount</Text>
          <View style={styles.tierGrid}>
            {DONATION_TIERS.map((tier) => (
              <Pressable
                key={tier.amount}
                style={({ pressed }) => [styles.tierButton, pressed && styles.tierButtonPressed]}
                onPress={() => handleDonate(tier.url)}
              >
                <Text style={styles.tierLabel}>{tier.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Why this exists</Text>
          <Text style={styles.body}>
            This project began because of my long history with the Confederated Tribes of Warm Springs. My wife and children come from Warm Springs, and I spent 15 years living and working within the community. Tribal Goods Trail is my way of honoring the people and the place that shaped so much of my life.
          </Text>
          <Text style={styles.body}>
            My path hasn’t been perfect, but this project reflects my commitment to growth, accountability, and giving back. I built Tribal Goods Trail to support Native-owned businesses with respect and visibility.
          </Text>

          <Pressable
            onPress={() =>
              Linking.openURL(
                'https://realnashtech.github.io/TribalGoodsTrail/legal/moderation.html'
              )
            }
          >
            <Text style={styles.link}>Moderation Policy</Text>
          </Pressable>

          <Pressable
            onPress={() =>
              Linking.openURL(
                'https://realnashtech.github.io/TribalGoodsTrail/legal/data-security.html'
              )
            }
          >
            <Text style={styles.link}>Data Security Policy</Text>
          </Pressable>

          <Pressable
            onPress={() =>
              Linking.openURL(
                'https://realnashtech.github.io/TribalGoodsTrail/legal/community.html'
              )
            }
          >
            <Text style={styles.link}>Community Guidelines</Text>
          </Pressable>

          <Pressable
            onPress={() =>
              Linking.openURL(
                'https://realnashtech.github.io/TribalGoodsTrail/legal/privacy.html'
              )
            }
          >
            <Text style={styles.link}>Privacy Policy</Text>
          </Pressable>

          <Pressable
            onPress={() =>
              Linking.openURL(
                'https://realnashtech.github.io/TribalGoodsTrail/legal/terms.html'
              )
            }
          >
            <Text style={styles.link}>Terms of Service</Text>
          </Pressable>

          <Pressable
            onPress={() =>
              Linking.openURL(
                'https://realnashtech.github.io/TribalGoodsTrail/legal/submission.html'
              )
            }
          >
            <Text style={styles.link}>Submission Standards</Text>
          </Pressable>

          <Pressable
            onPress={() =>
              Linking.openURL(
                'https://realnashtech.github.io/TribalGoodsTrail/legal/disclaimer.html'
              )
            }
          >
            <Text style={styles.link}>Legal Disclaimer</Text>
          </Pressable>

          <Text style={styles.lastUpdated}>Last updated: Dec 2025</Text>
        </View>
      </ScrollView>

      {checkoutUrl ? (
        <Modal
          transparent
          visible
          animationType="slide"
          onRequestClose={() => {
            setCheckoutUrl(null);
            setWebViewLoading(false);
          }}
        >
          <View style={styles.webviewOverlay}>
            <View style={styles.webviewCard}>
              <Pressable
                style={styles.webviewClose}
                onPress={() => {
                  setCheckoutUrl(null);
                  setWebViewLoading(false);
                }}
              >
                <Text style={styles.webviewCloseLabel}>Close</Text>
              </Pressable>
              <WebView
                source={{ uri: checkoutUrl }}
                startInLoadingState
                onLoadStart={() => setWebViewLoading(true)}
                onLoadEnd={() => setWebViewLoading(false)}
                onNavigationStateChange={(event) => {
                  if (event.url.includes('donationSuccess') || event.url.startsWith(successUrl)) {
                    setCheckoutUrl(null);
                    setWebViewLoading(false);
                    router.replace('/donate/success');
                  } else if (event.url.includes('cancel')) {
                    setCheckoutUrl(null);
                    setWebViewLoading(false);
                  }
                }}
              />
              {webViewLoading ? (
                <View style={styles.webviewLoading}>
                  <ActivityIndicator color={Colors.accent} />
                </View>
              ) : null}
            </View>
          </View>
        </Modal>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: Colors.palette.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.palette.divider,
    gap: 8,
  },
  title: {
    color: Colors.text.primary,
    fontSize: 24,
    fontWeight: '800',
  },
  body: {
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  tiersCard: {
    backgroundColor: Colors.palette.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.palette.divider,
    gap: 12,
  },
  sectionTitle: {
    color: Colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  tierGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tierButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: Colors.palette.primary,
  },
  tierButtonPressed: {
    opacity: 0.85,
  },
  tierLabel: {
    color: Colors.text.inverse,
    fontWeight: '800',
    fontSize: 16,
  },
  noteCard: {
    backgroundColor: Colors.palette.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.palette.divider,
    gap: 8,
  },
  noteTitle: {
    color: Colors.text.primary,
    fontWeight: '700',
    fontSize: 16,
  },
  webviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 12,
  },
  webviewCard: {
    flex: 1,
    backgroundColor: Colors.palette.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.palette.divider,
    overflow: 'hidden',
  },
  webviewClose: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: Colors.palette.divider,
    backgroundColor: Colors.palette.cardBackground,
  },
  webviewCloseLabel: {
    color: Colors.text.primary,
    fontWeight: '700',
  },
  webviewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  link: {
    color: Colors.palette.primary,
    fontWeight: '700',
    fontSize: 14,
    marginTop: 6,
    textDecorationLine: 'underline',
  },
  lastUpdated: {
    color: Colors.text.meta,
    fontSize: 12,
    marginTop: 10,
  },
});
