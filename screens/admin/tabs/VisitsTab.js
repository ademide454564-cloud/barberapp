import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import { API_URL } from '../../../config';

const VisitsTab = React.memo(({ navigation }) => {
  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const [activeTab, setActiveTab] = useState('open'); // 'open', 'closed', 'cancelled'
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [revenueStats, setRevenueStats] = useState(null);

  useEffect(() => {
    loadVisits();
    loadRevenueStats();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  const loadRevenueStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/appointments/revenue-stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_date: new Date(new Date().setDate(1)), // Ayın ilk günü
          end_date: new Date(), // Bugün
        }),
      });
      const data = await response.json();
      setRevenueStats(data);
    } catch (error) {
      console.error('Error loading revenue stats:', error);
    }
  }, []);

  const loadVisits = useCallback(async () => {
    try {
      setLoading(true);
      // TODO: Backend API endpoint oluşturulmalı
      // Şimdilik randevu verilerini kullanıyoruz
      const response = await fetch(`${API_URL}/appointments`);
      const data = await response.json();

      // Filter based on active tab
      const filtered = data.filter(apt => {
        if (activeTab === 'open') return apt.status === 'Beklemede';
        if (activeTab === 'closed') return apt.status === 'Onaylandı';
        if (activeTab === 'cancelled') return apt.status === 'İptal Edildi';
        return false;
      });

      setVisits(filtered);
    } catch (error) {
      console.error('Error loading visits:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadVisits();
    setRefreshing(false);
  }, [loadVisits]);

  const handleCloseVisit = useCallback(async (appointmentId) => {
    Alert.alert(
      'Adisyon Kapat',
      'Bu adisyonu kapatmak istediğinize emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Kapat',
          onPress: async () => {
            try {
              // Randevuyu onaylayarak adisyonu kapat
              await fetch(`${API_URL}/appointments/approve/${appointmentId}`, { method: 'POST' });
              Alert.alert('Başarılı', 'Adisyon kapatıldı');
              await loadVisits();
            } catch (error) {
              Alert.alert('Hata', 'Adisyon kapatılırken bir hata oluştu');
            }
          },
        },
      ]
    );
  }, [loadVisits]);

  const renderHeader = useCallback(() => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Ziyaretler</Text>
    </View>
  ), []);

  const renderTabs = useCallback(() => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'open' && styles.tabActive]}
        onPress={() => setActiveTab('open')}
      >
        <Text style={[styles.tabText, activeTab === 'open' && styles.tabTextActive]}>
          Açık
        </Text>
        <View style={[styles.tabBadge, activeTab === 'open' && styles.tabBadgeActive]}>
          <Text style={[styles.tabBadgeText, activeTab === 'open' && styles.tabBadgeTextActive]}>
            {visits.length}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'closed' && styles.tabActive]}
        onPress={() => setActiveTab('closed')}
      >
        <Text style={[styles.tabText, activeTab === 'closed' && styles.tabTextActive]}>
          Kapatılmış
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'cancelled' && styles.tabActive]}
        onPress={() => setActiveTab('cancelled')}
      >
        <Text style={[styles.tabText, activeTab === 'cancelled' && styles.tabTextActive]}>
          İptal Edilmiş
        </Text>
      </TouchableOpacity>
    </View>
  ), [activeTab, setActiveTab, visits]);

  const renderRevenueStats = useCallback(() => {
    if (!revenueStats) return null;

    return (
      <View style={styles.revenueContainer}>
        <Text style={styles.revenueTitle}>📊 Aylık Ciro (Bu Ay)</Text>

        {/* Toplam Ciro */}
        <View style={styles.totalRevenueCard}>
          <MaterialCommunityIcons name="cash-multiple" size={32} color={Colors.primary} />
          <View style={styles.totalRevenueInfo}>
            <Text style={styles.totalRevenueLabel}>Toplam Ciro</Text>
            <Text style={styles.totalRevenueAmount}>₺{revenueStats.total_revenue.toFixed(2)}</Text>
          </View>
          <View style={styles.appointmentCount}>
            <Text style={styles.appointmentCountText}>{revenueStats.appointment_count} Randevu</Text>
          </View>
        </View>

        {/* Ödeme Yöntemleri */}
        <View style={styles.paymentMethodsGrid}>
          <View style={styles.paymentMethodCard}>
            <MaterialCommunityIcons name="cash" size={24} color="#22C55E" />
            <Text style={styles.paymentMethodLabel}>Nakit</Text>
            <Text style={styles.paymentMethodAmount}>₺{revenueStats.nakit.toFixed(2)}</Text>
            <Text style={styles.paymentMethodCount}>{revenueStats.by_method.Nakit.count} işlem</Text>
          </View>

          <View style={styles.paymentMethodCard}>
            <MaterialCommunityIcons name="credit-card" size={24} color="#3B82F6" />
            <Text style={styles.paymentMethodLabel}>Kart</Text>
            <Text style={styles.paymentMethodAmount}>₺{revenueStats.kart.toFixed(2)}</Text>
            <Text style={styles.paymentMethodCount}>{revenueStats.by_method.Kart.count} işlem</Text>
          </View>

          <View style={styles.paymentMethodCard}>
            <MaterialCommunityIcons name="bank-transfer" size={24} color="#8B5CF6" />
            <Text style={styles.paymentMethodLabel}>EFT</Text>
            <Text style={styles.paymentMethodAmount}>₺{revenueStats.eft.toFixed(2)}</Text>
            <Text style={styles.paymentMethodCount}>{revenueStats.by_method.EFT.count} işlem</Text>
          </View>
        </View>
      </View>
    );
  }, [revenueStats]);

  const renderVisitCard = useCallback((visit) => {
    const startDate = new Date(visit.start_time);
    const formattedDate = startDate.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
    });
    const formattedTime = startDate.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <TouchableOpacity key={visit._id} style={styles.visitCard}>
        <View style={styles.visitHeader}>
          <View style={styles.visitIcon}>
            <MaterialCommunityIcons
              name={activeTab === 'open' ? 'receipt-text-clock' : activeTab === 'closed' ? 'receipt-text-check' : 'receipt-text-remove'}
              size={24}
              color={activeTab === 'open' ? Colors.warning : activeTab === 'closed' ? Colors.success : Colors.danger}
            />
          </View>
          <View style={styles.visitInfo}>
            <Text style={styles.visitCustomer}>{visit.customer_id?.name}</Text>
            <View style={styles.visitDateTime}>
              <MaterialCommunityIcons name="calendar" size={14} color={Colors.textSecondary} />
              <Text style={styles.visitDateTimeText}>{formattedDate}</Text>
              <MaterialCommunityIcons name="clock-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.visitDateTimeText}>{formattedTime}</Text>
            </View>
          </View>
        </View>

        <View style={styles.visitDivider} />

        <View style={styles.visitServices}>
          <View style={styles.serviceRow}>
            <Text style={styles.serviceName}>{visit.service_id?.name}</Text>
            <Text style={styles.servicePrice}>₺{visit.service_id?.price}</Text>
          </View>
        </View>

        <View style={styles.visitFooter}>
          <View style={styles.visitTotal}>
            <Text style={styles.totalLabel}>Toplam:</Text>
            <Text style={styles.totalAmount}>₺{visit.service_id?.price}</Text>
          </View>
          {activeTab === 'open' && (
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => handleCloseVisit(visit._id)}
            >
              <Text style={styles.closeButtonText}>Kapat</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [handleCloseVisit]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {renderHeader()}
      {renderTabs()}

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {renderRevenueStats()}

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
        ) : visits.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="receipt-text-outline"
              size={64}
              color={Colors.textLight}
            />
            <Text style={styles.emptyText}>
              {activeTab === 'open' && 'Açık adisyon yok'}
              {activeTab === 'closed' && 'Kapatılmış adisyon yok'}
              {activeTab === 'cancelled' && 'İptal edilmiş adisyon yok'}
            </Text>
          </View>
        ) : (
          <View style={styles.visitsList}>
            {visits.map(renderVisitCard)}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </Animated.View>
  );
});

