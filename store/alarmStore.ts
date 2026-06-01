import { create } from "zustand";
import { AlarmState, AlarmProduct } from "../types/Alarm.types";

// ─── Comparison Operators ─────────────────────────────────────────────────────

const comparisonOperators: Record<string, (a: number, b: number) => boolean> = {
  "<": (a, b) => a < b,
  ">": (a, b) => a > b,
  "=": (a, b) => a == b,
};

// ─── Alarm Store ──────────────────────────────────────────────────────────────

export const useAlarmStore = create<AlarmState>((set, get) => ({
  products: [],

  setProducts: (products: AlarmProduct[]) => {
    set({ products });
  },

  isAlarm: (packet, passedProduct = null) => {
    const { products } = get();

  
    const product =
      passedProduct ??
      products.find((p) => p.id == packet?.product_id) ??
      null;
    console.log("lkjewril: ",passedProduct)
    if (!product) return false;

    const alarms = product.attributes?.filter((item) => item.checkin == 0);

    if (!alarms || alarms.length === 0) return false;

    for (let i = 0; i < alarms.length; i++) {
      const alarm = alarms[i];
      const packetValue = packet[alarm.xup?.data_type];
      const thresholdNumber = Number(alarm.threshold);

      if (packetValue != null && packetValue != undefined && !isNaN(thresholdNumber)) {
       
        let packetNumber =
          alarm.xup?.data_type === "temperature"
            ? (Number(packetValue) * 9) / 5 + 32
            : Number(packetValue);

        const result = comparisonOperators[alarm.comparison]?.(packetNumber, thresholdNumber);

        if (result) return true; 
      }
    }

    return false;
  },
}));