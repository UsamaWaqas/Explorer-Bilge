import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveData = async <T>(key: string, value: T): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error('Save error:', e);
    return false;
  }
};

export const loadData = async <T>(
  key: string,
  defaultValue: T
): Promise<T> => {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? (JSON.parse(data) as T) : defaultValue;
  } catch (e) {
    console.error('Load error:', e);
    return defaultValue;
  }
};

export const removeData = async (key: string): Promise<boolean> => {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (e) {
    return false;
  }
};