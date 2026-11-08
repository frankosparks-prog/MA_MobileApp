import React, { useEffect, useRef } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { registerAudioListener, AudioCommand } from '../services/soundService';

let WebViewComponent: any = null;
if (Platform.OS !== 'web') {
  try {
    WebViewComponent = require('react-native-webview').WebView;
  } catch (e) {
    WebViewComponent = null;
  }
}

/**
 * HeadlessAudioPlayer executes zero-native-dependency audio on iOS and Android
 * using an invisible WebView host that runs the Web Audio API without requiring
 * deprecated or missing native audio modules (e.g. ExponentAV).
 */
export const HeadlessAudioPlayer: React.FC = () => {
  if (Platform.OS === 'web' || !WebViewComponent) {
    return null;
  }

  const webViewRef = useRef<any>(null);

  useEffect(() => {
    const unsubscribe = registerAudioListener((cmd: AudioCommand) => {
      if (webViewRef.current) {
        const payload = JSON.stringify(cmd);
        const script = `
          if (window.playAudioCommand) {
            window.playAudioCommand(${payload});
          }
          true;
        `;
        webViewRef.current.injectJavaScript(script);
      }
    });

    return unsubscribe;
  }, []);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      </head>
      <body style="background:transparent; margin:0; padding:0; overflow:hidden;">
        <script>
          let audioCtx = null;
          function getAudioContext() {
            if (!audioCtx) {
              const AudioContextClass = window.AudioContext || window.webkitAudioContext;
              if (AudioContextClass) {
                audioCtx = new AudioContextClass();
              }
            }
            if (audioCtx && audioCtx.state === 'suspended') {
              audioCtx.resume();
            }
            return audioCtx;
          }

          function playTone(freq, type, dur, delay) {
            setTimeout(function() {
              try {
                const ctx = getAudioContext();
                if (!ctx) return;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = type || 'sine';
                osc.frequency.setValueAtTime(freq, ctx.currentTime);
                gain.gain.setValueAtTime(0.35, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + dur);
              } catch(e) {}
            }, delay || 0);
          }

          window.playAudioCommand = function(cmd) {
            try {
              if (!cmd || !cmd.type) return;
              if (cmd.type === 'chime') {
                playTone(528, 'sine', 0.8, 0);
                playTone(660, 'sine', 0.6, 180);
                playTone(792, 'sine', 0.9, 360);
              } else if (cmd.type === 'piano') {
                playTone(440, 'triangle', 1.0, 0);
                playTone(554.37, 'triangle', 1.0, 0);
                playTone(659.25, 'triangle', 1.2, 0);
              } else if (cmd.type === 'heartbeat') {
                playTone(85, 'sine', 0.18, 0);
                playTone(72, 'sine', 0.22, 140);
                playTone(85, 'sine', 0.18, 500);
                playTone(72, 'sine', 0.22, 640);
              } else if (cmd.type === 'splash') {
                playTone(320, 'sine', 0.22, 0);
                playTone(480, 'triangle', 0.28, 80);
                playTone(720, 'sine', 0.5, 180);
              }
            } catch (err) {}
          };
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.hiddenContainer} pointerEvents="none">
      <WebViewComponent
        ref={webViewRef}
        source={{ html }}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        scrollEnabled={false}
        style={styles.webView}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  hiddenContainer: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    bottom: -50,
    left: -50,
    overflow: 'hidden',
  },
  webView: {
    width: 1,
    height: 1,
    backgroundColor: 'transparent',
  },
});

