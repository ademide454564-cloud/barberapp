import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import { API_URL } from '../../../config';

const MoreTab = React.memo(({ navigation }) => {
  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const [revenue, setRevenue] = useState({ daily: 0, weekly: 0, monthly: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRevenueData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadRevenueData = useCallback(async () => {
    try {
      setLoading(true);
      // TODO: Backend ciro API endpoint'i oluşturulmalı
      // Şimdilik demo veriler
      const response = await fetch(`${API_URL}/appointments`);
      const appointments = await response.json();

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      let dailyTotal = 0;
      let weeklyTotal = 0;
      let monthlyTotal = 0;

      appointments.forEach(apt => {
        if (apt.status === 'Onaylandı' && apt.service_id?.price) {
          const aptDate = new Date(apt.start_time);
          const price = apt.service_id.price;

          if (aptDate >= todayStart) dailyTotal += price;
          if (aptDate >= weekStart) weeklyTotal += price;
          if (aptDate >= monthStart) monthlyTotal += price;
        }
      });

      setRevenue({
        daily: dailyTotal,
        weekly: weeklyTotal,
        monthly: monthlyTotal,
      });
    } catch (error) {
      console.error('Error loading revenue:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const renderHeader = useCallback(() => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Diğer</Text>
    </View>
  ), []);

  const renderRevenueCards = useCallback(() => (
    <View style={styles.revenueSection}>
      <Text style={styles.sectionTitle}>Ciro Özeti</Text>

      <View style={styles.revenueCards}>
        <View style={[styles.revenueCard, { backgroundColor: Colors.revenue + '15' }]}>
          <MaterialCommunityIcons name="currency-try" size={28} color={Colors.revenue} />
          <Text style={styles.revenueLabel}>Günlük</Text>
          <Text style={[styles.revenueAmount, { color: Colors.revenue }]}>
            ₺{revenue.daily.toLocaleString('tr-TR')}
          </Text>
        </View>

        <View style={[styles.revenueCard, { backgroundColor: Colors.appointmentCard + '15' }]}>
          <MaterialCommunityIcons name="calendar-week" size={28} color={Colors.appointmentCard} />
          <Text style={styles.revenueLabel}>Haftalık</Text>
          <Text style={[styles.revenueAmount, { color: Colors.appointmentCard }]}>
            ₺{revenue.weekly.toLocaleString('tr-TR')}
          </Text>
        </View>

        <View style={[styles.revenueCard, { backgroundColor: Colors.primary + '15' }]}>
          <MaterialCommunityIcons name="calendar-month" size={28} color={Colors.primary} />
          <Text style={styles.revenueLabel}>Aylık</Text>
          <Text style={[styles.revenueAmount, { color: Colors.primary }]}>
            ₺{revenue.monthly.toLocaleString('tr-TR')}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.detailedReportButton}
        onPress={() => {
          navigation.navigate('RevenueReport');
        }}
      >
        <MaterialCommunityIcons name="chart-line" size={22} color={Colors.textWhite} />
        <Text style={styles.detailedReportText}>Detaylı Ciro Raporu</Text>
        <MaterialCommunityIcons name="arrow-right" size={20} color={Colors.textWhite} />
      </TouchableOpacity>
    </View>
  ), [revenue, navigation]);

  const renderMenuSection = useCallback((title, items) => (
    <View style={styles.menuSection}>
      <Text style={styles.menuSectionTitle}>{title}</Text>
      {items.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.menuItem}
          onPress={item.onPress}
        >
          <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
            <MaterialCommunityIcons name={item.icon} size={22} color={item.color} />
          </View>
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemTitle}>{item.title}</Text>
            {item.subtitle && (
              <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
            )}
          </View>
          {item.badge && (
            <View style={styles.menuBadge}>
              <Text style={styles.menuBadgeText}>{item.badge}</Text>
            </View>
          )}
          <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.textLight} />
        </TouchableOpacity>
      ))}
    </View>
  ), []);

  const managementItems = useMemo(() => [
    {
      icon: 'scissors-cutting',
      title: 'Hizmetler',
      subtitle: 'Hizmet yönetimi',
      color: Colors.appointmentCard,
      onPress: () => {
        navigation.navigate('Services');
      },
    },
    {
      icon: 'calendar-remove',
      title: 'Kapalı Günler',
      subtitle: 'Tatil ve kapalı günler',
      color: Colors.danger,
      onPress: () => {
        navigation.navigate('BlockedTimes');
      },
    },
    {
      icon: 'image-multiple',
      title: 'Galeri',
      subtitle: 'Fotoğraf yönetimi',
      color: Colors.revenue,
      onPress: () => {
        navigation.navigate('GalleryManagement');
      },
    },
    {
      icon: 'star',
      title: 'Yorumlar',
      subtitle: 'Müşteri değerlendirmeleri',
      color: Colors.warning,
      onPress: () => {
        navigation.navigate('ReviewsManagement');
      },
    },
  ], [navigation]);

  const settingsItems = useMemo(() => [
    {
      icon: 'calendar-clock',
      title: 'Takvim Ayarları',
      subtitle: 'Çalışma saatleri ve ayarlar',
      color: Colors.primary,
      onPress: () => {
        navigation.navigate('CalendarSettings');
      },
    },
    {
      icon: 'bell',
      title: 'Bildirimler',
      subtitle: 'Bildirim tercihleri',
      color: Colors.appointmentCard,
      onPress: () => {
        navigation.navigate('NotificationSettings');
      },
    },
    {
      icon: 'cog',
      title: 'Genel Ayarlar',
      subtitle: 'Uygulama ayarları',
      color: Colors.textSecondary,
      onPress: () => {
        navigation.navigate('GeneralSettings');
      },
    },
  ], [navigation]);

  const reportsItems = useMemo(() => [
    {
      icon: 'account-cancel',
      title: 'Kara Liste',
      subtitle: 'Engellenen müşteriler',
      color: Colors.danger,
      onPress: () => {
        navigation.navigate('Blacklist');
      },
    },
    {
      icon: 'history',
      title: 'Randevu Geçmişi',
      subtitle: 'Tüm randevu kayıtları',
      color: Colors.textSecondary,
      onPress: () => {
        navigation.navigate('AppointmentHistory');
      },
    },
    {
      icon: 'account-alert',
      title: 'Sık İptal Edenler',
      subtitle: 'İptal analizi',
      color: Colors.warning,
      onPress: () => {
        navigation.navigate('FrequentCancellers');
      },
    },
  ], [navigation]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {renderHeader()}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
        ) : (
          <>
            {renderRevenueCards()}
            {renderMenuSection('İşletme Yönetimi', managementItems)}
            {renderMenuSection('Raporlar', reportsItems)}
            {renderMenuSection('Ayarlar', settingsItems)}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </Animated.View>
  );
});

export default MoreTab;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.cardBackground,
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  scrollView: {
    flex: 1,
  },
  loader: {
    marginTop: 60,
  },
  revenueSection: {
    padding: 20,
    backgroundColor: Colors.cardBackground,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  revenueCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  revenueCard: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  revenueLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 8,
    marginBottom: 4,
  },
  revenueAmount: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  detailedReportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  detailedReportText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textWhite,
  },
  menuSection: {
    backgroundColor: Colors.cardBackground,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  menuSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  menuBadge: {
    backgroundColor: Colors.danger,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: 8,
  },
  menuBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textWhite,
  },
});
