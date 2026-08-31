import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ActivityIndicator, FlatList, Alert, ScrollView, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { getMe, getCandidates, switchPatient, registerPatient } from '../services/api';
import { removeToken, getDeviceLinkedUhids, addDeviceLinkedUhid, getOrCreateDeviceId, getPatientPhone, setToken } from '../utils/storage';
import { FontAwesome5 } from '@expo/vector-icons';

const ActionCard = ({ item, onPress }: any) => {
  const { icon, bgIcon, title, accent, disabled, feature } = item;
  
  const content = (
    <View style={{ flex: 1, width: '100%', justifyContent: 'space-between' }}>
      {/* Premium Watermark Background */}
      <View style={{ position: 'absolute', right: -20, bottom: -20, opacity: disabled ? 0.04 : 0.08 }}>
        <FontAwesome5 name={bgIcon || icon} size={60} color="#94A3B8" solid />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 }}>
        <View style={[styles.iconWrapper, { backgroundColor: disabled ? '#F1F5F9' : `${accent}15` }]}>
          <FontAwesome5 name={icon} size={20} color={disabled ? '#94A3B8' : accent} solid />
        </View>
        {!disabled && (
          <View style={{ opacity: 0.4, padding: 4 }}>
            <FontAwesome5 name="arrow-right" size={12} color={accent} solid />
          </View>
        )}
      </View>
      
      <View style={{ marginTop: 12, zIndex: 1 }}>
        <Text style={[styles.cardTitleText, { color: disabled ? '#94A3B8' : '#1E293B', textAlign: 'left' }]} numberOfLines={2}>
          {title}
        </Text>
        {!feature && <Text style={[styles.cardSubtitle, { textAlign: 'left' }]}>(Coming Soon)</Text>}
        {disabled && feature && <Text style={[styles.cardSubtitle, { textAlign: 'left' }]}>(Registered only)</Text>}
      </View>
    </View>
  );

  if (disabled) {
    return (
      <View style={[styles.actionCard, styles.actionCardDisabled]}>
        {content}
      </View>
    );
  }

  return (
    <TouchableOpacity 
      style={[
        styles.actionCard, 
        { borderColor: `${accent}15` }
      ]} 
      onPress={() => onPress(item.href)}
      activeOpacity={0.7}
    >
      {content}
    </TouchableOpacity>
  );
};

