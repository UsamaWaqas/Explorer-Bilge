import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import { WebView } from "react-native-webview";

export default function Checkout() {
  const { url } = useLocalSearchParams<{ url: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const hasRedirected = useRef(false);

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>

      {/* Header */}
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#E2E8F0"
      }}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#374151" />
        </Pressable>
        <Text style={{
          flex: 1,
          textAlign: "center",
          fontWeight: "bold",
          color: "#374151",
          fontSize: 16
        }}>
          Secure Checkout
        </Text>
        <Ionicons name="lock-closed" size={18} color="#10B981" />
      </View>

      {/* Loading */}
      {loading && (
        <View style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: [{ translateX: -20 }, { translateY: -20 }],
          zIndex: 10
        }}>
          <ActivityIndicator size="large" color="#2B6CB0" />
        </View>
      )}

      {/* WebView */}
      <WebView
        source={{ uri: url }}
        style={{ flex: 1 }}
        onLoadEnd={() => setLoading(false)}
        onLoadStart={() => setLoading(true)}
        onShouldStartLoadWithRequest={(request) => {
          console.log("🔗 URL:", request.url);

          if (request.url.includes("api.example.com/success")) {
            if (!hasRedirected.current) {
              hasRedirected.current = true;
              setTimeout(() => { 
                Toast.show({
                  type: "success",
                  text1: "Payment Successful! 🎉",
                  text2: "Your device has been activated.",
                  position: "top",
                  visibilityTime: 3000,
                });
                router.replace("/(auth)/device-activation/success");
              }, 100);
            }
            return false; 
          }

          return true; 
        }}
      />
    </View>
  );
}