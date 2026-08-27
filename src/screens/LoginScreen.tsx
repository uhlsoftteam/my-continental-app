import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ImageBackground, Image, SafeAreaView } from 'react-native';
import { colors } from '../theme/colors';
import { sendOtp } from '../services/api';

const BG_IMAGE = 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?ixlib=rb-4.0.3&auto=format&fit=crop&w=2128&q=80';

export const LoginScreen = ({ navigation }: any) => {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    if (!phone || phone.length < 11) {
      setError('Please enter a valid phone number');
      return;
    }
    setError('');
    
    // Check if phone has pin enabled locally (simplified)
    // Normally we'd use AsyncStorage to check if this device has a PIN for this phone.
    
    setIsLoading(true);
    try {
      await sendOtp(phone);
      navigation.navigate('OtpVerification', { phone });
    } catch (err: any) {
      // For now, if the API fails, we still navigate just for testing the flow if it's a dummy API,
      // but in real world we show error. Let's show error.
      const msg = err.response?.data?.message || 'Failed to send OTP';
      setError(msg);
      // For demo purposes, we can navigate anyway to demonstrate the flow if no real API:
      // navigation.navigate('OtpVerification', { phone });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ImageBackground source={{ uri: BG_IMAGE }} style={styles.background}>
      <View style={styles.overlay} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.card}>
            {/* Logo placeholder - replace with actual local logo */}
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>Continental Hospital</Text>
            </View>

            <Text style={styles.title}>Patient Login</Text>
            <Text style={styles.subtitle}>Enter your registered mobile number to continue.</Text>

            <Text style={styles.label}>PHONE NUMBER</Text>
            <View style={[styles.inputContainer, error ? styles.inputError : null]}>
              <Text style={styles.prefix}>📞</Text>
              <TextInput
                style={styles.input}
                placeholder="017XXXXXXXX"
                placeholderTextColor={colors.gray400}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                maxLength={11}
              />
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity 
              style={styles.button} 
              onPress={handleContinue}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.buttonText}>Continue</Text>
              )}
            </TouchableOpacity>
            
            <Text style={styles.copyright}>© {new Date().getFullYear()} Continental Hospital</Text>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primaryDark,
    opacity: 0.85,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 30,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.gray900,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray500,
    marginBottom: 32,
    lineHeight: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.gray500,
    marginBottom: 8,
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderColor: colors.gray200,
    paddingBottom: 10,
    marginBottom: 8,
  },
  inputError: {
    borderColor: colors.error,
  },
  prefix: {
    fontSize: 18,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: colors.gray900,
    fontWeight: '500',
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginBottom: 16,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  copyright: {
    textAlign: 'center',
    color: colors.gray400,
    fontSize: 10,
    marginTop: 30,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
