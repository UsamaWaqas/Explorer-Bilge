import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNetworkStore } from '../store/networkStore';
import { usePusherStore } from '../store/pusherStore';

export function PusherLifecycle() {
  const token = useAuthStore((s) => s.token);
  console.log("[PusherLifecycle] token:", token);
  const isConnected = useNetworkStore((s) => s.isConnected);
  const { connect, disconnect, status } = usePusherStore();

  useEffect(() => {
    if (token && isConnected) {
      connect(token);
    } else {
      disconnect();
    }
  }, [token, isConnected]);

  return null;
}