import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, SafeAreaView, RefreshControl } from 'react-native';
import { colors } from '../theme/colors';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getErpAppointments, getBills } from '../services/api';

export const PendingsScreen = () => {
  const navigation = useNavigation();
  const { useRoute } = require('@react-navigation/native');
  const route: any = useRoute();
  const { isHistory, initialTab } = route.params || {};
  const [activeTab, setActiveTab] = useState<'appointments' | 'bills'>(initialTab || 'appointments');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [loadingAppts, setLoadingAppts] = useState(false);
  const [loadingBills, setLoadingBills] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAppointments = async () => {
    try {
      setLoadingAppts(true);
      // Status 14 is often used for pending/scheduled appointments
      const params: any = {};
      if (!isHistory) params.status = 14;
      const response = await getErpAppointments(params);
      if (response && response.data) {
        setAppointments(Array.isArray(response.data) ? response.data : response.data.data || []);
      }
    } catch (e) {
      console.log('Error fetching appointments', e);
    } finally {
      setLoadingAppts(false);
    }
  };

  const fetchBills = async () => {
    try {
      setLoadingBills(true);
      const params: any = {};
      if (!isHistory) params.isDue = true;
      const response = await getBills(params);
      if (response && response.data) {
        setBills(Array.isArray(response.data) ? response.data : response.data.data || []);
      }
    } catch (e) {
      console.log('Error fetching bills', e);
    } finally {
      setLoadingBills(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchBills();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (activeTab === 'appointments') {
      await fetchAppointments();
    } else {
      await fetchBills();
    }
    setRefreshing(false);
  }, [activeTab]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Recent';
    try {
      let dateObj = new Date(dateStr);
      if (isNaN(dateObj.getTime())) {
        const parts = dateStr.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/);
        if (parts) {
          const [_, day, month, year] = parts;
          dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
      }
      if (isNaN(dateObj.getTime())) {
        return dateStr.split(' ')[0];
      }
      return dateObj.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch (e) {
      return dateStr.split(' ')[0];
    }
  };

  const renderAppointmentItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconCircle}>
          <FontAwesome5 name="user-md" size={16} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.doctorName}>{item.doctorName || item?.doctor?.fullName || 'Unknown Doctor'}</Text>
          <Text style={styles.department}>{item.department || item?.doctor?.department?.title || item?.department?.title || 'Consultation'}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{isHistory ? (item.status === 14 ? 'Pending' : 'Completed') : 'Pending'}</Text>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color="#64748B" />
          <Text style={styles.infoText}>{formatDate(item.appointmentDate)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={16} color="#64748B" />
          <Text style={styles.infoText}>{item.appointmentTime || 'N/A'}</Text>
        </View>
      </View>
    </View>
  );

  const renderBillItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconCircleBill}>
          <FontAwesome5 name="file-invoice-dollar" size={16} color="#D67B80" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.doctorName}>Bill #{item.billNo || item.id || 'N/A'}</Text>
          <Text style={styles.department}>{formatDate(item.billDateTime || item.billDate)}</Text>
        </View>
        <Text style={styles.billAmount}>৳ {item.patientDueAmount || item.finalBillAmount || item.dueAmount || item.netAmount || 0}</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.cardBody}>
        {/* <TouchableOpacity style={[styles.payButton, isHistory && { backgroundColor: '#E2E8F0' }]}>
          <Text style={[styles.payButtonText, isHistory && { color: '#475569' }]}>{isHistory ? 'View' : 'Pay Now'}</Text>
        </TouchableOpacity> */}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isHistory ? 'History' : 'Pendings'}</Text>
        <View style={{ width: 40 }} />
      </View>

      {!initialTab && (
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'appointments' && styles.activeTab]}
            onPress={() => setActiveTab('appointments')}
          >
            <Text style={[styles.tabText, activeTab === 'appointments' && styles.activeTabText]}>Appointments</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'bills' && styles.activeTab]}
            onPress={() => setActiveTab('bills')}
          >
            <Text style={[styles.tabText, activeTab === 'bills' && styles.activeTabText]}>{isHistory ? 'Bills' : 'Pending Bills'}</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.content}>
        {activeTab === 'appointments' ? (
          loadingAppts && appointments.length === 0 ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : (
            <FlatList
              data={appointments}
              keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
              renderItem={renderAppointmentItem}
              contentContainerStyle={styles.listContainer}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="calendar-clear-outline" size={60} color="#CBD5E1" />
                  <Text style={styles.emptyTitle}>{isHistory ? 'No Appointments' : 'No Pending Appointments'}</Text>
                  <Text style={styles.emptyDesc}>{isHistory ? "You don't have any appointments on record." : "You don't have any upcoming appointments at the moment."}</Text>
                </View>
              }
            />
          )
        ) : (
          loadingBills && bills.length === 0 ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : (
            <FlatList
              data={bills}
              keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
              renderItem={renderBillItem}
              contentContainerStyle={styles.listContainer}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="checkmark-done-circle-outline" size={60} color="#CBD5E1" />
                  <Text style={styles.emptyTitle}>{isHistory ? 'No Bills Found' : 'All Caught Up!'}</Text>
                  <Text style={styles.emptyDesc}>{isHistory ? 'You have no billing history.' : 'You have no pending dues or unpaid bills.'}</Text>
                </View>
              }
            />
          )
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 40, backgroundColor: colors.primary },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { color: colors.white, fontSize: 18, fontFamily: 'Inter_700Bold' },
  
  tabContainer: { flexDirection: 'row', padding: 16, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  activeTab: { backgroundColor: 'rgba(141, 73, 86, 0.08)' },
  tabText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#64748B' },
  activeTabText: { color: colors.primary, fontFamily: 'Inter_700Bold' },
  
  content: { flex: 1 },
  listContainer: { padding: 16, paddingBottom: 40 },
  loader: { marginTop: 40 },
  
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(141, 73, 86, 0.08)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  iconCircleBill: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(214, 123, 128, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  doctorName: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#1E293B', marginBottom: 2 },
  department: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#64748B' },
  
  statusBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: '#D97706', fontSize: 12, fontFamily: 'Inter_700Bold' },
  billAmount: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#D67B80' },
  
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 16 },
  cardBody: { flexDirection: 'row', gap: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#475569' },
  
  payButton: { backgroundColor: colors.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, width: '100%', alignItems: 'center' },
  payButtonText: { color: colors.white, fontSize: 14, fontFamily: 'Inter_700Bold' },
  
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 40 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#1E293B', marginTop: 16, marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: '#64748B', textAlign: 'center', fontFamily: 'Inter_400Regular', lineHeight: 20 }
});


