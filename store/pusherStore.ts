import { create } from "zustand";
import {
  createPusherInstance,
  destroyPusherInstance,
  getPusherInstance,
} from "../services/pusherService";

type ConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "failed";

type EventCallback = (event: { eventName: string; data: unknown }) => void;

interface PusherState {
  status: ConnectionStatus;
  activeChannels: Set<string>;
  channelCallbacks: Map<string, Set<EventCallback>>;

  connect: (authToken: string) => Promise<void>;
  disconnect: () => Promise<void>;
  subscribe: (channelName: string, onEvent: EventCallback) => Promise<void>;
  unsubscribe: (channelName: string, onEvent: EventCallback) => Promise<void>;
}

export const usePusherStore = create<PusherState>((set, get) => ({
  status: "idle",
  activeChannels: new Set(),
  channelCallbacks: new Map(),

  connect: async (authToken: string) => {
    console.log("[PusherStore] connecting...");
    const { status } = get();
    if (status === "connecting" || status === "connected") return;

    try {
      set({ status: "connecting" });
      await createPusherInstance(authToken);
      set({ status: "connected" });
      console.log("[PusherStore] connected!");
    } catch (err) {
      console.error("[PusherStore] connect failed", err);
      set({ status: "failed" });
    }
  },

  disconnect: async () => {
    try {
      await destroyPusherInstance();
    } catch (err) {
      console.error("[PusherStore] disconnect failed", err);
    } finally {
      set({
        status: "disconnected",
        activeChannels: new Set(),
        channelCallbacks: new Map(),
      });
    }
  },

  subscribe: async (channelName, onEvent) => {
    const { activeChannels, channelCallbacks } = get();

    const existing =
      channelCallbacks.get(channelName) ?? new Set<EventCallback>();
    existing.add(onEvent);
    const updatedCallbacks = new Map(channelCallbacks);
    updatedCallbacks.set(channelName, existing);
    set({ channelCallbacks: updatedCallbacks });
    console.log(
      "[PusherStore] callback added for:",
      channelName,
      "| total:",
      existing.size,
    );

    if (activeChannels.has(channelName)) {
      console.log(
        "[PusherStore] already subscribed:",
        channelName,
        "| just added callback",
      );
      return;
    }

    try {
      const pusher = getPusherInstance();
      await pusher.subscribe({
        channelName,
        onEvent: (event) => {
         
          const cbs = get().channelCallbacks.get(channelName);
          console.log(
            "[PusherStore] event on:",
            channelName,
            "| callbacks:",
            cbs?.size,
          );
          cbs?.forEach((cb) =>
            cb({ eventName: event.eventName, data: event.data }),
          );
        },
      });

      const updatedChannels = new Set(activeChannels);
      updatedChannels.add(channelName);
      set({ activeChannels: updatedChannels });
      console.log("[PusherStore] subscribed to:", channelName);
    } catch (err) {
      console.error("[PusherStore] subscribe failed", channelName, err);
    }
  },

  unsubscribe: async (channelName, onEvent) => {
    const { activeChannels, channelCallbacks } = get();

    const cbs = channelCallbacks.get(channelName);
    if (cbs) {
      cbs.delete(onEvent);
      console.log(
        "[PusherStore] callback removed:",
        channelName,
        "| remaining:",
        cbs.size,
      );

     
      if (cbs.size === 0) {
        try {
          const pusher = getPusherInstance();
          await pusher.unsubscribe({ channelName });

          const updatedChannels = new Set(activeChannels);
          updatedChannels.delete(channelName);
          const updatedCallbacks = new Map(channelCallbacks);
          updatedCallbacks.delete(channelName);
          set({
            activeChannels: updatedChannels,
            channelCallbacks: updatedCallbacks,
          });
          console.log("[PusherStore] fully unsubscribed:", channelName);
        } catch (err) {
          console.error("[PusherStore] unsubscribe failed", channelName, err);
        }
      }
    }
  },
}));