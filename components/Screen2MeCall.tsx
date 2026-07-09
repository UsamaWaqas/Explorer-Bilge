import Constants from 'expo-constants';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, AppStateStatus, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

const SCREEN2ME_SERVER =
  Constants.expoConfig?.extra?.screen2meServer ?? 'https://calling.example.com';

// Agar itne ms mein video genuinely connect na ho, ek dafa khud WebView
// reload karo (camera ko extra time milta hai release/re-acquire ke liye).
// FIX (slow-network false positive): 8s bohot kam tha — genuinely slow
// (lekin working) connections (3G/weak wifi) ko bhi "stuck" samajh kar
// force-retry kar deta tha. 14s se legit slow joins ko normal chance milta
// hai, aur asal stuck/dead connection abhi bhi reasonable time mein pakda
// jata hai.
const STUCK_WATCHDOG_MS = 14000;
// Itni auto-retries ke baad bhi fail ho to manual "Retry" button dikhao.
const MAX_AUTO_RETRIES = 2;
// FIX: App background se foreground aane ke baad, Android camera service ko
// thoda time do fully release hone ke liye, phir hi naya getUserMedia()
// try karo. Isi CAMERA_RELEASE_BUFFER_MS ka istemal hangup ke baad bhi
// hota hai (agle call ke liye camera free karne mein).
const CAMERA_RELEASE_BUFFER_MS = 600;

interface Screen2MeCallProps {
  roomName: string;
  displayName: string;
  xnid: string;
  token?: string | null;
  onHangUp?: () => void;
  // FIX: caller side ko batata hai ke call genuinely connect (answer) ho
  // chuki hai - is se [roomName].tsx decide karta hai ke hangup par
  // receiver ko /api/call/reject bhejna hai ya nahi (sirf pre-answer cancel
  // ke liye bhejna hai, already-connected call ke liye nahi).
  onConnected?: () => void;
}

