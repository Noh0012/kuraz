import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogoLockup, LogoMark } from '@/brand/Logo';
import { gradients } from '@/theme/tokens';

/** Full-screen brand splash: blue gradient, big lamp mark, tile + wordmark at the bottom. */
export function BrandSplash() {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient colors={gradients.splash} style={StyleSheet.absoluteFill}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <LogoMark size={190} />
      </View>
      <View style={{ alignItems: 'center', paddingBottom: insets.bottom + 48 }}>
        <LogoLockup size={56} />
      </View>
    </LinearGradient>
  );
}

/**
 * Keeps the brand splash on top of the freshly mounted app for a moment, then fades it out.
 * (Expo Go shows only the app icon as the native splash, so this is what students see first.)
 */
export function SplashOverlay({ holdMs = 900 }: { holdMs?: number }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const [done, setDone] = useState(false);

  useEffect(() => {
    const anim = Animated.sequence([
      Animated.delay(holdMs),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 420, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.08, duration: 420, useNativeDriver: true }),
      ]),
    ]);
    anim.start(() => setDone(true));
    return () => anim.stop();
  }, [holdMs, opacity, scale]);

  if (done) return null;
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity, transform: [{ scale }] }]}>
      <BrandSplash />
    </Animated.View>
  );
}
