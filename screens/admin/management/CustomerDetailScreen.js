import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import { API_URL } from '../../../config';

export default function CustomerDetailScreen({ route, navigation }) {
  const { customer } = route.params;
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalVisits: 0,
    totalSpent: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
  });

  useEffect(() => {
    loadCustomerData();
  }, []);

  const loadCustomerData = async () => {
    try {
      setLoading(true);

      // Müşterinin tüm randevularını yükle
      const response = await fetch(`${API_URL}/appointments/by-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: customer.phone_number }),
      });

      const data = await response.json();
      setAppointments(data);

      // İstatistikleri hesapla
      const now = new Date();
      const completed = data.filter(apt => apt.status === 'completed' || apt.status === 'Tamamlandı');
      const upcoming = data.filter(apt => new Date(apt.start_time) > now && apt.status !== 'İptal Edildi');
      const totalSpent = completed.reduce((sum, apt) => sum + (apt.amount || 0), 0);

      setStats({
        totalVisits: completed.length,
        totalSpent: totalSpent,
        upcomingAppointments: upcoming.length,
        completedAppointments: completed.length,
      });
    } catch (error) {
      console.error('Error loading customer data:', error);
      Alert.alert('Hata', 'Müşteri bilgileri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'Tamamlandı':
        return '#10b981';
      case 'confirmed':
      case 'Onaylandı':
        return Colors.primary;
      case 'İptal Edildi':
        return '#ef4444';
      default:
        return '#f59e0b';
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'completed': 'Tamamlandı',
      'confirmed': 'Onaylandı',
      'Beklemede': 'Beklemede',
      'İptal Edildi': 'İptal Edildi',
      'Onaylandı': 'Onaylandı',
      'Tamamlandı': 'Tamamlandı',
    };
    return statusMap[status] || status;
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Müşteri Detayı</Text>
      <View style={{ width: 40 }} />
    </View>
  );

  const renderCustomerInfo = () => (
    <View style={styles.customerInfoCard}>
      <View style={styles.avatarLarge}>
        <MaterialCommunityIcons name="account" size={48} color={Colors.primary} />
      </View>
      <Text style={styles.customerName}>{customer.name}</Text>
      <Text style={styles.customerPhone}>{customer.phone_number}</Text>
      {customer.email && <Text style={styles.customerEmail}>{customer.email}</Text>}

      {customer.is_admin && (
        <View style={styles.adminBadge}>
          <MaterialCommunityIcons name="shield-crown" size={16} color="#f59e0b" />
          <Text style={styles.adminBadgeText}>Admin</Text>
        </View>
      )}
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <MaterialCommunityIcons name="calendar-check" size={32} color={Colors.primary} />
        <Text style={styles.statValue}>{stats.totalVisits}</Text>
        <Text style={styles.statLabel}>Toplam Ziyaret</Text>
      </View>
      <View style={styles.statCard}>
        <MaterialCommunityIcons name="cash" size={32} color="#10b981" />
        <Text style={styles.statValue}>{stats.totalSpent}₺</Text>
        <Text style={styles.statLabel}>Toplam Harcama</Text>
      </View>
      <View style={styles.statCard}>
        <MaterialCommunityIcons name="clock-outline" size={32} color="#f59e0b" />
        <Text style={styles.statValue}>{stats.upcomingAppointments}</Text>
        <Text style={styles.statLabel}>Gelecek Randevu</Text>
      </View>
    </View>
  );

  const renderAppointmentCard = (appointment) => (
    <View key={appointment._id} style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <View>
          <Text style={styles.appointmentService}>
            {appointment.service_id?.name || 'Hizmet'}
          </Text>
          <Text style={styles.appointmentDate}>{formatDate(appointment.start_time)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
          <Text style={styles.statusText}>{getStatusText(appointment.status)}</Text>
        </View>
      </View>

      {appointment.staff_id && (
        <View style={styles.appointmentDetail}>
          <MaterialCommunityIcons name="account-tie" size={16} color={Colors.textSecondary} />
          <Text style={styles.appointmentDetailText}>{appointment.staff_id.name}</Text>
        </View>
      )}

      {appointment.amount > 0 && (
        <View style={styles.appointmentDetail}>
          <MaterialCommunityIcons name="cash" size={16} color={Colors.textSecondary} />
          <Text style={styles.appointmentDetailText}>{appointment.amount}₺</Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderCustomerInfo()}
        {renderStats()}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Randevu Geçmişi</Text>
          <Text style={styles.sectionSubtitle}>{appointments.length} randevu</Text>
        </View>

        {appointments.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="calendar-blank" size={64} color={Colors.textLight} />
            <Text style={styles.emptyStateText}>Henüz randevu yok</Text>
          </View>
        ) : (
          <View style={styles.appointmentsList}>
            {appointments.map(renderAppointmentCard)}
          </View>
        )}

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
    backgroundColor: Colors.primary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerInfoCard: {
    backgroundColor: '#fff',
    padding: 24,
    margin: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  avatarLarge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  customerName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  customerPhone: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  customerEmail: {
    fontSize: 14,
    color: Colors.textLight,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 12,
    gap: 6,
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  appointmentsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  appointmentCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F3F5',
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  appointmentService: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  appointmentDate: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  appointmentDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  appointmentDetailText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.textLight,
    marginTop: 16,
  },
});
