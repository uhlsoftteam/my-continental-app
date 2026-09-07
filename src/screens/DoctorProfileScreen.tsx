import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, StatusBar, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');

const stripBullets = (text: string) => {
  if (!text) return "";
  return text.replace(/^[•\-\*]\s*/, "");
};

const cleanRichText = (html: string) => {
  if (!html) return "";
  let cleaned = html.replace(/(style|class)="[^"]*"/gi, "");
  cleaned = cleaned.replace(/&nbsp;/gi, " ");
  cleaned = cleaned.replace(/<[^>]*>?/gm, ''); // remove html tags for mobile
  return cleaned.trim();
};

export const DoctorProfileScreen = ({ route, navigation }: any) => {
  const { doctor } = route.params;
  const [isExpanded, setIsExpanded] = useState(false);

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
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" />
      <SafeAreaView style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#5E2131" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 40 }} />
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeaderCard}>
          <Image 
            source={imageUrl ? { uri: imageUrl } : require('../../assets/adaptive-icon.png')} 
            style={styles.profileImage} 
            resizeMode="cover"
          />
          <View style={styles.profileHeaderDetails}>
            <Text style={styles.doctorName}>{doctor?.name || "Doctor Profile"}</Text>
            
            <View style={styles.degreesContainer}>
              {(doctor?.degrees || []).map((deg: string, i: number) => (
                <View key={i} style={styles.degreeBadge}>
                  <Text style={styles.degreeText}>{deg}</Text>
                </View>
              ))}
            </View>

            <View style={styles.designationRow}>
              <Text style={styles.designationText}>{doctor?.designation || "Consultant"}</Text>
              <View style={styles.dot} />
              <Text style={styles.departmentText}>{doctor?.department?.name || doctor?.department || "General"}</Text>
            </View>
            
            <View style={[styles.statusBadge, { backgroundColor: doctor?.isActive ? 'rgba(221,189,142,0.1)' : '#FEF2F2' }]}>
              <Text style={[styles.statusText, { color: doctor?.isActive ? '#5E2131' : '#B91C1C' }]}>
                {doctor?.isActive ? "Accepting New Patients" : "Currently Offline"}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="call" size={20} color="#5E2131" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="mail" size={20} color="#5E2131" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="phone-portrait" size={20} color="#5E2131" />
          </TouchableOpacity>
        </View>

        {/* Details Section */}
        <View style={styles.detailsCard}>
          <View style={[styles.detailsContent, !isExpanded && { maxHeight: 200, overflow: 'hidden' }]}>
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
            <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={16} color="#8D4956" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Book Button */}
      <View style={styles.floatingBookContainer}>
        <TouchableOpacity 
          style={styles.floatingBookBtn}
          onPress={() => navigation.navigate('Appointment', { doctor })}
        >
          <FontAwesome5 name="calendar-check" size={18} color="#FFF" />
          <Text style={styles.floatingBookText}>BOOK APPOINTMENT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: '#FAF9F6',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(221,189,142,0.2)',
  },
  backBtn: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#5E2131',
  },
  scrollContent: {
    padding: 20,
  },
  profileHeaderCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(221,189,142,0.2)',
    marginBottom: 20,
    flexDirection: 'row',
  },
  profileImage: {
    width: 120,
    height: 160,
    backgroundColor: '#FAF9F6',
  },
  profileHeaderDetails: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  doctorName: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#5E2131',
    marginBottom: 8,
  },
  degreesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  degreeBadge: {
    backgroundColor: 'rgba(141,73,86,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  degreeText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: '#8D4956',
  },
  designationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 12,
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
    backgroundColor: '#DDBD8E',
    marginHorizontal: 8,
  },
  departmentText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter_400Regular',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(221,189,142,0.3)',
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    textTransform: 'uppercase',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  iconBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(221,189,142,0.2)',
    shadowColor: '#DDBD8E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  detailsCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(221,189,142,0.2)',
    position: 'relative',
  },
  detailsContent: {
    padding: 20,
  },
  fadeOverlay: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0)',
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(221,189,142,0.1)',
  },
  expandBtnText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#8D4956',
    marginRight: 8,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Inter_900Black',
    color: '#DDBD8E',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  paragraphText: {
    fontSize: 14,
    color: '#334155',
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
    marginTop: 8,
    marginRight: 12,
  },
  listText: {
    fontSize: 14,
    color: '#334155',
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
    flex: 1,
  },
  floatingBookContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingBottom: 30, // for safe area
    borderTopWidth: 1,
    borderTopColor: 'rgba(221,189,142,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 10,
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
    color: colors.white,
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    marginLeft: 10,
    letterSpacing: 1,
  }
});
