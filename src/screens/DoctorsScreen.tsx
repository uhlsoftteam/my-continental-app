import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  Image,
  Modal,
  Dimensions,
  Animated,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { getDoctors, getDepartments } from '../services/api';

const { width } = Dimensions.get('window');

export const DoctorsScreen = ({ navigation }: any) => {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [isGridView, setIsGridView] = useState(false);

  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;

  // The controls container is approximately 124px tall.
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [0, -120],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [docsRes, deptsRes] = await Promise.all([
        getDoctors(),
        getDepartments()
      ]);
      setDoctors(docsRes.data || []);
      
      const depts = deptsRes.data || [];
      depts.sort((a: any, b: any) => a.name.localeCompare(b.name));
      setDepartments([{ _id: 'All', id: 'All', name: 'All Specialties' }, ...depts]);
    } catch (error) {
      console.error('Error fetching doctors data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (doc.designation && doc.designation.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesDept = selectedDept === 'All' || doc.department?._id === selectedDept || doc.department?.id === selectedDept;
      return matchesSearch && matchesDept;
    });
  }, [doctors, searchQuery, selectedDept]);

  const selectedDeptName = useMemo(() => {
    const dept = departments.find(d => d._id === selectedDept || d.id === selectedDept);
    return dept ? dept.name : 'All Specialties';
  }, [selectedDept, departments]);

  const renderDoctorCard = ({ item }: { item: any }) => {
    let imageUrl = item.image;
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = `http://10.200.117.240:5000${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
    }

    if (isGridView) {
      return (
        <TouchableOpacity 
          style={styles.gridCard}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Appointment', { doctor: item })}
        >
          <View style={styles.gridAvatarContainer}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.gridAvatar} />
            ) : (
              <View style={[styles.gridAvatar, styles.placeholderAvatar]}>
                <FontAwesome5 name="user-md" size={32} color={colors.primary} />
              </View>
            )}
            <View style={styles.onlineBadgeGrid} />
          </View>
          
          <Text style={styles.gridNameText} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.gridDesignationText} numberOfLines={1}>{item.designation}</Text>
          
          {item.department?.name && (
            <Text style={styles.gridDepartmentText} numberOfLines={1}>
              {item.department.name}
            </Text>
          )}

          <View style={styles.gridBookBtn}>
            <Text style={styles.gridBookBtnText}>Book Appointment</Text>
          </View>
        </TouchableOpacity>
      );
    }

    // LIST VIEW
    return (
      <TouchableOpacity 
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('Appointment', { doctor: item })}
      >
        <View style={styles.cardTopRow}>
          <View style={styles.avatarContainer}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.placeholderAvatar]}>
                <FontAwesome5 name="user-md" size={24} color={colors.primary} />
              </View>
            )}
            <View style={styles.onlineBadge} />
          </View>
          
          <View style={styles.infoContainer}>
            <Text style={styles.nameText} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.designationText} numberOfLines={1}>{item.designation}</Text>
            
            {item.department?.name && (
              <View style={styles.departmentPill}>
                <Text style={styles.departmentText} numberOfLines={1}>
                  {item.department.name}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.cardBottomRow}>
          <View style={styles.degreesWrapper}>
            {(item.degrees && item.degrees.length > 0) ? (
              <Text style={styles.degreesText} numberOfLines={2}>
                {item.degrees.join(', ')}
              </Text>
            ) : null}
          </View>
          <View style={styles.bookButtonSmall}>
            <Text style={styles.bookButtonTextSmall}>Book Appointment</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Fixed Top Header (Does not animate away, sits on top with zIndex) */}
      <View style={styles.fixedHeaderWrapper}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <FontAwesome5 name="arrow-left" size={20} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Find a Doctor</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <View style={styles.contentWrapper}>
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading doctors...</Text>
          </View>
        ) : filteredDoctors.length === 0 ? (
          <View style={styles.centerContent}>
            <FontAwesome5 name="search-minus" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No doctors found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search or filter.</Text>
          </View>
        ) : (
          <Animated.FlatList
            key={isGridView ? 'grid' : 'list'}
            data={filteredDoctors}
            keyExtractor={(item) => item._id}
            numColumns={isGridView ? 2 : 1}
            renderItem={renderDoctorCard}
            contentContainerStyle={styles.listContainer}
            columnWrapperStyle={isGridView ? styles.gridRow : undefined}
            showsVerticalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
          />
        )}

        {/* Animated Search & Filter Block (Sits on top of the list but under the fixed header) */}
        {!loading && (
          <Animated.View 
            style={[
              styles.controlsContainer, 
              { 
                transform: [{ translateY: headerTranslateY }],
                opacity: headerOpacity
              }
            ]}
          >
            <View style={styles.searchRow}>
              <View style={styles.searchBox}>
                <FontAwesome5 name="search" size={16} color="#94A3B8" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by name or specialty..."
                  placeholderTextColor="#94A3B8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                    <FontAwesome5 name="times-circle" size={16} color="#94A3B8" solid />
                  </TouchableOpacity>
                )}
              </View>
              
              <TouchableOpacity 
                style={styles.viewToggleBtn} 
                onPress={() => setIsGridView(!isGridView)}
              >
                <FontAwesome5 name={isGridView ? "list-ul" : "th-large"} size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.filterDropdownBtn} 
              onPress={() => setShowDeptModal(true)}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <FontAwesome5 name="filter" size={12} color="#64748B" style={{ marginRight: 8 }} />
                <Text style={styles.filterDropdownLabel}>Department:</Text>
                <Text style={styles.filterDropdownValue} numberOfLines={1}>{selectedDeptName}</Text>
              </View>
              <FontAwesome5 name="chevron-down" size={12} color="#94A3B8" />
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {/* Department Modal */}
      <Modal
        visible={showDeptModal}
        animationType="slide"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={() => setShowDeptModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Department</Text>
              <TouchableOpacity onPress={() => setShowDeptModal(false)} style={styles.modalCloseBtn}>
                <FontAwesome5 name="times" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={departments}
              keyExtractor={(item) => item._id || item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = selectedDept === item._id || selectedDept === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.modalDeptRow, isSelected && styles.modalDeptRowActive]}
                    onPress={() => {
                      setSelectedDept(item._id || item.id);
                      setShowDeptModal(false);
                    }}
                  >
                    <Text style={[styles.modalDeptText, isSelected && styles.modalDeptTextActive]}>
                      {item.name}
                    </Text>
                    {isSelected && (
                      <FontAwesome5 name="check" size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.primary },
  fixedHeaderWrapper: {
    zIndex: 10,
    backgroundColor: colors.primary,
    elevation: 4, // for android shadow
  },
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
  
  controlsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#1E293B',
  },
  viewToggleBtn: {
    width: 48,
    height: 48,
    backgroundColor: colors.white,
    borderRadius: 12,
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  filterDropdownLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#64748B',
    marginRight: 6,
  },
  filterDropdownValue: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#0F172A',
    flex: 1,
  },
  
  // Notice the paddingTop to push the list items down below the floating controlsContainer
  listContainer: { padding: 16, paddingTop: 140, paddingBottom: 40 },
  
  gridRow: {
    justifyContent: 'space-between',
  },
  
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    marginTop: 100, // push it down below animated header
  },
  loadingText: {
    marginTop: 16,
    color: '#64748B',
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#334155',
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#94A3B8',
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  
  /* LIST CARD STYLES */
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { position: 'relative', marginRight: 12 },
  avatar: {
    width: 60,
    height: 76,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  placeholderAvatar: { alignItems: 'center', justifyContent: 'center' },
  onlineBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: colors.white,
  },
  infoContainer: { flex: 1, justifyContent: 'center' },
  nameText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#0F172A', marginBottom: 2 },
  designationText: { fontSize: 12, color: '#64748B', fontFamily: 'Inter_500Medium', marginBottom: 2 },
  departmentPill: {
    alignSelf: 'flex-start',
    backgroundColor: `${colors.primary}10`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  departmentText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: colors.primary },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  degreesWrapper: {
    flex: 1,
    marginRight: 12,
  },
  degreesText: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: 'Inter_400Regular',
    lineHeight: 16,
  },
  bookButtonSmall: {
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bookButtonTextSmall: {
    color: colors.primary,
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
  },

  /* GRID CARD STYLES */
  gridCard: {
    width: (width - 32 - 12) / 2, // Half width minus padding and gap
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  gridAvatarContainer: { position: 'relative', marginBottom: 12 },
  gridAvatar: {
    width: 80,
    height: 100,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  onlineBadgeGrid: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: colors.white,
  },
  gridNameText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 4,
  },
  gridDesignationText: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
    marginBottom: 6,
  },
  gridDepartmentText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  gridBookBtn: {
    backgroundColor: `${colors.primary}10`,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    width: '100%',
    alignItems: 'center',
  },
  gridBookBtnText: {
    color: colors.primary,
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    textAlign: 'center',
  },

  /* MODAL STYLES */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 60,
    maxHeight: '80%',
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#0F172A',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalDeptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  modalDeptRowActive: {
    backgroundColor: `${colors.primary}05`,
  },
  modalDeptText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: '#334155',
  },
  modalDeptTextActive: {
    fontFamily: 'Inter_700Bold',
    color: colors.primary,
  },
});
