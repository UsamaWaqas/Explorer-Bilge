import "dotenv/config";

export default ({ config }) => ({
  ...config,
  plugins: [
    // 'expo-notifications', // TEMP: removed for test build — restore before production build (needs Push Notifications capability enabled on Apple Developer portal first)
  ],
  extra: {
    ...config.extra,
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
  },
});