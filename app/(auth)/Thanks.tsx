import { Image, Pressable, ScrollView, Text, View } from "react-native";
import Toast from "react-native-toast-message";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ThanksProps {
  email: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Thanks({ email }: ThanksProps) {
  return (
      <ScrollView
        className="flex-1 bg-white px-6"
        contentContainerStyle={{
          paddingBottom: 24,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View className="items-center mb-4">
          <Image
            source={require("../../assets/images/armIT_logo.png")}
            className="w-[280px] h-[100px]"
            resizeMode="contain"
          />
        </View>

        {/* Heading */}
        <View className="mb-2 mt-4">
          <Text className="text-[20px] font-semibold text-[#4A5568]">
            Thank you for your Signing Up!
          </Text>
        </View>

        {/* Sub text */}
        <Text className="text-[15px] text-[#6b7280] mt-1">
          Check your email or text message to complete your new account activation
        </Text>

        {/* Email display */}
        {email ? (
          <View className="mt-4 bg-[#F2F7FF] rounded-xl px-4 py-3">
            <Text className="text-[#2B6CB0] text-[14px] font-semibold text-center">
              {email}
            </Text>
          </View>
        ) : null}

        {/* DONE Button */}
        <View className="items-center mt-14">
          <Pressable
            className="bg-white border-2 h-14 w-32 border-[#2B6CB0] rounded-lg justify-center items-center"
            onPress={() => {
              Toast.show({
                type: "success",
                text1: "Registration completed!",
                position: "top",
                visibilityTime: 3000,
              });
            }}
          >
            <Text className="text-[#2B6CB0] text-[14px] font-bold tracking-widest">
              DONE
            </Text>
          </Pressable>
        </View>

        {/* Terms */}
        <View className="mt-4 px-4">
          <Text className="text-[#6b7280] text-[13px] text-center">
            By pressing <Text className="font-semibold">DONE</Text> you accept
            our{" "}
            <Text className="font-semibold text-[#2B6CB0]">Terms of Service</Text>
          </Text>
        </View>

        {/* Slogan */}
        <View className="items-center mt-20 mb-4">
          <Text className="text-[#2B6CB0] text-[18px] font-bold tracking-wide">
            THE SMART WAY TO MONITOR
          </Text>
          <Text className="text-[#CBD5E0] text-[16px] font-semibold tracking-wide mt-1">
            EVERYTHING THAT MATTERS
          </Text>
        </View>
      </ScrollView>
  );
}
