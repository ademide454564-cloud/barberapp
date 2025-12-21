import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import { API_URL } from '../../../config';

const CustomersTab = React.memo(({ navigation }) => {
  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'pending'

  useEffect(() => {
    loadData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Load pending appointments for approval
      const appointmentsResponse = await fetch(`${API_URL}/appointments`);
      const appointments = await appointmentsResponse.json();
      const pending = appointments.filter(apt => apt.status === 'Beklemede');
      setPendingApprovals(pending);

      // TODO: Load all customers from backend
      // Şimdilik appointment'lardan müşterileri çıkarıyoruz
      const uniqueCustomers = {};
      appointments.forEach(apt => {
        if (apt.customer_id && apt.customer_id._id) {
          uniqueCustomers[apt.customer_id._id] = apt.customer_id;
        }
      });
      setCustomers(Object.values(uniqueCustomers));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleApprove = useCallback(async (appointmentId) => {
    try {
      await fetch(`${API_URL}/appointments/approve/${appointmentId}`, { method: 'POST' });
      Alert.alert('Başarılı', 'Randevu onaylandı');
      await loadData();
    } catch (error) {
      Alert.alert('Hata', 'Randevu onaylanırken bir hata oluştu');
    }
  }, [loadData]);

  const handleReject = useCallback(async (appointmentId) => {
    Alert.alert(
      'Randevu Reddi',
      'Bu randevuyu reddetmek istediğinize emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Reddet',
          style: 'destructive',
          onPress: async () => {
            try {
              await fetch(`${API_URL}/appointments/cancel/${appointmentId}`, { method: 'POST' });
              Alert.alert('Başarılı', 'Randevu reddedildi');
              await loadData();
            } catch (error) {
              Alert.alert('Hata', 'Randevu reddedilirken bir hata oluştu');
            }
          },
        },
      ]
    );
  }, [loadData]);

  const renderHeader = useCallback(() => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Müşteriler</Text>
    </View>
  ), []);

  const renderSearchBar = useCallback(() => (
    <View style={styles.searchContainer}>
      <MaterialCommunityIcons name="magnify" size={20} color={Colors.textSecondary} />
      <TextInput
        style={styles.searchInput}
        placeholder="Müşteri ara..."
        placeholderTextColor={Colors.textLight}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => setSearchQuery('')}>
          <MaterialCommunityIcons name="close-circle" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  ), [searchQuery, setSearchQuery]);

  const renderTabs = useCallback(() => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'all' && styles.tabActive]}
        onPress={() => setActiveTab('all')}
      >
        <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
          Tüm Müşteriler
        </Text>
        <View style={[styles.tabBadge, activeTab === 'all' && styles.tabBadgeActive]}>
          <Text style={[styles.tabBadgeText, activeTab === 'all' && styles.tabBadgeTextActive]}>
            {customers.length}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
        onPress={() => setActiveTab('pending')}
      >
        <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
          Onay Bekleyen
        </Text>
        {pendingApprovals.length > 0 && (
          <View style={[styles.tabBadge, activeTab === 'pending' && styles.tabBadgeActive]}>
            <Text style={[styles.tabBadgeText, activeTab === 'pending' && styles.tabBadgeTextActive]}>
              {pendingApprovals.length}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  ), [activeTab, setActiveTab, customers, pendingApprovals]);

  const renderCustomerCard = useCallback((customer) => (
    <TouchableOpacity key={customer._id} style={styles.customerCard}>
      <View style={styles.customerAvatar}>
        <MaterialCommunityIcons name="account" size={28} color={Colors.primary} />
      </View>
      <View style={styles.customerInfo}>
        <Text style={styles.customerName}>{customer.name}</Text>
        <Text style={styles.customerPhone}>{customer.phone_number}</Text>
        {customer.email && (
          <Text style={styles.customerEmail}>{customer.email}</Text>
        )}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.textLight} />
    </TouchableOpacity>
  ), []);

  const renderPendingApprovalCard = useCallback((appointment) => {
    const startDate = new Date(appointment.start_time);
    const formattedDate = startDate.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
    });
    const formattedTime = startDate.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View key={appointment._id} style={styles.pendingCard}>
        <View style={styles.pendingHeader}>
          <View style={styles.pendingIcon}>
            <MaterialCommunityIcons name="clock-alert" size={24} color={Colors.warning} />
          </View>
          <View style={styles.pendingInfo}>
            <Text style={styles.pendingCustomer}>{appointment.customer_id?.name}</Text>
            <Text style={styles.pendingService}>{appointment.service_id?.name}</Text>
            <View style={styles.pendingDateTime}>
              <MaterialCommunityIcons name="calendar" size={14} color={Colors.textSecondary} />
              <Text style={styles.pendingDateTimeText}>{formattedDate}</Text>
              <MaterialCommunityIcons name="clock-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.pendingDateTimeText}>{formattedTime}</Text>
            </View>
          </View>
        </View>

        <View style={styles.pendingActions}>
          <TouchableOpacity
            style={styles.approveButton}
            onPress={() => handleApprove(appointment._id)}
          >
            <MaterialCommunityIcons name="check" size={18} color={Colors.textWhite} />
            <Text style={styles.approveButtonText}>Onayla</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={() => handleReject(appointment._id)}
          >
            <MaterialCommunityIcons name="close" size={18} color={Colors.textWhite} />
            <Text style={styles.rejectButtonText}>Reddet</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [handleApprove, handleReject]);

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone_number?.includes(searchQuery)
  );

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {renderHeader()}
      {renderSearchBar()}
      {renderTabs()}

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
        ) : (
          <>
            {activeTab === 'all' && (
              <View style={styles.customersList}>
                {filteredCustomers.length === 0 ? (
                  <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="account-search" size={64} color={Colors.textLight} />
                    <Text style={styles.emptyText}>Müşteri bulunamadı</Text>
                  </View>
                ) : (
                  filteredCustomers.map(renderCustomerCard)
                )}
              </View>
            )}

            {activeTab === 'pending' && (
              <View style={styles.pendingList}>
                {pendingApprovals.length === 0 ? (
                  <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="check-all" size={64} color={Colors.textLight} />
                    <Text style={styles.emptyText}>Onay bekleyen randevu yok</Text>
                  </View>
                ) : (
                  pendingApprovals.map(renderPendingApprovalCard)
                )}
              </View>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </Animated.View>
  );
});

export default CustomersTab;

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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    fontSize: 13,
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
    fontSize: 11,
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
  customersList: {
    padding: 16,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  customerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  customerEmail: {
    fontSize: 13,
    color: Colors.textLight,
  },
  pendingList: {
    padding: 16,
  },
  pendingCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  pendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pendingIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pendingInfo: {
    flex: 1,
  },
  pendingCustomer: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  pendingService: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  pendingDateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pendingDateTimeText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginRight: 8,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: 10,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  approveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textWhite,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.danger,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textWhite,
  },
});
