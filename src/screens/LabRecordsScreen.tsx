import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, TouchableOpacity, Modal } from 'react-native';
import { colors } from '../theme/colors';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getLabResults } from '../services/api';
import { LabTrendWidget } from '../components/LabTrendWidget';
import { getSafeRange } from '../utils/labReferenceRanges';

const ELIGIBLE_TEST_CODES = [600000339, 600000336, 600000216, 600000214, 600000199];

export const LabRecordsScreen = () => {
  const navigation = useNavigation();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzingItem, setAnalyzingItem] = useState<any>(null);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await getLabResults();
      if (response && response.data) {
        setResults(Array.isArray(response.data) ? response.data : response.data.data || []);
      }
    } catch (e) {
      console.log('Error fetching lab results', e);
    } finally {
      setLoading(false);
    }
  };

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

  const renderItem = ({ item, index }: { item: any, index: number }) => {
    const isEligible = item.labTestCode && ELIGIBLE_TEST_CODES.includes(Number(item.labTestCode));
    const safeRange = item.labTestCode ? getSafeRange(item.labTestCode, {} as any) : null;
    const safeRangeStr = safeRange ? safeRange[0] + ' - ' + safeRange[1] : null;
    const displayRef = (item.reference && item.reference !== '—' && item.reference !== 'null') ? item.reference : (safeRangeStr ?? '—');
    
    return (
      <View style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.indexBadge}>
            <Text style={styles.indexText}>{index + 1}</Text>
          </View>
          <View style={styles.dateBlock}>
            <Text style={styles.fieldLabel}>DATE</Text>
            <Text style={styles.dateValue}>{formatDate(item.resultDate || item.createdAt)}</Text>
          </View>
        </View>
        
        <View style={styles.titleRow}>
          <Text style={styles.fieldLabel}>TEST TITLE</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Ionicons name="flask" size={18} color="#8D4956" style={{marginRight: 8}} />
            <Text style={styles.testTitle}>{item.testTitle || item.profileName || item.category || 'Lab Result'}</Text>
          </View>
        </View>
        
        <View style={styles.bottomGrid}>
          <View style={styles.gridCol}>
            <Text style={styles.fieldLabel}>RESULT</Text>
            <View style={styles.resultBox}>
              <Text style={styles.resultValue}>
                {item.resultData ?? '—'}
                {item.unit && item.unit !== '—' ? <Text style={styles.unitText}> {item.unit}</Text> : null}
              </Text>
            </View>
          </View>
          <View style={styles.gridCol}>
            <Text style={styles.fieldLabel}>REFERENCE</Text>
            <View style={styles.refBox}>
              <Text style={styles.referenceValue}>{displayRef}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>{item.method || '—'}</Text>
          {isEligible && (
            <TouchableOpacity style={styles.analyzeBtn} onPress={() => setAnalyzingItem(item)}>
              <Ionicons name="stats-chart" size={14} color={colors.white} style={{marginRight: 6}} />
              <Text style={styles.analyzeBtnText}>Analyze</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lab Results (Data)</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item, idx) => item.id ? item.id.toString() : idx.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={48} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No Results Found</Text>
                <Text style={styles.emptyDesc}>You do not have any lab records available.</Text>
              </View>
            }
          />
        )}
      </View>

      <Modal visible={!!analyzingItem} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Trend Analysis</Text>
              <TouchableOpacity onPress={() => setAnalyzingItem(null)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            {analyzingItem && (
              <View style={styles.trendContainer}>
                <LabTrendWidget 
                  testCode={analyzingItem.labTestCode} 
                  title={analyzingItem.testTitle || analyzingItem.profileName || 'Test Result'} 
                  accentColor="#8D4956" 
                  patient={null} fullWidth={true}
                />
              </View>
            )}
            
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setAnalyzingItem(null)}>
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  
  card: { backgroundColor: colors.white, borderRadius: 24, padding: 20, marginBottom: 20, shadowColor: '#8D4956', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4, borderWidth: 1, borderColor: '#F1F5F9' },
  
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  indexBadge: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(141, 73, 86, 0.08)', justifyContent: 'center', alignItems: 'center' },
  indexText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#8D4956' },
  
  dateBlock: { alignItems: 'flex-end', backgroundColor: '#F8FAFC', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  dateValue: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#1E293B', marginTop: 2 },
  
  titleRow: { marginBottom: 20 },
  testTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#1E293B', flexShrink: 1 },
  
  bottomGrid: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  gridCol: { flex: 1 },
  resultBox: { backgroundColor: 'rgba(141, 73, 86, 0.05)', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, marginTop: 6, borderWidth: 1, borderColor: 'rgba(141, 73, 86, 0.1)' },
  refBox: { backgroundColor: '#F8FAFC', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, marginTop: 6, borderWidth: 1, borderColor: '#F1F5F9' },
  resultValue: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#8D4956' },
  unitText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#64748B' },
  referenceValue: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#475569' },
  
  fieldLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase' },
  
  footerRow: { borderTopWidth: 1, borderTopColor: '#F1F5F9', borderStyle: 'dashed', paddingTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#94A3B8', flex: 1 },
  analyzeBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#8D4956', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, shadowColor: '#8D4956', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2 },
  analyzeBtnText: { color: colors.white, fontSize: 12, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#1E293B' },
  closeBtn: { padding: 4 },
  trendContainer: { minHeight: 200, marginBottom: 20 },
  modalCloseBtn: { backgroundColor: '#F1F5F9', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  modalCloseBtnText: { color: '#64748B', fontSize: 15, fontFamily: 'Inter_700Bold' },
  
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 40 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#1E293B', marginTop: 16, marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: '#64748B', textAlign: 'center', fontFamily: 'Inter_400Regular', lineHeight: 20 }
});







