import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import { API_URL } from '../../../config';

export default function NewVisitScreen({ navigation }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoadingServices(true);
      const response = await fetch(`${API_URL}/services`);
      const data = await response.json();
      setServices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading services:', error);
      Alert.alert('Hata', 'Hizmetler yüklenirken bir hata oluştu');
    } finally {
      setLoadingServices(false);
    }
  };

  const validateInputs = () => {
    if (!name.trim()) {
      Alert.alert('Hata', 'Lütfen müşteri adını girin');
      return false;
    }
    if (!phone.trim()) {
      Alert.alert('Hata', 'Lütfen telefon numarası girin');
      return false;
    }
    if (!selectedService) {
      Alert.alert('Hata', 'Lütfen bir hizmet seçin');
      return false;
    }
    return true;
  };

  const handleCreateVisit = async () => {
    if (!validateInputs()) return;

    Alert.alert(
      'Adisyon Aç',
      'Walk-in müşteri için yeni adisyon açmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Oluştur',
          onPress: async () => {
            try {
              setLoading(true);

              // Create appointment with current time
              const now = new Date();

              const response = await fetch(`${API_URL}/appointments/add`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  customer: {
                    name: name.trim(),
                    phone_number: phone.trim(),
                  },
                  service_id: selectedService._id,
                  staff_id: '65f1234567890abcdef12345', // Default staff - should be dynamic
                  start_time: now.toISOString(),
                  admin_created: true,
                  selected_extras: [],
                }),
              });

              if (response.ok) {
                Alert.alert('Başarılı', 'Adisyon başarıyla açıldı', [
                  {
                    text: 'Tamam',
                    onPress: () => navigation.goBack(),
                  },
                ]);
              } else {
                const error = await response.text();
                Alert.alert('Hata', 'Adisyon açılırken bir hata oluştu: ' + error);
              }
            } catch (error) {
              console.error('Error creating visit:', error);
              Alert.alert('Hata', 'Adisyon açılırken bir hata oluştu');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Yeni Adisyon Aç</Text>
      <View style={styles.backButton} />
    </View>
  );

  const renderServiceCard = (service) => {
    const isSelected = selectedService?._id === service._id;
    return (
      <TouchableOpacity
        key={service._id}
        style={[styles.serviceCard, isSelected && styles.serviceCardSelected]}
        onPress={() => setSelectedService(service)}
      >
        <View style={styles.serviceIcon}>
          <MaterialCommunityIcons
            name="scissors-cutting"
            size={24}
            color={isSelected ? Colors.primary : Colors.appointmentCard}
          />
        </View>
        <View style={styles.serviceInfo}>
          <Text style={[styles.serviceName, isSelected && styles.serviceNameSelected]}>
            {service.name}
          </Text>
          <View style={styles.serviceDetails}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.serviceDuration}>{service.duration_minutes} dk</Text>
          </View>
        </View>
        <Text style={[styles.servicePrice, isSelected && styles.servicePriceSelected]}>
          ₺{service.price}
        </Text>
        {isSelected && (
          <View style={styles.checkIcon}>
            <MaterialCommunityIcons name="check-circle" size={24} color={Colors.primary} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {renderHeader()}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="receipt-text-plus"
              size={64}
              color={Colors.appointmentCard}
            />
          </View>

          <Text style={styles.description}>
            Walk-in müşteri için adisyon açın
          </Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Müşteri Adı *</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="account" size={20} color={Colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Müşteri adı ve soyadı"
                  placeholderTextColor={Colors.textLight}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Telefon Numarası *</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="phone" size={20} color={Colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="05XX XXX XX XX"
                  placeholderTextColor={Colors.textLight}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={11}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Hizmet Seçin *</Text>
              {loadingServices ? (
                <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 20 }} />
              ) : (
                <View style={styles.servicesList}>
                  {services.map(renderServiceCard)}
                </View>
              )}
            </View>

            {selectedService && (
              <View style={styles.summary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Seçilen Hizmet:</Text>
                  <Text style={styles.summaryValue}>{selectedService.name}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Süre:</Text>
                  <Text style={styles.summaryValue}>{selectedService.duration_minutes} dakika</Text>
                </View>
                <View style={[styles.summaryRow, styles.summaryTotal]}>
                  <Text style={styles.totalLabel}>Toplam:</Text>
                  <Text style={styles.totalValue}>₺{selectedService.price}</Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.createButton, loading && styles.createButtonDisabled]}
              onPress={handleCreateVisit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.textWhite} />
              ) : (
                <>
                  <MaterialCommunityIcons name="check" size={20} color={Colors.textWhite} />
                  <Text style={styles.createButtonText}>Adisyon Aç</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
    color: Colors.text,
    letterSpacing: -0.5,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.appointmentCardLight,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  servicesList: {
    gap: 12,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  serviceCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  serviceNameSelected: {
    color: Colors.primary,
  },
  serviceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serviceDuration: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.appointmentCard,
    marginRight: 8,
  },
  servicePriceSelected: {
    color: Colors.primary,
  },
  checkIcon: {
    marginLeft: 8,
  },
  summary: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  summaryTotal: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.appointmentCard,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textWhite,
  },
});
