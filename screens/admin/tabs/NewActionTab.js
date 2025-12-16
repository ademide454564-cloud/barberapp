import React, { useMemo, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';

const NewActionTab = React.memo(({ navigation }) => {
  const fadeAnim = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);
  const renderHeader = useCallback(() => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Yeni Ekle</Text>
    </View>
  ), []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {renderHeader()}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.actionCard}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="calendar-plus" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.actionTitle}>Yeni Randevu</Text>
            <Text style={styles.actionDescription}>
              Müşteri için yeni randevu oluştur
            </Text>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Booking')}
            >
              <Text style={styles.actionButtonText}>Randevu Oluştur</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color={Colors.textWhite} />
            </TouchableOpacity>
          </View>

          <View style={styles.actionCard}>
            <View style={[styles.iconContainer, { backgroundColor: Colors.appointmentCardLight }]}>
              <MaterialCommunityIcons
                name="receipt-text-plus"
                size={48}
                color={Colors.appointmentCard}
              />
            </View>
            <Text style={styles.actionTitle}>Yeni Adisyon</Text>
            <Text style={styles.actionDescription}>
              Walk-in müşteri için adisyon aç
            </Text>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: Colors.appointmentCard }]}
              onPress={() => navigation.navigate('NewVisit')}
            >
              <Text style={styles.actionButtonText}>Adisyon Aç</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color={Colors.textWhite} />
            </TouchableOpacity>
          </View>

          <View style={styles.quickActions}>
            <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('AddCustomer')}
            >
              <MaterialCommunityIcons name="account-plus" size={24} color={Colors.text} />
              <Text style={styles.quickActionText}>Müşteri Ekle</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Services')}
            >
              <MaterialCommunityIcons name="scissors-cutting" size={24} color={Colors.text} />
              <Text style={styles.quickActionText}>Hizmet Ekle</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('BlockedTimes')}
            >
              <MaterialCommunityIcons name="calendar-remove" size={24} color={Colors.text} />
              <Text style={styles.quickActionText}>Kapalı Gün Ekle</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </Animated.View>
  );
});

export default NewActionTab;

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
  content: {
    padding: 20,
  },
  actionCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    padding: 28,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  actionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  actionDescription: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    gap: 8,
    width: '100%',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textWhite,
  },
  quickActions: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    gap: 12,
  },
  quickActionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
});
