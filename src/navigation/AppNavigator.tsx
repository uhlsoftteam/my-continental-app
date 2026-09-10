import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/LoginScreen';
import { OtpVerificationScreen } from '../screens/OtpVerificationScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { SetupPinScreen } from '../screens/SetupPinScreen';
import { VerifyPinScreen } from '../screens/VerifyPinScreen';
import { DoctorsScreen } from '../screens/DoctorsScreen';
import { AppointmentScreen } from '../screens/AppointmentScreen';
import { DoctorProfileScreen } from '../screens/DoctorProfileScreen';
import { RecordsScreen } from '../screens/RecordsScreen';
import { PackageDetailsScreen } from '../screens/PackageDetailsScreen';

export type RootStackParamList = {
  Login: undefined;
  OtpVerification: { phone: string };
  SetupPin: { phone: string };
  VerifyPin: { phone: string };
  Home: undefined;
  Doctors: undefined;
  Appointment: { doctor: any };
  DoctorProfile: { doctor: any };
  Records: undefined;
  PackageDetails: { packageData: any };
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
      <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
      <Stack.Screen name="SetupPin" component={SetupPinScreen} />
      <Stack.Screen name="VerifyPin" component={VerifyPinScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Doctors" component={DoctorsScreen} />
      <Stack.Screen name="Appointment" component={AppointmentScreen} />
      <Stack.Screen name="DoctorProfile" component={DoctorProfileScreen} />
      <Stack.Screen name="Records" component={RecordsScreen} />
      <Stack.Screen name="PackageDetails" component={PackageDetailsScreen} />
    </Stack.Navigator>
  );
};
