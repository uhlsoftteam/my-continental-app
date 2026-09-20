import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, SafeAreaView, RefreshControl, Alert } from 'react-native';
import { colors } from '../theme/colors';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getDischargeSummaries } from '../services/api';

export const DischargeSummariesScreen = () => {
  const navigation = useNavigation();
  const [summaries, setSummaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const formatDate = (d?: string | null) => {
    if (!d) return 'Recent';
    try {
      let dateStr = d;
      const timeMatch = d.match(/^(\d{2})[-/](\d{2})[-/](\d{4})(?:\s+(.*))?$/);
      if (timeMatch) {
        dateStr = `${timeMatch[3]}-${timeMatch[2]}-${timeMatch[1]}${timeMatch[4] ? 'T' + timeMatch[4] : ''}`;
      } else {
        const isoDash = /^\d{4}-\d{2}-\d{2}/.test(d);
        dateStr = isoDash ? d : d.split("-").reverse().join("-");
      }
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return d;
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return d;
    }
  };

  const fetchSummaries = async () => {
    try {
      setLoading(true);
      const response = await getDischargeSummaries();
      if (response && response.data) {
        setSummaries(Array.isArray(response.data) ? response.data : response.data.data || []);
      }
    } catch (e) {
      console.log('Error fetching discharge summaries', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaries();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSummaries();
    setRefreshing(false);
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconCircle}>
          <FontAwesome5 name="file-alt" size={16} color="#F59E0B" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.admissionId || 'Discharge Summary'}</Text>
          <Text style={styles.cardDate}>{formatDate(item.dischargeDate)}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Discharge Summaries</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {loading && summaries.length === 0 ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : (
          <FlatList
            data={summaries}
            keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <FontAwesome5 name="folder-open" size={48} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No Summaries Found</Text>
                <Text style={styles.emptyDesc}>You don't have any discharge summaries available at the moment.</Text>
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
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(245, 158, 11, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  cardTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#1E293B', marginBottom: 2 },
  cardDate: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#64748B' },
  
  viewBtn: { backgroundColor: 'rgba(245, 158, 11, 0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  viewBtnText: { color: '#F59E0B', fontSize: 13, fontFamily: 'Inter_700Bold' },
  
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 40 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#1E293B', marginTop: 16, marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: '#64748B', textAlign: 'center', fontFamily: 'Inter_400Regular', lineHeight: 20 }
});


