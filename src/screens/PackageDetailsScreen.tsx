import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, SafeAreaView, Platform, Linking } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { FontAwesome5 } from '@expo/vector-icons';

// Simple HTML to List Parser
const extractListItems = (html: string) => {
  if (!html) return [];
  const listRegex = /<li[^>]*>(.*?)<\/li>/gis;
  let items = [];
  let match;
  while ((match = listRegex.exec(html)) !== null) {
    let cleanText = match[1].replace(/<[^>]*>?/gm, "").trim();
    if (cleanText) items.push(cleanText);
  }
  
  if (items.length === 0) {
    // Fallback: just strip tags and split by newlines if no <li>
    const stripped = html.replace(/<[^>]*>?/gm, " ").trim();
    if (stripped) items = [stripped];
  }
  
  return items;
};

export const PackageDetailsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const packageData = route.params?.packageData;

  if (!packageData) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Package details not found.</Text>
      </SafeAreaView>
    );
  }

  const { packageName, details, packageImage, price, targetAudience, packageNature, seo } = packageData;
  const imageUrl = packageImage?.url ? packageImage.url : null;
  const inclusions = extractListItems(details);

  const handleCall = () => {
    Linking.openURL('tel:10666');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <FontAwesome5 name="arrow-left" size={18} color="#5E2131" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{packageName}</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView style={styles.scrollView} bounces={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Hero Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={imageUrl ? { uri: imageUrl } : require('../../assets/icon.png')}
            style={styles.image}
            resizeMode="cover"
          />
          <View style={styles.imageOverlay} />
        </View>

        <View style={styles.contentContainer}>
          
          {/* Badges */}
          <View style={styles.badgesContainer}>
            <View style={styles.natureBadge}>
              <Text style={styles.natureBadgeText}>{packageNature || "Health Checkup"}</Text>
            </View>
            <View style={styles.dotSeparator} />
            <View style={styles.infoBadge}>
              <FontAwesome5 name="user" size={10} color="#8D4956" />
              <Text style={styles.infoBadgeText}>{targetAudience?.gender || "All"}</Text>
            </View>
            {targetAudience?.ageRange && (
              <>
                <View style={styles.dotSeparator} />
                <View style={styles.infoBadge}>
                  <FontAwesome5 name="lock" size={10} color="#8D4956" />
                  <Text style={styles.infoBadgeText}>Age: {targetAudience.ageRange}</Text>
                </View>
              </>
            )}
          </View>

          {/* Title & Description */}
          <Text style={styles.title}>{packageName}</Text>
          {seo?.metaDescription && (
            <View style={styles.descriptionQuote}>
              <Text style={styles.descriptionQuoteText}>{seo.metaDescription}</Text>
            </View>
          )}

          {/* Tests & Inclusions */}
          <View style={styles.cardSection}>
            <View style={styles.sectionHeader}>
              <FontAwesome5 name="list-ul" size={18} color="#8D4956" />
              <Text style={styles.sectionTitle}>Tests & Inclusions</Text>
            </View>
            <View style={styles.listContainer}>
              {inclusions.map((item, idx) => (
                <View key={idx} style={styles.listItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.listItemText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Instructions for Patients */}
          <View style={styles.cardSection}>
            <View style={styles.sectionHeader}>
              <FontAwesome5 name="shield-alt" size={18} color="#8D4956" />
              <Text style={styles.sectionTitle}>Instructions for Patients</Text>
            </View>
            <View style={styles.listContainer}>
              {[
                "Report to the registration desk by 8:00–9:00 am.",
                "Do not take any medication, alcohol or cigarettes in the morning.",
                "Bring all past medical reports and prescriptions where recent medical as well as medication histories are recorded.",
                "Bring your identification documents for registration (i.e. NID, Passport or Company letter).",
                "Please wear loose and comfortable clothing as you may have to change clothes for X-Ray / Ultrasonogram."
              ].map((item, idx) => (
                <View key={idx} style={styles.listItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.listItemText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Pricing & Call to Action */}
          <View style={styles.pricingCard}>
            <FontAwesome5 name="clipboard-check" size={120} color="rgba(255,255,255,0.05)" style={styles.pricingBgIcon} />
            <Text style={styles.pricingLabel}>TOTAL PACKAGE COST</Text>
            <Text style={styles.pricingValue}>৳{price?.toLocaleString()}</Text>
            
            <TouchableOpacity style={styles.callButton} onPress={handleCall}>
              <FontAwesome5 name="phone-alt" size={16} color="#5E2131" />
              <Text style={styles.callButtonText}>CALL FOR BOOKING</Text>
            </TouchableOpacity>

            <Text style={styles.pricingSubtext}>Price includes all diagnostic tests listed and one professional specialist consultation.</Text>
          </View>

          {/* Trust Badge */}
          <View style={styles.trustBadge}>
            <View style={styles.trustIconContainer}>
              <FontAwesome5 name="check-circle" size={24} color="#8D4956" />
            </View>
            <View style={styles.trustTextContainer}>
              <Text style={styles.trustTitle}>CERTIFIED EXCELLENCE</Text>
              <Text style={styles.trustSubtext}>Adhering to international quality standards in healthcare.</Text>
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#64748B',
    fontFamily: 'Inter_500Medium',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(221, 189, 142, 0.2)', // #DDBD8E with opacity
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#5E2131',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  imageContainer: {
    width: '100%',
    height: 250,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  contentContainer: {
    padding: 20,
    backgroundColor: '#FAF9F6',
  },
  badgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  natureBadge: {
    backgroundColor: 'rgba(221, 189, 142, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(221, 189, 142, 0.3)',
  },
  natureBadgeText: {
    color: '#8D4956',
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dotSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DDBD8E',
    marginHorizontal: 8,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoBadgeText: {
    color: '#64748B',
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    marginLeft: 6,
  },
  title: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    color: '#5E2131',
    lineHeight: 32,
    marginBottom: 16,
  },
  descriptionQuote: {
    borderLeftWidth: 3,
    borderLeftColor: '#DDBD8E',
    paddingLeft: 12,
    paddingVertical: 4,
    marginBottom: 24,
  },
  descriptionQuoteText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#64748B',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  cardSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(221, 189, 142, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(221, 189, 142, 0.2)',
    paddingBottom: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#5E2131',
    marginLeft: 12,
  },
  listContainer: {
    paddingLeft: 4,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DDBD8E',
    marginTop: 8,
    marginRight: 12,
  },
  listItemText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#475569',
    lineHeight: 22,
  },
  pricingCard: {
    backgroundColor: '#5E2131',
    borderRadius: 8,
    padding: 24,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#5E2131',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  pricingBgIcon: {
    position: 'absolute',
    right: -20,
    bottom: -20,
  },
  pricingLabel: {
    color: '#DDBD8E',
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  pricingValue: {
    color: '#fff',
    fontSize: 36,
    fontFamily: 'Inter_900Black',
    marginBottom: 24,
  },
  callButton: {
    backgroundColor: '#DDBD8E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 6,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  callButtonText: {
    color: '#5E2131',
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.5,
    marginLeft: 10,
  },
  pricingSubtext: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 16,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(221, 189, 142, 0.3)',
  },
  trustIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#FAF9F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(221, 189, 142, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  trustTextContainer: {
    flex: 1,
  },
  trustTitle: {
    color: '#5E2131',
    fontSize: 10,
    fontFamily: 'Inter_900Black',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  trustSubtext: {
    color: '#94A3B8',
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    lineHeight: 16,
  }
});
