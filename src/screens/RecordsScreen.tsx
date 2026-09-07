import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const RecordCard = ({ item, onPress }: any) => {
  const { icon, title, desc, accent } = item;
  
  return (
    <TouchableOpacity 
      style={[styles.recordCard, { borderColor: `${accent}30` }]} 
      onPress={() => onPress(item.title)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrapper, { backgroundColor: `${accent}15` }]}>
        <FontAwesome5 name={icon} size={24} color={accent} solid />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDesc}>{desc}</Text>
      </View>
      <View style={styles.arrowWrapper}>
        <FontAwesome5 name="chevron-right" size={16} color="#CBD5E1" />
      </View>
    </TouchableOpacity>
  );
};

export const RecordsScreen = ({ navigation }: any) => {
  const scrollY = React.useRef(new Animated.Value(0)).current;

  const records = [
    { id: '1', icon: 'notes-medical', title: 'Lab Results (Data)', desc: 'View your clinical health records and lab results.', accent: '#5E2131' },
    { id: '2', icon: 'pills', title: 'Prescriptions', desc: 'Access your medication history and prescriptions.', accent: '#10B981' },
    { id: '3', icon: 'file-alt', title: 'Discharge Summaries', desc: 'Read your hospital discharge summaries and notes.', accent: '#F59E0B' },
    { id: '4', icon: 'calendar-check', title: 'Pending Appointments', desc: 'Check your upcoming and pending appointments.', accent: '#8B5CF6' },
    { id: '5', icon: 'file-invoice-dollar', title: 'Pending Dues', desc: 'View your billing history and pending payments.', accent: '#EF4444' },
  ];

  const handlePress = (title: string) => {
    Alert.alert("Coming Soon", `${title} will be implemented soon.`);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <FontAwesome5 name="arrow-left" size={20} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Previous Records</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.contentWrapper}>
        <Animated.ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        >
          <View style={styles.titleContainer}>
            <Text style={styles.pageTitle}>Your Records</Text>
            <Text style={styles.pageSubtitle}>Access and manage all your health information in one place.</Text>
          </View>

          <View style={styles.cardsContainer}>
            {records.map((record) => (
              <RecordCard key={record.id} item={record} onPress={handlePress} />
            ))}
          </View>
        </Animated.ScrollView>
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
  contentWrapper: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContainer: { padding: 20, paddingBottom: 40 },
  titleContainer: { marginBottom: 24 },
  pageTitle: { fontSize: 24, fontFamily: 'Inter_700Bold', color: '#1E293B', marginBottom: 8 },
  pageSubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#64748B', lineHeight: 20 },
  cardsContainer: { gap: 16 },
  recordCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#1E293B', marginBottom: 4 },
  cardDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#64748B', lineHeight: 18 },
  arrowWrapper: { marginLeft: 12, opacity: 0.5 },
});
