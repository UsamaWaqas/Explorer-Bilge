import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';

interface AnimatedSwitchProps {
  value: boolean;
  onValueChange: () => void;
}

const AnimatedSwitch: React.FC<AnimatedSwitchProps> = ({ value, onValueChange }) => {
  const switchTranslate = useRef(new Animated.Value(value ? 18 : 0)).current;

  useEffect(() => {
    Animated.spring(switchTranslate, {
      toValue: value ? 18 : 0,
      damping: 15,
      stiffness: 150,
      mass: 0.5,
      useNativeDriver: false, // false kyunki backgroundColor animate ho rahi hai
    }).start();
  }, [value]);

  const backgroundColor = switchTranslate.interpolate({
    inputRange: [0, 18],
    outputRange: ['#9ca3af', '#3b82f6'],
  });

  return (
    <TouchableWithoutFeedback onPress={onValueChange}>
      <View style={styles.container}>
        <Animated.View style={[styles.track, { backgroundColor }]}>
          <Animated.View
            style={[
              styles.circle,
              {
                transform: [{ translateX: switchTranslate }],
              },
            ]}
          />
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  track: {
    width: 42,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
});

export default AnimatedSwitch;