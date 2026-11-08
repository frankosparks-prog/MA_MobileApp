import React, { useMemo, useEffect, useRef } from 'react';
import { View, Platform, StyleProp, ViewStyle, Animated } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { plantSvg } from '../assets/plantSvg';

let WebViewComponent: any = null;
if (Platform.OS !== 'web') {
  try {
    WebViewComponent = require('react-native-webview').WebView;
  } catch (e) {
    WebViewComponent = null;
  }
}

/**
 * Total animation duration of plant.svg is exactly 3.333 seconds (100 frames @ 30fps).
 * Every SMIL <animate> and <animateTransform> has dur="3.333s" begin="0s".
 * We divide this time across 0-100% adherence so the plant grows progressively
 * as medication is taken, instead of looping continuously on repeat.
 */
export const PLANT_SVG_TOTAL_DURATION_SEC = 3.333;

interface PlantIllustrationProps {
  style?: StyleProp<ViewStyle>;
  size?: number;
  width?: number;
  height?: number;
  /**
   * Adherence growth percentage (0 to 100).
   * Determines the exact morphological growth stage in plant.svg:
   * t = (progress / 100) * 3.333 seconds
   */
  progress?: number;
  /**
   * Enable soft living breathing / swaying aura
   */
  breathe?: boolean;
}

export const PlantIllustration: React.FC<PlantIllustrationProps> = ({
  style,
  size = 150,
  width,
  height,
  progress = 75,
  breathe = true,
}) => {
  const w = width ?? size;
  const h = height ?? size;

  // Clamped adherence progress between 5% (seedling sprout) and 100% (full mature bloom)
  const clampedProgress = Math.max(5, Math.min(100, progress));
  const targetSeconds = (clampedProgress / 100) * PLANT_SVG_TOTAL_DURATION_SEC;

  const webContainerRef = useRef<any>(null);
  const webViewRef = useRef<any>(null);
  const prevProgressRef = useRef(clampedProgress);

  // Subtle living breathing pulse animation for the botanical organism
  const breatheAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!breathe) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1.03,
          duration: 2800,
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 0.98,
          duration: 2800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [breathe, breatheAnim]);

  // 1. Web Platform: Pause repeating animation and seek to target adherence second
  useEffect(() => {
    if (Platform.OS !== 'web' || !webContainerRef.current) return;

    const container = webContainerRef.current;
    const svg = container.querySelector('svg');
    if (!svg) return;

    if (typeof svg.pauseAnimations === 'function') {
      svg.pauseAnimations();
    }

    if (typeof svg.setCurrentTime === 'function') {
      const prevSeconds = (prevProgressRef.current / 100) * PLANT_SVG_TOTAL_DURATION_SEC;
      const startT = prevSeconds !== targetSeconds ? prevSeconds : targetSeconds;
      const endT = targetSeconds;
      const durationMs = 1000;
      const startTime = performance.now();

      function step(now: number) {
        const elapsed = now - startTime;
        const p = Math.min(elapsed / durationMs, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        const curT = startT + (endT - startT) * ease;
        try {
          svg.setCurrentTime(curT);
        } catch (e) {}

        if (p < 1) {
          requestAnimationFrame(step);
        } else {
          try {
            svg.setCurrentTime(endT);
            svg.pauseAnimations();
          } catch (e) {}
        }
      }

      requestAnimationFrame(step);
    }

    prevProgressRef.current = clampedProgress;
  }, [targetSeconds, clampedProgress]);

  // Update native WebView when progress changes dynamically
  useEffect(() => {
    if (Platform.OS !== 'web' && webViewRef.current) {
      const script = `
        if (typeof window.seekPlantProgress === 'function') {
          window.seekPlantProgress(${targetSeconds.toFixed(3)});
        }
        true;
      `;
      webViewRef.current.injectJavaScript(script);
      prevProgressRef.current = clampedProgress;
    }
  }, [targetSeconds, clampedProgress]);

  // 2. Web Platform Render
  if (Platform.OS === 'web') {
    return (
      <Animated.View
        style={[
          {
            width: w,
            height: h,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transform: [{ scale: breatheAnim }],
          },
          style,
        ]}
      >
        <div
          ref={webContainerRef}
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          dangerouslySetInnerHTML={{ __html: plantSvg }}
        />
      </Animated.View>
    );
  }

  // 3. Native Mobile (iOS / Android / Expo Go):
  // Renders inside an unbordered transparent WebView where SMIL animations
  // are paused and frozen at the calculated second corresponding to adherence
  const htmlContent = useMemo(() => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      user-select: none;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: transparent !important;
      background-color: transparent !important;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    svg {
      width: 100%;
      height: 100%;
      max-width: 100%;
      max-height: 100%;
      display: block;
    }
  </style>
</head>
<body style="background: transparent; background-color: transparent;">
  ${plantSvg}
  <script>
    const TOTAL_DURATION = 3.333;
    let targetTime = ${targetSeconds.toFixed(3)};

    window.seekPlantProgress = function(newTime) {
      const svg = document.querySelector('svg');
      if (!svg) return;
      if (typeof svg.pauseAnimations === 'function') {
        svg.pauseAnimations();
      }
      if (typeof svg.setCurrentTime === 'function') {
        const startT = svg.getCurrentTime() || 0;
        const endT = Math.min(newTime, TOTAL_DURATION);
        const durationMs = 1200;
        const startTime = performance.now();

        function step(now) {
          const elapsed = now - startTime;
          const p = Math.min(elapsed / durationMs, 1);
          const ease = 1 - Math.pow(1 - p, 3);
          const curT = startT + (endT - startT) * ease;
          try {
            svg.setCurrentTime(curT);
          } catch(e) {}
          if (p < 1) {
            requestAnimationFrame(step);
          } else {
            try {
              svg.setCurrentTime(endT);
              svg.pauseAnimations();
            } catch(e) {}
          }
        }
        requestAnimationFrame(step);
      }
    };

    function initPlant() {
      const svg = document.querySelector('svg');
      if (!svg) {
        setTimeout(initPlant, 20);
        return;
      }
      if (typeof svg.pauseAnimations === 'function') {
        svg.pauseAnimations();
      }
      if (typeof svg.setCurrentTime === 'function') {
        svg.setCurrentTime(targetTime);
      }
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      initPlant();
    } else {
      window.addEventListener('DOMContentLoaded', initPlant);
    }
  </script>
</body>
</html>`;
  }, [targetSeconds]);

  if (WebViewComponent) {
    return (
      <Animated.View
        style={[
          {
            width: w,
            height: h,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transparent',
            overflow: 'hidden',
            transform: [{ scale: breatheAnim }],
          },
          style,
        ]}
        pointerEvents="none"
      >
        <WebViewComponent
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: htmlContent }}
          style={{
            width: w,
            height: h,
            backgroundColor: 'transparent',
          }}
          containerStyle={{
            backgroundColor: 'transparent',
          }}
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          scalesPageToFit={true}
          bounces={false}
          overScrollMode="never"
          androidLayerType="hardware"
        />
      </Animated.View>
    );
  }

  // 4. Fallback to SvgXml
  return (
    <View
      style={[
        {
          width: w,
          height: h,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
      pointerEvents="none"
    >
      <SvgXml xml={plantSvg} width={w} height={h} />
    </View>
  );
};
