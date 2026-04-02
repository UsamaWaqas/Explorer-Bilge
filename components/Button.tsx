import React, { useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, PressableProps, Text } from 'react-native';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  textClassName?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function Button({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  textClassName = '',
  onPress,
  ...props
}: ButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const animatedStyle = {
    transform: [{ scale }],
    opacity,
  };

  const handlePressIn = () => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 0.96,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0.7,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const variantStyles = {
    primary: 'bg-[#f49b33]',
    secondary: 'bg-[#2b2b2b]',
    outline: 'bg-[#2b2b2b] border border-[#f49b33]',
  };

  const sizeStyles = {
    small: 'p-1.5 my-1',
    medium: 'p-2 my-2',
    large: 'p-3 my-2',
  };

  const textVariantStyles = {
    primary: 'text-black',
    secondary: 'text-white',
    outline: 'text-[#f49b33]',
  };

  const textSizeStyles = {
    small: 'text-sm',
    medium: 'text-lg',
    large: 'text-xl',
  };

  const isDisabled = disabled || loading;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={animatedStyle}
      className={`
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-50' : ''}
        rounded-lg
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#000' : '#f49b33'} />
      ) : (
        <Text
          className={`
            ${textVariantStyles[variant]}
            ${textSizeStyles[size]}
            font-semibold text-center
            ${textClassName}
          `}
        >
          {title}
        </Text>
      )}
    </AnimatedPressable>
  );
}