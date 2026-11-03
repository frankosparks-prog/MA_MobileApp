import React, { useMemo } from 'react';
import { View, Platform, StyleProp, ViewStyle } from 'react-native';
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

interface PlantIllustrationProps {
  style?: StyleProp<ViewStyle>;
  size?: number;
  width?: number;
  height?: number;
}

export const PlantIllustration: React.FC<PlantIllustrationProps> = ({
  style,
  size = 140,
  width,
  height,
}) => {
  const w = width ?? size;
  const h = height ?? size;

  // 1. Web Platform: Direct inline SVG with full SMIL animation support
  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          {
            width: w,
            height: h,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          },
          style,
        ]}
        {...({
          dangerouslySetInnerHTML: { __html: plantSvg },
        } as any)}
      />
    );
  }

  // 2. Native Mobile (iOS / Android / Expo Go):
  // Renders inside an unbordered transparent WebView so all SMIL animations execute at 60 FPS
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
</body>
</html>`;
  }, []);

  if (WebViewComponent) {
    return (
      <View
        style={[
          {
            width: w,
            height: h,
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
      </View>
    );
  }

  // 3. Fallback to SvgXml
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

