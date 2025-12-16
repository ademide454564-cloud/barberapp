import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import { API_URL } from '../../../config';

export default function AppointmentHistoryScreen({ navigation }) {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = appointments.filter(
        (apt) =>
          apt.customer_id?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          apt.customer_id?.phone_number?.includes(searchQuery)
      );
      setFilteredAppointments(filtered);
    } else {
      setFilteredAppointments(appointments);
    }
  }, [searchQuery, appointments]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/appointments`);
      const data = await response.json();
      setAppointments(data);
      setFilteredAppointments(data);
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
        <Text style={styles.headerTitle}>Randevu Geçmişi</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Müşteri ara..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      ) : (
        <ScrollView style={styles.scrollView}>
          {filteredAppointments.map((apt) => {
            const date = new Date(apt.start_time);
            return (
              <View key={apt._id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.customerName}>{apt.customer_id?.name}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      apt.status === 'Onaylandı' && styles.statusConfirmed,
                      apt.status === 'Beklemede' && styles.statusPending,
                      apt.status === 'İptal Edildi' && styles.statusCancelled,
                    ]}
                  >
                    <Text style={styles.statusText}>{apt.status}</Text>
                  </View>
                </View>
                <Text style={styles.service}>{apt.service_id?.name}</Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.date}>
                    {date.toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                  <Text style={styles.price}>₺{apt.service_id?.price}</Text>
                </View>
              </View>
            );
          })}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.text },
  loader: { marginTop: 60 },
  scrollView: { flex: 1, padding: 16, paddingTop: 0 },
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerName: { fontSize: 17, fontWeight: '700', color: Colors.text },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 },
  statusConfirmed: { backgroundColor: Colors.success },
  statusPending: { backgroundColor: Colors.warning },
  statusCancelled: { backgroundColor: Colors.danger },
  statusText: { fontSize: 11, fontWeight: '700', color: Colors.textWhite },
  service: { fontSize: 15, color: Colors.textSecondary, marginBottom: 8 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  date: { fontSize: 14, color: Colors.textSecondary },
  price: { fontSize: 16, fontWeight: '700', color: Colors.primary },
});
