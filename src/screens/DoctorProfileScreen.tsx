import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const stripBullets = (text: string) => {
  if (!text) return "";
  return text.replace(/^[•\-\*]\s*/, "");
};

const cleanRichText = (html: string) => {
  if (!html) return "";
  let cleaned = html.replace(/<br\s*[\/]?>/gi, "__NEWLINE__");
  cleaned = cleaned.replace(/<\/p>|<\/div>/gi, "__PARAGRAPH__");
  cleaned = cleaned.replace(/<[^>]*>?/gm, ' '); // remove html tags, replacing with space
  cleaned = cleaned.replace(/&nbsp;/gi, " ");
  
  // Collapse all whitespace (including source code newlines) into a single space
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  // Restore explicit line breaks
  cleaned = cleaned.replace(/__NEWLINE__/g, "\n");
  cleaned = cleaned.replace(/__PARAGRAPH__/g, "\n\n");
  
  // Clean up any double spaces that might have been created around newlines
  cleaned = cleaned.replace(/ \n/g, "\n");
  cleaned = cleaned.replace(/\n /g, "\n");
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n"); // max 2 newlines
  
  return cleaned.trim();
};

export const DoctorProfileScreen = ({ route, navigation }: any) => {
  const { doctor } = route.params;
  const [isExpanded, setIsExpanded] = useState(false);
  const [isScheduleExpanded, setIsScheduleExpanded] = useState(false);

  let imageUrl = doctor?.image || null;
  if (imageUrl && !imageUrl.startsWith('http')) {
    imageUrl = `http://10.200.117.240:5000${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  }

  const renderSection = (title: string, data: string[] | string | undefined, isHtml: boolean = false) => {
    if (!data || (Array.isArray(data) && data.length === 0)) return null;
    
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {Array.isArray(data) ? (
          data.map((item, i) => (
            <View key={i} style={styles.listItem}>
              <View style={styles.bulletPoint} />
              <Text style={styles.listText}>{stripBullets(item)}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.paragraphText}>
            {isHtml ? cleanRichText(data as string) : data}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" translucent={false} />
      
      <SafeAreaView style={styles.header} edges={['top']}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#5E2131" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 40 }} />
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Header Container */}
        <View style={styles.profileHeaderContainer}>
          <Image 
            source={imageUrl ? { uri: imageUrl } : require('../../assets/icon.png')} 
            style={styles.profileHeroImage} 
            resizeMode="cover"
          />
          <View style={styles.profileHeaderDetails}>
            <Text style={styles.doctorName}>{doctor?.name || "Doctor Profile"}</Text>
            
            <View style={styles.designationRow}>
              <Text style={styles.designationText}>{doctor?.designation || "Consultant"}</Text>
              <View style={styles.dot} />
              <Text style={styles.departmentText}>{doctor?.department?.name || doctor?.department || "General"}</Text>
            </View>

            <View style={styles.degreesContainer}>
              {(doctor?.degrees || []).map((deg: string, i: number) => (
                <View key={i} style={styles.degreeBadge}>
                  <Text style={styles.degreeText}>{deg}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Details Section */}
        <View style={styles.detailsCard}>
          <View style={[styles.detailsContent, !isExpanded && { maxHeight: 300, overflow: 'hidden' }]}>
            {renderSection("About Doctor", doctor?.introduction, true)}
            {renderSection("Education", doctor?.academic)}
            {renderSection("Experience", doctor?.experience)}
            {renderSection("Expertise & Skill", doctor?.expertiseAndSkill, true)}
            {renderSection("Special Clinical Interests", doctor?.specialClinicalInterests)}
            {renderSection("Professional Affiliations", doctor?.professionalAffiliations)}
            {renderSection("Training & Workshop", doctor?.trainingAndWorkshop)}
            {renderSection("Fellowships", doctor?.fellowships)}
          </View>
          
          {!isExpanded && (
            <View style={styles.fadeOverlay} />
          )}
          
          <TouchableOpacity 
            style={styles.expandBtn} 
            onPress={() => setIsExpanded(!isExpanded)}
          >
            <Text style={styles.expandBtnText}>{isExpanded ? "SHOW LESS" : "VIEW FULL PROFILE"}</Text>
            <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={16} color="#5E2131" />
          </TouchableOpacity>
        </View>

        {/* Schedule Accordion */}
        <View style={styles.scheduleCard}>
          <TouchableOpacity 
            style={styles.scheduleHeader}
            onPress={() => setIsScheduleExpanded(!isScheduleExpanded)}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={styles.scheduleIconBg}>
                <FontAwesome5 name="calendar-alt" size={18} color="#5E2131" />
              </View>
              <View style={{ flex: 1, paddingRight: 16, justifyContent: 'center' }}>
                <Text style={styles.scheduleTitle}>Availability Schedule</Text>
                <Text style={styles.scheduleSubtitle}>{doctor?.location || "Main Branch"}</Text>
              </View>
            </View>
            <Ionicons name={isScheduleExpanded ? "chevron-up" : "chevron-down"} size={20} color="#DDBD8E" />
          </TouchableOpacity>
          
          {isScheduleExpanded && (
            <View style={styles.scheduleContent}>
              {(doctor?.schedules || []).length > 0 ? (
                <View style={styles.scheduleGrid}>
                  {(doctor?.schedules || []).map((row: any, idx: number) => (
                    <TouchableOpacity 
                      key={idx} 
                      style={styles.scheduleItem}
                      onPress={() => navigation.navigate('Appointment', { doctor })}
                    >
                      <View>
                        <Text style={styles.scheduleDay}>{row?.day}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                          <FontAwesome5 name="clock" size={12} color="#DDBD8E" style={{ marginRight: 6 }} />
                          <Text style={styles.scheduleTime}>{row?.startTime} - {row?.endTime}</Text>
                        </View>
                      </View>
                      <FontAwesome5 name="chevron-right" size={16} color="#DDBD8E" />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={styles.noScheduleText}>No schedules available for this week.</Text>
              )}
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating Book Button */}
      <View style={styles.floatingBookContainer}>
        <TouchableOpacity 
          style={styles.floatingBookBtn}
          onPress={() => navigation.navigate('Appointment', { doctor })}
        >
          <FontAwesome5 name="calendar-check" size={16} color="#FFF" />
          <Text style={styles.floatingBookText}>BOOK APPOINTMENT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#5E2131',
  },
  scrollContent: {
    padding: 20,
  },
  profileHeaderContainer: {
    marginBottom: 24,
  },
  profileHeroImage: {
    width: '100%',
    aspectRatio: 0.85,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    marginBottom: 20,
  },
  profileHeaderDetails: {
    paddingHorizontal: 4,
  },
  doctorName: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: '#1E293B',
    marginBottom: 8,
    lineHeight: 32,
  },
  designationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  designationText: {
    fontSize: 12,
    color: '#8D4956',
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 8,
  },
  departmentText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter_400Regular',
  },
  degreesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  degreeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  degreeText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#475569',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(221,189,142,0.3)',
    position: 'relative',
    overflow: 'hidden',
  },
  detailsContent: {
    padding: 20,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#DDBD8E',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  paragraphText: {
    fontSize: 14,
    color: '#475569',
    fontFamily: 'Inter_400Regular',
    lineHeight: 24,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingRight: 10,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8D4956',
    marginTop: 9,
    marginRight: 12,
  },
  listText: {
    fontSize: 14,
    color: '#475569',
    fontFamily: 'Inter_400Regular',
    lineHeight: 24,
    flex: 1,
  },
  fadeOverlay: {
    position: 'absolute',
    bottom: 45,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.85)',
    zIndex: 1,
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    zIndex: 2,
  },
  scheduleCard: {
    backgroundColor: '#fff',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(221,189,142,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
  },
  scheduleIconBg: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(94,33,49,0.05)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  scheduleTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#5E2131',
    textTransform: 'uppercase',
    letterSpacing: 1,
    lineHeight: 22,
    marginBottom: 4,
  },
  scheduleSubtitle: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    lineHeight: 16,
  },
  scheduleContent: {
    padding: 20,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  scheduleGrid: {
    flexDirection: 'column',
    gap: 12,
    marginTop: 16,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF9F6',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 16,
    borderRadius: 12,
  },
  scheduleDay: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scheduleTime: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#475569',
  },
  noScheduleText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 16,
  },
  expandBtnText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#5E2131',
    marginRight: 8,
  },
  floatingBookContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  floatingBookBtn: {
    backgroundColor: '#5E2131',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  floatingBookText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    marginLeft: 10,
    letterSpacing: 0.5,
  }
});
