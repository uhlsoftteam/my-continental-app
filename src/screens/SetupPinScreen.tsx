import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { colors } from "../theme/colors";
import { setupPin } from "../services/api";
import { getOrCreateDeviceId, setPinEnabledPhone } from "../utils/storage";

export const SetupPinScreen = ({ route, navigation }: any) => {
  const { phone } = route.params;
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSetup = async () => {
    if (pin.length !== 4) {
      setError("PIN must be 4 digits");
      return;
    }
    if (pin !== confirmPin) {
      setError("PINs do not match");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const deviceId = await getOrCreateDeviceId();
      await setupPin(deviceId, pin);
      await setPinEnabledPhone(phone);
      
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to set PIN";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    navigation.reset({ index: 0, routes: [{ name: "Home" }] });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        
        <View style={styles.formContainer}>
          <Text style={styles.title}>Secure Your Account</Text>
          <Text style={styles.subtitle}>
            Create a 4-digit PIN for faster logins on this device.
          </Text>

          <Text style={styles.label}>Enter 4-Digit PIN</Text>
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
            />
          </View>

          <Text style={styles.label}>Confirm PIN</Text>
          <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
            <TextInput
              style={styles.input}
              placeholder="• • • •"
              placeholderTextColor={colors.gray400}
              keyboardType="number-pad"
              value={confirmPin}
              onChangeText={setConfirmPin}
              maxLength={4}
              secureTextEntry
            />
          </View>
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={styles.button}
            onPress={handleSetup}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>Set PIN & Continue</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            disabled={isLoading}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
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
  label: { fontSize: 12, fontWeight: "600", color: colors.gray700, marginBottom: 8, textAlign: "center" },
  inputWrapper: { borderWidth: 1, borderColor: colors.gray300, borderRadius: 8, paddingHorizontal: 16, height: 52, backgroundColor: "#F9FAFB", justifyContent: "center", alignItems: "center", marginBottom: 16 },
  inputError: { borderColor: colors.error, backgroundColor: "#FEF2F2" },
  input: { fontSize: 24, color: colors.gray900, fontWeight: "600", letterSpacing: 8, textAlign: "center" },
  errorText: { color: colors.error, fontSize: 12, marginBottom: 16, textAlign: "center" },
  button: { backgroundColor: colors.primary, height: 52, borderRadius: 8, alignItems: "center", justifyContent: "center", marginTop: 16 },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: "600" },
  skipButton: { height: 52, borderRadius: 8, alignItems: "center", justifyContent: "center", marginTop: 8 },
  skipButtonText: { color: colors.gray600, fontSize: 16, fontWeight: "600" },
});
