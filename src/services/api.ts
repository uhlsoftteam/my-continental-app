import axios from 'axios';

// Hardcoding URL to bypass Expo/Metro bundler cache of old .env values
const BASE_URL = 'https://4aq2buqunf.execute-api.eu-north-1.amazonaws.com/dev/api';

export const api = axios.create({
  baseURL: BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`,
  headers: {
    'Content-Type': 'application/json',
  },
});

import { getToken, removeToken, clearPinEnabledPhone, clearDeviceLinkedUhids } from '../utils/storage';
import { resetToLogin } from '../navigation/navigationRef';
import { Alert, Platform } from 'react-native';

api.interceptors.request.use(async (config) => {
  try {
    const token = await getToken();
    if (token && config.headers) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
  } catch (e) {}
  return config;
});

api.interceptors.response.use(
  (response) => {
    // Also check if the body has a forceLogout flag (even on 200)
    if (response.data && response.data.forceLogout === true) {
      handleForceLogout(response.data.message);
      return Promise.reject(new Error(response.data.message));
    }
    return response;
  },
  async (error) => {
    if (error.response) {
      if (error.response.status === 401 || (error.response.data && error.response.data.forceLogout === true)) {
        const msg = error.response.data?.message || 'Session expired. Please log in again.';
        handleForceLogout(msg);
      }
    }
    return Promise.reject(error);
  }
);

const handleForceLogout = async (message: string) => {
  await removeToken();
  await clearPinEnabledPhone();
  await clearDeviceLinkedUhids();
  if (Platform.OS === 'web') {
    window.alert(message);
  } else {
    Alert.alert('Session Expired', message);
  }
  resetToLogin();
};

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

export const getDoctors = async () => {
  const response = await api.get('doctors');
  return response.data;
};

export const getDepartments = async () => {
  const response = await api.get('departments');
  return response.data;
};

export const createAppointment = async (data: any) => {
  const response = await api.post('appointments', data);
  return response.data;
};

export const getLabAnalysis = async (labTestCode: string | number) => {
  const response = await api.get('/ehr/lab/analysis', { params: { labTestCode } });
  return response.data;
};

export const getPackages = async (page: number = 1, limit: number = 6) => {
  const response = await api.get('packages', { params: { page, limit } });
  return response.data;
};

export const getErpPatient = async () => {
  const response = await api.get('ehr/patient');
  return response.data;
};

export const getErpAppointments = async (params: any = {}) => {
  const response = await api.get('/ehr/appointments', { params });
  return response.data;
};

export const getBills = async (params: any = {}) => {
  const response = await api.get('/ehr/bills', { params });
  return response.data;
};

export const getBasicLabReports = async (params: any = {}) => {
  const response = await api.get('/ehr/lab/reports/basic_search', { params });
  return response.data;
};

export const getPrescriptions = async (params: any = {}) => {
  const response = await api.get('/ehr/prescriptions', { params });
  return response.data;
};

export const getDischargeSummaries = async (params: any = {}) => {
  const response = await api.get('/ehr/discharge', { params });
  return response.data;
};

export const getLabResultsByReportId = async (labReportId: string | number) => {
  const response = await api.get(`/ehr/lab/results/${labReportId}`);
  return response.data;
};

export const downloadLabReportPdf = async (labReportId: string | number) => {
  const response = await api.get(`/ehr/lab/reports/lrId/${labReportId}`, {
    responseType: 'blob'
  });
  return response.data;
};


export const getLabResults = async (params: any = {}) => {
  const response = await api.get('/ehr/lab', { params });
  return response.data;
};

export const createEhrTempPatient = async (data: any) => {
  const response = await api.post('/ehr/temp-patients', data);
  return response.data;
};

export const getEhrTempPatients = async (params: any = {}) => {
  const response = await api.get('/ehr/temp-patients', { params });
  return response.data;
};

export const submitContactForm = async (data: any) => {
  const response = await api.post('contact', data);
  return response.data;
};




