import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Alert, ActivityIndicator, Modal } from 'react-native';
import { colors } from '../theme/colors';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getMe, getErpPatient } from '../services/api';
import { ALL_LAB_TRENDS } from './HomeScreen';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const BLOOD_GROUPS: Record<number, string> = {
  1: "A+", 2: "A-", 3: "B+", 4: "B-", 5: "AB+", 6: "AB-", 7: "O+", 8: "O-",
};

const MARITAL_STATUSES: Record<number, string> = {
  1: "Single", 2: "Married", 3: "Divorced", 4: "Widowed", 5: "Separated",
};

const GENDERS: Record<number, string> = {
  1: "Male", 2: "Female", 3: "Other",
};

const InfoRow = ({ iconName, iconLib, label, value }: { iconName: string, iconLib: 'Ionicons' | 'FontAwesome5' | 'MaterialIcons', label: string, value: string | undefined | null }) => {
  const IconComponent: any = iconLib === 'FontAwesome5' ? FontAwesome5 : iconLib === 'MaterialIcons' ? MaterialIcons : Ionicons;
  
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconContainer}>
        <IconComponent name={iconName} size={16} color={colors.primary} />
      </View>
      <View style={styles.infoTextContainer}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, !value && styles.infoValueEmpty]}>{value || 'Not provided'}</Text>
      </View>
    </View>
  );
};

