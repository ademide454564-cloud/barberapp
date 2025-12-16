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

export default function FrequentCancellersScreen({ navigation }) {
  const [cancellers, setCancellers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCancellers();
  }, []);

  const loadCancellers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/reports/frequent-cancellers`);
      const data = await response.json();
      setCancellers(data);
    } catch (error) {
      console.error(error);
      setCancellers([]);
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
        <Text style={styles.headerTitle}>Sık İptal Edenler</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      ) : (
        <ScrollView style={styles.scrollView}>
          {cancellers.map((item, index) => (
            <View key={index} style={styles.card}>
              <View style={styles.cardContent}>
                <View style={styles.avatar}>
                  <MaterialCommunityIcons name="account-alert" size={28} color={Colors.warning} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.name}>{item.customer?.name || 'Bilinmeyen'}</Text>
                  <Text style={styles.phone}>
                    {item.customer?.phone_number || item.phone_number}
                  </Text>
                </View>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.cancelCount} İptal</Text>
              </View>
            </View>
          ))}
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardBackground,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  cardContent: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.warning + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  phone: { fontSize: 14, color: Colors.textSecondary },
  badge: {
    backgroundColor: Colors.warning,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  badgeText: { fontSize: 13, fontWeight: '700', color: Colors.textWhite },
});
