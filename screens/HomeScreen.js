import React, { useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../constants/Colors';
import { API_URL } from '../config';


export default function HomeScreen({ navigation }) {
  const scrollViewRef = useRef(null);
  const servicesRef = useRef(null);
  const [userName, setUserName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [featuredPhoto, setFeaturedPhoto] = useState(null);
  const [galleryPhotos, setGalleryPhotos] = useState([]);

  useEffect(() => {
    loadServices();
    loadReviews();
    loadPhotos();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadUserName();
      loadUnreadCount();
    }, [])
  );

  const loadUserName = async () => {
    try {
      const name = await AsyncStorage.getItem('userName');
      const adminStatus = await AsyncStorage.getItem('isAdmin');
      if (name !== null) {
        setUserName(name);
      }
      setIsAdmin(adminStatus === 'true');
    } catch (e) {
      console.error('AsyncStorage okuma hatası:', e);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Çıkış Yap',
      'Çıkış yapmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('userPhone');
              await AsyncStorage.removeItem('userName');
              await AsyncStorage.removeItem('userEmail');
              await AsyncStorage.removeItem('isLoggedIn');
              await AsyncStorage.removeItem('isAdmin');
              setUserName('');
              setIsAdmin(false);
              Alert.alert('Başarılı', 'Çıkış yapıldı');
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  const loadServices = async () => {
    try {
      const response = await fetch(`${API_URL}/services`);
      const data = await response.json();
      setServices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      const response = await fetch(`${API_URL}/reviews`);
      const data = await response.json();
      setReviews(Array.isArray(data) ? data : []);

      // Ortalama puanı al
      const ratingResponse = await fetch(`${API_URL}/reviews/average-rating`);
      const ratingData = await ratingResponse.json();
      setAverageRating(ratingData.averageRating || 0);
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  };

  const loadPhotos = async () => {
    try {
      // Featured foto
      const featuredResponse = await fetch(`${API_URL}/photos/featured`);
      const featured = await featuredResponse.json();
      setFeaturedPhoto(featured);

      // Gallery fotoları (max 3)
      const galleryResponse = await fetch(`${API_URL}/photos/gallery`);
      const gallery = await galleryResponse.json();
      setGalleryPhotos(gallery);
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const userDataStr = await AsyncStorage.getItem('userData');
      if (!userDataStr) {
        setUnreadCount(0);
        return;
      }

      const userData = JSON.parse(userDataStr);
      const response = await fetch(`${API_URL}/customers`);
      const customers = await response.json();
      const customer = customers.find(c => c.phone_number === userData.phone_number);

      if (customer) {
        const countResponse = await fetch(`${API_URL}/notifications/unread-count/${customer._id}`);
        const countData = await countResponse.json();
        setUnreadCount(countData.count || 0);
      } else {
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
      setUnreadCount(0);
    }
  };

  const scrollToServices = () => {
    servicesRef.current?.measureLayout(
      scrollViewRef.current,
      (x, y) => {
        scrollViewRef.current?.scrollTo({ y: y - 20, animated: true });
      }
    );
  };

  const scrollToAddress = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const openMaps = () => {
    const address = 'Örnek Mahallesi, Berber Sokak No:1, İstanbul';
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(address)}`,
      android: `geo:0,0?q=${encodeURIComponent(address)}`,
    });
    Linking.openURL(url);
  };

  const getServiceIcon = (name) => {
    const icons = {
      'Saç Kesimi': 'scissors-cutting',
      'Sakal Tıraşı': 'razor-single-edge',
      'Saç + Sakal': 'content-cut',
      'Cilt Bakımı': 'face-man-shimmer',
      'Kaş Dizaynı': 'eye',
      'Bıyık Tıraşı': 'mustache',
      'Saç Boyama': 'palette',
      'Ağda': 'fire',
    };
    return icons[name] || 'scissors-cutting';
  };

  const ServiceCard = ({ service }) => (
    <TouchableOpacity
      style={styles.serviceCard}
      onPress={() => navigation.navigate('Booking', { service })}
      activeOpacity={0.8}
    >
      <View style={styles.serviceIconContainer}>
        <MaterialCommunityIcons
          name={getServiceIcon(service.name)}
          size={32}
          color={Colors.primary}
        />
      </View>

      <View style={styles.serviceInfo}>
        <Text style={styles.serviceName}>{service.name}</Text>
        <View style={styles.serviceDetails}>
          <View style={styles.serviceDuration}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={Colors.secondaryText} />
            <Text style={styles.serviceDurationText}>{service.duration_minutes} dk</Text>
          </View>
        </View>
      </View>

      <View style={styles.servicePriceContainer}>
        <Text style={styles.servicePrice}>₺{service.price}</Text>
        <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.secondaryText} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Minimal Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.profileSection}>
            <Image
              source={require('../assets/kaanherli.jpeg')}
              style={styles.profileImage}
            />
            <View>
              <Text style={styles.barberName}>Kaan Herli</Text>
              <Text style={styles.barberSubtitle}>Profesyonel Berber</Text>
            </View>
          </View>

          <View style={styles.headerIcons}>
            {userName && (
              <TouchableOpacity
                style={styles.notificationButton}
                onPress={() => navigation.navigate('NotificationCenter')}
              >
                <MaterialCommunityIcons name="bell-outline" size={24} color={Colors.text} />
                {unreadCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
            {isAdmin && (
              <TouchableOpacity
                style={styles.adminIconButton}
                onPress={() => navigation.navigate('Admin')}
              >
                <MaterialCommunityIcons name="cog-outline" size={24} color={Colors.text} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeHeader}>
            <View>
              <Text style={styles.welcomeTitle}>
                {userName ? `Merhaba, ${userName}` : 'Merhaba'}
              </Text>
              <Text style={styles.welcomeSubtitle}>Size nasıl yardımcı olabiliriz?</Text>
            </View>

            {userName ? (
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <MaterialCommunityIcons name="logout-variant" size={18} color={Colors.error} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => navigation.navigate('Login')}
              >
                <MaterialCommunityIcons name="login" size={18} color={Colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Featured Photo */}
          {featuredPhoto && (
            <Image
              source={{ uri: featuredPhoto.url }}
              style={styles.featuredPhoto}
              resizeMode="cover"
            />
          )}

          {/* Gallery Photos */}
          {galleryPhotos.length > 0 && (
            <View style={styles.galleryPhotos}>
              {galleryPhotos.map((photo, index) => (
                <Image
                  key={photo._id}
                  source={{ uri: photo.url }}
                  style={styles.galleryPhoto}
                  resizeMode="cover"
                />
              ))}
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={scrollToServices}
          >
            <MaterialCommunityIcons name="scissors-cutting" size={20} color={Colors.primary} />
            <Text style={styles.actionButtonText}>Hizmetler</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('MyAppointments')}
          >
            <MaterialCommunityIcons name="calendar-check" size={20} color={Colors.primary} />
            <Text style={styles.actionButtonText}>Randevum</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={scrollToAddress}
          >
            <MaterialCommunityIcons name="map-marker" size={20} color={Colors.primary} />
            <Text style={styles.actionButtonText}>Konum</Text>
          </TouchableOpacity>
        </View>

        {/* Reviews Section */}
        <View style={styles.reviewsSection}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>Müşteri Yorumları</Text>
            {averageRating > 0 && (
              <View style={styles.averageRatingContainer}>
                <MaterialCommunityIcons name="star" size={18} color="#FFD700" />
                <Text style={styles.averageRatingText}>{averageRating}</Text>
              </View>
            )}
          </View>

          {reviews.length === 0 ? (
            <View style={styles.emptyReviews}>
              <MaterialCommunityIcons name="comment-text-outline" size={48} color="#ADB5BD" />
              <Text style={styles.emptyReviewsText}>Henüz yorum yapılmamış</Text>
              <Text style={styles.emptyReviewsSubtext}>İlk yorumu siz yapın!</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.reviewsCarousel}
            >
              {reviews.map((review) => (
                <View key={review._id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewCustomerName}>
                      {review.customer_id?.name || 'Anonim'}
                    </Text>
                    <View style={styles.reviewStars}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <MaterialCommunityIcons
                          key={star}
                          name={star <= review.rating ? 'star' : 'star-outline'}
                          size={14}
                          color={star <= review.rating ? '#FFD700' : '#ccc'}
                        />
                      ))}
                    </View>
                  </View>
                  {review.comment && (
                    <Text style={styles.reviewComment} numberOfLines={3}>
                      {review.comment}
                    </Text>
                  )}
                  <Text style={styles.reviewDate}>
                    {new Date(review.createdAt).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Services Section */}
        <View ref={servicesRef} style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>Hizmetler</Text>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
          ) : (
            <View style={styles.servicesList}>
              {services.map((service) => (
                <ServiceCard key={service._id} service={service} />
              ))}
            </View>
          )}
        </View>

        {/* Address Section */}
        <View style={styles.addressSection}>
          <Text style={styles.sectionTitle}>Konum</Text>

          <View style={styles.addressCard}>
            <View style={styles.addressInfo}>
              <MaterialCommunityIcons name="map-marker" size={24} color={Colors.primary} />
              <View style={styles.addressTextContainer}>
                <Text style={styles.addressText}>Örnek Mahallesi, Berber Sokak No:1</Text>
                <Text style={styles.addressSubtext}>Kadıköy / İstanbul</Text>
                <Text style={styles.addressSubtext}>Tel: 0555 123 45 67</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.mapButton} onPress={openMaps}>
              <MaterialCommunityIcons name="directions" size={18} color="#fff" />
              <Text style={styles.mapButtonText}>Yol Tarifi</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E9ECEF',
  },
  barberName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  barberSubtitle: {
    fontSize: 13,
    color: '#868E96',
    marginTop: 2,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  adminIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  welcomeSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: '#868E96',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredPhoto: {
    width: '100%',
    height: 220,
    borderRadius: 20,
    backgroundColor: '#E9ECEF',
    marginBottom: 12,
  },
  galleryPhotos: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 0,
  },
  galleryPhoto: {
    flex: 1,
    height: 140,
    borderRadius: 16,
    backgroundColor: '#E9ECEF',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    flexShrink: 1,
    textAlign: 'center',
  },
  servicesSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  servicesList: {
    gap: 12,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  serviceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serviceDurationText: {
    fontSize: 13,
    color: '#868E96',
  },
  servicePriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  addressSection: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  addressCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  addressInfo: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  addressTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  addressText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 4,
    lineHeight: 20,
  },
  addressSubtext: {
    fontSize: 14,
    color: '#868E96',
    lineHeight: 20,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  mapButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  loader: {
    marginTop: 40,
  },
  reviewsSection: {
    paddingLeft: 24,
    marginBottom: 32,
  },
  reviewsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 24,
    marginBottom: 16,
  },
  averageRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  averageRatingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  emptyReviews: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 24,
  },
  emptyReviewsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#868E96',
    marginTop: 12,
  },
  emptyReviewsSubtext: {
    fontSize: 14,
    color: '#ADB5BD',
    marginTop: 4,
  },
  reviewsCarousel: {
    paddingHorizontal: 24,
  },
  reviewCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    width: Dimensions.get('window').width - 64, // Ekran genişliği - 64px (32px her yandan)
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewCustomerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: '#868E96',
  },
});
