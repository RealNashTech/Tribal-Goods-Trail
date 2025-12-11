import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import ScreenContainer from '@/components/ScreenContainer';
import { Colors } from '@/theme';

export default function AboutTabScreen() {
  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>

          <Text
            style={{
              fontSize: 24,
              fontWeight: 'bold',
              marginBottom: 16,
              color: Colors.text.primary,
            }}
          >
            About Tribal Goods Trail
          </Text>

          <Text style={styles.body}>
            This project began because of my long history with the Confederated Tribes of Warm Springs.
            My wife and children come from Warm Springs, and I spent 15 years living and working within
            the community. Tribal Goods Trail is my way of honoring the people and the place that shaped
            so much of my life.
          </Text>

          <Text style={styles.body}>
            My path hasn’t been perfect, but this project reflects my commitment to growth, accountability,
            and giving back. I built Tribal Goods Trail to support Native-owned businesses with respect
            and visibility.
          </Text>

          <Text style={styles.body}>
            Tribal Goods Trail is a free map-based directory connecting users with Native-owned businesses,
            artisans, cultural sellers, and community vendors across the Pacific Northwest—and expanding
            nationwide. Listings include licensed businesses, Tribal enterprises, nonprofits, and independent
            community sellers.
          </Text>

          <Text style={styles.body}>
            Whether someone makes beadwork, sells salmon or jerky, gathers huckleberries, runs a storefront,
            or provides local services, they deserve to be seen. Listings are always free, no account is
            required, and the map updates live as submissions are approved.
          </Text>

          <Text style={styles.subtitle}>Legal Policies</Text>

          <Pressable onPress={() => Linking.openURL('https://realnashtech.github.io/TribalGoodsTrail/')}>
            <Text style={styles.link}>Tribal Goods Trail Home</Text>
          </Pressable>

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
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 28,
    paddingHorizontal: 12,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 20,       // UPDATED: full-width spacing
    borderWidth: 1,
    borderColor: Colors.accent,
    gap: 12,
  },
  body: {
    color: Colors.text.secondary,
    lineHeight: 21,
    fontSize: 14,
    marginBottom: 12,
  },
  subtitle: {
    color: Colors.text.primary,
    fontWeight: '800',
    fontSize: 16,
    marginTop: 12,
  },
  link: {
    color: Colors.accent,
    textDecorationLine: 'underline',
    fontSize: 14,
    marginBottom: 6,
  },
  lastUpdated: {
    color: Colors.text.secondary,
    fontSize: 12,
    marginTop: 6,
  },
});
