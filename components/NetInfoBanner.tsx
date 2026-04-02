import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import { useNetwork } from '../hooks/useNetwork';

export default function NetInfoBanner() {
  const { isConnected, lastOfflineAt } = useNetwork();
  const isOffline = !isConnected;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(false); 


  useEffect(() => {
    if (isOffline) {
      setVisible(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setVisible(false)); 
    }
  }, [isOffline]);

 
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!isOffline) return;
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, [isOffline]);

  if (!visible) return null;


  const minutesAgo = lastOfflineAt
    ? Math.floor((now - lastOfflineAt) / 60_000)
    : 0;

  const timeLabel =
    minutesAgo < 1
      ? 'just now'
      : `${minutesAgo} min${minutesAgo > 1 ? 's' : ''} ago`;

  return (
    <Animated.View
      style={{ opacity: fadeAnim }}
      className="absolute bottom-[90px] left-0 right-0 items-center z-[9999] pointer-events-none"
    >
      <View className="bg-black/50 border-black/10 py-3 px-5 rounded-full flex-row items-center gap-2">
        <View className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
        <Text className="text-white text-[13px]">
          {`You're offline • Last updated ${timeLabel}`}
        </Text>
      </View>
    </Animated.View>
  );
}