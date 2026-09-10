import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';

const stripHtml = (html: string) => {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, "").trim();
};

export const PackageCard = ({ data }: any) => {
  const navigation = useNavigation<any>();
  const { packageName, details, packageImage, price } = data;

  const imageUrl = packageImage?.url ? packageImage.url : null;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => navigation.navigate('PackageDetails', { packageData: data })}
    >
      <View style={styles.imageContainer}>
        <Image
          source={imageUrl ? { uri: imageUrl } : require('../../assets/icon.png')}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.overlay} />
      </View>

      <View style={styles.content}>
        <View>
          <Text style={styles.title} numberOfLines={2}>{packageName}</Text>

          <View style={styles.priceContainer}>
            <Text style={styles.price}>৳ {price?.toLocaleString()}</Text>
          </View>

          <Text style={styles.details} numberOfLines={3}>{stripHtml(details)}</Text>
        </View>

        <View style={styles.button}>
          <Text style={styles.buttonText}>VIEW DETAILS</Text>
        </View>
      </View>

      <View style={styles.bottomAccent} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 260,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  imageContainer: {
    height: 140,
    width: '100%',
    position: 'relative',
    backgroundColor: '#F8FAFC',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  content: {
    padding: 16,
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: colors.primary,
    marginBottom: 4,
    lineHeight: 22,
  },
  priceContainer: {
    marginBottom: 10,
  },
  price: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: colors.primary,
  },
  details: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 18,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },
  bottomAccent: {
    height: 4,
    backgroundColor: colors.secondary,
    width: '100%',
  }
});
