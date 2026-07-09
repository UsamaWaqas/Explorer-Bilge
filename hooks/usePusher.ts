import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { getPusherChannelName, PUSHER_EVENTS } from "../constants/pusher";
import { useAuthStore } from "../store/authStore";
import { usePusherStore } from "../store/pusherStore";

// ── Pusher Init ─────────────────────────────────────────
export function usePusherInit() {
  const { connect, disconnect } = usePusherStore();
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!token) {
      console.log("[PusherInit] no token, skipping connect");
      return;
    }

    // Initial connect
    console.log("[PusherInit] connecting...");
    connect(token);

    // App foreground/background handle karo
    const handleAppStateChange = async (nextState: AppStateStatus) => {
      if (nextState === "active") {
        console.log("[PusherInit] app active → reconnecting...");
        await disconnect(); // stale state clear
        await connect(token); // fresh connect
      } else if (nextState === "background") {
        console.log("[PusherInit] app background → disconnecting...");
        await disconnect();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    return () => {
      console.log("[PusherInit] cleanup → disconnecting");
      subscription.remove();
      disconnect();
    };
  }, [token]);
}

// ── Generic Pusher Event Hook ───────────────────────────
export function usePusherEvent(onEvent: () => void) {
  const { subscribe, unsubscribe, status } = usePusherStore();
  const user = useAuthStore((s) => s.user);
  const channelRef = useRef<string | null>(null);
  const onEventRef = useRef(onEvent);
  const callbackRef = useRef<
    ((e: { eventName: string; data: unknown }) => void) | null
  >(null);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!user?.id) {
      console.log("[PusherEvent] no user id, skipping");
      return;
    }
    if (status !== "connected") {
      console.log("[PusherEvent] not connected, status:", status);
      return;
    }

    const channelName = getPusherChannelName(user.id);
    channelRef.current = channelName;

    const callback = ({
      eventName,
      data,
    }: {
      eventName: string;
      data: unknown;
    }) => {
      console.log("[PusherEvent] event received:", eventName);

      if (eventName !== PUSHER_EVENTS.DEVICE_DATA_UPDATED) {
        console.log("[PusherEvent] ignoring event:", eventName);
        return;
      }

      console.log("[PusherEvent] DATA:", JSON.stringify(data, null, 2));
      onEventRef.current();
    };

    callbackRef.current = callback;

    console.log("[PusherEvent] subscribing to:", channelName);
    subscribe(channelName, callback);

    return () => {
      if (channelRef.current && callbackRef.current) {
        console.log(
          "[PusherEvent] cleanup → unsubscribing:",
          channelRef.current,
        );
        unsubscribe(channelRef.current, callbackRef.current);
        channelRef.current = null;
        callbackRef.current = null;
      }
    };
  }, [user?.id, status]);
}

// ── Device-specific Pusher Hook ─────────────────────────
export function usePusher(deviceId?: string | number) {
  const queryClient = useQueryClient();
  const deviceIdRef = useRef(deviceId);

  useEffect(() => {
    deviceIdRef.current = deviceId;
    console.log("[Pusher] deviceId ref updated:", deviceId);
  }, [deviceId]);

  usePusherEvent(() => {
    console.log(
      "[Pusher] invalidating query for deviceId:",
      deviceIdRef.current,
    );
    queryClient.invalidateQueries({
      queryKey: ["monitoring", deviceIdRef.current],
    });
  });
}
