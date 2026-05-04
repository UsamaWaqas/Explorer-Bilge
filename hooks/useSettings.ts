import { useCallback, useEffect, useState } from "react";
import Toast from "react-native-toast-message";
import { STORAGE_KEYS } from "../constants/keys";
import {
  fetchTilesApi,
  saveToggleVisibility,
} from "../services/settingsService";
import { TileItem } from "../types/settings.types";
import { loadData, saveData } from "../utils/asyncStorage";
import { useNetwork } from "./useNetwork";

export const useSettings = () => {
  const isConnected = useNetwork();

  const [productData, setProductData] = useState<TileItem[]>([]);
  const [apiResponse, setApiResponse] = useState<TileItem[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchTiles = useCallback(async () => {
    try {
      setIsFetching(true);

      if (!isConnected) {
        const cached = await loadData<TileItem[]>(STORAGE_KEYS.SETTINGS, []);
        if (cached.length > 0) {
          setProductData(cached);
          setApiResponse(cached);
        }
        return;
      }

      const data = await fetchTilesApi();
      if (data?.error) return;

      if (data?.success) {
        const formattedTiles: TileItem[] = [];

        data.data.forEach((product: any) => {
          formattedTiles.push({
            id: product.id,
            isProduct: true,
            name: product.name,
            isSelected: product?.notifie?.attributes?.some(
              (tile: any) => tile?.is_visible,
            ),
            productId: product.id,
          });

          const grouped: Record<string, any[]> = {};
          product?.notifie?.attributes?.forEach((tile: any) => {
            if (!grouped[tile.description]) grouped[tile.description] = [];
            grouped[tile.description].push(tile);
          });

          Object.keys(grouped).forEach((desc) => {
            const tiles = grouped[desc];
            formattedTiles.push({
              id: tiles[0].id,
              xup_id: tiles[0].xup.id,
              isProduct: false,
              name: desc,
              isSelected: tiles.some((a) => a.is_visible),
              productId: product.id,
              groupedAttributes: tiles.map((a: any) => ({
                id: a.id,
                xup_id: a.xup.id,
                is_visible: a.is_visible,
              })),
            });
          });
        });

        setProductData(formattedTiles);
        setApiResponse(formattedTiles);
        await saveData<TileItem[]>(STORAGE_KEYS.SETTINGS, formattedTiles);
      }
    } finally {
      setIsFetching(false);
      setIsRefreshing(false);
    }
  }, [isConnected]);

  useEffect(() => {
    fetchTiles();
  }, [fetchTiles]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchTiles();
  };

 
  const toggleSwitch = (toggledItem: TileItem) => {
    const newStatus = !toggledItem.isSelected;

    if (toggledItem.isProduct) {
      setProductData((prev) =>
        prev.map((item) => {
          if (item.productId === toggledItem.id) {
            if (item.groupedAttributes) {
              return {
                ...item,
                isSelected: newStatus,
                groupedAttributes: item.groupedAttributes.map((ga) => ({
                  ...ga,
                  is_visible: newStatus,
                })),
              };
            }
            return { ...item, isSelected: newStatus };
          }
          return item;
        }),
      );
    } else {
      setProductData((prev) =>
        prev.map((item) => {
          if (item.id === toggledItem.id && item.groupedAttributes) {
            return {
              ...item,
              isSelected: newStatus,
              groupedAttributes: item.groupedAttributes.map((ga) => ({
                ...ga,
                is_visible: newStatus,
              })),
            };
          }
          return item;
        }),
      );
    }
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!isConnected) {
      Toast.show({
        type: "error",
        text1: "Offline",
        text2: "Internet nahi hai. Baad mein save karein.",
        position: "top",
        visibilityTime: 3000,
      });
      return;
    }

    try {
      setIsSaving(true);
      const xups: any[] = [];

      productData.forEach((currentItem) => {
        const originalItem = apiResponse.find(
          (apiItem) =>
            apiItem.id === currentItem.id &&
            apiItem.productId === currentItem.productId &&
            apiItem.isProduct === currentItem.isProduct,
        );

        if (
          !currentItem.isProduct &&
          originalItem &&
          currentItem.isSelected !== originalItem.isSelected
        ) {
          currentItem.groupedAttributes?.forEach((ga) => {
            xups.push({
              product_id: currentItem.productId,
              attribute_id: ga.id,
              xup_id: ga.xup_id,
              status: ga.is_visible,
            });
          });
        }
      });

      if (xups.length === 0) {
        Toast.show({
          type: "error",
          text1: "No Changes",
          text2: "Please change any toggle before saving.",
          position: "top",
          visibilityTime: 3000,
        });
        return;
      }

      const res = await saveToggleVisibility(xups);
      if (res?.success) fetchTiles();
    } finally {
      setIsSaving(false);
    }
  };

  // ── Helper ────────────────────────────────────────────────────────────────
  const isAttributeDisabled = (item: TileItem): boolean => {
    if (item.isProduct) return false;
    const parentProduct = productData.find(
      (i) => i.productId === item.productId && i.isProduct,
    );
    return !parentProduct?.isSelected;
  };

  return {
    productData,
    isFetching,
    isSaving,
    isRefreshing,
    isConnected,
    onRefresh,
    toggleSwitch,
    handleSave,
    isAttributeDisabled,
  };
};
