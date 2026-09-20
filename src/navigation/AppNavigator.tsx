import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/LoginScreen';
import { RegistrationScreen } from '../screens/RegistrationScreen';
import { OtpVerificationScreen } from '../screens/OtpVerificationScreen';
import { MainTabNavigator } from './MainTabNavigator';
import { SetupPinScreen } from '../screens/SetupPinScreen';
import { VerifyPinScreen } from '../screens/VerifyPinScreen';
import { DoctorsScreen } from '../screens/DoctorsScreen';
import { AppointmentScreen } from '../screens/AppointmentScreen';
import { DoctorProfileScreen } from '../screens/DoctorProfileScreen';
import { RecordsScreen } from '../screens/RecordsScreen';
import { PackageDetailsScreen } from '../screens/PackageDetailsScreen';
import { ContactScreen } from '../screens/ContactScreen';
import { PendingsScreen } from '../screens/PendingsScreen';
import { LabRecordsScreen } from '../screens/LabRecordsScreen';
import { LabReportsScreen } from '../screens/LabReportsScreen';
import { LabReportDetailsScreen } from '../screens/LabReportDetailsScreen';
import { PrescriptionsScreen } from '../screens/PrescriptionsScreen';
import { DischargeSummariesScreen } from '../screens/DischargeSummariesScreen';

export type RootStackParamList = {
  Login: undefined;
  Registration: undefined;
  OtpVerification: { phone: string };
  SetupPin: { phone: string };
  VerifyPin: { phone: string };
  Home: undefined;
  Doctors: undefined;
  Appointment: { doctor: any };
  DoctorProfile: { doctor: any };
  Records: undefined;
  PackageDetails: { packageData: any };
  Contact: undefined;
  Pendings: undefined;
  LabRecords: undefined;
  LabReports: undefined;
  LabReportDetails: { reportId: string | number };
  Prescriptions: undefined;
  DischargeSummaries: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Registration" component={RegistrationScreen} />
      <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
      <Stack.Screen name="SetupPin" component={SetupPinScreen} />
      <Stack.Screen name="VerifyPin" component={VerifyPinScreen} />
      <Stack.Screen name="Home" component={MainTabNavigator} />
      <Stack.Screen name="Doctors" component={DoctorsScreen} />
      <Stack.Screen name="Appointment" component={AppointmentScreen} />
      <Stack.Screen name="DoctorProfile" component={DoctorProfileScreen} />
      <Stack.Screen name="Records" component={RecordsScreen} />
      <Stack.Screen name="PackageDetails" component={PackageDetailsScreen} />
      <Stack.Screen name="Contact" component={ContactScreen} />
      <Stack.Screen name="Pendings" component={PendingsScreen} />
      <Stack.Screen name="LabRecords" component={LabRecordsScreen} />
      <Stack.Screen name="LabReports" component={LabReportsScreen} />
      <Stack.Screen name="LabReportDetails" component={LabReportDetailsScreen} />
      <Stack.Screen name="Prescriptions" component={PrescriptionsScreen} />
      <Stack.Screen name="DischargeSummaries" component={DischargeSummariesScreen} />
    </Stack.Navigator>
  );
};