export const ProfileScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [patient, setPatient] = useState<any>(null);
  const [erpPatient, setErpPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showTrendModal, setShowTrendModal] = useState(false);
  const [enabledTrends, setEnabledTrends] = useState<number[]>([]);
  const [tempEnabledTrends, setTempEnabledTrends] = useState<number[]>([]);

  useEffect(() => {
    loadProfileData();
    loadTrendPrefs();
  }, []);

  const loadTrendPrefs = async () => {
    try {
      const saved = await AsyncStorage.getItem('patientLabTrendPrefs');
      if (saved) {
        setEnabledTrends(JSON.parse(saved));
      } else {
        setEnabledTrends(ALL_LAB_TRENDS.map(t => t.code));
      }
    } catch (e) {}
  };

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const response = await getMe();
      let patientData = null;
      if (response && response.patient) {
        patientData = response.patient;
        setPatient(response.patient);
      }
      
      if (patientData && (patientData.uhid || patientData.erpPatientId)) {
        try {
          const erpRes = await getErpPatient();
          if (erpRes && erpRes.data) {
            setErpPatient(erpRes.data);
          }
        } catch (erpErr) {
          console.log('Failed to fetch ERP patient', erpErr);
        }
      }
    } catch (e) {
      console.log('Failed to load profile data', e);
      const phone = await AsyncStorage.getItem('userPhone');
      const name = await AsyncStorage.getItem('userName');
      setPatient({ name, phone });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('userToken');
              await AsyncStorage.removeItem('userPhone');
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Error logging out:', error);
            }
          }
        }
      ]
    );
  };

  const formatDate = (d: string | undefined | null) => {
    if (!d) return undefined;
    let dateObj = new Date(d);
    const parts = d.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/);
    if (parts) {
      const [_, day, month, year] = parts;
      dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    if (isNaN(dateObj.getTime())) return d;
    return dateObj.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const displayName = erpPatient?.fullName || erpPatient?.name || patient?.name || patient?.fullName || 'Patient';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.nameText}>{displayName}</Text>
            {patient?.uhid && (
              <View style={styles.uhidBadge}>
                <FontAwesome5 name="id-card" size={12} color={colors.primary} style={{marginRight: 6}} />
                <Text style={styles.uhidText}>UHID: <Text style={{fontWeight: 'bold'}}>{patient.uhid}</Text></Text>
              </View>
            )}
            {erpPatient?.payerName && (
              <View style={[styles.uhidBadge, {marginTop: 6, backgroundColor: 'rgba(141, 73, 86, 0.05)'}]}>
                <FontAwesome5 name="user-md" size={10} color={colors.primary} style={{marginRight: 4}} />
                <Text style={styles.uhidText}>Corporate: {erpPatient.payerName}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>PERSONAL INFORMATION</Text>
          </View>
          <View style={styles.sectionContent}>
            {erpPatient ? (
              <>
                <InfoRow iconName="person" iconLib="Ionicons" label="Full Name" value={erpPatient.fullName || erpPatient.name} />
                <InfoRow iconName="venus-mars" iconLib="FontAwesome5" label="Gender" value={erpPatient.gender || erpPatient.sex || erpPatient.sexName || erpPatient.genderName || GENDERS[erpPatient.genderID as number]} />
                <InfoRow iconName="bloodtype" iconLib="MaterialIcons" label="Blood Group" value={BLOOD_GROUPS[erpPatient.bloodGroupID as number]} />
                <InfoRow iconName="favorite-border" iconLib="MaterialIcons" label="Marital Status" value={MARITAL_STATUSES[erpPatient.maritualStatusID as number] || MARITAL_STATUSES[erpPatient.maritalStatusID as number]} />
                <InfoRow iconName="birthday-cake" iconLib="FontAwesome5" label="Date of Birth" value={formatDate(erpPatient.dob || erpPatient.dateOfBirth)} />
                <InfoRow iconName="family-restroom" iconLib="MaterialIcons" label="Father's Name" value={erpPatient.fatherName} />
                <InfoRow iconName="family-restroom" iconLib="MaterialIcons" label="Mother's Name" value={erpPatient.motherName} />
                <InfoRow iconName="call" iconLib="Ionicons" label="Mobile" value={erpPatient.mobile || erpPatient.phone} />
                <InfoRow iconName="mail" iconLib="Ionicons" label="Email" value={erpPatient.email} />
                <InfoRow iconName="location-sharp" iconLib="Ionicons" label="Address" value={erpPatient.address || erpPatient.addresses?.[0]?.streetAddress} />
              </>
            ) : (
              <>
                <InfoRow iconName="person" iconLib="Ionicons" label="Full Name" value={displayName} />
                <InfoRow iconName="venus-mars" iconLib="FontAwesome5" label="Gender" value={patient?.gender} />
                <InfoRow iconName="birthday-cake" iconLib="FontAwesome5" label="Date of Birth" value={formatDate(patient?.dateOfBirth)} />
                <InfoRow iconName="call" iconLib="Ionicons" label="Mobile" value={patient?.phone} />
                <InfoRow iconName="mail" iconLib="Ionicons" label="Email" value={patient?.email} />
                <InfoRow iconName="location-sharp" iconLib="Ionicons" label="Address" value={patient?.address} />
              </>
            )}
          </View>
        </View>

        {/* Info Notice */}
        <View style={styles.infoNotice}>
          <View style={styles.infoNoticeHeader}>
            <MaterialIcons name="local-hospital" size={16} color={colors.primary} />
            <Text style={styles.infoNoticeTitle}>Need to update your details?</Text>
          </View>
          <Text style={styles.infoNoticeText}>Please visit the hospital reception or contact us to update your personal information.</Text>
        </View>

        {/* Preferences Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>PREFERENCES</Text>
          </View>
          <View style={[styles.sectionContent, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text style={styles.preferenceTitle}>Health Trends View</Text>
              <Text style={styles.preferenceSubtitle}>Customize which health markers are displayed on your dashboard.</Text>
            </View>
            <TouchableOpacity 
              style={styles.customizeBtn} 
              onPress={() => {
                setTempEnabledTrends([...enabledTrends]);
                setShowTrendModal(true);
              }}
            >
              <Ionicons name="settings" size={14} color={colors.primary} style={{marginRight: 4}} />
              <Text style={styles.customizeBtnText}>Customize</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Register Patient Button */}
        <TouchableOpacity style={styles.registerButton} onPress={() => navigation.navigate('Registration' as any)}>
          <Ionicons name="person-add-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={styles.registerText}>Register New Patient</Text>
        </TouchableOpacity>

        {/* Log Out Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
        
        <View style={{height: 40}} />
      </ScrollView>

      {/* Trend Customization Modal */}
      <Modal visible={showTrendModal} animationType="slide" transparent={true}>
         <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
               <View style={styles.modalHeader}>
                 <View>
                   <Text style={styles.modalTitle}>Customize Trends</Text>
                   <Text style={styles.modalSubtitle}>Select which health markers to display</Text>
                 </View>
                 <TouchableOpacity style={styles.closeBtnWrapper} onPress={() => setShowTrendModal(false)}>
                   <Text style={styles.closeBtn}>X</Text>
                 </TouchableOpacity>
               </View>
               
               <ScrollView style={{ maxHeight: 300, marginBottom: 20 }}>
                 {ALL_LAB_TRENDS.map((trend) => {
                   const isSelected = tempEnabledTrends.includes(trend.code);
                   return (
                     <TouchableOpacity 
                       key={trend.code}
                       style={styles.trendOption}
                       onPress={() => {
                         if (isSelected) {
                           setTempEnabledTrends(tempEnabledTrends.filter(c => c !== trend.code));
                         } else {
                           setTempEnabledTrends([...tempEnabledTrends, trend.code]);
                         }
                       }}
                     >
                       <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                         {isSelected && <FontAwesome5 name="check" size={12} color="#fff" />}
                       </View>
                       <Text style={styles.trendOptionText}>{trend.title}</Text>
                     </TouchableOpacity>
                   );
                 })}
               </ScrollView>
               
               <TouchableOpacity 
                 style={styles.linkBtn}
                 onPress={async () => {
                   setEnabledTrends(tempEnabledTrends);
                   await AsyncStorage.setItem('patientLabTrendPrefs', JSON.stringify(tempEnabledTrends));
                   setShowTrendModal(false);
                 }}
               >
                 <Text style={styles.linkBtnText}>Save Preferences</Text>
               </TouchableOpacity>
            </View>
         </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 20, backgroundColor: colors.primary, alignItems: 'center', paddingTop: 40 },
  headerTitle: { color: colors.white, fontSize: 18, fontFamily: 'Inter_700Bold' },
  scrollContainer: { padding: 16 },
  
  profileHeaderCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, paddingHorizontal: 8 },
  avatarContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4 },
  avatarText: { fontSize: 32, fontFamily: 'Inter_700Bold', color: colors.white },
  headerTextContainer: { marginLeft: 20, flex: 1 },
  nameText: { fontSize: 24, fontFamily: 'Inter_700Bold', color: colors.gray900, marginBottom: 6 },
  uhidBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: 'rgba(141, 73, 86, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  uhidText: { color: colors.primary, fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  
  sectionCard: { backgroundColor: colors.white, borderRadius: 24, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)', overflow: 'hidden' },
  sectionHeader: { backgroundColor: '#FAF9F6', paddingHorizontal: 24, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(221, 189, 142, 0.3)' },
  sectionTitle: { fontSize: 12, fontFamily: 'Inter_700Bold', color: colors.primary, letterSpacing: 1 },
  sectionContent: { padding: 24 },
  
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#FAF9F6' },
  infoIconContainer: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(141, 73, 86, 0.04)', justifyContent: 'center', alignItems: 'center', marginRight: 16, marginTop: 2 },
  infoTextContainer: { flex: 1 },
  infoLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.primary, marginBottom: 2 },
  infoValue: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.gray900 },
  infoValueEmpty: { color: colors.gray400, fontStyle: 'italic', fontFamily: 'Inter_400Regular' },
  
  infoNotice: { backgroundColor: '#FAF9F6', borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(221, 189, 142, 0.4)' },
  infoNoticeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  infoNoticeTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.primary, marginLeft: 8 },
  infoNoticeText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.primary, lineHeight: 20 },
  
  preferenceTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.gray900, marginBottom: 4 },
  preferenceSubtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.gray500, lineHeight: 18 },
  customizeBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.gray200 },
  customizeBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.gray700 },
  
  registerButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: '#FAF9F6', borderRadius: 16, borderWidth: 1, borderColor: '#DDBD8E', marginBottom: 16 },
  registerText: { color: colors.primary, fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: '#FEF2F2', borderRadius: 16, borderWidth: 1, borderColor: '#FECACA' },
  logoutText: { color: colors.error, fontSize: 16, fontFamily: 'Inter_600SemiBold' },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: colors.white, borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#1E293B', marginBottom: 2 },
  modalSubtitle: { fontSize: 13, color: '#64748B', fontFamily: 'Inter_400Regular' },
  closeBtnWrapper: { padding: 4, backgroundColor: '#F1F5F9', borderRadius: 20, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  closeBtn: { fontSize: 16, color: '#64748B', fontFamily: 'Inter_700Bold', lineHeight: 18 },
  trendOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#CBD5E1', backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  checkboxSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  trendOptionText: { fontSize: 15, fontFamily: 'Inter_500Medium', color: '#1E293B' },
  linkBtn: { backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, borderRadius: 12, height: 48, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 2 },
  linkBtnText: { color: colors.white, fontFamily: 'Inter_700Bold', fontSize: 15 },
});
