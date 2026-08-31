import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { colors } from "../theme/colors";
import { sendOtp } from "../services/api";
import { getOrCreateDeviceId, getPinEnabledPhone, clearPinEnabledPhone } from "../utils/storage";

export const LoginScreen = ({ navigation }: any) => {
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [pinEnabledPhoneState, setPinEnabledPhoneState] = useState<string | null>(null);

  useEffect(() => {
    getOrCreateDeviceId().then(setDeviceId);
  }, []);

  useFocusEffect(
    useCallback(() => {
      getPinEnabledPhone().then(setPinEnabledPhoneState);
    }, [])
  );

  const handleContinue = async (force: boolean = false) => {
    const digitsOnly = phone.replace(/\D/g, "");
    
    // Accept 10 digits (without 0) or 11 digits (with 0)
    if (digitsOnly.length === 10 || (digitsOnly.length === 11 && digitsOnly.startsWith("0"))) {
      setError("");
    } else {
      setError("Please enter a valid phone number");
      return;
    }

    // Always send the 11-digit format to the backend
    const formattedPhone = digitsOnly.length === 10 ? `0${digitsOnly}` : digitsOnly;

    // PIN bypass check
    if (formattedPhone === pinEnabledPhoneState && !force) {
      navigation.navigate("VerifyPin", { phone: formattedPhone });
      return;
    }

    setIsLoading(true);
    try {
      await sendOtp(formattedPhone, deviceId, force);
      navigation.navigate("OtpVerification", { phone: formattedPhone });
    } catch (err: any) {
      console.log('OTP Send Error:', err);
      
      if (err.response?.data?.status === "device_conflict") {
        Alert.alert(
          "Session Conflict",
          err.response?.data?.message || "You are logged in on another device. Logging in here will sign you out everywhere else. Do you want to continue?",
          [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Yes, login here", 
              style: "destructive",
              onPress: async () => {
                await clearPinEnabledPhone();
                handleContinue(true);
              }
            }
          ]
        );
      } else {
        const msg = err.response?.data?.message || err.message || "Failed to send OTP";
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.innerContainer}>
            
            <View style={styles.contentContainer}>
              <View style={styles.header}>
                <Image
                  source={require("../../assets/continental.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.formContainer}>
                <Text style={styles.title}>Welcome</Text>
                <Text style={styles.subtitle}>
                  Sign in to manage your health records and appointments.
                </Text>

                <Text style={styles.label}>Mobile Number</Text>
                <View
                  style={[styles.inputWrapper, error ? styles.inputError : null]}
                >
                  <Text style={styles.prefix}>+880</Text>
                  <View style={styles.divider} />
                  <TextInput
                    style={styles.input}
                    placeholder="17XXXXXXXX"
                    placeholderTextColor={colors.gray400}
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                    maxLength={10}
                  />
                </View>
                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <TouchableOpacity
                  style={styles.button}
                  onPress={() => handleContinue(false)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.buttonText}>Continue</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.footer}>
              <Text style={styles.copyright}>
                © {new Date().getFullYear()} Continental Hospital
              </Text>
            </View>

          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  keyboardView: { flex: 1 },
  innerContainer: { flex: 1, paddingHorizontal: 24 },
  contentContainer: { flex: 1, justifyContent: "center" },
  header: { alignItems: "center", marginBottom: 40 },
  logo: { width: 200, height: 60 },
  formContainer: {},
  title: { fontSize: 26, fontWeight: "bold", color: colors.gray900, marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.gray500, marginBottom: 36, lineHeight: 20 },
  label: { fontSize: 12, fontWeight: "600", color: colors.gray700, marginBottom: 8 },
  inputWrapper: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.gray300, borderRadius: 8, paddingHorizontal: 16, height: 52, backgroundColor: "#F9FAFB", marginBottom: 8 },
  inputError: { borderColor: colors.error, backgroundColor: "#FEF2F2" },
  prefix: { fontSize: 16, fontWeight: "500", color: colors.gray700 },
  divider: { width: 1, height: 24, backgroundColor: colors.gray300, marginHorizontal: 12 },
  input: { flex: 1, fontSize: 16, color: colors.gray900, fontWeight: "500" },
  errorText: { color: colors.error, fontSize: 12, marginBottom: 16, marginTop: -4 },
  button: { backgroundColor: colors.primary, height: 52, borderRadius: 8, alignItems: "center", justifyContent: "center", marginTop: 16 },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: "600" },
  footer: { paddingBottom: 24, alignItems: "center" },
  copyright: { color: colors.gray400, fontSize: 12 },
});
