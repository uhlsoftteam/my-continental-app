import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getMe, getErpPatient, submitContactForm } from '../services/api';

export const ContactScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setFetchingProfile(true);
      const response = await getMe();
      let patientData = null;
      let erpData = null;
      
      if (response && response.patient) {
        patientData = response.patient;
      }
      
      if (patientData && (patientData.uhid || patientData.erpPatientId)) {
        try {
          const erpRes = await getErpPatient();
          if (erpRes && erpRes.data) erpData = erpRes.data;
        } catch (e) {}
      }

      const displayName = erpData?.fullName || erpData?.name || patientData?.name || patientData?.fullName || '';
      const nameParts = displayName.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      const email = erpData?.email || patientData?.email || "";
      const phone = erpData?.mobile || patientData?.phone || "";

      setForm(prev => ({ ...prev, firstName, lastName, email, phone }));
    } catch (e) {
      console.log('Error loading profile data for contact form', e);
    } finally {
      setFetchingProfile(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.subject.trim() || !form.message.trim()) {
      Alert.alert("Incomplete Form", "Please fill in all required fields.");
      return;
    }
    
    setLoading(true);
    try {
      await submitContactForm({
        name: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email,
        phone: form.phone,
        subject: form.subject,
        message: form.message
      });
      
      Alert.alert(
        "Message Sent",
        "Thank you for contacting us. Our support team will get back to you shortly.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      console.log('Error submitting contact form:', error);
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to send your message. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Contact Us</Text>
          <View style={{ width: 40 }} />
        </View>

        {fetchingProfile ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            
            <View style={styles.infoCard}>
              <View style={styles.infoItem}>
                <View style={styles.iconCircle}>
                  <Ionicons name="call" size={18} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.infoLabel}>Call Us 24/7</Text>
                  <Text style={styles.infoValue}>+880 96667-10666</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoItem}>
                <View style={styles.iconCircle}>
                  <Ionicons name="mail" size={18} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.infoLabel}>Email Us</Text>
                  <Text style={styles.infoValue}>info@continental.health</Text>
                </View>
              </View>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.formHeader}>Send a Message</Text>
              
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>First Name</Text>
                  <TextInput 
                    style={styles.input} 
                    value={form.firstName} 
                    onChangeText={(val) => setForm({...form, firstName: val})} 
                    placeholder="First Name" 
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Last Name</Text>
                  <TextInput 
                    style={styles.input} 
                    value={form.lastName} 
                    onChangeText={(val) => setForm({...form, lastName: val})} 
                    placeholder="Last Name" 
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput 
                  style={styles.input} 
                  value={form.email} 
                  onChangeText={(val) => setForm({...form, email: val})} 
                  placeholder="Enter email" 
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number (Read-only)</Text>
                <TextInput 
                  style={[styles.input, styles.readOnlyInput]} 
                  value={form.phone} 
                  editable={false}
                  placeholder="Phone number" 
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Subject *</Text>
                <TextInput 
                  style={styles.input} 
                  value={form.subject} 
                  onChangeText={(val) => setForm({...form, subject: val})} 
                  placeholder="How can we help?" 
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Message *</Text>
                <TextInput 
                  style={[styles.input, styles.textArea]} 
                  value={form.message} 
                  onChangeText={(val) => setForm({...form, message: val})} 
                  placeholder="Type your message here..." 
                  multiline={true}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>Send Message</Text>
                    <Ionicons name="send" size={16} color={colors.white} style={{ marginLeft: 8 }} />
                  </>
                )}
              </TouchableOpacity>
            </View>
            
            <View style={{height: 40}} />
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 40, backgroundColor: colors.primary },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { color: colors.white, fontSize: 18, fontFamily: 'Inter_700Bold' },
  
  scrollContainer: { padding: 16 },
  
  infoCard: { backgroundColor: colors.white, borderRadius: 20, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },
  infoItem: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(141, 73, 86, 0.08)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  infoLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#64748B', marginBottom: 2 },
  infoValue: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#1E293B' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 16 },
  
  formCard: { backgroundColor: colors.white, borderRadius: 20, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },
  formHeader: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#1E293B', marginBottom: 20 },
  
  row: { flexDirection: 'row' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#475569', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 16, height: 48, backgroundColor: '#F8FAFC', fontSize: 14, color: '#1E293B', fontFamily: 'Inter_400Regular' },
  readOnlyInput: { backgroundColor: '#F1F5F9', color: '#94A3B8' },
  textArea: { height: 100, paddingTop: 16 },
  
  submitBtn: { flexDirection: 'row', backgroundColor: colors.primary, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 12, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  submitBtnText: { color: colors.white, fontSize: 16, fontFamily: 'Inter_700Bold' }
});

