import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import { verifyOtp, selectPatient, registerPatient } from "../services/api";
import { getOrCreateDeviceId, setPinEnabledPhone, getPatientPhone, setPatientPhone, clearDeviceLinkedUhids, setToken } from "../utils/storage";

export const OtpVerificationScreen = ({ route, navigation }: any) => {
  const { phone } = route.params;
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const processCandidates = async (patients: any[], deviceId: string) => {
    const unconfirmedLocal = patients.find((p: any) => p.source === "local" && !p.uhid);
    const confirmedLocal = patients.find((p: any) => p.source === "local" && p.uhid);
    const erpProfile = patients.find((p: any) => p.source === "erp");

    let finalRes;
    if (unconfirmedLocal) {
      finalRes = await selectPatient({
        phone,
        source: unconfirmedLocal.source,
        localId: unconfirmedLocal.localId || undefined,
        uhid: unconfirmedLocal.uhid || undefined,
        deviceId,
      });
    } else if (confirmedLocal || erpProfile) {
      finalRes = await registerPatient({
        phone,
        name: "New Patient",
        skipErpSync: true,
        deviceId,
        uhid: confirmedLocal?.uhid || erpProfile?.uhid,
        erpPatientId: confirmedLocal?.erpPatientId || erpProfile?.erpPatientId,
        gender: confirmedLocal?.gender || erpProfile?.gender,
        dateOfBirth: confirmedLocal?.dateOfBirth || erpProfile?.dateOfBirth,
        address: confirmedLocal?.address || erpProfile?.address,
      });
    } else {
      finalRes = await registerPatient({
        phone,
        name: "New Patient",
        deviceId,
      });
    }
    
    return finalRes;
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }
    setError("");
    setIsLoading(true);

    try {
      const verifyRes = await verifyOtp(phone, otp);
      const deviceId = await getOrCreateDeviceId();
      
      const finalRes = await processCandidates(verifyRes.patients || [], deviceId);
      
      // Save token
      if (finalRes.token) {
        await setToken(finalRes.token);
      }
      
      // Phone switch check for clearing linked UHIDs
      const prevPhone = await getPatientPhone();
      if (prevPhone && prevPhone !== phone) {
        await clearDeviceLinkedUhids();
      }
      await setPatientPhone(phone);
      
      const hasPin = finalRes.patient?.hasPin;
      console.log('Backend response finalRes:', JSON.stringify(finalRes, null, 2));
      console.log('hasPin resolved to:', hasPin);
      
      if (hasPin) {
        await setPinEnabledPhone(phone);
        navigation.reset({ index: 0, routes: [{ name: "Home" }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: "SetupPin", params: { phone } }] });
      }
      
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Invalid OTP";
      setError(msg);
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
            
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              >
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.title}>Verify Number</Text>
              <Text style={styles.subtitle}>
                We've sent a 6-digit verification code to {phone}.
              </Text>

              <Text style={styles.label}>Security Code</Text>
              <View
                style={[styles.inputWrapper, error ? styles.inputError : null]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="• • • • • •"
                  placeholderTextColor={colors.gray400}
                  keyboardType="number-pad"
                  value={otp}
                  onChangeText={setOtp}
                  maxLength={6}
                  textContentType="oneTimeCode"
                  autoComplete="sms-otp"
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
                  <Text style={styles.buttonText}>Verify & Login</Text>
                )}
              </TouchableOpacity>

              <View style={styles.resendContainer}>
                <Text style={styles.resendText}>Didn't receive the code? </Text>
                <TouchableOpacity disabled={countdown > 0}>
                  <Text
                    style={[
                      styles.resendLink,
                      countdown > 0 && styles.resendDisabled,
                    ]}
                  >
                    {countdown > 0 ? `Resend in ${countdown}s` : "Resend Now"}
                  </Text>
                </TouchableOpacity>
              </View>
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
  header: { marginTop: 20 },
  backButton: { paddingVertical: 8, alignSelf: "flex-start" },
  backButtonText: { color: colors.gray700, fontSize: 16, fontWeight: "500" },
  formContainer: { flex: 1, justifyContent: "center", paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: "bold", color: colors.gray900, marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.gray500, marginBottom: 36, lineHeight: 20 },
  label: { fontSize: 12, fontWeight: "600", color: colors.gray700, marginBottom: 8 },
  inputWrapper: { borderWidth: 1, borderColor: colors.gray300, borderRadius: 8, paddingHorizontal: 16, height: 52, backgroundColor: "#F9FAFB", justifyContent: "center", marginBottom: 8 },
  inputError: { borderColor: colors.error, backgroundColor: "#FEF2F2" },
  input: { fontSize: 20, color: colors.gray900, fontWeight: "600", letterSpacing: 4, textAlign: "center" },
  errorText: { color: colors.error, fontSize: 12, marginBottom: 16, marginTop: -4 },
  button: { backgroundColor: colors.primary, height: 52, borderRadius: 8, alignItems: "center", justifyContent: "center", marginTop: 16 },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: "600" },
  resendContainer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 32 },
  resendText: { color: colors.gray600, fontSize: 14 },
  resendLink: { color: colors.primary, fontWeight: "600", fontSize: 14 },
  resendDisabled: { color: colors.gray400 },
});