export function Screen2MeCall({
  roomName,
  displayName,
  xnid,
  token = null,
  onHangUp,
  onConnected,
}: Screen2MeCallProps) {
  const sessionUrl =
    `${SCREEN2ME_SERVER}/${encodeURIComponent(roomName)}` +
    `#config.startWithAudioMuted=false` +
    `&config.startWithVideoMuted=false` +
    `&config.disableDeepLinking=true` +
    `&userInfo.displayName=${encodeURIComponent(displayName)}` +
    `&userInfo.email=${encodeURIComponent(`${xnid}@xnid.jove`)}` +
    (token ? `&token=${token}` : '');

  const baseServerUrl = SCREEN2ME_SERVER.replace(/\/+$/, '');
  const encodedRoom = encodeURIComponent(roomName);

  const isPostCallRedirect = (url: string) => {
    const urlWithoutHash = url.split('#')[0];
    const isOnServer = urlWithoutHash.startsWith(baseServerUrl);
    const hasRoom = urlWithoutHash.includes(encodedRoom) || urlWithoutHash.includes(roomName);
    return isOnServer && !hasRoom;
  };

  // FIX (root cause of "infinite Connecting..."): WebView ko `key` se force
  // remount karte hain jab watchdog stuck-connecting detect kare. Plain
  // reload() se kaafi nahi tha kyunke camera handle JS reload se release
  // nahi hota - poora WebView instance hi remount karna padta hai.
  const [webviewKey, setWebviewKey] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [showRetryUI, setShowRetryUI] = useState(false);
  // FIX (silent WebView load failures): pehle koi onError/onHttpError
  // handler nahi tha - agar calling.example.com unreachable ho (no
  // internet, DNS fail, server down, SSL issue), user ko generic
  // "Call is not connecting.." hi dikhta tha (watchdog ke through, 14s
  // baad), asal wajah kabhi nahi batayi jati thi. Ab load/network error
  // turant pakda jata hai aur specific message dikhaya jata hai.
  const [loadError, setLoadError] = useState<string | null>(null);
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectedRef = useRef(false);
  // FIX: background/foreground transition track karne ke liye. Android 9+
  // par background jaate hi camera/mic OS level pe revoke ho jata hai, is
  // liye foreground wapas aane par purani (dead) stream reuse karne ki
  // koshish karne ke bajaye WebView ko remount kar ke fresh getUserMedia()
  // mangwate hain.
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const bgResumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // FIX: in-place camera refresh ke response ka wait - agar WebView se
  // TRACK_REFRESH_OK/FAIL time par na aaye, to fallbackTimer khud hi
  // remount trigger kar dega. Isse "hamesha safe" guarantee milti hai.
  const trackRefreshFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const webviewRef = useRef<WebView>(null);
  const TRACK_REFRESH_TIMEOUT_MS = 4000;

  const clearWatchdog = () => {
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
  };

  const armWatchdog = () => {
    clearWatchdog();
    watchdogRef.current = setTimeout(() => {
      if (connectedRef.current) return;
      setRetryCount((prev) => {
        const next = prev + 1;
        if (next > MAX_AUTO_RETRIES) {
          setShowRetryUI(true);
          return prev;
        }
        // Force a fresh WebView instance - new mount, new getUserMedia
        // attempt, gives the camera another chance to be free by now.
        setWebviewKey((k) => k + 1);
        return next;
      });
    }, STUCK_WATCHDOG_MS);
  };

  // Naye attempt (initial mount ya har retry) par watchdog (re)arm karo.
  useEffect(() => {
    connectedRef.current = false;
    armWatchdog();
    return clearWatchdog;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webviewKey]);

  // FIX: background se foreground aane par, agar call already connected thi,
  // to purani camera stream dead ho chuki hoti hai (Android ne revoke kar
  // di). Us dead stream ko resurrect karne ki koshish karne ke bajaye
  // WebView remount kar ke bilkul fresh getUserMedia() request karwate hain.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      const wasBackground =
        appStateRef.current === 'background' || appStateRef.current === 'inactive';
      const isNowActive = nextState === 'active';

      if (wasBackground && isNowActive && connectedRef.current) {
        if (bgResumeTimeoutRef.current) clearTimeout(bgResumeTimeoutRef.current);
        // Thoda ruko taake Android camera service purani stream ko poori
        // tarah release kar chuka ho, phir hi naya track mangwao - warna
        // naya getUserMedia() bhi "camera in use" fail ho sakta hai kyunke
        // purana handle abhi teardown ho raha hota hai.
        bgResumeTimeoutRef.current = setTimeout(() => {
          // Pehle in-place refresh try karo (call rejoin nahi hogi). Agar
          // ye WebView ke andar se timeout tak jawab na de (Jitsi internal
          // API na mile, ya replaceTrack fail ho), tabhi remount (rejoin)
          // par fallback karo - taake call kabhi permanently stuck na rahe.
          webviewRef.current?.postMessage(
            JSON.stringify({ event: 'NATIVE_REQUEST_TRACK_REFRESH' })
          );
          if (trackRefreshFallbackRef.current) clearTimeout(trackRefreshFallbackRef.current);
          trackRefreshFallbackRef.current = setTimeout(() => {
            console.log('[Screen2MeCall] in-place track refresh timed out - falling back to remount');
            connectedRef.current = false;
            setRetryCount(0);
            setWebviewKey((k) => k + 1);
          }, TRACK_REFRESH_TIMEOUT_MS);
        }, CAMERA_RELEASE_BUFFER_MS);
      }
      appStateRef.current = nextState;
    });
    return () => {
      sub.remove();
      if (bgResumeTimeoutRef.current) clearTimeout(bgResumeTimeoutRef.current);
      if (trackRefreshFallbackRef.current) clearTimeout(trackRefreshFallbackRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleManualRetry = () => {
    setShowRetryUI(false);
    setLoadError(null);
    setRetryCount(0);
    connectedRef.current = false;
    setWebviewKey((k) => k + 1);
  };

  // Same room-membership check, usable inside injected JS as a plain string fn
  const isPostCallRedirectJs = `
    function isPostCallRedirectUrl(url) {
      try {
        var urlWithoutHash = url.split('#')[0];
        var isOnServer = urlWithoutHash.indexOf(baseUrl) === 0;
        var hasRoom = urlWithoutHash.indexOf(encodedRoom) !== -1 || urlWithoutHash.indexOf(rawRoom) !== -1;
        return isOnServer && !hasRoom;
      } catch (e) { return false; }
    }
  `;

  const injectedJavaScript = `
    (function() {
      var hangupSent = false;
      var baseUrl = '${baseServerUrl}';
      var encodedRoom = '${encodedRoom}';
      var rawRoom = '${roomName}';
      var videoEverConnected = false;

      window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'DEBUG', msg: '🔴🔴🔴 INJECTED_JS_RUNNING 🔴🔴🔴' }));

      ${isPostCallRedirectJs}

      // FIX: background→foreground par WebView remount kiye bina camera
      // track refresh karne ki koshish - taake call visually rejoin na ho.
      // Jitsi self-hosted, non-iframe-API mode mein load ho raha hai, is
      // liye humein undocumented "APP" global object pe rely karna padta
      // hai. Ye Jitsi version ke sath break ho sakta hai - is liye RN side
      // par bhi timeout ke sath fallback (full remount) rakha hai agar ye
      // postMessage 'TRACK_REFRESH_OK' na bheje.
      function handleNativeMessage(e) {
        try {
          var data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
          if (data && data.event === 'NATIVE_REQUEST_TRACK_REFRESH') {
            attemptInPlaceCameraRefresh();
          }
        } catch (err) {}
      }
      // RN WebView postMessage() Android par kabhi 'document' pe deliver
      // hota hai, kabhi 'window' pe (RN WebView version ke hisaab se) -
      // dono pe listen kar rahe hain taake reliably mile.
      window.addEventListener('message', handleNativeMessage);
      document.addEventListener('message', handleNativeMessage);

      function attemptInPlaceCameraRefresh() {
        try {
          var conference =
            (window.APP && window.APP.conference) ||
            (window.APP && window.APP.store &&
              window.APP.store.getState()['features/base/conference'] &&
              window.APP.store.getState()['features/base/conference'].conference);

          if (!conference || typeof conference.replaceTrack !== 'function') {
            window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'DEBUG', msg: '⚠️ TRACK_REFRESH: no internal conference API found' }));
            window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'TRACK_REFRESH_FAIL' }));
            return;
          }

          navigator.mediaDevices.getUserMedia({ video: true, audio: false })
            .then(function(stream) {
              var newVideoTrack = stream.getVideoTracks()[0];
              var oldTrack = window.APP.conference.getLocalVideoTrack
                ? window.APP.conference.getLocalVideoTrack()
                : null;

              var doReplace = conference.replaceTrack
                ? conference.replaceTrack(oldTrack, newVideoTrack)
                : Promise.reject(new Error('replaceTrack unavailable'));

              Promise.resolve(doReplace)
                .then(function() {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'DEBUG', msg: '✅ TRACK_REFRESH: camera track replaced in place' }));
                  window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'TRACK_REFRESH_OK' }));
                })
                .catch(function(err) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'DEBUG', msg: '⚠️ TRACK_REFRESH replaceTrack failed: ' + (err && err.message) }));
                  window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'TRACK_REFRESH_FAIL' }));
                });
            })
            .catch(function(err) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'DEBUG', msg: '⚠️ TRACK_REFRESH getUserMedia failed: ' + (err && err.message) }));
              window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'TRACK_REFRESH_FAIL' }));
            });
        } catch (err) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'DEBUG', msg: '⚠️ TRACK_REFRESH exception: ' + (err && err.message) }));
          window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'TRACK_REFRESH_FAIL' }));
        }
      }

      function sendHangUp() {
        if (hangupSent) return;
        hangupSent = true;
        try {
          // Camera/mic ko forcibly release karo taake Android native camera
          // service jaldi free ho jaye agle call ke liye
          document.querySelectorAll('video').forEach(function(v) {
            if (v.srcObject) {
              v.srcObject.getTracks().forEach(function(t) { t.stop(); });
              v.srcObject = null;
            }
          });
        } catch (err) {}
        window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'HANG_UP' }));
      }

      function openExternally(url) {
        // Invite/share links (Gmail, Outlook, Yahoo, etc.) - khol do bahar,
        // call ko bilkul mat chuo
        window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'OPEN_EXTERNAL', url: url }));
      }

      // 1. window.open override
      window.open = function(url, target, features) {
        try {
          if (url && isPostCallRedirectUrl(url)) {
            sendHangUp();
          } else if (url) {
            openExternally(url);
          }
        } catch (err) {}
        return null;
      };

      // 2. Anchor clicks intercept
      document.addEventListener('click', function(e) {
        var el = e.target;
        while (el && el.tagName !== 'A') el = el.parentElement;
        if (el && el.tagName === 'A') {
          var target = el.getAttribute('target') || '';
          var href = el.getAttribute('href') || '';
          if (target === '_blank' || target === '_system') {
            e.preventDefault();
            if (href && isPostCallRedirectUrl(href)) {
              sendHangUp();
            } else if (href) {
              openExternally(href);
            }
          }
        }
      }, true);

      // 2b. "Leave meeting" / "End meeting for all" confirmation buttons
      // FIX: pehle exact text match (===) use ho raha tha, jo tab fail ho
      // jata tha jab button text 2 lines mein render hota (extra
      // whitespace/line-break se textContent match nahi karta), ya jab
      // WebView pe fast tap se 'click' event reliably fire nahi hota. Ab
      // substring match (.includes) use kar rahe hain aur click + touchend
      // dono listen kar rahe hain, depth bhi badhaya hai.
      function checkLeaveButtonText(el) {
        var depth = 0;
        var origEl = el;
        while (el && depth < 8) {
          var text = (el.textContent || '').replace(/\\s+/g, ' ').trim().toLowerCase();
          var ariaLabel = (el.getAttribute && el.getAttribute('aria-label') || '').toLowerCase();
          if (
            (text && text.length < 40 && (
              text.includes('end meeting for all') ||
              text.includes('leave meeting') ||
              text === 'leave' ||
              text === 'end call'
            )) ||
            ariaLabel.includes('leave meeting') ||
            ariaLabel.includes('end meeting')
          ) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'DEBUG', msg: '✅ MATCHED leave/end button: "' + text + '"' }));
            setTimeout(sendHangUp, 800);
            return true;
          }
          el = el.parentElement;
          depth++;
        }
        // DEBUG: koi match nahi hua - clicked element ka raw info bhejo taake
        // pata chale actual DOM structure/text kya tha
        try {
          var tag = origEl && origEl.tagName;
          var rawText = (origEl && origEl.textContent || '').slice(0, 60);
          window.ReactNativeWebView.postMessage(JSON.stringify({
            event: 'DEBUG',
            msg: '❌ No match. tag=' + tag + ' text="' + rawText + '"'
          }));
        } catch (e) {}
        return false;
      }
      document.addEventListener('click', function(e) {
        checkLeaveButtonText(e.target);
      }, true);
      document.addEventListener('touchend', function(e) {
        var el = e.target;
        if (e.changedTouches && e.changedTouches.length > 0) {
          var touch = e.changedTouches[0];
          var real = document.elementFromPoint(touch.clientX, touch.clientY);
          if (real) el = real;
        }
        checkLeaveButtonText(el);
      }, true);

      // 2c. Video-connected detector - RN ko batata hai jab call GENUINELY
      // dono taraf se live ho jaye (sirf apna camera preview nahi).
      // FIX: pehle ye sirf "koi bhi 1 video chal raha hai" check karta tha -
      // jo caller ke apne self-preview se hi turant true ho jata tha, chahe
      // dusri taraf ne abhi accept na kiya ho. Isi wajah se "answered" galat
      // tarah se mark ho jata tha aur pre-answer cancel par reject API
      // bhejna skip ho jata tha. Ab kam az kam 2 video streams (khud + dusra
      // banda) genuinely playing chahiye, taake "connected" ka matlab asal
      // mein two-party connection ho.
      function markVideoConnected() {
        if (videoEverConnected) return;
        videoEverConnected = true;
        window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'VIDEO_CONNECTED' }));
      }

      // FIX (audio-only / camera-off call never "Connected"): pehle sirf
      // "2 video streams simultaneously playing" hi connected maanta tha.
      // Agar koi ek banda apna camera off rakhe (ya audio-only join kare),
      // uska <video> element kabhi banta hi nahi — playingCount kabhi 2 tak
      // nahi pahunchta, aur call hamesha "not connected" reh jati thi (galat
      // early-cancel reject, aur watchdog isko baar baar "stuck" samajh kar
      // remount karta rehta). Ab video-count ke sath sath Jitsi ke apne
      // internal participant-list (redux state) ko bhi check karte hain —
      // ye camera on/off se independent hai, sirf ye batata hai ke kitne
      // log room mein genuinely joined hain.
      function getJoinedParticipantCount() {
        try {
          var state = window.APP && window.APP.store && window.APP.store.getState();
          var participants = state && state['features/base/participants'];
          if (Array.isArray(participants)) return participants.length;
        } catch (err) {}
        return 0;
      }

      var videoStartCheck = setInterval(function() {
        try {
          var videos = document.querySelectorAll('video');
          var playingCount = 0;
          videos.forEach(function(v) {
            if (v.srcObject && v.readyState >= 2 && !v.paused) playingCount++;
          });
          if (playingCount >= 2 || getJoinedParticipantCount() >= 2) {
            markVideoConnected();
            clearInterval(videoStartCheck);
          }
        } catch (err) {}
      }, 500);

      // 2d. Fallback black-screen detector - sirf tab chalta hai jab video
      // kam az kam ek baar connect ho chuka ho AND page genuinely visible ho
      // (Home/Recents dabane par false-trigger na ho).
      var checkCount = 0;
      var blackScreenObserver = setInterval(function() {
        try {
          if (!videoEverConnected) {
            checkCount = 0;
            return;
          }
          if (document.hidden || document.visibilityState !== 'visible') {
            checkCount = 0;
            return;
          }
          var videos = document.querySelectorAll('video');
          var anyPlaying = false;
          videos.forEach(function(v) {
            if (v.srcObject && v.readyState >= 2 && !v.paused) anyPlaying = true;
          });
          var hasLeaveDialog = !!document.querySelector(
            '[class*="leave"], [class*="hangup"], [aria-label*="Leave" i], [aria-label*="hang up" i]'
          );
          if (!anyPlaying && hasLeaveDialog) {
            checkCount++;
            if (checkCount >= 6) {
              sendHangUp();
              clearInterval(blackScreenObserver);
            }
          } else {
            checkCount = 0;
          }
        } catch (err) {}
      }, 500);

      document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible') checkCount = 0;
      });

      // 3. Jitsi native postMessage events
      window.addEventListener('message', function(e) {
        try {
          var data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
          // FIX: Jitsi ka official "participantJoined" event - sabse
          // reliable signal ke dusra banda genuinely call mein aa chuka hai.
          // Video-count heuristic ke sath redundant backup ke taur par.
          if (data.event === 'participantJoined') {
            markVideoConnected();
          }
          if (
            data.event === 'readyToClose' ||
            data.event === 'videoConferenceLeft' ||
            data.event === 'HANG_UP'
          ) { sendHangUp(); }
        } catch(err) {}
      });

      // 4. URL polling fallback
      setInterval(function() {
        try {
          var url = window.location.href.split('#')[0];
          var isOnServer = url.startsWith(baseUrl);
          var hasRoom = url.indexOf(encodedRoom) !== -1 || url.indexOf(rawRoom) !== -1;
          if (isOnServer && !hasRoom) { sendHangUp(); }
        } catch(err) {}
      }, 500);

    })();
    true;
  `;

  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const parsed = JSON.parse(event.nativeEvent.data);

      if (parsed.event === 'DEBUG') {
        console.log('[Screen2MeCall][WebView DEBUG]', parsed.msg);
        return;
      }

      if (parsed.event === 'TRACK_REFRESH_OK') {
        // In-place camera refresh kaamyab - remount fallback cancel karo,
        // call bina rejoin kiye chalti rahegi.
        if (trackRefreshFallbackRef.current) {
          clearTimeout(trackRefreshFallbackRef.current);
          trackRefreshFallbackRef.current = null;
        }
        console.log('[Screen2MeCall] in-place camera track refresh succeeded, no rejoin needed');
        return;
      }

      if (parsed.event === 'TRACK_REFRESH_FAIL') {
        // WebView ne khud bata diya ke refresh nahi ho saka - fallback
        // timer ka wait mat karo, turant remount karo.
        if (trackRefreshFallbackRef.current) {
          clearTimeout(trackRefreshFallbackRef.current);
          trackRefreshFallbackRef.current = null;
        }
        console.log('[Screen2MeCall] in-place camera track refresh failed, remounting');
        connectedRef.current = false;
        setRetryCount(0);
        setWebviewKey((k) => k + 1);
        return;
      }

      if (parsed.event === 'VIDEO_CONNECTED') {
        connectedRef.current = true;
        clearWatchdog();
        onConnected?.();
        return;
      }

      if (parsed.event === 'OPEN_EXTERNAL' && parsed.url) {
        // Invite/share link - bahar khol do, call ko hangup mat karo
        Linking.openURL(parsed.url).catch(() => {});
        return;
      }

      if (parsed.event === 'HANG_UP' && onHangUp) {
        console.log('[Screen2MeCall] HANG_UP received from WebView');
        clearWatchdog();
        // Thoda delay taake camera/mic Android level pe release hone ka
        // time mil jaye, agle call mein "camera in use" wala masla na aaye
        setTimeout(() => onHangUp(), 400);
      }
    } catch {}
  };

  if (loadError) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>{loadError}</Text>
          <Pressable style={styles.retryButton} onPress={handleManualRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (showRetryUI) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Call is not connecting..</Text>
          <Pressable style={styles.retryButton} onPress={handleManualRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        key={webviewKey}
        source={{ uri: sessionUrl }}
        style={styles.webview}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        mediaCapturePermissionGrantType="grant"
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsProtectedMedia={true}
        setSupportMultipleWindows={false}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.loadingText}>Connecting call...</Text>
          </View>
        )}
        injectedJavaScript={injectedJavaScript}
        onMessage={handleMessage}
        onOpenWindow={() => onHangUp?.()}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.log('[Screen2MeCall] WebView onError:', JSON.stringify(nativeEvent));
          clearWatchdog();
          setLoadError('No internet connection. Please check your network and try again.');
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.log('[Screen2MeCall] WebView onHttpError:', JSON.stringify(nativeEvent));
          // 5xx = server-side problem; 4xx on the top-level page load is
          // also treated as a hard failure. (Sub-resource 4xx, e.g. a
          // missing favicon, would arrive here too, but pointing the user
          // at "Retry" is still the safe default rather than staying
          // silent.)
          if (nativeEvent.statusCode >= 400) {
            clearWatchdog();
            setLoadError('Call server is not reachable right now. Please try again.');
          }
        }}
        onNavigationStateChange={(navState) => {
          if (isPostCallRedirect(navState.url)) onHangUp?.();
        }}
        onShouldStartLoadWithRequest={(request) => {
          if (isPostCallRedirect(request.url)) {
            onHangUp?.();
            return false;
          }
          // Mailto / external share scheme links - WebView ke andar load mat
          // karo, RN ko handle karne do (Linking), call ko mat chuo
          if (
            request.url.startsWith('mailto:') ||
            request.url.startsWith('intent:') ||
            request.url.startsWith('tel:')
          ) {
            Linking.openURL(request.url).catch(() => {});
            return false;
          }
          return (
            request.url.startsWith('http://') ||
            request.url.startsWith('https://')
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  webview: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 14,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#2C64B3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});