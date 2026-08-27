import axios from 'axios';

// Replace with your actual backend URL or use .env
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const sendOtp = async (phone: string) => {
  const response = await api.post('/patient-auth/send-otp', { phone });
  return response.data;
};

export const verifyOtp = async (phone: string, otp: string) => {
  const response = await api.post('/patient-auth/verify-otp', { phone, otp });
  return response.data;
};

export const setupPin = async (deviceId: string, pin: string) => {
  const response = await api.post('/patient-auth/setup-pin', { deviceId, pin });
  return response.data;
};

export const verifyPin = async (phone: string, deviceId: string, pin: string) => {
  const response = await api.post('/patient-auth/verify-pin', { phone, deviceId, pin });
  return response.data;
};

export const selectPatient = async (data: any) => {
  const response = await api.post('/patient-auth/select-patient', data);
  return response.data;
};

export const registerPatient = async (data: any) => {
  const response = await api.post('/patient-auth/register', data);
  return response.data;
};
