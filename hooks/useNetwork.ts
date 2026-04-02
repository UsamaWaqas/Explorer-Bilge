import { useNetworkStore } from '../store/networkStore';

/**
 * Sirf store read karta hai.
 * Koi apna NetInfo subscription nahi — store wala kaam karega.
 *
 * Usage:
 *   const { isConnected, lastOfflineAt } = useNetwork();
 */
export const useNetwork = () => {
  const isConnected = useNetworkStore((s) => s.isConnected);
  const lastOfflineAt = useNetworkStore((s) => s.lastOfflineAt);
  return { isConnected, lastOfflineAt };
};