export const HomeScreen = ({ navigation }: any) => {
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false);
  
  // Switch Patient state
  const [candidates, setCandidates] = useState<any[]>([]);
  const [linkedUhids, setLinkedUhids] = useState<string[]>([]);
  const [switchUhidText, setSwitchUhidText] = useState("");
  const [isSwitching, setIsSwitching] = useState(false);
  const [patientPhone, setPhone] = useState("");
  
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const meRes = await getMe();
      setPatient(meRes.patient);
      const phone = await getPatientPhone();
      setPhone(phone || "");
      
      // Automatically prompt to link UHID if the current profile doesn't have one
      if (meRes.patient && !meRes.patient.uhid) {
        openSwitchModal();
      }
    } catch (e) {
      console.log('Error fetching me', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await removeToken();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };
  
  const openSwitchModal = async () => {
    setModalVisible(true);
    try {
      const savedUhids = await getDeviceLinkedUhids();
      setLinkedUhids(savedUhids);
      
      const res = await getCandidates();
      if (res.success && res.patients) {
        setCandidates(res.patients);
      }
    } catch (e: any) {
      const errorDetail = e.response?.data?.message || e.message || String(e);
      console.log('Error fetching candidates:', errorDetail);
      Alert.alert("Authentication Error", `Could not load profiles. Detail: ${errorDetail}\n\nPlease log out and log back in.`);
    }
  };
  
  const handleLinkNewUhid = async () => {
    if (!switchUhidText) return;
    
    const candidate = candidates.find((c: any) => String(c.uhid) === String(switchUhidText).trim());
    if (!candidate) {
      Alert.alert("Error", "UHID not associated with this phone number.");
      return;
    }
    
    await performSwitch(candidate);
  };
  
  const performSwitch = async (candidate: any) => {
    setIsSwitching(true);
    try {
      const deviceId = await getOrCreateDeviceId();
      const selectRes = await switchPatient({
        phone: patientPhone,
        source: candidate.source,
        localId: candidate.localId || undefined,
        uhid: candidate.uhid || undefined,
        erpPatientId: candidate.erpPatientId || undefined,
        name: candidate.name || undefined,
        gender: candidate.gender || undefined,
        dateOfBirth: candidate.dateOfBirth || undefined,
        address: candidate.address || undefined,
        deviceId,
      });
      
      let token = selectRes.token;
      
      if (selectRes.status === 'erp_register') {
         const regRes = await registerPatient({
            phone: patientPhone,
            name: candidate.name || "Unknown",
            gender: candidate.gender || undefined,
            dateOfBirth: candidate.dateOfBirth || undefined,
            address: candidate.address || undefined,
            uhid: candidate.uhid || undefined,
            erpPatientId: candidate.erpPatientId || undefined,
            deviceId,
         });
         token = regRes.token;
      }
      
      if (token) {
        await setToken(token);
        await addDeviceLinkedUhid(candidate.uhid);
        
        Alert.alert("Success", "Switched Patient Successfully");
        setModalVisible(false);
        setSwitchUhidText("");
        setLoading(true);
        loadData();
      }
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.message || "Failed to switch patient.");
    } finally {
      setIsSwitching(false);
    }
  };
  
  const visibleCandidates = candidates.filter((c: any) => {
    const isCurrent = (c.uhid && c.uhid === patient?.uhid) || (c.localId && c.localId === patient?.id);
    if (isCurrent) return false;
    return c.uhid && linkedUhids.includes(String(c.uhid));
  });

  const isConfirmed = !!patient?.uhid;
  
  const dashboardCards = [
    { icon: 'calendar-check', title: 'Make Appointment', href: 'Appointment', accent: '#5E2131', disabled: false, feature: true },
    { icon: 'clipboard-list', title: 'Pendings', href: 'Pending', accent: '#D67B80', disabled: !isConfirmed, feature: true },
    { icon: 'file-medical', title: 'Previous Records', href: 'Records', accent: '#DDBD8E', disabled: !isConfirmed, feature: true },
    { icon: 'flask', title: 'Lab Reports', href: 'Lab', accent: '#3b82f6', disabled: !isConfirmed, feature: true },
    { icon: 'pills', title: 'Order Medicine', href: 'Pharmacy', accent: '#8D4956', disabled: true, feature: false },
    { icon: 'envelope', bgIcon: 'envelope-open', title: 'Contact Us', href: 'Contact', accent: '#5E2131', disabled: false, feature: true },
    { icon: 'vial', title: 'Home Collection', href: 'HomeCollection', accent: '#DDBD8E', disabled: true, feature: false },
    { icon: 'phone-alt', title: 'Call', href: 'Call', accent: '#8D4956', disabled: false, feature: true },
    { icon: 'user-md', title: 'Find a Doctor', href: 'Doctors', accent: '#8D4956', disabled: false, feature: true },
    { icon: 'clipboard-list', title: 'Registration', href: 'Registration', accent: '#5E2131', disabled: false, feature: true, hidden: isConfirmed },
    { icon: 'credit-card', title: 'Online Payments', href: 'Billing', accent: '#D67B80', disabled: true, feature: false },
    { icon: 'syringe', title: 'Vaccination', href: 'Vaccination', accent: '#DDBD8E', disabled: true, feature: false },
    { icon: 'comments', title: 'Feedback', href: 'Feedback', accent: '#8D4956', disabled: true, feature: false },
  ];

  const visibleCards = dashboardCards.filter((c) => !c.hidden);
  const enabledCards = visibleCards.filter((c) => !c.disabled);
  const disabledCards = visibleCards.filter((c) => c.disabled);
  const sortedCards = [...enabledCards, ...disabledCards];

  const handleCardPress = (href: string) => {
    if (href === 'Call') {
      Linking.openURL('tel:+8809666710666').catch((err) => {
        Alert.alert("Error", "Could not open the phone dialer.");
        console.error("Failed to open dialer:", err);
      });
      return;
    }
    Alert.alert("Coming Soon", `Navigation to ${href} will be implemented soon.`);
  };

  const currentDate = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "short", day: "numeric" });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
         <View style={{ flex: 1, paddingRight: 16 }}>
           <Text style={styles.headerSubtitle} numberOfLines={1}>{currentDate}</Text>
           {loading ? (
             <ActivityIndicator color={colors.white} size="small" style={{marginTop: 4, alignSelf: 'flex-start'}} />
           ) : (
             <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">{patient?.name || "Patient"}</Text>
           )}
         </View>
         <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
           <TouchableOpacity style={styles.switchHeaderBtn} onPress={openSwitchModal}>
              <Text style={styles.switchHeaderBtnText}>Switch Patient</Text>
           </TouchableOpacity>
           <TouchableOpacity 
              onPress={handleLogout} 
              style={{ padding: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
           >
              <FontAwesome5 name="sign-out-alt" size={14} color={colors.white} />
           </TouchableOpacity>
         </View>
      </View>
      
      <View style={styles.contentWrapper}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

          <Text style={styles.sectionTitle}>Dashboard</Text>
          
          {/* Dashboard Grid */}
          <View style={styles.gridContainer}>
            {sortedCards.map((card, idx) => (
              <ActionCard key={idx} item={card} onPress={handleCardPress} />
            ))}
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
          
          <View style={styles.footerSpace} />
        </ScrollView>
      </View>
      
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
         <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
               <View style={styles.modalHeader}>
                 <View>
                   <Text style={styles.modalTitle}>Switch Patient</Text>
                   <Text style={styles.modalSubtitle}>Profiles for {patientPhone}</Text>
                 </View>
                 <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtnWrapper}>
                   <Text style={styles.closeBtn}>✕</Text>
                 </TouchableOpacity>
               </View>
               
               <Text style={styles.label}>Link New UHID</Text>
               <View style={styles.inputRow}>
                 <TextInput 
                   style={styles.input}
                   placeholder="E.g., 1000787878"
                   value={switchUhidText}
                   onChangeText={setSwitchUhidText}
                   placeholderTextColor={colors.gray400}
                 />
                 <TouchableOpacity 
                   style={[styles.linkBtn, (!switchUhidText || isSwitching) && styles.linkBtnDisabled]}
                   onPress={handleLinkNewUhid}
                   disabled={!switchUhidText || isSwitching}
                 >
                   <Text style={styles.linkBtnText}>{isSwitching ? "..." : "Link"}</Text>
                 </TouchableOpacity>
               </View>
               
               <Text style={styles.labelSub}>Linked Profiles</Text>
               <FlatList 
                 data={visibleCandidates}
                 keyExtractor={(item, index) => index.toString()}
                 ListEmptyComponent={() => (
                   <Text style={styles.emptyText}>No other profiles linked on this device yet.</Text>
                 )}
                 renderItem={({item}) => (
                   <TouchableOpacity 
                     style={styles.candidateCard}
                     onPress={() => performSwitch(item)}
                     disabled={isSwitching}
                   >
                     <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{item.name?.charAt(0).toUpperCase()}</Text>
                     </View>
                     <View>
                        <Text style={styles.candidateName}>{item.name}</Text>
                        <Text style={styles.candidateUhid}>{item.uhid ? `UHID: ${item.uhid}` : "Unconfirmed Profile"}</Text>
                     </View>
                   </TouchableOpacity>
                 )}
                 style={{maxHeight: 300}}
               />
            </View>
         </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.primary },
  contentWrapper: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    paddingBottom: 24,
    backgroundColor: colors.primary,
  },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 },
  headerTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.white, marginTop: 4, textTransform: 'capitalize' },
  switchHeaderBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', flexShrink: 0 },
  switchHeaderBtnText: { color: colors.white, fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  
  scrollContainer: { padding: 16 },
  
  sectionTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.gray900, marginBottom: 16, marginLeft: 4 },
  
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  
  actionCard: {
    backgroundColor: colors.white,
    width: '48%',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    minHeight: 120,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    overflow: 'hidden',
  },
  actionCardDisabled: {
    opacity: 0.7,
    elevation: 0,
    shadowOpacity: 0,
    backgroundColor: '#F8FAFC',
    borderColor: '#F1F5F9',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleText: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 2, color: '#1E293B' },
  cardSubtitle: { fontSize: 10, color: '#94A3B8', fontFamily: 'Inter_600SemiBold' },
  
  logoutButton: { paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(141, 73, 86, 0.3)', alignItems: 'center', marginTop: 12, backgroundColor: 'transparent' },
  logoutText: { color: colors.primary, fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  footerSpace: { height: 40 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: colors.white, borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#1E293B', marginBottom: 2 },
  modalSubtitle: { fontSize: 13, color: '#64748B', fontFamily: 'Inter_400Regular' },
  closeBtnWrapper: { padding: 4, backgroundColor: '#F1F5F9', borderRadius: 20, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  closeBtn: { fontSize: 16, color: '#64748B', fontFamily: 'Inter_700Bold', lineHeight: 18 },
  
  label: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#334155', marginBottom: 8 },
  inputRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  input: { flex: 1, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', borderRadius: 12, paddingHorizontal: 16, height: 48, backgroundColor: '#F8FAFC', fontSize: 15, color: '#1E293B', fontFamily: 'Inter_400Regular' },
  linkBtn: { backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, borderRadius: 12, height: 48, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 2 },
  linkBtnDisabled: { opacity: 0.5, shadowOpacity: 0, elevation: 0 },
  linkBtnText: { color: colors.white, fontFamily: 'Inter_700Bold', fontSize: 15 },
  
  labelSub: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.5 },
  emptyText: { textAlign: 'center', color: '#94A3B8', marginVertical: 20, fontSize: 14, fontStyle: 'italic', fontFamily: 'Inter_400Regular' },
  candidateCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', borderRadius: 16, marginBottom: 12, backgroundColor: colors.white },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(141, 73, 86, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarText: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.primary },
  candidateName: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#1E293B' },
  candidateUhid: { fontSize: 13, color: '#64748B', marginTop: 4, fontFamily: 'Inter_400Regular' }
});
