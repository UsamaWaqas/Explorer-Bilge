import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

/**
 * One-time check: kya abhi internet hai?
 * isInternetReachable null = check chal raha hai = optimistic true
 */
export const isOnline = async (): Promise<boolean> => {
  const state: NetInfoState = await NetInfo.fetch();
  return state.isConnected === true && state.isInternetReachable !== false;
};

/**
 * Continuous monitor. lastStatus closure ke andar hai —
 * multiple callers ke beech share NAHI hoga.
 */
export const startNetworkMonitor = (
  onOnline: () => void,
  onOffline: () => void,
): (() => void) => {
  let lastStatus: boolean | null = null; 

  const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
    // null = reachability check pending => optimistic online
    const online =
      state.isConnected === true && state.isInternetReachable !== false;

    if (lastStatus === online) return; 
    lastStatus = online;

    if (online) {
      onOnline();
    } else {
      onOffline();
    }
  });

  return unsubscribe;
};