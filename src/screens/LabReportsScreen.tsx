import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, TouchableOpacity, Modal, Alert, ScrollView, Platform } from 'react-native';
import { colors } from '../theme/colors';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getBasicLabReports, getLabResultsByReportId, downloadLabReportPdf } from '../services/api';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export const LabReportsScreen = () => {
  const navigation = useNavigation();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [previewReportId, setPreviewReportId] = useState<string | number | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await getBasicLabReports({ page: 1, limit: 20 });
      if (response && response.data) {
        setReports(Array.isArray(response.data) ? response.data : response.data.data || []);
      }
    } catch (e) {
      console.log('Error fetching lab reports', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (reportId: string | number) => {
    setPreviewReportId(reportId);
    try {
      setLoadingResults(true);
      const response = await getLabResultsByReportId(reportId);
      if (response && response.data) {
        setResults(Array.isArray(response.data) ? response.data : response.data.data || []);
      } else {
        setResults([]);
      }
    } catch (e) {
      console.log('Error fetching lab report details', e);
      setResults([]);
    } finally {
      setLoadingResults(false);
    }
  };

  const handleDownload = async () => {
    if (!previewReportId) return;
    try {
      setDownloading(true);
      const blob = await downloadLabReportPdf(previewReportId);
      
      if (Platform.OS === 'web') {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Lab_Report_LR-${previewReportId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        setDownloading(false);
        return;
      }

      const fr = new FileReader();
      fr.onload = async () => {
        if (typeof fr.result === 'string') {
          const base64Data = fr.result.split(',')[1];
          const fileUri = `${FileSystem.documentDirectory}Lab_Report_LR-${previewReportId}.pdf`;
          
          await FileSystem.writeAsStringAsync(fileUri, base64Data, {
            encoding: FileSystem.EncodingType.Base64,
          });
          
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri, {
              mimeType: 'application/pdf',
              dialogTitle: 'Download Lab Report',
              UTI: 'com.adobe.pdf'
            });
          } else {
            Alert.alert("Success", "PDF downloaded, but sharing is not available on this device.");
          }
        }
      };
      fr.readAsDataURL(blob);
    } catch (e) {
      console.error('Failed to download PDF', e);
      Alert.alert('Error', 'Failed to download PDF report.');
    } finally {
      if (Platform.OS !== 'web') {
        setDownloading(false);
      }
    }
  };

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

  const renderItem = ({ item, index }: { item: any, index: number }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.indexBadge}>
            <Text style={styles.indexText}>{index + 1}</Text>
          </View>
          <View style={styles.dateBlock}>
            <Text style={styles.fieldLabel}>DATE</Text>
            <Text style={styles.dateValue}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        
        <View style={styles.detailsRow}>
          <View style={styles.detailCol}>
            <Text style={styles.fieldLabel}>REPORT NO</Text>
            <Text style={styles.detailValue}>LR-{item.id}</Text>
          </View>
          <View style={styles.detailCol}>
            <Text style={styles.fieldLabel}>TEST NAMES</Text>
            <Text style={styles.detailValue} numberOfLines={2}>{item.labTestNames || '—'}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.previewBtn} onPress={() => handlePreview(item.id)}>
          <FontAwesome5 name="eye" size={14} color={colors.white} style={{marginRight: 8}} />
          <Text style={styles.previewBtnText}>PREVIEW</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderModalContent = () => (
    <View style={styles.modalContainer}>
      <View style={styles.modalHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <FontAwesome5 name="eye" size={18} color="#DDBD8E" style={{ marginRight: 8 }} />
          <Text style={styles.modalTitle}>Report Preview</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity 
            style={styles.downloadBtn} 
            onPress={handleDownload}
            disabled={downloading}
          >
            {downloading ? (
              <ActivityIndicator size="small" color="#8D4956" />
            ) : (
              <>
                <FontAwesome5 name="download" size={14} color="#8D4956" style={{ marginRight: 6 }} />
                <Text style={styles.downloadBtnText}>Download</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setPreviewReportId(null)} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.modalContent}>
        {loadingResults ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : results.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
             <View>
                <View style={styles.tableHeader}>
                   <Text style={[styles.th, { width: 150 }]}>Test Title</Text>
                   <Text style={[styles.th, { width: 100 }]}>Result</Text>
                   <Text style={[styles.th, { width: 80 }]}>Unit</Text>
                   <Text style={[styles.th, { width: 120 }]}>Reference</Text>
                   <Text style={[styles.th, { width: 120 }]}>Method</Text>
                </View>
                <FlatList
                   data={results}
                   keyExtractor={(item, idx) => idx.toString()}
                   renderItem={({item}) => (
                      <View style={styles.tr}>
                         <Text style={[styles.td, { width: 150 }]} numberOfLines={2}>{item.testTitle || '—'}</Text>
                         <Text style={[styles.td, { width: 100, color: '#8D4956', fontFamily: 'Inter_700Bold' }]}>{item.resultData || '—'}</Text>
                         <Text style={[styles.td, { width: 80, color: '#64748B' }]}>{item.unit || '—'}</Text>
                         <Text style={[styles.td, { width: 120, color: '#64748B' }]}>{item.reference || '—'}</Text>
                         <Text style={[styles.td, { width: 120, color: '#94A3B8', fontSize: 12 }]}>{item.method || '—'}</Text>
                      </View>
                   )}
                />
             </View>
          </ScrollView>
        ) : (
          <View style={styles.emptyResults}>
             <FontAwesome5 name="flask" size={40} color="#DDBD8E80" />
             <Text style={styles.emptyResultsText}>No result data available for this report.</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lab Reports</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : (
          <FlatList
            data={reports}
            keyExtractor={(item, idx) => item.id ? item.id.toString() : idx.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={styles.emptyIconBg}>
                  <FontAwesome5 name="flask" size={32} color="#8D4956" />
                </View>
                <Text style={styles.emptyTitle}>No lab reports found</Text>
                <Text style={styles.emptyDesc}>Check back after your tests are completed and approved.</Text>
              </View>
            }
          />
        )}
      </View>

      <Modal visible={!!previewReportId} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          {renderModalContent()}
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
  
  card: { backgroundColor: colors.white, borderRadius: 20, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: 'rgba(221, 189, 142, 0.15)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  indexBadge: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(94, 33, 49, 0.04)', justifyContent: 'center', alignItems: 'center' },
  indexText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#8D4956' },
  dateBlock: { alignItems: 'flex-end' },
  fieldLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#8D4956', letterSpacing: 1, textTransform: 'uppercase' },
  dateValue: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#1E293B', marginTop: 2 },
  
  detailsRow: { flexDirection: 'row', marginBottom: 16 },
  detailCol: { flex: 1, paddingRight: 8 },
  detailValue: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#1E293B', marginTop: 2 },
  
  previewBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#5E2131', paddingVertical: 12, borderRadius: 12 },
  previewBtnText: { color: colors.white, fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 20, backgroundColor: colors.white, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(221, 189, 142, 0.15)' },
  emptyIconBg: { width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(94, 33, 49, 0.04)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#1E293B' },
  emptyDesc: { fontSize: 14, color: '#94A3B8', textAlign: 'center', fontFamily: 'Inter_400Regular', marginTop: 8, maxWidth: 220 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 },
  modalContainer: { backgroundColor: colors.white, borderRadius: 24, overflow: 'hidden', maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#5E2131' },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginRight: 8 },
  downloadBtnText: { color: '#8D4956', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  closeBtn: { padding: 6, backgroundColor: '#F1F5F9', borderRadius: 20 },
  
  modalContent: { padding: 16, minHeight: 200 },
  tableHeader: { flexDirection: 'row', backgroundColor: 'rgba(94, 33, 49, 0.04)', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(221, 189, 142, 0.15)' },
  th: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#5E2131', textTransform: 'uppercase' },
  tr: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  td: { fontSize: 14, fontFamily: 'Inter_500Medium', color: '#1E293B' },
  
  emptyResults: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyResultsText: { color: '#94A3B8', marginTop: 12, fontFamily: 'Inter_500Medium' }
});
