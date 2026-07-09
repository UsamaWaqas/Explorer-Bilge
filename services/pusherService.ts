import * as PusherModule from "pusher-js/react-native";



const mod = PusherModule as any;


if (mod.default && typeof mod.default === "object") {

}

if (mod.default?.default && typeof mod.default.default === "object") {
  console.log("[PusherDebug] mod.default.default keys:", Object.keys(mod.default.default));
}

const allKeys = Object.keys(mod);
allKeys.forEach((key) => {
  console.log(`[PusherDebug] mod["${key}"] type:`, typeof mod[key]);
});

const PusherClient =
  (typeof mod.default?.default === "function" ? mod.default.default : null) ??
  (typeof mod.default === "function" ? mod.default : null) ??
  (typeof mod.Pusher === "function" ? mod.Pusher : null) ??
  (typeof mod.default?.Pusher === "function" ? mod.default.Pusher : null) ??
  mod;

console.log("[PusherDebug] resolved PusherClient type:", typeof PusherClient);
console.log("[PusherDebug] is callable?", typeof PusherClient === "function");
console.log("[PusherDebug] ── MODULE INSPECTION END ──");

import { PUSHER_CONFIG } from "../constants/pusher";

let pusherInstance: any | null = null;
const subscribedChannels: Map<string, any> = new Map();

export async function createPusherInstance(authToken: string): Promise<void> {
  console.log("============================================================");
  console.log("[PusherService] createPusherInstance() CALLED");
  console.log("[PusherService] authToken present:", !!authToken);
  console.log("[PusherService] authToken (first 20 chars):", authToken?.slice(0, 20) + "...");
  console.log("[PusherService] PUSHER_CONFIG:", JSON.stringify({
    appKey: PUSHER_CONFIG.appKey ? PUSHER_CONFIG.appKey.slice(0, 6) + "..." : "❌ MISSING",
    cluster: PUSHER_CONFIG.cluster || "❌ MISSING",
    authEndpoint: PUSHER_CONFIG.authEndpoint || "❌ MISSING",
  }));

  if (pusherInstance) {
    console.log("[PusherService] ⚠️ Instance already exists, skipping init.");
    console.log("============================================================");
    return;
  }

  if (typeof PusherClient !== "function") {
    const err = new Error(
      `[PusherService] PusherClient is not a constructor. Got: ${typeof PusherClient}. ` +
        `Module keys: ${Object.keys(mod).join(", ")}`,
    );
    console.error("[PusherService] ❌ FATAL:", err.message);
    console.log("============================================================");
    throw err;
  }

  console.log("[PusherService] Creating new Pusher instance...");

  try {
    pusherInstance = new PusherClient(PUSHER_CONFIG.appKey, {
      cluster: PUSHER_CONFIG.cluster,
      forceTLS: true,
      // TEST: channelAuthorization hata diya — public channel ko auth ki zaroorat nahi
      // agar issue solve ho jaye to pata chalega auth config hi scene tha
    });

    console.log("[PusherService] Pusher instance created — waiting for connection...");

    return new Promise((resolve, reject) => {
      pusherInstance.connection.bind("connected", () => {
        
        resolve();
      });

      pusherInstance.connection.bind("connecting", () => {
        console.log("[PusherService] 🔄 Pusher connecting...");
      });

      pusherInstance.connection.bind("disconnected", () => {
        console.log("[PusherService] ⚠️ Pusher disconnected.");
      });

      pusherInstance.connection.bind("error", (err: any) => {
        console.error("[PusherService] ❌ Connection ERROR:", JSON.stringify(err));
        reject(err);
      });

      pusherInstance.connection.bind("failed", (err: any) => {
        console.error("[PusherService] ❌ Connection FAILED:", JSON.stringify(err));
        reject(err);
      });

      pusherInstance.connection.bind(
        "state_change",
        ({ previous, current }: { previous: string; current: string }) => {
          console.log(`[PusherService] 🔀 State change: ${previous} → ${current}`);
        },
      );
    });
  } catch (error) {
    console.error("[PusherService] ❌ Critical initialization error:", error);
    pusherInstance = null;
    throw error;
  }
}

export async function destroyPusherInstance(): Promise<void> {
  console.log("[PusherService] destroyPusherInstance() called");
  subscribedChannels.clear();

  if (pusherInstance) {
    pusherInstance.disconnect();
    pusherInstance = null;
    console.log("[PusherService] ✅ Instance destroyed.");
  } else {
    console.log("[PusherService] ⚠️ No instance to destroy.");
  }
}

export function getPusherInstance() {
  if (!pusherInstance) {
    console.warn("[PusherService] ❌ getPusherInstance() — no instance exists! createPusherInstance() pehle call karo.");
    return null;
  }

  return {
    subscribe: async ({
      channelName,
      onEvent,
    }: {
      channelName: string;
      onEvent: (event: { eventName: string; data: any }) => void;
    }) => {
      console.log("------------------------------------------------------------");
      console.log("[PusherService] subscribe() called for channel:", channelName);

      if (subscribedChannels.has(channelName)) {
        
        return;
      }

      console.log("[PusherService] Calling pusherInstance.subscribe()...");
      const channel = pusherInstance.subscribe(channelName);
      subscribedChannels.set(channelName, channel);
      console.log("[PusherService] pusherInstance.subscribe() called. Waiting for auth...");

      channel.bind("pusher:subscription_succeeded", () => {
        // ─── LOG A: Subscription success — MUST aana chahiye ────────────────
        console.log("============================================================");
        console.log("[PusherService] ✅ SUBSCRIPTION SUCCEEDED:", channelName);
        console.log("[PusherService] Ab is channel pe events receive honge.");
        console.log("============================================================");
      });

      channel.bind("pusher:subscription_error", (err: any) => {
        // ─── LOG B: Auth fail — private channel ka issue ─────────────────────
        console.log("============================================================");
        console.error("[PusherService] ❌ SUBSCRIPTION ERROR on:", channelName);
        console.error("[PusherService] Error details:", JSON.stringify(err, null, 2));
        console.error("[PusherService] Hint: broadcasting/auth endpoint check karo — 403 aa raha hoga");
        console.error("[PusherService] Auth endpoint:", PUSHER_CONFIG.authEndpoint);
        console.log("============================================================");
      });

      channel.bind_global((eventName: string, data: any) => {
        if (eventName.startsWith("pusher:")) {
          // Internal pusher events — sirf dikhao
          console.log(`[PusherService] 🔧 Internal event [${channelName}] → ${eventName}`);
          return;
        }

        // ─── LOG C: Actual business event ────────────────────────────────────
        console.log("============================================================");
        console.log(`[PusherService] 📨 EVENT ARRIVED [${channelName}] → ${eventName}`);
        console.log("[PusherService] data:", JSON.stringify(data, null, 2));
        console.log("============================================================");

        onEvent({ eventName, data });
      });

      console.log("[PusherService] ✅ Channel setup complete:", channelName);
      console.log("------------------------------------------------------------");
    },

    unsubscribe: async ({ channelName }: { channelName: string }) => {
      if (!subscribedChannels.has(channelName)) {
        console.warn("[PusherService] ⚠️ unsubscribe() called on untracked channel:", channelName);
        return;
      }

      pusherInstance?.unsubscribe(channelName);
      subscribedChannels.delete(channelName);
      console.log("[PusherService] ✅ Unsubscribed from:", channelName);
    },
  };
}