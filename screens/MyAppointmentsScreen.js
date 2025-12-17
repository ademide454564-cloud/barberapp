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
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { API_URL } from '../config';


export default function MyAppointmentsScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [sentCode, setSentCode] = useState('');

  useEffect(() => {
    checkLoginAndLoadAppointments();
  }, []);

  const checkLoginAndLoadAppointments = async () => {
    try {
      const savedPhone = await AsyncStorage.getItem('userPhone');

      if (savedPhone) {
        setIsLoggedIn(true);
        setPhone(savedPhone);
        await loadAppointments(savedPhone);
      } else {
        setShowLoginModal(true);
      }
    } catch (error) {
      console.error('Error checking login:', error);
      setShowLoginModal(true);
    }
  };

  const loadAppointments = async (phoneNumber) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/appointments/by-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phoneNumber }),
      });

      const data = await response.json();
      setAppointments(data);
    } catch (error) {
      Alert.alert('Hata', 'Randevular yüklenirken bir hata oluştu');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const sendLoginCode = async () => {
    if (!phone.trim() || phone.length < 10) {
      Alert.alert('Hata', 'Lütfen geçerli bir telefon numarası girin');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/appointments/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phone }),
      });

      const data = await response.json();

      if (response.ok) {
        setSentCode(data.code || '');
        Alert.alert('Kod Gönderildi', 'Telefon numaranıza 6 haneli kod gönderildi');
      } else {
        Alert.alert('Hata', 'Kod gönderilemedi');
      }
    } catch (error) {
      Alert.alert('Hata', 'Doğrulama kodu gönderilemedi');
    } finally {
      setLoading(false);
    }
  };

  const verifyLoginCode = async () => {
    if (verificationCode.length !== 6) {
      Alert.alert('Hata', 'Lütfen 6 haneli kodu girin');
      return;
    }

    try {
      setLoading(true);
      const verifyResponse = await fetch(`${API_URL}/appointments/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: phone,
          code: verificationCode
        }),
      });

      const verifyData = await verifyResponse.json();

      if (verifyResponse.ok && verifyData.verified) {
        await AsyncStorage.setItem('userPhone', phone);
        await AsyncStorage.setItem('isLoggedIn', 'true');
        setIsLoggedIn(true);
        setShowLoginModal(false);
        setVerificationCode('');

        await loadAppointments(phone);
        Alert.alert('Başarılı', 'Giriş yapıldı!');
      } else {
        Alert.alert('Hata', verifyData.message || 'Geçersiz kod');
      }
    } catch (error) {
      Alert.alert('Hata', 'Kod doğrulanamadı');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = (appointment) => {
    Alert.alert(
      'Randevu İptali',
      `${appointment.service_id?.name} randevunuzu iptal etmek istediğinize emin misiniz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'İptal Et',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/appointments/cancel/${appointment._id}`, {
                method: 'POST',
              });

              if (response.ok) {
                setAppointments(appointments.filter((apt) => apt._id !== appointment._id));
                Alert.alert('Başarılı', 'Randevunuz iptal edildi');
              } else {
                Alert.alert('Hata', 'Randevu iptal edilirken bir hata oluştu');
              }
            } catch (error) {
              Alert.alert('Hata', 'Randevu iptal edilirken bir hata oluştu');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Randevum</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
        ) : appointments.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <MaterialCommunityIcons name="calendar-remove" size={64} color="#ADB5BD" />
            </View>
            <Text style={styles.emptyTitle}>Randevu Bulunamadı</Text>
            <Text style={styles.emptySubtitle}>
              Henüz kayıtlı randevunuz bulunmuyor
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.emptyButtonText}>Randevu Al</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.appointmentsList}>
            {appointments.map((appointment) => {
              const startDate = new Date(appointment.start_time);
              const formattedDate = startDate.toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              });
              const formattedTime = startDate.toLocaleTimeString('tr-TR', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <View key={appointment._id} style={styles.appointmentCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.serviceIconContainer}>
                      <MaterialCommunityIcons
                        name="scissors-cutting"
                        size={28}
                        color={Colors.primary}
                      />
                    </View>
                    <View style={styles.cardHeaderInfo}>
                      <Text style={styles.serviceName}>{appointment.service_id?.name}</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          appointment.status === 'Onaylandı' && styles.statusConfirmed,
                          appointment.status === 'Beklemede' && styles.statusPending,
                        ]}
                      >
                        <Text style={styles.statusText}>{appointment.status}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.cardDivider} />

                  <View style={styles.cardDetails}>
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="calendar" size={18} color="#868E96" />
                      <Text style={styles.detailText}>{formattedDate}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="clock-outline" size={18} color="#868E96" />
                      <Text style={styles.detailText}>{formattedTime}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="account" size={18} color="#868E96" />
                      <Text style={styles.detailText}>{appointment.customer_id?.name}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="cash" size={18} color="#868E96" />
                      <Text style={styles.detailText}>₺{appointment.service_id?.price}</Text>
                    </View>

                    {/* Seçili Extras */}
                    {appointment.selected_extras && appointment.selected_extras.length > 0 && (
                      <View style={styles.extrasSection}>
                        <Text style={styles.extrasTitle}>Hizmet Ayrıntıları:</Text>
                        <View style={styles.extrasContainer}>
                          {appointment.selected_extras.map((extra, index) => (
                            <View key={index} style={styles.extraTag}>
                              <Text style={styles.extraTagText}>{extra.name}</Text>
                              {extra.price > 0 && (
                                <Text style={styles.extraTagPrice}>+₺{extra.price}</Text>
                              )}
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => handleCancelAppointment(appointment)}
                  >
                    <MaterialCommunityIcons name="close-circle" size={20} color="#fff" />
                    <Text style={styles.cancelButtonText}>Randevuyu İptal Et</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Login Modal */}
      <Modal visible={showLoginModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowLoginModal(false);
                navigation.goBack();
              }}
            >
              <MaterialCommunityIcons name="close" size={24} color="#1A1A1A" />
            </TouchableOpacity>

            <View style={styles.modalBody}>
              <View style={styles.modalIconContainer}>
                <MaterialCommunityIcons name="lock-outline" size={48} color={Colors.primary} />
              </View>

              <Text style={styles.modalTitle}>Giriş Yap</Text>
              <Text style={styles.modalSubtitle}>
                Randevularınızı görüntülemek için telefon numaranızı doğrulayın
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Telefon Numarası</Text>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="05XX XXX XX XX"
                  placeholderTextColor="#ADB5BD"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={11}
                />
              </View>

              <TouchableOpacity
                style={[styles.sendCodeButton, (phone.length < 10 || loading) && styles.sendCodeButtonDisabled]}
                onPress={sendLoginCode}
                disabled={loading || phone.length < 10}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="message-text" size={20} color="#fff" />
                    <Text style={styles.sendCodeButtonText}>Kod Gönder</Text>
                  </>
                )}
              </TouchableOpacity>

              {sentCode && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Doğrulama Kodu</Text>
                    <TextInput
                      style={styles.codeInput}
                      placeholder="000000"
                      placeholderTextColor="#ADB5BD"
                      value={verificationCode}
                      onChangeText={setVerificationCode}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>

                  <Text style={styles.testCodeText}>[TEST] Kod: {sentCode}</Text>

                  <TouchableOpacity
                    style={[
                      styles.loginButton,
                      (verificationCode.length !== 6 || loading) && styles.loginButtonDisabled,
                    ]}
                    onPress={verifyLoginCode}
                    disabled={loading || verificationCode.length !== 6}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.loginButtonText}>Giriş Yap</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
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
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  scrollView: {
    flex: 1,
  },
  loader: {
    marginTop: 100,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#868E96',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  emptyButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  appointmentsList: {
    padding: 24,
    gap: 16,
  },
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
  cardHeaderInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  statusConfirmed: {
    backgroundColor: '#10B981',
  },
  statusPending: {
    backgroundColor: '#F59E0B',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F3F5',
    marginBottom: 16,
  },
  cardDetails: {
    gap: 12,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailText: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  extrasSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F5',
  },
  extrasTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#868E96',
    marginBottom: 10,
  },
  extrasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  extraTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    gap: 6,
  },
  extraTagText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#495057',
  },
  extraTagPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  cancelButton: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: 32,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    alignSelf: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#868E96',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  phoneInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sendCodeButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 24,
  },
  sendCodeButtonDisabled: {
    backgroundColor: '#ADB5BD',
    opacity: 0.5,
  },
  sendCodeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  codeInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    letterSpacing: 8,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  testCodeText: {
    fontSize: 13,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  loginButtonDisabled: {
    backgroundColor: '#ADB5BD',
    opacity: 0.5,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
