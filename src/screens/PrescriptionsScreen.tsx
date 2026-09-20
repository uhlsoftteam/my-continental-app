import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, SafeAreaView, RefreshControl, Alert } from 'react-native';
import { colors } from '../theme/colors';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getPrescriptions } from '../services/api';

export const PrescriptionsScreen = () => {
  const navigation = useNavigation();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Recent';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Recent';
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await getPrescriptions();
      if (response && response.data) {
        setPrescriptions(Array.isArray(response.data) ? response.data : response.data.data || []);
      }
    } catch (e) {
      console.log('Error fetching prescriptions', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPrescriptions();
    setRefreshing(false);
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconCircle}>
          <FontAwesome5 name="pills" size={16} color="#10B981" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.doctorName || item.drName || 'Prescription'}</Text>
          <Text style={styles.cardDate}>{formatDate(item.completeDateTime || item.prescriptionDate || item.txDate || item.date || item.createdAt)}</Text>
        </View>
        <TouchableOpacity style={styles.viewBtn} onPress={() => Alert.alert('View Details', 'Full detailed view for this record will be available soon.')}>
          <Text style={styles.viewBtnText}>View</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Prescriptions</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {loading && prescriptions.length === 0 ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : (
          <FlatList
            data={prescriptions}
            keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <FontAwesome5 name="prescription-bottle-alt" size={48} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No Prescriptions</Text>
                <Text style={styles.emptyDesc}>You don't have any prescriptions available at the moment.</Text>
              </View>
            }
          />
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
  
  content: { flex: 1 },
  listContainer: { padding: 16, paddingBottom: 40 },
  loader: { marginTop: 40 },
  
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(16, 185, 129, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  cardTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#1E293B', marginBottom: 2 },
  cardDate: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#64748B' },
  
  viewBtn: { backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  viewBtnText: { color: '#10B981', fontSize: 13, fontFamily: 'Inter_700Bold' },
  
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 40 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#1E293B', marginTop: 16, marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: '#64748B', textAlign: 'center', fontFamily: 'Inter_400Regular', lineHeight: 20 }
});



