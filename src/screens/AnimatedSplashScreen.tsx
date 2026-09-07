import React, { useEffect, useState } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

// Keep the native splash screen visible until we are ready to take over
SplashScreen.preventAutoHideAsync().catch(() => {});

interface Props {
  onAnimationComplete: () => void;
}

export const AnimatedSplashScreen = ({ onAnimationComplete }: Props) => {
  const [scale] = useState(new Animated.Value(1));
  const [opacity] = useState(new Animated.Value(1));

  useEffect(() => {
    // Hide the native splash screen. Since our view looks identical,
    // the transition to our React Native view is invisible to the user.
    SplashScreen.hideAsync().catch(() => {});

    Animated.sequence([
      Animated.delay(600), // Hold for a moment
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1.15,
          duration: 900,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 600,
          delay: 300,
          useNativeDriver: true,
        })
      ])
    ]).start(() => {
      onAnimationComplete();
    });
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.Image
        source={require('../../assets/continental_hospital.jpg')}
        style={[
          styles.logo,
          {
            opacity: opacity,
            transform: [{ scale: scale }]
          }
        ]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999, // Ensure it stays on top of the entire app
  },
  logo: {
    // By removing width: '100%' and height: '100%', 
    // React Native renders the required image at its exact native pixel dimensions,
    // which identically matches the OS-level static splash screen rendering!
  }
});
