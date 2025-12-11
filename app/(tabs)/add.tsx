import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import ScreenContainer from '@/components/ScreenContainer';
import SubmissionForm from '@/components/SubmissionForm';
import { trackEvent } from '@/services/analytics';
import { Colors } from '@/theme';

export default function AddBusinessScreen() {
  const router = useRouter();
  const [infoVisible, setInfoVisible] = useState(false);

  // Automatically open modal on first load
  useEffect(() => {
    trackEvent('screen_view', { screen: 'AddBusiness' });
    setTimeout(() => setInfoVisible(true), 150); // small delay to prevent UI jump
  }, []);

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.kicker}>Partner with us</Text>
          <Text style={styles.title}>Submit a Business</Text>
          <Text style={styles.subtitle}>
            Share your Native-owned business. We'll verify ownership, add you to the directory, 
            and spotlight you in browse and map.
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <Text style={styles.metaText}>Free listing</Text>
            </View>
            <View style={styles.metaPill}>
              <Text style={styles.metaText}>Verification required</Text>
            </View>
          </View>

          {/* Manual open button remains */}
          <Pressable onPress={() => setInfoVisible(true)} style={styles.infoButton}>
            <Text style={styles.infoButtonText}>Who Can Be Listed?</Text>
          </Pressable>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Business details</Text>
          <SubmissionForm />

          <Pressable onPress={() => router.push('/admin/login')} hitSlop={10}>
            <Text style={styles.adminLoginText}>Admin login</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* INFORMATION MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={infoVisible}
        onRequestClose={() => setInfoVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            
            {/* Close button */}
            <Pressable onPress={() => setInfoVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </Pressable>

            {/* SCROLLABLE CONTENT */}
            <ScrollView contentContainerStyle={styles.modalContent}>
              
              <Text style={styles.modalTitle}>Who Can Be Listed?</Text>

              <Text style={styles.modalText}>
                Tribal Goods Trail welcomes listings from Native-owned businesses of all kinds. 
                Whether you are officially registered or a community-based seller, there is space for you here.
              </Text>

              <Text style={styles.modalText}>
                Examples of who can be listed:
              </Text>

              <Text style={styles.modalText}>
                • your brother selling fresh salmon{"\n"}
                • your auntie selling beadwork{"\n"}
                • your uncle making homemade jerky{"\n"}
                • your cousin selling firewood{"\n"}
                • your grandpa drying salmon{"\n"}
                • your Kuthla gathering huckleberries{"\n"}
                • independent Native artists and crafters{"\n"}
                • powwow vendors and seasonal sellers{"\n"}
                • LLCs, nonprofits, and Tribal enterprises{"\n"}
                • community sellers operating without formal registration
              </Text>

              <Text style={styles.modalText}>
                If you’re Native-owned, you’re welcome in our directory.
              </Text>

            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
    gap: 12,
  },
  hero: {
    backgroundColor: Colors.palette.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.palette.divider,
    gap: 8,
  },
  kicker: {
    color: Colors.text.secondary,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    color: Colors.text.primary,
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  metaPill: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: Colors.palette.surfaceBackground,
    borderWidth: 1,
    borderColor: Colors.palette.divider,
  },
  metaText: {
    color: Colors.text.primary,
    fontWeight: '800',
    fontSize: 12,
  },
  infoButton: {
    backgroundColor: Colors.palette.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  infoButtonText: {
    color: Colors.text.inverse,
    fontWeight: '700',
    fontSize: 14,
  },
  formCard: {
    backgroundColor: Colors.palette.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.palette.divider,
    gap: 8,
  },
  formTitle: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  adminLoginText: {
    color: Colors.text.secondary,
    textDecorationLine: 'underline',
    fontSize: 12,
    marginTop: 4,
  },

  /* MODAL STYLES */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: Colors.palette.cardBackground,
    borderRadius: 12,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 20,
    maxHeight: '80%',

    borderWidth: 1,
    borderColor: Colors.palette.divider,
    shadowColor: Colors.palette.shadowSoft,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 6,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 4,
    marginBottom: 4,
  },
  closeButtonText: {
    fontSize: 28,
    color: Colors.text.primary,
    fontWeight: '600',
    marginTop: -6,
  },
  modalContent: {
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  modalText: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: 12,
  },
});
