import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { Screen2MeCall } from '../../../components/Screen2MeCall';

// This screen receives: roomName, displayName, xnid
// These are passed from wherever call is initiated (profile, marina, support)

export default function CallScreen() {
  const { roomName, displayName, xnid } = useLocalSearchParams<{
    roomName: string;
    displayName: string;
    xnid: string;
  }>();

  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <Screen2MeCall
        roomName={roomName}
        displayName={displayName ?? 'User'}
        xnid={xnid ?? ''}
        token={null}           
        onHangUp={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
});