import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, TextInput, Platform, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { getMe, createAppointment, getDoctors } from '../services/api';

export const AppointmentScreen = ({ route, navigation }: any) => {
  const passedDoctor = route.params?.doctor;
  
  const [step, setStep] = useState<number>(1);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(passedDoctor || null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDoctorModal, setShowDoctorModal] = useState(false);

  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [notes, setNotes] = useState('');

  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientEmail, setPatientEmail] = useState('');

  // Dates
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  // Dynamic Times grouped
  const timeSlots = React.useMemo(() => {
    let startStr = "09:00 AM";
    let endStr = "05:00 PM";
    
    if (selectedDoctor?.schedules && selectedDoctor.schedules.length > 0) {
      const dayName = selectedDate.toLocaleDateString("en-US", { weekday: "long" });
      const activeSchedule = selectedDoctor.schedules.find((s: any) => s.day === dayName);
      
      if (!activeSchedule) {
        return null; // Not available
      }
      startStr = activeSchedule.startTime;
      endStr = activeSchedule.endTime;
    }

    const parseTime = (timeStr: string) => {
      const [time, modifier] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (hours === 12) hours = 0;
      if (modifier === 'PM') hours += 12;
      const d = new Date();
      d.setHours(hours, minutes, 0, 0);
      return d;
    };

    const start = parseTime(startStr);
    const end = parseTime(endStr);

    const slots = { Morning: [] as string[], Afternoon: [] as string[], Evening: [] as string[] };
    
    let current = start;
    while (current <= end) {
      let h = current.getHours();
      let m = current.getMinutes();
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hours12 = h % 12 || 12;
      const timeString = `${hours12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
      
      if (h < 12) slots.Morning.push(timeString);
      else if (h < 16) slots.Afternoon.push(timeString);
      else slots.Evening.push(timeString);
      
      current.setMinutes(current.getMinutes() + 30);
    }

    return Object.fromEntries(Object.entries(slots).filter(([_, v]) => v.length > 0));
  }, [selectedDoctor, selectedDate]);

  useEffect(() => {
    loadPatientData();
  }, []);

  const loadPatientData = async () => {
    try {
      if (!passedDoctor) {
        const docsRes = await getDoctors();
        setDoctors(docsRes.data || []);
      }
      const res = await getMe();
      setPatient(res.patient);
      setPatientName(res.patient?.name || '');
      setPatientPhone(res.patient?.phone || res.patient?.phoneNumber || '');
      setPatientEmail(res.patient?.email || '');
    } catch (e) {
      console.log('Error fetching data', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (doc.designation && doc.designation.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  let imageUrl = selectedDoctor?.image;
  if (imageUrl && !imageUrl.startsWith('http')) {
    imageUrl = `http://10.200.117.240:5000${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  }

  const handleNext = () => {
    if (step === 1) {
      if (!selectedDoctor) {
        Alert.alert('Required', 'Please select a specialist first.');
        return;
      }
      if (!selectedTime) {
        Alert.alert('Required', 'Please select a time slot.');
        return;
      }
    }
    if (step === 2) {
      if (!patientName.trim() || !patientPhone.trim()) {
        Alert.alert('Required', 'Please enter patient name and phone number.');
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (step === 1) {
      navigation.goBack();
    } else {
      setStep(prev => prev - 1);
    }
  };

  const handleBook = async () => {
    try {
      setSubmitting(true);
      const appointmentData: any = {
        doctorId: selectedDoctor._id || selectedDoctor.id,
        patientName: patientName || 'Unknown Patient',
        email: patientEmail,
        phoneNumber: patientPhone || '',
        appointmentDate: selectedDate.toISOString().split('T')[0],
        appointmentTime: selectedTime,
      };

      if (notes) appointmentData.notes = notes;
      await createAppointment(appointmentData);
      
      if (Platform.OS === 'web') {
        window.alert('Success!\n\nYour appointment request has been submitted successfully.');
        navigation.popToTop();
      } else {
        Alert.alert('Success', 'Your appointment request has been submitted successfully.', [{ text: 'OK', onPress: () => navigation.popToTop() }]);
      }
    } catch (e: any) {
      console.error('Booking Error:', e.response?.data || e);
      let errorMsg = 'Could not complete your booking. Please try again.';
      if (e.response?.data?.message) {
        errorMsg = Array.isArray(e.response.data.message) ? e.response.data.message.join('\n') : e.response.data.message;
      }
      if (Platform.OS === 'web') window.alert('Booking Failed\n\n' + errorMsg);
      else Alert.alert('Booking Failed', errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateLabel = (d: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  };

  // Renders Step 1: Date & Time
  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      {!selectedDoctor ? (
        <TouchableOpacity style={styles.emptyDoctorCard} onPress={() => setShowDoctorModal(true)} activeOpacity={0.7}>
          <View style={[styles.avatar, styles.placeholderAvatar, { width: 56, height: 56 }]}><FontAwesome5 name="user-md" size={24} color={colors.primary} /></View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.emptyTitle}>Select a Specialist</Text>
            <Text style={styles.emptySubtitle}>Tap to browse our doctors</Text>
          </View>
          <FontAwesome5 name="chevron-down" size={16} color="#CBD5E1" />
        </TouchableOpacity>
      ) : (
        <View style={styles.doctorSummaryCard}>
          <View style={styles.avatarContainer}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.avatar} resizeMode="contain" />
            ) : (
              <View style={[styles.avatar, styles.placeholderAvatar]}><FontAwesome5 name="user-md" size={32} color={colors.primary} /></View>
            )}
          </View>
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>{selectedDoctor.name}</Text>
            <Text style={styles.doctorDesig}>{selectedDoctor.designation}</Text>
            {selectedDoctor.department?.name && (
              <View style={styles.deptPill}>
                <Text style={styles.deptText}>{selectedDoctor.department.name}</Text>
              </View>
            )}
          </View>
          {!passedDoctor && (
            <TouchableOpacity onPress={() => setShowDoctorModal(true)} style={styles.changeBtn}>
              <FontAwesome5 name="pen" size={12} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>
      )}

      <Text style={styles.sectionTitle}>1. Select Date</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
        {dates.map((d, idx) => {
          const isSelected = d.toDateString() === selectedDate.toDateString();
          return (
            <TouchableOpacity key={idx} style={[styles.dateCard, isSelected && styles.dateCardActive]} onPress={() => setSelectedDate(d)} activeOpacity={0.7}>
              <Text style={[styles.dateMonth, isSelected && styles.dateTextActive]}>{d.toLocaleDateString('en-US', { month: 'short' })}</Text>
              <Text style={[styles.dateNum, isSelected && styles.dateTextActive]}>{d.getDate()}</Text>
              <Text style={[styles.dateDay, isSelected && styles.dateTextActive]}>{formatDateLabel(d)}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Text style={styles.sectionTitle}>2. Select Time</Text>
      {!timeSlots ? (
        <View style={styles.noSlotsContainer}>
          <FontAwesome5 name="calendar-times" size={32} color="#CBD5E1" />
          <Text style={styles.noSlotsText}>No schedules available on {selectedDate.toLocaleDateString("en-US", { weekday: "long" })}.</Text>
          <Text style={styles.noSlotsSubtext}>Please select another date.</Text>
        </View>
      ) : (
        Object.entries(timeSlots).map(([period, slots]) => (
          <View key={period} style={styles.timeGroup}>
            <Text style={styles.timeGroupTitle}>{period}</Text>
            <View style={styles.timeGrid}>
              {(slots as string[]).map((time, idx) => {
                const isSelected = time === selectedTime;
                return (
                  <TouchableOpacity key={idx} style={[styles.timeSlot, isSelected && styles.timeSlotActive]} onPress={() => setSelectedTime(time)} activeOpacity={0.7}>
                    <Text style={[styles.timeText, isSelected && styles.timeTextActive]}>{time}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))
      )}
    </View>
  );

  // Renders Step 2: Details
  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.sectionTitle}>Patient Details</Text>
      
      <View style={styles.inputGroup}>
        <View style={styles.inputIcon}><FontAwesome5 name="user" size={16} color="#94A3B8" /></View>
        <TextInput style={styles.inputField} value={patientName} onChangeText={setPatientName} placeholder="Full Name" placeholderTextColor="#94A3B8" />
      </View>

      <View style={[styles.inputGroup, { backgroundColor: '#F1F5F9' }]}>
        <View style={styles.inputIcon}><FontAwesome5 name="phone-alt" size={16} color="#94A3B8" /></View>
        <TextInput style={[styles.inputField, { color: '#64748B' }]} value={patientPhone} editable={false} placeholder="Phone Number" keyboardType="phone-pad" placeholderTextColor="#94A3B8" />
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.inputIcon}><FontAwesome5 name="envelope" size={16} color="#94A3B8" /></View>
        <TextInput style={styles.inputField} value={patientEmail} onChangeText={setPatientEmail} placeholder="Email Address" keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#94A3B8" />
      </View>

      <Text style={styles.sectionTitle}>Additional Notes (Optional)</Text>
      <View style={[styles.inputGroup, { height: 100, alignItems: 'flex-start' }]}>
        <View style={[styles.inputIcon, { marginTop: 12 }]}><FontAwesome5 name="notes-medical" size={16} color="#94A3B8" /></View>
        <TextInput
          style={[styles.inputField, { height: 100, textAlignVertical: 'top', paddingTop: 12 }]}
          placeholder="Briefly describe your symptoms..."
          placeholderTextColor="#94A3B8"
          multiline
          value={notes}
          onChangeText={setNotes}
        />
      </View>
    </View>
  );

  // Renders Step 3: Review
  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Review & Confirm</Text>
      
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <FontAwesome5 name="calendar-check" size={24} color="#8D4956" />
          <View style={styles.summaryHeaderInfo}>
            <Text style={styles.summaryDate}>{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
            <Text style={styles.summaryTime}>{selectedTime}</Text>
          </View>
          <TouchableOpacity onPress={() => setStep(1)} style={styles.summaryEditBtn}>
            <Text style={styles.summaryEditText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Specialist</Text>
          <Text style={styles.summaryValue}>{selectedDoctor.name}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Patient</Text>
          <Text style={styles.summaryValue}>{patientName}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Contact</Text>
          <Text style={styles.summaryValue}>{patientPhone}</Text>
        </View>

        {notes ? (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Notes</Text>
            <Text style={styles.summaryValue}>{notes}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.trustBadge}>
        <FontAwesome5 name="shield-alt" size={20} color="#64748B" />
        <Text style={styles.trustText}>Your information is securely encrypted and kept confidential.</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <FontAwesome5 name="arrow-left" size={20} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Appointment</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Stepper Progress */}
      <View style={styles.stepperContainer}>
        {[1, 2, 3].map((s, i) => (
          <React.Fragment key={s}>
            <View style={[styles.stepIndicator, step >= s ? styles.stepIndicatorActive : styles.stepIndicatorInactive]}>
              <Text style={[styles.stepIndicatorText, step >= s ? styles.stepIndicatorTextActive : styles.stepIndicatorTextInactive]}>{s}</Text>
            </View>
            {i < 2 && <View style={[styles.stepLine, step > s ? styles.stepLineActive : styles.stepLineInactive]} />}
          </React.Fragment>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={handleBack}>
          <Text style={styles.secondaryBtnText}>{step === 1 ? 'Cancel' : 'Back'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.primaryBtn, submitting && styles.primaryBtnDisabled]}
          onPress={step === 3 ? handleBook : handleNext}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.primaryBtnText}>{step === 3 ? 'Confirm Appointment' : 'Next Step'}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Doctor Selection Modal */}
      {showDoctorModal && (
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Specialist</Text>
              <TouchableOpacity onPress={() => setShowDoctorModal(false)} style={styles.modalCloseBtn}>
                <FontAwesome5 name="times" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <View style={{ padding: 16 }}>
              <View style={styles.searchBox}>
                <FontAwesome5 name="search" size={16} color="#94A3B8" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by name or specialty..."
                  placeholderTextColor="#94A3B8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
              {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
              ) : (
                filteredDoctors.map((doc: any) => {
                  let docImgUrl = doc.image;
                  if (docImgUrl && !docImgUrl.startsWith('http')) docImgUrl = `http://10.200.117.240:5000${docImgUrl.startsWith('/') ? '' : '/'}${docImgUrl}`;
                  return (
                    <TouchableOpacity 
                      key={doc._id} 
                      style={styles.doctorSelectCard} 
                      onPress={() => { 
                        setSelectedDoctor(doc); 
                        setShowDoctorModal(false); 
                      }} 
                      activeOpacity={0.7}
                    >
                      <View style={styles.avatarContainer}>
                        {docImgUrl ? (
                          <Image source={{ uri: docImgUrl }} style={styles.avatarSmall} resizeMode="contain" />
                        ) : (
                          <View style={[styles.avatarSmall, styles.placeholderAvatar]}><FontAwesome5 name="user-md" size={24} color={colors.primary} /></View>
                        )}
                      </View>
                      <View style={styles.doctorInfo}>
                        <Text style={styles.doctorNameSelect} numberOfLines={1}>{doc.name}</Text>
                        <Text style={styles.doctorDesigSelect} numberOfLines={1}>{doc.designation}</Text>
                        <Text style={styles.deptTextSelect} numberOfLines={1}>{doc.department?.name || "General"}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </SafeAreaView>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.primary },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 16, paddingVertical: 16, backgroundColor: colors.primary,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.white },
  
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  stepIndicator: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepIndicatorActive: { backgroundColor: colors.primary },
  stepIndicatorInactive: { backgroundColor: '#F1F5F9' },
  stepIndicatorText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  stepIndicatorTextActive: { color: '#fff' },
  stepIndicatorTextInactive: { color: '#94A3B8' },
  stepLine: { height: 3, width: 40, marginHorizontal: 8, borderRadius: 2 },
  stepLineActive: { backgroundColor: colors.primary },
  stepLineInactive: { backgroundColor: '#F1F5F9' },

  scrollContainer: { padding: 20, backgroundColor: '#FAF9F6', flexGrow: 1 },
  stepContainer: { flex: 1 },
  stepTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#1E293B', marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#1E293B', marginBottom: 12, marginTop: 8 },
  
  // Step 1: Doctor Summary
  emptyDoctorCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 24,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: colors.primary, borderStyle: 'dashed',
  },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.primary, marginBottom: 2 },
  emptySubtitle: { fontSize: 13, color: '#64748B', fontFamily: 'Inter_400Regular' },
  
  doctorSummaryCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 24,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  avatarContainer: { marginRight: 16 },
  avatar: { width: 64, height: 64, borderRadius: 16, backgroundColor: '#F1F5F9' },
  avatarSmall: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#F1F5F9' },
  placeholderAvatar: { alignItems: 'center', justifyContent: 'center' },
  doctorInfo: { flex: 1, justifyContent: 'center' },
  doctorName: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#0F172A', marginBottom: 4 },
  doctorDesig: { fontSize: 13, color: '#64748B', fontFamily: 'Inter_500Medium', marginBottom: 8 },
  deptPill: { alignSelf: 'flex-start', backgroundColor: `${colors.primary}10`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  deptText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: colors.primary },
  changeBtn: { padding: 8, backgroundColor: '#F8FAFC', borderRadius: 8 },

  // Date Cards
  dateScroll: { marginBottom: 24, marginHorizontal: -4 },
  dateCard: {
    width: 68, height: 90, backgroundColor: '#fff', borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 4, borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1,
  },
  dateCardActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dateMonth: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  dateNum: { fontSize: 24, fontFamily: 'Inter_700Bold', color: '#0F172A', marginBottom: 2 },
  dateDay: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#64748B' },
  dateTextActive: { color: '#fff' },

  // Time Slots
  timeGroup: { marginBottom: 16 },
  timeGroupTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  timeSlot: {
    width: '30%', backgroundColor: '#fff', paddingVertical: 12, borderRadius: 12, alignItems: 'center',
    marginHorizontal: '1.5%', marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9',
  },
  timeSlotActive: { backgroundColor: `${colors.primary}10`, borderColor: colors.primary },
  timeText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#475569' },
  timeTextActive: { color: colors.primary, fontFamily: 'Inter_700Bold' },

  noSlotsContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', borderStyle: 'dashed' },
  noSlotsText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#64748B', marginTop: 12 },
  noSlotsSubtext: { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#94A3B8', marginTop: 4 },

  // Inputs
  inputGroup: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 16,
    height: 56, overflow: 'hidden'
  },
  inputIcon: { width: 56, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#F1F5F9' },
  inputField: { flex: 1, paddingHorizontal: 16, fontSize: 15, fontFamily: 'Inter_500Medium', color: '#1E293B' },

  // Summary Card
  summaryCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
  },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  summaryHeaderInfo: { flex: 1, marginLeft: 16 },
  summaryDate: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#0F172A', marginBottom: 4 },
  summaryTime: { fontSize: 14, fontFamily: 'Inter_500Medium', color: '#8D4956' },
  summaryEditBtn: { padding: 6, backgroundColor: '#F8FAFC', borderRadius: 8 },
  summaryEditText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#64748B' },
  summaryDivider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 20 },
  summaryRow: { marginBottom: 16 },
  summaryLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  summaryValue: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#1E293B' },

  trustBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 32, paddingHorizontal: 20 },
  trustText: { marginLeft: 12, fontSize: 12, fontFamily: 'Inter_400Regular', color: '#64748B', flex: 1, lineHeight: 18 },

  // Selector
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, height: 48, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 15, fontFamily: 'Inter_400Regular', color: '#1E293B' },
  doctorSelectCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  doctorNameSelect: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#0F172A', marginBottom: 2 },
  doctorDesigSelect: { fontSize: 12, color: '#64748B', fontFamily: 'Inter_500Medium', marginBottom: 2 },
  deptTextSelect: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: colors.primary },

  // Bottom Bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff',
    flexDirection: 'row', padding: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1, borderTopColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 10,
  },
  secondaryBtn: { width: 80, height: 56, borderRadius: 16, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  secondaryBtnText: { color: '#64748B', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  primaryBtn: { flex: 1, backgroundColor: colors.primary, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  primaryBtnDisabled: { backgroundColor: '#CBD5E1' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },

  // Modal
  modalOverlay: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100,
  },
  modalContainer: {
    flex: 1, backgroundColor: '#FAF9F6', marginTop: 100,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', backgroundColor: '#fff',
  },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#1E293B' },
  modalCloseBtn: { padding: 8 },
});
