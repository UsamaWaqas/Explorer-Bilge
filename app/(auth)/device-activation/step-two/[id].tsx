import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import * as WebBrowser from 'expo-web-browser';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { post } from "../../../../api/apiHelper";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Plan {
  id: string;
  name: string;
  plan_code: string;
  plan_family: string;
  amount: string;
  billing_interval: string;
  device_limit: number;
  billing_type: string;
  activation_type: string;
}

// ─── Palette (matches web PlanCard) ──────────────────────────────────────────

const PALETTE_POOL = [
  { iconName: "shield-checkmark-outline", iconColor: "#2563EB", iconBg: "#EFF6FF", badgeColor: "#1D4ED8", badgeBg: "#EFF6FF", familyColor: "#B45309", familyBg: "#FFFBEB" },
  { iconName: "star-outline",             iconColor: "#059669", iconBg: "#ECFDF5", badgeColor: "#047857", badgeBg: "#ECFDF5", familyColor: "#6D28D9", familyBg: "#F5F3FF" },
  { iconName: "flash-outline",            iconColor: "#7C3AED", iconBg: "#F5F3FF", badgeColor: "#6D28D9", badgeBg: "#F5F3FF", familyColor: "#047857", familyBg: "#ECFDF5" },
  { iconName: "trophy-outline",           iconColor: "#D97706", iconBg: "#FFFBEB", badgeColor: "#B45309", badgeBg: "#FFFBEB", familyColor: "#1D4ED8", familyBg: "#EFF6FF" },
];

const PLAN_CONFIG: Record<string, any> = {
  guardian: { ...PALETTE_POOL[0] },
  command:  { ...PALETTE_POOL[1] },
};

function getPalette(plan_code: string, index: number) {
  return PLAN_CONFIG[plan_code] ?? PALETTE_POOL[index % PALETTE_POOL.length];
}

function getFeatures(plan: Plan) {
  return [
    plan.device_limit === -1 ? "Unlimited devices" : `Up to ${plan.device_limit} devices`,
    plan.billing_type === "one_time" ? "One-time payment" : "Recurring billing",
    plan.activation_type === "single" ? "Single activation" : "Batch activation",
    plan.plan_family === "operator" ? "Operator-level entitlement" : "Consumer entitlement",
  ];
}

