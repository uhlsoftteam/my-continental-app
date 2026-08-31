import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import { verifyPin, selectPatient, registerPatient } from "../services/api";
import { getOrCreateDeviceId, clearPinEnabledPhone, getPatientPhone, setPatientPhone, clearDeviceLinkedUhids, setToken } from "../utils/storage";

export const VerifyPinScreen = ({ route, navigation }: any) => {
  const { phone } = route.params;
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

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
    if (pin.length !== 4) {
      setError("PIN must be 4 digits");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const deviceId = await getOrCreateDeviceId();
      const verifyRes = await verifyPin(phone, deviceId, pin);
      
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
      
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Invalid PIN";
      
      if (msg === "Invalid PIN or device") {
        await clearPinEnabledPhone();
        setError("Session expired. Please login via OTP again.");
        setTimeout(() => {
          navigation.navigate("Login");
        }, 2000);
      } else {
        setError(msg);
        setPin("");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginWithOtp = () => {
    navigation.navigate("Login");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        
        <View style={styles.formContainer}>
          <Text style={styles.title}>Enter your PIN</Text>
          <Text style={styles.subtitle}>
            Welcome back! Enter your 4-digit PIN to login securely.
          </Text>

          <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
            <TextInput
              style={styles.input}
              placeholder="• • • •"
              placeholderTextColor={colors.gray400}
              keyboardType="number-pad"
              value={pin}
              onChangeText={setPin}
              maxLength={4}
              secureTextEntry
              autoFocus
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
              <Text style={styles.buttonText}>Login with PIN</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.otpButton}
            onPress={handleLoginWithOtp}
            disabled={isLoading}
          >
            <Text style={styles.otpButtonText}>Forgot PIN? Login with OTP</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  innerContainer: { flex: 1, paddingHorizontal: 24 },
  formContainer: { flex: 1, justifyContent: "center", paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: "bold", color: colors.gray900, marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 14, color: colors.gray500, marginBottom: 36, lineHeight: 20, textAlign: "center" },
  inputWrapper: { borderWidth: 1, borderColor: colors.gray300, borderRadius: 8, paddingHorizontal: 16, height: 52, backgroundColor: "#F9FAFB", justifyContent: "center", alignItems: "center", marginBottom: 16 },
  inputError: { borderColor: colors.error, backgroundColor: "#FEF2F2" },
  input: { fontSize: 24, color: colors.gray900, fontWeight: "600", letterSpacing: 8, textAlign: "center" },
  errorText: { color: colors.error, fontSize: 12, marginBottom: 16, textAlign: "center" },
  button: { backgroundColor: colors.primary, height: 52, borderRadius: 8, alignItems: "center", justifyContent: "center", marginTop: 16 },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: "600" },
  otpButton: { height: 52, borderRadius: 8, alignItems: "center", justifyContent: "center", marginTop: 8 },
  otpButtonText: { color: colors.primary, fontSize: 14, fontWeight: "600" },
});
