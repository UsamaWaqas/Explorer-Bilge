import * as PusherModule from 'pusher-js/react-native';


console.log("[PusherDebug] ── MODULE INSPECTION START ──");
console.log("[PusherDebug] typeof PusherModule:", typeof PusherModule);
console.log("[PusherDebug] PusherModule keys:", Object.keys(PusherModule));

const mod = PusherModule as any;

console.log("[PusherDebug] typeof mod.default:", typeof mod.default);
console.log("[PusherDebug] typeof mod.Pusher:", typeof mod.Pusher);
console.log("[PusherDebug] typeof mod.default?.default:", typeof mod.default?.default);
console.log("[PusherDebug] typeof mod.default?.Pusher:", typeof mod.default?.Pusher);


if (mod.default && typeof mod.default === 'object') {
  console.log("[PusherDebug] mod.default keys:", Object.keys(mod.default));
}

if (mod.default?.default && typeof mod.default.default === 'object') {
  console.log("[PusherDebug] mod.default.default keys:", Object.keys(mod.default.default));
}

// Try to find anything callable
const allKeys = Object.keys(mod);
allKeys.forEach((key) => {
  console.log(`[PusherDebug] mod["${key}"] type:`, typeof mod[key]);
});

// ─── Resolve the actual constructor ──────────────────────────────────────────
const PusherClient =
  (typeof mod.default?.default === 'function' ? mod.default.default : null) ??
  (typeof mod.default === 'function' ? mod.default : null) ??
  (typeof mod.Pusher === 'function' ? mod.Pusher : null) ??
  (typeof mod.default?.Pusher === 'function' ? mod.default.Pusher : null) ??
  mod;

console.log("[PusherDebug] resolved PusherClient type:", typeof PusherClient);
console.log("[PusherDebug] is callable?", typeof PusherClient === 'function');
console.log("[PusherDebug] ── MODULE INSPECTION END ──");

import { PUSHER_CONFIG } from "../constants/pusher";

let pusherInstance: any | null = null;
const subscribedChannels: Map<string, any> = new Map();

export async function createPusherInstance(authToken: string): Promise<void> {
  console.log("[Pusher] init starting...");
  console.log("[Pusher] PusherClient type:", typeof PusherClient);
  console.log("[Pusher] Is constructor?", typeof PusherClient === 'function');
  console.log("[Pusher] Config:", {
    appKey: PUSHER_CONFIG.appKey ? `${PUSHER_CONFIG.appKey.slice(0, 4)}...` : 'MISSING',
    cluster: PUSHER_CONFIG.cluster ?? 'MISSING',
    authEndpoint: PUSHER_CONFIG.authEndpoint ?? 'MISSING',
  });

  if (pusherInstance) {
    console.log("[Pusher] Instance already exists, skipping init.");
    return;
  }

  if (typeof PusherClient !== 'function') {
    const err = new Error(
      `[Pusher] PusherClient is not a constructor. Got: ${typeof PusherClient}. ` +
      `Module keys: ${Object.keys(mod).join(', ')}`
    );
    console.error("[Pusher] FATAL:", err.message);
    throw err;
  }

  try {
    console.log("[Pusher] Creating new instance...");
    pusherInstance = new PusherClient(PUSHER_CONFIG.appKey, {
      cluster: PUSHER_CONFIG.cluster,
      forceTLS: true,
      channelAuthorization: {
        endpoint: PUSHER_CONFIG.authEndpoint,
        transport: "ajax",
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
        },
      },
    });

    console.log("[Pusher] Instance created, waiting for connection...");
    console.log("[Pusher] pusherInstance type:", typeof pusherInstance);
    console.log("[Pusher] pusherInstance keys:", Object.keys(pusherInstance));

    return new Promise((resolve, reject) => {
      pusherInstance.connection.bind("connected", () => {
        console.log("[Pusher] connected! Socket ID:", pusherInstance.connection.socket_id);
        resolve();
      });

      pusherInstance.connection.bind("connecting", () => {
        console.log("[Pusher] connecting...");
      });

      pusherInstance.connection.bind("disconnected", () => {
        console.log("[Pusher] disconnected.");
      });

      pusherInstance.connection.bind("error", (err: any) => {
        console.error("[Pusher] connection error:", JSON.stringify(err));
        reject(err);
      });

      pusherInstance.connection.bind("failed", (err: any) => {
        console.error("[Pusher] connection failed:", JSON.stringify(err));
        reject(err);
      });

      pusherInstance.connection.bind("state_change", ({ previous, current }: { previous: string; current: string }) => {
        console.log(`[Pusher] state: ${previous} → ${current}`);
      });
    });
  } catch (error) {
    console.error("[Pusher] critical initialization error:", error);
    pusherInstance = null;
    throw error;
  }
}

export async function destroyPusherInstance(): Promise<void> {
  console.log("[Pusher] destroying instance...");
  console.log("[Pusher] active channels before destroy:", [...subscribedChannels.keys()]);

  subscribedChannels.clear();

  if (pusherInstance) {
    pusherInstance.disconnect();
    pusherInstance = null;
    console.log("[Pusher] instance destroyed.");
  } else {
    console.log("[Pusher] no instance to destroy.");
  }
}

export function getPusherInstance() {
  if (!pusherInstance) {
    console.error("[Pusher] getPusherInstance called but no instance exists.");
    throw new Error("[Pusher] not initialized. Call createPusherInstance first.");
  }

  console.log("[Pusher] getPusherInstance called, connection state:", pusherInstance.connection.state);

  return {
    subscribe: async ({
      channelName,
      onEvent,
    }: {
      channelName: string;
      onEvent: (event: { eventName: string; data: any }) => void;
    }) => {
      console.log("[Pusher] subscribing to channel:", channelName);

      if (subscribedChannels.has(channelName)) {
        console.log("[Pusher] already subscribed to:", channelName, "— reusing.");
        return;
      }

      const channel = pusherInstance.subscribe(channelName);
      subscribedChannels.set(channelName, channel);

      channel.bind("pusher:subscription_succeeded", () => {
        console.log("[Pusher] subscription succeeded:", channelName);
      });

      channel.bind("pusher:subscription_error", (err: any) => {
        console.error("[Pusher] subscription error:", channelName, JSON.stringify(err));
      });

      channel.bind_global((eventName: string, data: any) => {
        if (!eventName.startsWith("pusher:")) {
          console.log(`[Pusher] event [${channelName}] → ${eventName}:`, JSON.stringify(data));
        }
        onEvent({ eventName, data });
      });

      console.log("[Pusher] subscribed to:", channelName);
      console.log("[Pusher] total active channels:", subscribedChannels.size);
    },

    unsubscribe: async ({ channelName }: { channelName: string }) => {
      if (!subscribedChannels.has(channelName)) {
        console.warn("[Pusher] unsubscribe called on untracked channel:", channelName);
        return;
      }

      pusherInstance?.unsubscribe(channelName);
      subscribedChannels.delete(channelName);
      console.log("[Pusher] unsubscribed from:", channelName);
      console.log("[Pusher] remaining channels:", [...subscribedChannels.keys()]);
    },
  };
}