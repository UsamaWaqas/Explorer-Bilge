import { useEffect, useRef } from "react";
import { Animated, Dimensions, Easing, Pressable, View } from "react-native";
import { useDrawerStore } from "../store/ModalStore";

const { width } = Dimensions.get("window");
const DRAWER_WIDTH = 320;

interface GlobalDrawerProps {
  children: React.ReactNode;
}

export default function GlobalDrawer({ children }: GlobalDrawerProps) {
  const isOpen = useDrawerStore((s) => s.isOpen);
  const close = useDrawerStore((s) => s.close);

  const translateX = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const EASE_OUT = Easing.out(Easing.cubic);
  const EASE_IN = Easing.in(Easing.cubic);

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 350,
          easing: EASE_OUT,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          easing: EASE_OUT,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: DRAWER_WIDTH,
          duration: 300,
          easing: EASE_IN,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          easing: EASE_IN,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <Animated.View
        pointerEvents={isOpen ? "auto" : "none"}
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          opacity: fadeAnim,
          zIndex: 998,  // ✅ Toast 999 pe hoga, drawer 998
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={close} />
      </Animated.View>

      {/* Drawer */}
      <Animated.View
        style={{
          position: "absolute",
          top: 0, right: 0, bottom: 0,
          width: DRAWER_WIDTH,
          backgroundColor: "#E8EEF3",
          zIndex: 998,  // ✅ Toast ke neeche
          transform: [{ translateX }],
          shadowColor: "#000",
          shadowOffset: { width: -2, height: 0 },
          shadowOpacity: 0.25,
          shadowRadius: 10,
          elevation: 998,
        }}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          {children}
        </Pressable>
      </Animated.View>
    </>
  );
}