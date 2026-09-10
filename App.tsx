import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { navigationRef } from './src/navigation/navigationRef';
import { StatusBar } from 'react-native';
import { AnimatedSplashScreen } from './src/screens/AnimatedSplashScreen';

export default function App() {
  const [isSplashReady, setIsSplashReady] = React.useState(false);

  return (
    <>
      <NavigationContainer ref={navigationRef}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <AppNavigator />
      </NavigationContainer>

      {!isSplashReady && (
        <AnimatedSplashScreen onAnimationComplete={() => setIsSplashReady(true)} />
      )}
    </>
  );
}
