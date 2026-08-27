import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';
import { colors } from '../theme/colors';
import { verifyOtp } from '../services/api';

export const OtpVerificationScreen = ({ route, navigation }: any) => {
  const { phone } = route.params;
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }
    setError('');
    setIsLoading(true);
    
    try {
      await verifyOtp(phone, otp);
      // For now, skip PIN setup and go straight to Home
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid OTP';
      setError(msg);
      // For demo:
      // navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Change Number</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Verify Number</Text>
        <Text style={styles.subtitle}>We sent a code to {phone}.</Text>

        <Text style={styles.label}>SECURITY CODE</Text>
        <View style={[styles.inputContainer, error ? styles.inputError : null]}>
          <TextInput
            style={styles.input}
            placeholder="• • • • • •"
            placeholderTextColor={colors.gray300}
            keyboardType="number-pad"
            value={otp}
            onChangeText={setOtp}
            maxLength={6}
            secureTextEntry
          />
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleVerify}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>
        
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive it? </Text>
          <TouchableOpacity disabled={countdown > 0}>
            <Text style={[styles.resendLink, countdown > 0 && styles.resendDisabled]}>
              {countdown > 0 ? `Resend in ${countdown}s` : 'Resend'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    padding: 30,
    justifyContent: 'center',
  },
  backButton: {
    marginBottom: 40,
  },
  backButtonText: {
    color: colors.gray500,
    fontWeight: 'bold',
    fontSize: 14,
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
    marginBottom: 40,
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
    borderBottomWidth: 2,
    borderColor: colors.gray200,
    paddingBottom: 10,
    marginBottom: 8,
  },
  inputError: {
    borderColor: colors.error,
  },
  input: {
    fontSize: 32,
    color: colors.gray900,
    fontWeight: 'bold',
    letterSpacing: 10,
    textAlign: 'center',
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginBottom: 16,
    textAlign: 'center',
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
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  resendText: {
    color: colors.gray500,
    fontSize: 14,
  },
  resendLink: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  resendDisabled: {
    color: colors.gray400,
  },
});