export default VisitsTab;

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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: Colors.background,
    borderRadius: 10,
    gap: 6,
  },
  tabActive: {
    backgroundColor: Colors.primaryLight,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  tabBadge: {
    backgroundColor: Colors.borderDark,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabBadgeActive: {
    backgroundColor: Colors.primary,
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  tabBadgeTextActive: {
    color: Colors.textWhite,
  },
  scrollView: {
    flex: 1,
  },
  loader: {
    marginTop: 60,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
  },
  visitsList: {
    padding: 16,
    gap: 12,
  },
  visitCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  visitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  visitIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  visitInfo: {
    flex: 1,
  },
  visitCustomer: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  visitDateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  visitDateTimeText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginRight: 8,
  },
  visitDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 12,
  },
  visitServices: {
    marginBottom: 12,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
  servicePrice: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  visitFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  visitTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  closeButton: {
    backgroundColor: Colors.success,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textWhite,
  },
  revenueContainer: {
    padding: 16,
    backgroundColor: Colors.background,
  },
  revenueTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  totalRevenueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.primary + '30',
  },
  totalRevenueInfo: {
    flex: 1,
    marginLeft: 12,
  },
  totalRevenueLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  totalRevenueAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  appointmentCount: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  appointmentCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  paymentMethodsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentMethodCard: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  paymentMethodLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 8,
  },
  paymentMethodAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 4,
  },
  paymentMethodCount: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});
