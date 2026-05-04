import { useNetworkStore } from '../store/networkStore';



export const useNetwork = () => {
  const isConnected = useNetworkStore((s) => s.isConnected);
  const lastOfflineAt = useNetworkStore((s) => s.lastOfflineAt);
  return { isConnected, lastOfflineAt };
};