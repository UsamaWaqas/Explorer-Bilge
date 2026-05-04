import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { get, post } from "../../api/apiHelper";
import AnimatedSwitch from "../../components/Switch"; // update path as per your project

// ─── Types ───────────────────────────────────────────────────────────────────

interface GroupedAttribute {
  id: number;
  xup_id: number;
  send_notification: boolean;
}

interface AlertItem {
  id: number;
  isProduct: boolean;
  name: string;
  isSelected: boolean;
  productId: number;
  xup_id?: number;
  groupedAttributes?: GroupedAttribute[];
}

interface ApiAttribute {
  id: number;
  description: string;
  send_notification: boolean;
  xup: { id: number };
}

interface ApiProduct {
  id: number;
  name: string;
  notifie: {
    attributes: ApiAttribute[];
  };
}

interface ApiResponse {
  success: boolean;
  data: ApiProduct[];
  message?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

function ConfigureAlerts() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [productData, setProductData] = useState<AlertItem[]>([]);
  const [apiResponse, setApiResponse] = useState<AlertItem[]>([]);

  const {
    data,
    isError,
    refetch,
    isLoading: isNotifiAlertsConfigLoading,
    isRefetching,
  } = useQuery<ApiResponse>({
    queryKey: ["notifiAlertsConfiguration"],
    queryFn: async () => {
      const response = await get("/api/user-products");
      return response;
    },
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (data?.success) {
      const formattedAlerts: AlertItem[] = [];

      data?.data?.forEach((product: ApiProduct) => {
        // push product row
        formattedAlerts.push({
          id: product?.id,
          isProduct: true,
          name: product?.name,
          isSelected: product?.notifie?.attributes?.some(
            (alert: ApiAttribute) => alert?.send_notification
          ),
          productId: product?.id,
        });

        // group attributes by description
        const grouped: Record<string, ApiAttribute[]> = {};
        product?.notifie?.attributes?.forEach((alert: ApiAttribute) => {
          if (!grouped[alert.description]) {
            grouped[alert.description] = [];
          }
          grouped[alert.description].push(alert);
        });

        // push one representative for each description
        Object.keys(grouped).forEach((desc: string) => {
          const alerts = grouped[desc];
          formattedAlerts.push({
            id: alerts[0].id,
            xup_id: alerts[0].xup.id,
            isProduct: false,
            name: desc,
            isSelected: alerts.some((a: ApiAttribute) => a.send_notification),
            productId: product.id,
            groupedAttributes: alerts.map((a: ApiAttribute) => ({
              id: a.id,
              xup_id: a.xup.id,
              send_notification: a.send_notification,
            })),
          });
        });
      });

      setProductData(formattedAlerts);
      setApiResponse(JSON.parse(JSON.stringify(formattedAlerts)));
    }
  }, [data]);

  const toggleSwitch = (toggledItem: AlertItem, status: boolean): void => {
    if (toggledItem?.isProduct) {
      setProductData((prevData: AlertItem[]) =>
        prevData.map((item: AlertItem) => {
          if (item?.productId === toggledItem.id) {
            if (item?.groupedAttributes) {
              return {
                ...item,
                isSelected: status,
                groupedAttributes: item.groupedAttributes.map(
                  (ga: GroupedAttribute) => ({
                    ...ga,
                    send_notification: status,
                  })
                ),
              };
            } else {
              return { ...item, isSelected: status };
            }
          } else {
            return item;
          }
        })
      );
    } else {
      setProductData((prevData: AlertItem[]) =>
        prevData.map((item: AlertItem) => {
          if (item.id === toggledItem.id && item?.groupedAttributes) {
            return {
              ...item,
              isSelected: status,
              groupedAttributes: item.groupedAttributes.map(
                (ga: GroupedAttribute) => ({
                  ...ga,
                  send_notification: status,
                })
              ),
            };
          }
          return item;
        })
      );
    }
  };

  async function handleSave(): Promise<void> {
    try {
      setIsLoading(true);
      const xups: {
        product_id: number;
        attribute_id: number;
        xup_id: number;
        status: boolean;
      }[] = [];

      productData.forEach((currentItem: AlertItem) => {
        const originalItem = apiResponse.find(
          (apiItem: AlertItem) =>
            apiItem.id == currentItem.id &&
            apiItem.productId == currentItem.productId &&
            apiItem.isProduct == currentItem.isProduct
        );

        if (
          !currentItem.isProduct &&
          originalItem &&
          currentItem.isSelected != originalItem.isSelected
        ) {
          currentItem.groupedAttributes?.forEach((ga: GroupedAttribute) => {
            xups.push({
              product_id: currentItem.productId,
              attribute_id: ga.id,
              xup_id: ga.xup_id,
              status: ga.send_notification,
            });
          });
        }
      });

      if (xups.length == 0) {
        Toast.show({
          type: "info",
          text1: "Please change any toggle before saving",
        });
        return;
      }

      const payload = { type: "notification", xups };

      const res = await post("/api/attributes/toggle-visibility", payload);

      if (res?.success) {
        refetch();
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View className="flex-1 gap-3 mb-16">
      {/* Header */}
      {/* <View className="flex-row items-center justify-between m-3">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="rounded-full flex p-2 justify-center items-center bg-[#E3EFFF]"
          >
            <Ionicons name="arrow-back" size={12} color="#2C64B3" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-[#313131] ml-3">
            Configure Notifi Alerts
          </Text>
        </View>
      </View> */}

      {/* Sensor Box */}
      <View className="rounded-t-3xl p-3 flex flex-col mb-20">
        <View className="flex-row justify-between items-center mt-3">
          <Text className="text-[#2C64B3] text-xl font-bold">Edit Alerts</Text>
          <View className="flex-row items-center gap-x-3">
            {(isNotifiAlertsConfigLoading || isRefetching) ? (
              <ActivityIndicator size="small" color="#2C64B3" />
            ) : null}
            <TouchableOpacity
              className={`${
                isLoading ? "bg-[#2C64B3]" : "bg-[#2C64B3]"
              } py-2 w-36 rounded-lg items-center`}
              onPress={handleSave}
              disabled={isLoading || isRefetching || isNotifiAlertsConfigLoading}
            >
              <Text className="text-white">
                {isLoading ? "Saving..." : "Save Changes"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          className="max-w-full mt-5 border border-gray-200 rounded-lg overflow-hidden shadow-sm"
          showsVerticalScrollIndicator={false}
        >
          <View className="bg-white">
            {productData.map((item: AlertItem, index: number) => {
              const isDisabled =
                !item.isProduct &&
                !productData.filter(
                  (i: AlertItem) =>
                    i.productId == item.productId && i.isProduct
                )[0]?.isSelected;

              return (
                <View
                  key={index}
                  className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200"
                >
                  <Text
                    className={`text-sm font-bold ${
                      item.isProduct === true
                        ? "text-[#2C64B3]"
                        : "text-gray-500"
                    }`}
                  >
                    {item.name}
                  </Text>
                  <View className="flex-row items-center">
                    <AnimatedSwitch
                      value={item.isSelected}
                      onValueChange={() =>
                        !isDisabled && toggleSwitch(item, !item.isSelected)
                      }
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <Toast />
    </View>
  );
}

export default ConfigureAlerts;