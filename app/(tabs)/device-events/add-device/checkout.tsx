import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { WebView } from "react-native-webview";


const SUCCESS_URL_KEYWORD = "success";

export default function AddDeviceCheckout() {
  const { url, deviceIds } = useLocalSearchParams<{
    url: string;
    deviceIds: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const hasRedirected = useRef(false);

  const handleSuccess = () => {
    if (hasRedirected.current) return;
    hasRedirected.current = true;

    Toast.show({
      type: "success",
      text1: "Payment Successful! 🎉",
      text2: "Your device has been activated.",
      position: "top",
      visibilityTime: 3000,
    });

   
    router.replace({
      pathname: "/(tabs)/device-events/add-device/success" as any,
    });
  };

  if (!url) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text className="text-red-500 font-bold text-lg mt-3 text-center">
          No checkout URL provided
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-6 border border-gray-300 rounded-xl px-6 py-3"
        >
          <Text className="text-[#2B6CB0] font-bold">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: 12,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          borderBottomWidth: 1,
          borderBottomColor: "#E2E8F0",
          backgroundColor: "white",
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={24} color="#374151" />
        </Pressable>

        <Text
          style={{
            flex: 1,
            textAlign: "center",
            fontWeight: "bold",
            color: "#374151",
            fontSize: 16,
          }}
        >
          Secure Checkout
        </Text>

        <Ionicons name="lock-closed" size={18} color="#10B981" />
      </View>

      {/* Loading overlay */}
      {loading && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            backgroundColor: "rgba(255,255,255,0.85)",
          }}
        >
          <ActivityIndicator size="large" color="#2B6CB0" />
          <Text style={{ color: "#718096", marginTop: 12, fontSize: 14 }}>
            Loading secure payment…
          </Text>
        </View>
      )}

      <WebView
        source={{ uri: url }}
        style={{ flex: 1 }}
        onLoadEnd={() => setLoading(false)}
        onLoadStart={() => setLoading(true)}
        onShouldStartLoadWithRequest={(request) => {
          console.log("🔗 Checkout URL:", request.url);

       
          if (request.url.includes(SUCCESS_URL_KEYWORD)) {
            handleSuccess();
            return false;
          }

          return true; 
        }}
        
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState={false}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
      />
    </View>
  );
}