import Constants from 'expo-constants';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

const SCREEN2ME_SERVER =
  Constants.expoConfig?.extra?.screen2meServer ?? 'https://calling.example.com';

interface Screen2MeCallProps {
  roomName: string;
  displayName: string;
  xnid: string;          
  token?: string | null; 
  onHangUp?: () => void;
}

export function Screen2MeCall({
  roomName,
  displayName,
  xnid,
  token = null,
  onHangUp,
}: Screen2MeCallProps) {

  const sessionUrl =
    `${SCREEN2ME_SERVER}/${encodeURIComponent(roomName)}` +
    `#config.startWithAudioMuted=false` +
    `&config.startWithVideoMuted=false` +
    `&config.disableDeepLinking=true` +
    `&userInfo.displayName=${encodeURIComponent(displayName)}` +
    `&userInfo.email=${encodeURIComponent(`${xnid}@xnid.jove`)}` +  
    (token ? `&token=${token}` : '');

  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const parsed = JSON.parse(event.nativeEvent.data);
      if (parsed.event === 'HANG_UP' && onHangUp) onHangUp();
    } catch {
     
    }
  };

  const handlePermissionRequest = (request: {
    resources: string[];
    grant: (r: string[]) => void;
  }) => {
    
    request.grant(request.resources);
  };

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: sessionUrl }}
        style={styles.webview}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        mediaCapturePermissionGrantType="grant"
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsProtectedMedia={true}
        onMessage={handleMessage}
        onShouldStartLoadWithRequest={(request) =>
          request.url.startsWith('http://') ||
          request.url.startsWith('https://')
        }
        onPermissionRequest={handlePermissionRequest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  webview: { flex: 1 },
});