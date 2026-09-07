import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { getMe, createAppointment } from '../services/api';

export const AppointmentScreen = ({ route, navigation }: any) => {
  const { doctor } = route.params;
  
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Generate next 7 days
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  // Mock time slots
  const timeSlots = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'
  ];

  useEffect(() => {
    loadPatientData();
  }, []);

  const loadPatientData = async () => {
    try {
      const res = await getMe();
      setPatient(res.patient);
    } catch (e) {
      console.log('Error fetching patient profile', e);
    } finally {
      setLoading(false);
    }
  };

  let imageUrl = doctor.image;
  if (imageUrl && !imageUrl.startsWith('http')) {
    imageUrl = `http://10.200.117.240:5000${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  }

  const handleBook = async () => {
    if (!selectedTime) {
      Alert.alert('Error', 'Please select an appointment time.');
      return;
    }

    try {
      setSubmitting(true);
      
      const appointmentData = {
        doctorId: doctor._id || doctor.id,
        patientName: patient?.name || 'Unknown Patient',
        email: patient?.email || '',
        phoneNumber: patient?.phone || '', // Need to ensure phone is correct
        appointmentDate: selectedDate.toISOString().split('T')[0],
        appointmentTime: selectedTime,
        notes: notes
      };

      await createAppointment(appointmentData);
      
      Alert.alert(
        'Success',
        'Your appointment request has been submitted successfully.',
        [{ text: 'OK', onPress: () => navigation.popToTop() }]
      );
    } catch (e: any) {
      console.error(e);
      Alert.alert('Booking Failed', e.response?.data?.message || 'Could not complete your booking. Please try again.');
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <FontAwesome5 name="arrow-left" size={20} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Appointment</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Doctor Profile Card */}
        <View style={styles.doctorCard}>
          <View style={styles.doctorHeader}>
            <View style={styles.avatarContainer}>
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.placeholderAvatar]}>
                  <FontAwesome5 name="user-md" size={32} color={colors.primary} />
                </View>
              )}
            </View>
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>{doctor.name}</Text>
              <Text style={styles.doctorDesig}>{doctor.designation}</Text>
              {doctor.department?.name && (
                <View style={styles.deptPill}>
                  <Text style={styles.deptText}>{doctor.department.name}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Date Selection */}
        <Text style={styles.sectionTitle}>Select Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
          {dates.map((d, idx) => {
            const isSelected = d.toDateString() === selectedDate.toDateString();
            return (
              <TouchableOpacity 
                key={idx} 
                style={[styles.dateCard, isSelected && styles.dateCardActive]}
                onPress={() => setSelectedDate(d)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dateDay, isSelected && styles.dateTextActive]}>
                  {formatDateLabel(d)}
                </Text>
                <Text style={[styles.dateNum, isSelected && styles.dateTextActive]}>
                  {d.getDate()}
                </Text>
                <Text style={[styles.dateMonth, isSelected && styles.dateTextActive]}>
                  {d.toLocaleDateString('en-US', { month: 'short' })}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Time Selection */}
        <Text style={styles.sectionTitle}>Available Slots</Text>
        <View style={styles.timeGrid}>
          {timeSlots.map((time, idx) => {
            const isSelected = time === selectedTime;
            return (
              <TouchableOpacity 
                key={idx} 
                style={[styles.timeSlot, isSelected && styles.timeSlotActive]}
                onPress={() => setSelectedTime(time)}
                activeOpacity={0.7}
              >
                <Text style={[styles.timeText, isSelected && styles.timeTextActive]}>
                  {time}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Patient Details Summary */}
        <Text style={styles.sectionTitle}>Patient Details</Text>
        <View style={styles.patientCard}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <View>
              <Text style={styles.patientName}>{patient?.name || 'Unknown Patient'}</Text>
              <Text style={styles.patientPhone}>{patient?.phone || patient?.phoneNumber || 'No phone registered'}</Text>
              {patient?.uhid && <Text style={styles.patientUhid}>UHID: {patient.uhid}</Text>}
            </View>
          )}
        </View>

        {/* Notes */}
        <Text style={styles.sectionTitle}>Additional Notes (Optional)</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Briefly describe your symptoms or reason for visit..."
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          value={notes}
          onChangeText={setNotes}
        />
        
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={[styles.confirmBtn, (!selectedTime || submitting) && styles.confirmBtnDisabled]}
          onPress={handleBook}
          disabled={!selectedTime || submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.confirmBtnText}>Confirm Appointment</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.primary },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 16,
    backgroundColor: colors.primary,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.white },
  
  scrollContainer: { padding: 16, backgroundColor: '#F8FAFC', flexGrow: 1 },
  
  doctorCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  doctorHeader: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { marginRight: 16 },
  avatar: { width: 72, height: 72, borderRadius: 16, backgroundColor: '#F1F5F9' },
  placeholderAvatar: { alignItems: 'center', justifyContent: 'center' },
  doctorInfo: { flex: 1, justifyContent: 'center' },
  doctorName: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#0F172A', marginBottom: 4 },
  doctorDesig: { fontSize: 13, color: '#64748B', fontFamily: 'Inter_500Medium', marginBottom: 8 },
  deptPill: {
    alignSelf: 'flex-start',
    backgroundColor: `${colors.primary}10`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  deptText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: colors.primary },
  
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#1E293B', marginBottom: 12, marginLeft: 4 },
  
  dateScroll: { marginBottom: 24, paddingLeft: 4 },
  dateCard: {
    width: 68,
    height: 90,
    backgroundColor: colors.white,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dateDay: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#64748B', marginBottom: 4 },
  dateNum: { fontSize: 20, fontFamily: 'Inter_700Bold', color: '#0F172A', marginBottom: 2 },
  dateMonth: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#64748B' },
  dateTextActive: { color: colors.white },
  
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  timeSlot: {
    width: '31%',
    backgroundColor: colors.white,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timeSlotActive: {
    backgroundColor: `${colors.primary}15`,
    borderColor: colors.primary,
  },
  timeText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#475569' },
  timeTextActive: { color: colors.primary },

  patientCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  patientName: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#1E293B', marginBottom: 4 },
  patientPhone: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#64748B', marginBottom: 4 },
  patientUhid: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.primary },
  
  notesInput: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#1E293B',
    marginBottom: 24,
  },
  
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    padding: 16,
    paddingBottom: 32, // Safe area padding
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  confirmBtnText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  }
});
