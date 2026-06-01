import React from 'react';
import { TextStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import BatteryIcon from '../assets/Icons/Battery';
import TemperatureIcon from '../assets/Icons/Temperature';
import HumidityIcon from '../assets/Icons/Humidity';
import DeviceHealthIcon from '../assets/Icons/DeviceHealth';
import WaterLeakIcon from '../assets/Icons/WaterLeak';
import MainBilgeLevelIcon from '../assets/Icons/MainBilgeLevel';
import Security1Icon from '../assets/Icons/Security1';
import ImpactIcon from '../assets/Icons/Impact';
import PowerIcon from '../assets/Icons/Power';
import MotionIcon from '../assets/Icons/Motion';
import EnergyUsageIcon from '../assets/Icons/EnergyUsage';

export interface Tile {
  lable?: string;
  xUP?: string;
  data_type?: string;
}

export interface DeviceValues {
  [key: string]: any;
}

export interface Tide {
  t: string;
  type: 'H' | 'L';
}

export interface AttributeConfig {
  type: 'number' | 'boolean';
  icon: React.ReactNode;
  color: string;
  operators: string[];
}

const ICON_SIZE = 42;
const ATTR_ICON_SIZE = 18;

export const Icons: Record<string, React.FC<{ size?: number; color?: string }>> = {
  Battery: BatteryIcon,
  Temperature: TemperatureIcon,
  Humidity: HumidityIcon,
  'Device Health': DeviceHealthIcon,
  'Water Leak': WaterLeakIcon,
  'Main Bilge Level': MainBilgeLevelIcon,
  'Security 1': Security1Icon,
  Impact: ImpactIcon,
  Power: PowerIcon,
  Motion: MotionIcon,
  'Energy Usage': EnergyUsageIcon,
};

export const formatValue = (data_type?: string, value?: any): string => {
  if (value == null && data_type !== 'voltage') return 'NA';
  switch (data_type) {
    case 'temperature':
      return `${Math.round((Number(value) * 9) / 5 + 32)}°F`;
    case 'humidity':
      return `${value}%`;
    case 'voltage':
      return `${value ? value / 10 : 3}V`;
    default:
      return value === 'alert' ? 'Alert' : 'OK';
  }
};

export const getTextColor = (value: string): TextStyle => ({
  color: value === 'Alert' ? '#EF4444' : '#5C5C5C',
});

// ── whereFrom parameter add kiya ──────────────────────────────────────────────
export const getTilesConfig = (
  xups: Tile[] = [],
  deviceValues: DeviceValues = {},
  whereFrom?: string,   
) => {
  return xups.map((tile) => {
    const rawValue = deviceValues?.[tile?.xUP ?? ''];
    const formattedValue = formatValue(tile?.data_type, rawValue);
    const isAlert = formattedValue === 'Alert';

    const capitalizedLabel = tile?.data_type
      ? tile.data_type.charAt(0).toUpperCase() + tile.data_type.slice(1)
      : '';

    const label = tile?.lable ?? capitalizedLabel;

   
    let IconComponent: React.FC<{ size?: number; color?: string }>;

    if (label === 'Device Health' && whereFrom !== 'marina') {
      IconComponent = ({ size = ICON_SIZE, color = '#2C64B3' }) => (
        <MaterialIcons name="apartment" size={size} color={color} />
      );
    } else {
      IconComponent =
        Icons[tile?.lable ?? ''] ??
        Icons[capitalizedLabel] ??
        Icons.Impact;
    }

    return {
      label,
      value: formattedValue,
      icon: <IconComponent size={ICON_SIZE} color={isAlert ? 'white' : '#2C64B3'} />,
      textColor: getTextColor(formattedValue),
      dataType: tile?.data_type,
    };
  });
};

export const formatTideTime = (tide: Tide): string => {
  const date = new Date(tide.t);
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const isPM = hours >= 12;
  hours = hours % 12 || 12;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${
    isPM ? 'PM' : 'AM'
  } ${tide.type === 'H' ? 'HIGH' : 'LOW'}`;
};

export const haversineDistance = (
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number => {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const getAttributeConfig = (attribute: string): AttributeConfig => {
  switch (attribute) {
    case 'temperature':
      return {
        type: 'number',
        icon: <MaterialIcons name="thermostat" size={ATTR_ICON_SIZE} />,
        color: '#F97316',
        operators: ['<', '>', '<=', '>=', '==', '!=', '-'],
      };
    case 'humidity':
      return {
        type: 'number',
        icon: <MaterialIcons name="water-drop" size={ATTR_ICON_SIZE} />,
        color: '#06B6D4',
        operators: ['<', '>', '<=', '>=', '==', '!=', '-'],
      };
    case 'reed_state':
      return {
        type: 'boolean',
        icon: <MaterialIcons name="sensors" size={ATTR_ICON_SIZE} />,
        color: '#6366F1',
        operators: ['==', '!='],
      };
    case 'external_input':
      return {
        type: 'boolean',
        icon: <MaterialIcons name="input" size={ATTR_ICON_SIZE} />,
        color: '#A855F7',
        operators: ['==', '!='],
      };
    case 'battery_voltage':
      return {
        type: 'number',
        icon: <MaterialIcons name="battery-charging-full" size={ATTR_ICON_SIZE} />,
        color: '#22C55E',
        operators: ['<', '>', '<=', '>='],
      };
    case 'move':
      return {
        type: 'boolean',
        icon: <MaterialIcons name="directions-run" size={ATTR_ICON_SIZE} />,
        color: '#EC4899',
        operators: ['==', '!='],
      };
    default:
      return {
        type: 'number',
        icon: <MaterialIcons name="rule" size={ATTR_ICON_SIZE} />,
        color: '#6B7280',
        operators: ['<', '>', '<=', '>='],
      };
  }
};