import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
  ActivityIndicator,
  Modal,
  FlatList
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createEhrTempPatient, getMe, getEhrTempPatients } from '../services/api';
import { useNavigation } from '@react-navigation/native';
import { getPatientPhone } from '../utils/storage';
import DateTimePicker from '@react-native-community/datetimepicker';

export const RegistrationScreen = () => {
  const navigation = useNavigation();
  const [activeStep, setActiveStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [patientPortalId, setPatientPortalId] = useState('');
  const [tempPatients, setTempPatients] = useState<any[]>([]);
  const [totalTempCount, setTotalTempCount] = useState(0);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [isFetchingPending, setIsFetchingPending] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      updateForm('dob', `${year}-${month}-${day}`);
    }
  };
  
  const [formData, setFormData] = useState({
    fullName: '',
    dob: '',
    genderId: '1',
    fatherName: '',
    motherName: '',
    mobile: '',
    email: '',
    nid: '',
    streetAddress: '',
    kinName: '',
    kinRelationId: '1',
    kinAddressMobile: '',
    termsAndConditions: false,
  });

  React.useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const phone = await getPatientPhone();
        if (phone) {
          setFormData(prev => ({ ...prev, mobile: phone }));
        }
        const meRes = await getMe();
        if (meRes && meRes.patient && meRes.patient._id) {
          setPatientPortalId(meRes.patient._id);
        }
        
        // Fetch pending patients
        if (phone) {
          setIsFetchingPending(true);
          try {
            const tempRes = await getEhrTempPatients({
              page: 1,
              limit: 50,
              orderBy: "id",
              dir: "desc",
              mobile: phone
            });
            if (tempRes?.data) {
              setTempPatients(tempRes.data.data || []);
              setTotalTempCount(tempRes.data.totalCount || 0);
            }
          } catch (e) {
            console.error('Failed to load pending patients', e);
          } finally {
            setIsFetchingPending(false);
          }
        }
      } catch (e) {
        console.error('Failed to load patient data', e);
      }
    };
    fetchPatientData();
  }, []);

  const updateForm = (key: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (activeStep === 1) {
      if (!formData.fullName || !formData.dob || !formData.mobile) {
        Alert.alert('Error', 'Please fill all required fields (Name, DOB, Mobile).');
        return;
      }
      setActiveStep(2);
    } else if (activeStep === 2) {
      if (!formData.kinName || !formData.kinAddressMobile) {
        Alert.alert('Error', 'Please fill Emergency Contact Name and Mobile.');
        return;
      }
      setActiveStep(3);
    }
  };

  const handleBack = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const parseDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    let d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      const parts = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
      if (parts) {
        const [_, day, month, year, hour, min, sec] = parts;
        d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(min), parseInt(sec));
      }
    }
    if (isNaN(d.getTime())) return 'Invalid Date';
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleSubmit = async () => {
    if (!formData.termsAndConditions) {
      Alert.alert('Error', 'You must agree to the Terms and Conditions.');
      return;
    }

    setIsLoading(true);
    try {
      const nameParts = formData.fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const payload = {
        firstName,
        lastName,
        fullName: formData.fullName,
        dob: formData.dob,
        genderId: Number(formData.genderId),
        mobile: formData.mobile,
        fatherName: formData.fatherName,
        motherName: formData.motherName,
        email: formData.email,
        nid: formData.nid,
        kinName: formData.kinName,
        kinRelationId: Number(formData.kinRelationId),
        kinAddressMobile: formData.kinAddressMobile,
        addresses: [
          {
            streetAddress: formData.streetAddress,
            addressTypeId: 3
          }
        ],
        isSMSAllow: true,
        isEmailAllow: true,
        patientPortalId: patientPortalId
      };

      const response = await createEhrTempPatient(payload);
      Alert.alert('Success', 'Patient registered successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#5E2131" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Patient Registration</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity 
          style={styles.pendingBadgeBtn} 
          onPress={() => setShowPendingModal(true)}
        >
          <FontAwesome5 name="users" size={14} color="#8D4956" style={{ marginRight: 6 }} />
          <Text style={styles.pendingBadgeText}>Pending</Text>
          <View style={styles.pendingCount}>
            <Text style={styles.pendingCountText}>{totalTempCount}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {totalTempCount >= 10 ? (
        <View style={styles.limitReachedContainer}>
          <View style={styles.limitIconContainer}>
            <Ionicons name="close-circle" size={48} color="#EF4444" />
          </View>
          <Text style={styles.limitTitle}>Registration Limit Reached</Text>
          <Text style={styles.limitText}>
            You have reached the maximum allowed limit of 10 registrations for this phone number.
          </Text>
          <Text style={styles.limitTextSecondary}>
            Please contact support or visit the hospital reception if you need further assistance.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.progressContainer}>
        <View style={[styles.progressStep, activeStep >= 1 && styles.activeStep]}>
          <Text style={[styles.stepText, activeStep >= 1 && styles.activeStepText]}>1</Text>
        </View>
        <View style={[styles.progressLine, activeStep >= 2 && styles.activeLine]} />
        <View style={[styles.progressStep, activeStep >= 2 && styles.activeStep]}>
          <Text style={[styles.stepText, activeStep >= 2 && styles.activeStepText]}>2</Text>
        </View>
        <View style={[styles.progressLine, activeStep >= 3 && styles.activeLine]} />
        <View style={[styles.progressStep, activeStep >= 3 && styles.activeStep]}>
          <Text style={[styles.stepText, activeStep >= 3 && styles.activeStepText]}>3</Text>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.content}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {activeStep === 1 && (
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              
              <Text style={styles.label}>Full Name *</Text>
              <TextInput style={styles.input} placeholder="Enter full name" value={formData.fullName} onChangeText={(val) => updateForm('fullName', val)} />
              
              <Text style={styles.label}>Date of Birth (YYYY-MM-DD) *</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.input, { justifyContent: 'center' }]}>
                <Text style={{ color: formData.dob ? '#1F2937' : '#9CA3AF' }}>
                  {formData.dob || "e.g. 1990-01-25"}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  testID="dateTimePicker"
                  value={formData.dob ? new Date(formData.dob) : new Date()}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                  maximumDate={new Date()}
                />
              )}
              
              <Text style={styles.label}>Gender</Text>
              <View style={styles.row}>
                <TouchableOpacity style={[styles.radio, formData.genderId === '1' && styles.radioActive]} onPress={() => updateForm('genderId', '1')}>
                  <Text style={[styles.radioText, formData.genderId === '1' && styles.radioActiveText]}>Male</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.radio, formData.genderId === '2' && styles.radioActive]} onPress={() => updateForm('genderId', '2')}>
                  <Text style={[styles.radioText, formData.genderId === '2' && styles.radioActiveText]}>Female</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Mobile Number *</Text>
              <TextInput style={[styles.input, { backgroundColor: '#F3F4F6', color: '#9CA3AF' }]} placeholder="01XXXXXXXXX" keyboardType="phone-pad" value={formData.mobile} editable={false} />

              <Text style={styles.label}>Email</Text>
              <TextInput style={styles.input} placeholder="example@email.com" keyboardType="email-address" autoCapitalize="none" value={formData.email} onChangeText={(val) => updateForm('email', val)} />
              
              <Text style={styles.label}>Father's Name</Text>
              <TextInput style={styles.input} placeholder="Father's name" value={formData.fatherName} onChangeText={(val) => updateForm('fatherName', val)} />
              
              <Text style={styles.label}>Mother's Name</Text>
              <TextInput style={styles.input} placeholder="Mother's name" value={formData.motherName} onChangeText={(val) => updateForm('motherName', val)} />
              
              <Text style={styles.label}>NID/Passport</Text>
              <TextInput style={styles.input} placeholder="NID or Passport number" value={formData.nid} onChangeText={(val) => updateForm('nid', val)} />
            </View>
          )}

          {activeStep === 2 && (
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Address & Emergency</Text>

              <Text style={styles.label}>Street Address</Text>
              <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Enter address" multiline value={formData.streetAddress} onChangeText={(val) => updateForm('streetAddress', val)} />

              <Text style={styles.label}>Emergency Contact Name *</Text>
              <TextInput style={styles.input} placeholder="Name" value={formData.kinName} onChangeText={(val) => updateForm('kinName', val)} />

              <Text style={styles.label}>Emergency Contact Mobile *</Text>
              <TextInput style={styles.input} placeholder="01XXXXXXXXX" keyboardType="phone-pad" value={formData.kinAddressMobile} onChangeText={(val) => updateForm('kinAddressMobile', val)} />
            </View>
          )}

          {activeStep === 3 && (
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Consent & Terms</Text>

              <View style={styles.termsBox}>
                <Text style={styles.termsText}>
                  The undersigned patient and/or responsible relative or person hereby consent to authorize physicians and medical professionals to administer and perform medical examinations, routine investigation, medical treatments, outpatient procedures...
                </Text>
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>I agree to the terms and conditions *</Text>
                <Switch 
                  value={formData.termsAndConditions} 
                  onValueChange={(val) => updateForm('termsAndConditions', val)}
                  trackColor={{ false: "#767577", true: "#8D4956" }}
                />
              </View>
            </View>
          )}

          <View style={styles.footer}>
            {activeStep < 3 ? (
              <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                <Text style={styles.nextButtonText}>Next</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isLoading}>
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.nextButtonText}>Register</Text>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      </>
      )}

      {/* Pending Patients Modal */}
      <Modal visible={showPendingModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowPendingModal(false)}>
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Pending Registrations</Text>
            <TouchableOpacity onPress={() => setShowPendingModal(false)} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          {isFetchingPending ? (
            <View style={styles.modalCenter}>
              <ActivityIndicator size="large" color="#8D4956" />
            </View>
          ) : tempPatients.length === 0 ? (
            <View style={styles.modalCenter}>
              <Text style={styles.emptyText}>No temporary patients found.</Text>
            </View>
          ) : (
            <FlatList
              data={tempPatients}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.listContainer}
              renderItem={({ item }) => (
                <View style={styles.patientCard}>
                  <View style={styles.patientCardHeader}>
                    <Text style={styles.patientId}>ID: {item.id}</Text>
                    <Text style={styles.patientDate}>
                      {parseDate(item.createdAt)}
                    </Text>
                  </View>
                  <Text style={styles.patientName}>{item.fullName || `${item.firstName} ${item.lastName}`}</Text>
                  <Text style={styles.patientMobile}>Mobile: {item.mobile}</Text>
                </View>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: '#fff' },
  backButton: { padding: 8, marginRight: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#5E2131' },
  pendingBadgeBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#DDBD8E', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  pendingBadgeText: { fontSize: 12, fontWeight: '600', color: '#8D4956', marginRight: 6 },
  pendingCount: { backgroundColor: '#8D4956', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  pendingCountText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  
  limitReachedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#FEF2F2', margin: 20, borderRadius: 16, borderWidth: 1, borderColor: '#FECACA' },
  limitIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  limitTitle: { fontSize: 20, fontWeight: 'bold', color: '#B91C1C', marginBottom: 12, textAlign: 'center' },
  limitText: { fontSize: 15, color: '#991B1B', textAlign: 'center', marginBottom: 12, lineHeight: 22 },
  limitTextSecondary: { fontSize: 13, color: '#991B1B', textAlign: 'center', opacity: 0.8 },

  progressContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20, backgroundColor: '#fff' },
  progressStep: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#D1D5DB' },
  activeStep: { backgroundColor: '#8D4956', borderColor: '#8D4956' },
  stepText: { color: '#9CA3AF', fontWeight: 'bold' },
  activeStepText: { color: '#fff' },
  progressLine: { width: 60, height: 4, backgroundColor: '#E5E7EB', marginHorizontal: 8, borderRadius: 2 },
  activeLine: { backgroundColor: '#8D4956' },
  content: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  formSection: { backgroundColor: '#fff', padding: 20, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  label: { fontSize: 14, fontWeight: '600', color: '#4B5563', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 12, height: 48, fontSize: 15, color: '#1F2937' },
  row: { flexDirection: 'row', gap: 12 },
  radio: { flex: 1, height: 48, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' },
  radioActive: { borderColor: '#8D4956', backgroundColor: '#FFF0F3' },
  radioText: { fontSize: 15, color: '#4B5563', fontWeight: '500' },
  radioActiveText: { color: '#8D4956', fontWeight: '600' },
  termsBox: { backgroundColor: '#F3F4F6', padding: 16, borderRadius: 8, marginBottom: 16 },
  termsText: { fontSize: 13, color: '#4B5563', lineHeight: 20 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  switchLabel: { fontSize: 15, fontWeight: '500', color: '#1F2937', flex: 1 },
  footer: { marginTop: 24, alignItems: 'flex-end' },
  nextButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#8D4956', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, gap: 8 },
  submitButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#059669', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, gap: 8 },
  nextButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  modalSafeArea: { flex: 1, backgroundColor: '#F3F4F6' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#5E2131' },
  modalCloseBtn: { padding: 4 },
  modalCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#6B7280', fontSize: 16, fontStyle: 'italic' },
  listContainer: { padding: 16 },
  patientCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  patientCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  patientId: { fontSize: 12, fontWeight: '600', color: '#8D4956' },
  patientDate: { fontSize: 12, color: '#6B7280' },
  patientName: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  patientMobile: { fontSize: 14, color: '#4B5563' },
});
