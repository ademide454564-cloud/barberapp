import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import { API_URL } from '../../../config';

export default function RevenueReportScreen({ navigation }) {
  const [revenue, setRevenue] = useState({
    today: 0,
    week: 0,
    month: 0,
    year: 0,
    topServices: [],
    dailyBreakdown: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRevenueData();
  }, []);

  const loadRevenueData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/appointments`);
      const appointments = await response.json();

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const yearStart = new Date(now.getFullYear(), 0, 1);

      let todayTotal = 0;
      let weekTotal = 0;
      let monthTotal = 0;
      let yearTotal = 0;
      const serviceRevenue = {};

      appointments.forEach((apt) => {
        if (apt.status === 'Onaylandı' && apt.service_id?.price) {
          const aptDate = new Date(apt.start_time);
          const price = apt.service_id.price;

          if (aptDate >= todayStart) todayTotal += price;
          if (aptDate >= weekStart) weekTotal += price;
          if (aptDate >= monthStart) monthTotal += price;
          if (aptDate >= yearStart) yearTotal += price;

          // Top services
          const serviceName = apt.service_id.name;
          if (!serviceRevenue[serviceName]) {
            serviceRevenue[serviceName] = { name: serviceName, total: 0, count: 0 };
          }
          serviceRevenue[serviceName].total += price;
          serviceRevenue[serviceName].count += 1;
        }
      });

      const topServices = Object.values(serviceRevenue)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      setRevenue({
        today: todayTotal,
        week: weekTotal,
        month: monthTotal,
        year: yearTotal,
        topServices,
        dailyBreakdown: [],
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ciro Raporu</Text>
        <TouchableOpacity onPress={loadRevenueData}>
          <MaterialCommunityIcons name="refresh" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Main Stats */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: Colors.revenue + '15' }]}>
              <MaterialCommunityIcons name="calendar-today" size={28} color={Colors.revenue} />
              <Text style={styles.statLabel}>Bugün</Text>
              <Text style={[styles.statValue, { color: Colors.revenue }]}>
                ₺{revenue.today.toLocaleString('tr-TR')}
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: Colors.appointmentCard + '15' }]}>
              <MaterialCommunityIcons name="calendar-week" size={28} color={Colors.appointmentCard} />
              <Text style={styles.statLabel}>Bu Hafta</Text>
              <Text style={[styles.statValue, { color: Colors.appointmentCard }]}>
                ₺{revenue.week.toLocaleString('tr-TR')}
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: Colors.primary + '15' }]}>
              <MaterialCommunityIcons name="calendar-month" size={28} color={Colors.primary} />
              <Text style={styles.statLabel}>Bu Ay</Text>
              <Text style={[styles.statValue, { color: Colors.primary }]}>
                ₺{revenue.month.toLocaleString('tr-TR')}
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: Colors.warning + '15' }]}>
              <MaterialCommunityIcons name="calendar" size={28} color={Colors.warning} />
              <Text style={styles.statLabel}>Bu Yıl</Text>
              <Text style={[styles.statValue, { color: Colors.warning }]}>
                ₺{revenue.year.toLocaleString('tr-TR')}
              </Text>
            </View>
          </View>

          {/* Top Services */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>En Çok Gelir Getiren Hizmetler</Text>
            {revenue.topServices.map((service, index) => (
              <View key={index} style={styles.serviceCard}>
                <View style={styles.serviceRank}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.serviceCount}>{service.count} Randevu</Text>
                </View>
                <Text style={styles.serviceRevenue}>₺{service.total.toLocaleString('tr-TR')}</Text>
              </View>
            ))}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  loader: { marginTop: 60 },
  scrollView: { flex: 1, padding: 16 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 12,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  section: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  serviceRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textWhite,
  },
  serviceInfo: { flex: 1 },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  serviceCount: { fontSize: 13, color: Colors.textSecondary },
  serviceRevenue: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.revenue,
  },
});
