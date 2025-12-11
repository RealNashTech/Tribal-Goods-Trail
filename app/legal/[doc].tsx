import { useLocalSearchParams, useRouter } from "expo-router";
import { WebView } from "react-native-webview";
import { View, ActivityIndicator, StyleSheet, Platform } from "react-native";
import ScreenContainer from "@/components/ScreenContainer";
import { Colors } from "@/theme";

export default function LegalWebViewScreen() {
  const { doc } = useLocalSearchParams();
  const router = useRouter();

  const legalUrls: Record<string, string> = {
    privacy: "https://realnashtech.github.io/Tribal-Goods-Trail/legal/privacy.html",
    terms: "https://realnashtech.github.io/Tribal-Goods-Trail/legal/terms.html",
    submission: "https://realnashtech.github.io/Tribal-Goods-Trail/legal/submission.html",
    moderation: "https://realnashtech.github.io/Tribal-Goods-Trail/legal/moderation.html",
    "data-security": "https://realnashtech.github.io/Tribal-Goods-Trail/legal/data-security.html",
    community: "https://realnashtech.github.io/Tribal-Goods-Trail/legal/community.html",
    disclaimer: "https://realnashtech.github.io/Tribal-Goods-Trail/legal/disclaimer.html",
  };

  const url = legalUrls[doc as string];

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <WebView
          source={{ uri: url }}
          startInLoadingState
          renderLoading={() => (
            <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: 20 }} />
          )}
          style={styles.webview}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  webview: {
    flex: 1,
  },
});
