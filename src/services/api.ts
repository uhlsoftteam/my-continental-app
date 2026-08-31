import axios from 'axios';

// Hardcoding IP to bypass Expo/Metro bundler cache of old .env values
const BASE_URL = 'http://10.200.117.240:5000/dev/api/';

export const api = axios.create({
  baseURL: BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`,
  headers: {
    'Content-Type': 'application/json',
  },
});

import { getToken } from '../utils/storage';

api.interceptors.request.use(async (config) => {
  try {
    const token = await getToken();
    if (token && config.headers) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
  } catch (e) {}
  return config;
});

export const sendOtp = async (phone: string, deviceId: string, force?: boolean) => {
  const response = await api.post('patient-auth/send-otp', { phone, deviceId, force });
  return response.data;
};

export const verifyOtp = async (phone: string, otp: string) => {
  const response = await api.post('patient-auth/verify-otp', { phone, otp });
  return response.data;
};

export const setupPin = async (deviceId: string, pin: string) => {
  const response = await api.post('patient-auth/setup-pin', { deviceId, pin });
  return response.data;
};

export const verifyPin = async (phone: string, deviceId: string, pin: string) => {
  const response = await api.post('patient-auth/verify-pin', { phone, deviceId, pin });
  return response.data;
};

export const selectPatient = async (data: any) => {
  const response = await api.post('patient-auth/select-patient', data);
  return response.data;
};

export const registerPatient = async (data: any) => {
  const response = await api.post('patient-auth/register', data);
  return response.data;
};

export const getCandidates = async () => {
  const response = await api.get('patient-auth/candidates');
  return response.data;
};

export const switchPatient = async (data: any) => {
  const response = await api.post('patient-auth/switch-patient', data);
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('patient-auth/me');
  return response.data;
};

