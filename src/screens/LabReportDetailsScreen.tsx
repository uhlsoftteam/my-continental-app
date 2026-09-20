import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, SafeAreaView } from 'react-native';
import { colors } from '../theme/colors';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getLabResultsByReportId } from '../services/api';

export const LabReportDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { reportId } = route.params || {};

  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (reportId) {
      fetchDetails();
    }
  }, [reportId]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const response = await getLabResultsByReportId(reportId);
      if (response && response.data) {
        setResults(Array.isArray(response.data) ? response.data : response.data.data || []);
      }
    } catch (e) {
      console.log('Error fetching report details', e);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconCircle}>
          <FontAwesome5 name="vial" size={16} color="#5E2131" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.testTitle || 'Unknown Test'}</Text>
          <Text style={styles.cardMethod}>{item.method || 'Standard Method'}</Text>
        </View>
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.resultGrid}>
        <View style={styles.resultCol}>
          <Text style={styles.label}>RESULT</Text>
          <View style={styles.resultValueContainer}>
            <Text style={styles.resultValue}>{item.resultData || '--'}</Text>
            <Text style={styles.unit}>{item.unit || ''}</Text>
          </View>
        </View>
        
        <View style={styles.resultCol}>
          <Text style={styles.label}>REFERENCE RANGE</Text>
          <Text style={styles.reference}>{item.reference || 'N/A'}</Text>
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
        <Text style={styles.headerTitle}>Report Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>REPORT ID</Text>
          <Text style={styles.summaryValue}>LR-{reportId}</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={48} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No Details Found</Text>
                <Text style={styles.emptyDesc}>We couldn't retrieve the detailed parameters for this report.</Text>
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
  summaryBox: { backgroundColor: colors.white, padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  summaryLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#64748B', letterSpacing: 0.5 },
  summaryValue: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#1E293B', marginTop: 4 },
  
  listContainer: { padding: 16, paddingBottom: 40 },
  loader: { marginTop: 40 },
  
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(94, 33, 49, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  cardTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#1E293B', marginBottom: 2 },
  cardMethod: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#64748B' },
  
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 16 },
  
  resultGrid: { flexDirection: 'row', gap: 16 },
  resultCol: { flex: 1 },
  label: { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#94A3B8', letterSpacing: 0.5, marginBottom: 4 },
  resultValueContainer: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  resultValue: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#8D4956' },
  unit: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#64748B' },
  reference: { fontSize: 14, fontFamily: 'Inter_500Medium', color: '#475569', marginTop: 2 },
  
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 40 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#1E293B', marginTop: 16, marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: '#64748B', textAlign: 'center', fontFamily: 'Inter_400Regular', lineHeight: 20 }
});