// ─── Plan Card ────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  index,
  selected,
  onSelect,
}: {
  plan: Plan;
  index: number;
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const cfg = getPalette(plan.plan_code, index);
  const active = selected === plan.id;
  const features = getFeatures(plan);

  return (
    <Pressable
      onPress={() => onSelect(plan.id)}
      className={`bg-white rounded-xl border shadow-sm p-5 mb-4 ${
        active ? "border-[#2B6CB0]" : "border-slate-200"
      }`}
      style={active ? { shadowColor: "#2B6CB0", shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 } : {}}
    >
      {/* Radio + Icon Row */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-3">
          <View
            className="w-11 h-11 rounded-xl items-center justify-center"
            style={{ backgroundColor: cfg.iconBg }}
          >
            <Ionicons name={cfg.iconName as any} size={20} color={cfg.iconColor} />
          </View>
          <View>
            <Text className="font-semibold text-[#374151] text-base">{plan.name}</Text>
            <View
              className="mt-0.5 px-2 py-0.5 rounded-full self-start"
              style={{ backgroundColor: cfg.badgeBg }}
            >
              <Text style={{ color: cfg.badgeColor }} className="text-[10px] font-bold uppercase tracking-wider">
                {plan.plan_code}
              </Text>
            </View>
          </View>
        </View>

        {/* Radio indicator */}
        {active ? (
          <View className="w-6 h-6 rounded-full bg-[#2B6CB0] items-center justify-center">
            <Ionicons name="checkmark" size={13} color="white" />
          </View>
        ) : (
          <View className="w-6 h-6 rounded-full border-2 border-slate-300" />
        )}
      </View>

      {/* Plan family badge */}
      <View
        className="self-start px-3 py-1 rounded-full mb-3"
        style={{ backgroundColor: cfg.familyBg }}
      >
        <Text style={{ color: cfg.familyColor }} className="text-[11px] font-bold uppercase tracking-wide">
          {plan.plan_family}
        </Text>
      </View>

      {/* Price */}
      <View className="flex-row items-baseline gap-1 mb-3">
        <Text className="text-3xl font-bold text-[#374151]">
          ${parseFloat(plan.amount).toFixed(0)}
        </Text>
        <Text className="text-sm text-[#9CA3AF]">/ {plan.billing_interval}</Text>
      </View>

      <View className="border-t border-slate-100 mb-3" />

      {/* Features */}
      <View className="gap-2">
        {features.map((feat, i) => (
          <View key={i} className="flex-row items-center gap-2">
            <Ionicons name="checkmark-circle" size={15} color="#10B981" />
            <Text className="text-sm text-[#6B7280] flex-1">{feat}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PlanCardSkeleton() {
  return (
    <View className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
      <View className="flex-row items-center gap-3 mb-3">
        <View className="w-11 h-11 rounded-xl bg-slate-200" />
        <View className="flex-1 gap-2">
          <View className="h-4 w-32 bg-slate-200 rounded" />
          <View className="h-3 w-20 bg-slate-100 rounded" />
        </View>
        <View className="w-6 h-6 rounded-full bg-slate-200" />
      </View>
      <View className="h-6 w-24 bg-slate-100 rounded-full mb-3" />
      <View className="h-8 w-20 bg-slate-200 rounded mb-3" />
      <View className="border-t border-slate-100 mb-3" />
      <View className="gap-2">
        {[1, 2, 3, 4].map((i) => (
          <View key={i} className="h-3 bg-slate-100 rounded" style={{ width: `${90 - i * 8}%` }} />
        ))}
      </View>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StepTwo() {
  const router = useRouter();
  const { deviceIds, userId } = useLocalSearchParams<{ deviceIds: string; userId: string }>();

  const parsedDeviceIds: string[] = deviceIds ? JSON.parse(deviceIds) : [];

  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isContinuing, setIsContinuing] = useState(false);

  // ─── Fetch Plans ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!parsedDeviceIds.length) return;
    (async () => {
      try {
        const response = await post(
          "/api/products-with-plans-users",
          { deviceIds: parsedDeviceIds },
          {},
          false
        );

        if (response?.isOffline) {
          Toast.show({ type: "info", text1: "Offline", text2: "No internet connection", position: "top", visibilityTime: 3000 });
          setIsError(true);
          setErrorMessage("No internet connection.");
          return;
        }

        if (!response?.success) {
          throw new Error(response?.message || "Failed to load plans");
        }

        setPlans(response?.plans ?? []);
      } catch (err: any) {
        setIsError(true);
        setErrorMessage(err?.message || "We couldn't fetch available plans.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // ─── Continue ───────────────────────────────────────────────────────────

  const handleContinue = async () => {
    if (!selectedPlan) {
      Toast.show({ type: "error", text1: "Select a plan", text2: "Please select a valid plan", position: "top", visibilityTime: 3000 });
      return;
    }

    setIsContinuing(true);
    try {
      const response = await post(
        "/api/process-payment",
        {
          device_ids: parsedDeviceIds,
          user_id: userId,
          selected_plan_id: selectedPlan,
        },
        {},
        false
      );

      if (response?.isOffline) {
        Toast.show({ type: "info", text1: "Offline", text2: "No internet connection", position: "top", visibilityTime: 3000 });
        return;
      }

   router.push({
  pathname: "/(auth)/device-activation/checkout",
  params: { url: response.checkout_url }
});
  return;

      Toast.show({ type: "error", text1: "Error", text2: response?.message || "Something went wrong", position: "top", visibilityTime: 3000 });

    } catch {
      Toast.show({ type: "error", text1: "Error", text2: "Failed to process payment", position: "top", visibilityTime: 3000 });
    } finally {
      setIsContinuing(false);
    }
  };

  const selectedPlanName = plans.find((p) => p.id === selectedPlan)?.name;

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ paddingBottom: 32 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Logo */}
      <View className="items-center pt-4 pb-2 px-6">
        <Image
          source={require("../../../../assets/images/armIT_logo.png")}
          style={{ width: 280, height: 100 }}
          resizeMode="contain"
        />
      </View>

      {/* Head Card */}
      <View className="mx-4 mb-4 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <View className="h-1.5 bg-gray-200">
          <View className="h-1.5 bg-[#2B6CB0]" style={{ width: "66.6%" }} />
        </View>

        <View className="px-5 py-4 flex-row justify-between items-start">
          <View className="flex-1 pr-4">
            <Text className="text-[11px] text-[#2B6CB0] font-semibold uppercase tracking-widest mb-1">
              Step 2 of 3
            </Text>
            <Text className="text-lg font-bold text-[#374151] mb-1">Plan Selection</Text>
            <Text className="text-xs font-semibold text-[#6B7280] mb-1">Choose Your Plan</Text>
            <Text className="text-xs text-[#9CA3AF] leading-4">
              Select the subscription that best fits your needs.
            </Text>
          </View>

          <View className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-w-[80px] items-center">
            <Text className="text-[10px] text-[#9CA3AF] font-medium mb-0.5">Available Plans</Text>
            <Text className="text-sm font-bold text-[#374151]">
              {isLoading ? "…" : `${plans.length} Options`}
            </Text>
          </View>
        </View>
      </View>

      {/* Plans */}
      <View className="px-4">
        {isLoading && (
          <>
            <PlanCardSkeleton />
            <PlanCardSkeleton />
            <PlanCardSkeleton />
          </>
        )}

        {isError && (
          <View className="bg-white border border-red-200 rounded-2xl shadow-sm p-5 flex-row items-start justify-between gap-4 mt-2">
            <View className="flex-row items-start gap-3 flex-1">
              <View className="w-11 h-11 rounded-xl bg-red-50 items-center justify-center shrink-0">
                <Ionicons name="alert-circle-outline" size={22} color="#EF4444" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-red-500 text-sm">Unable to load plans</Text>
                <Text className="text-xs text-red-400 mt-1 leading-4">
                  {errorMessage || "We couldn't fetch available plans."} Please return to the previous page to re-select your bundle preferences.
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => router.back()}
              className="border border-slate-300 rounded-lg px-3 h-9 items-center justify-center"
            >
              <Text className="text-[#2B6CB0] font-bold text-sm">Go Back</Text>
            </Pressable>
          </View>
        )}

        {!isLoading && !isError && plans.map((plan, i) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            index={i}
            selected={selectedPlan}
            onSelect={setSelectedPlan}
          />
        ))}
      </View>

      {/* Footer */}
      {!isLoading && !isError && (
        <View className="mx-4 mt-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex-row items-center justify-between">
          <View className="flex-1 pr-4">
            <Text className="font-semibold text-[#6B7280] text-sm">Ready to continue?</Text>
            {selectedPlanName ? (
              <Text className="text-xs text-[#2B6CB0] font-medium mt-0.5">{selectedPlanName} selected</Text>
            ) : (
              <Text className="text-xs text-[#9CA3AF] mt-0.5">Your selected plan will be used in billing setup.</Text>
            )}
          </View>

          <Pressable
            onPress={handleContinue}
            disabled={isContinuing}
            className="bg-white border border-[#6B7280] h-10 w-32 rounded-lg items-center justify-center"
          >
            {isContinuing ? (
              <ActivityIndicator size="small" color="#2B6CB0" />
            ) : (
              <Text className="text-[#2B6CB0] font-bold text-sm">Save & Continue</Text>
            )}
          </Pressable>
        </View>
      )}

      {/* Slogan */}
      <View className="items-center mt-8 mb-4">
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