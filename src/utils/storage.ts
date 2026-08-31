import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const DEVICE_ID_KEY = 'patientDeviceId';
const PIN_ENABLED_PHONE_KEY = 'pinEnabledPhone';

export const getOrCreateDeviceId = async (): Promise<string> => {
  try {
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = Crypto.randomUUID();
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  } catch (error) {
    console.error('Error getting/creating device ID:', error);
    // Fallback in case AsyncStorage fails (should not happen in normal conditions)
    return Crypto.randomUUID();
  }
};

export const setPinEnabledPhone = async (phone: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(PIN_ENABLED_PHONE_KEY, phone);
  } catch (error) {
    console.error('Error setting PIN enabled phone:', error);
  }
};

export const getPinEnabledPhone = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(PIN_ENABLED_PHONE_KEY);
  } catch (error) {
    console.error('Error getting PIN enabled phone:', error);
    return null;
  }
};

export const clearPinEnabledPhone = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(PIN_ENABLED_PHONE_KEY);
  } catch (error) {
    console.error('Error clearing PIN enabled phone:', error);
  }
};

// New functions for token, phone, and linked UHID management
const TOKEN_KEY = 'patientToken';
const PATIENT_PHONE_KEY = 'patientPhone';
const DEVICE_LINKED_UHIDS_KEY = 'deviceLinkedUhids';

export const setToken = async (token: string) => {
  try { await AsyncStorage.setItem(TOKEN_KEY, token); } catch (e) {}
};
export const getToken = async () => {
  try { return await AsyncStorage.getItem(TOKEN_KEY); } catch (e) { return null; }
};
export const removeToken = async () => {
  try { await AsyncStorage.removeItem(TOKEN_KEY); } catch (e) {}
};

export const setPatientPhone = async (phone: string) => {
  try { await AsyncStorage.setItem(PATIENT_PHONE_KEY, phone); } catch (e) {}
};
export const getPatientPhone = async () => {
  try { return await AsyncStorage.getItem(PATIENT_PHONE_KEY); } catch (e) { return null; }
};

export const getDeviceLinkedUhids = async (): Promise<string[]> => {
  try {
    const data = await AsyncStorage.getItem(DEVICE_LINKED_UHIDS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const addDeviceLinkedUhid = async (uhid: string) => {
  if (!uhid) return;
  try {
    const current = await getDeviceLinkedUhids();
    const updated = Array.from(new Set([...current, String(uhid)]));
    await AsyncStorage.setItem(DEVICE_LINKED_UHIDS_KEY, JSON.stringify(updated));
  } catch (e) {}
};

export const clearDeviceLinkedUhids = async () => {
  try { await AsyncStorage.removeItem(DEVICE_LINKED_UHIDS_KEY); } catch (e) {}
};
