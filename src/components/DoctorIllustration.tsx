import React, { useMemo } from 'react';
import { View, Platform, StyleProp, ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { doctorReportSvg } from '../assets/doctorReportSvg';

let WebViewComponent: any = null;
if (Platform.OS !== 'web') {
  try {
    // Dynamically require react-native-webview on native platforms
    WebViewComponent = require('react-native-webview').WebView;
  } catch (e) {
    WebViewComponent = null;
  }
}

interface DoctorIllustrationProps {
  style?: StyleProp<ViewStyle>;
  width?: number;
  height?: number;
}

export const DoctorIllustration: React.FC<DoctorIllustrationProps> = ({
  style,
  width = 240,
  height = 220,
}) => {
  // 1. Web Platform: Render inline SVG with full SMIL animation support
  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          {
            width,
            height,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          },
          style,
        ]}
        {...({
          dangerouslySetInnerHTML: { __html: doctorReportSvg },
        } as any)}
      />
    );
  }

  // 2. Native Mobile (iOS / Android / Expo Go):
  // react-native-svg ignores SMIL <animate> and <animateTransform> tags on native.
  // Using an unbordered, transparent WebView executes all 81 SMIL animations at 60 FPS.
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
  ${doctorReportSvg}
</body>
</html>`;
  }, []);

  if (WebViewComponent) {
    return (
      <View
        style={[
          {
            width,
            height,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transparent',
            overflow: 'hidden',
          },
          style,
        ]}
        pointerEvents="none"
      >
        <WebViewComponent
          originWhitelist={['*']}
          source={{ html: htmlContent }}
          style={{
            width,
            height,
            backgroundColor: 'transparent',
          }}
          containerStyle={{
            backgroundColor: 'transparent',
          }}
          androidLayerType="hardware"
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
          scalesPageToFit={false}
        />
      </View>
    );
  }

  // 3. Fallback to static SvgXml if WebView is not available
  return (
    <View
      style={[
        { width, height, alignItems: 'center', justifyContent: 'center' },
        style,
      ]}
      pointerEvents="none"
    >
      <SvgXml xml={doctorReportSvg} width={width} height={height} />
    </View>
  );
};
