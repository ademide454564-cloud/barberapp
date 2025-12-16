import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../constants/Colors';
import { API_URL } from '../config';


export default function BookingScreen({ route, navigation }) {
  const serviceFromRoute = route.params?.service || null;
  const editAppointment = route.params?.editAppointment || null;
  const preselectedDate = route.params?.preselectedDate || null;
  const isEditMode = !!editAppointment;

  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [serviceExtras, setServiceExtras] = useState([]);
  const [selectedExtras, setSelectedExtras] = useState([]);

  const [selectedService, setSelectedService] = useState(
    isEditMode ? editAppointment.service_id : serviceFromRoute
  );
  const [selectedDate, setSelectedDate] = useState(
    isEditMode ? new Date(editAppointment.start_time) : (preselectedDate ? new Date(preselectedDate) : new Date())
  );
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingAppointmentData, setPendingAppointmentData] = useState(null);
  const [sentCode, setSentCode] = useState('');

  useEffect(() => {
    loadServices();
    loadServiceExtras();
    checkLoginStatus();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      checkLoginStatus();
    }, [])
  );

  const checkLoginStatus = async () => {
    try {
      const savedPhone = await AsyncStorage.getItem('userPhone');
      const savedName = await AsyncStorage.getItem('userName');
      const savedEmail = await AsyncStorage.getItem('userEmail');

      if (savedPhone) {
        setIsLoggedIn(true);
        setPhoneNumber(savedPhone);
        setCustomerName(savedName || '');
        setCustomerEmail(savedEmail || '');
      }
    } catch (error) {
      console.error('Error checking login status:', error);
    }
  };

  useEffect(() => {
    if (selectedService && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedService, selectedDate]);

  const sendVerificationCode = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Hata', 'Lütfen telefon numaranızı girin');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/appointments/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phoneNumber }),
      });

      const data = await response.json();

      if (response.ok) {
        setSentCode(data.code);
        Alert.alert(
          'Kod Gönderildi',
          `Telefon numaranıza doğrulama kodu gönderildi.\n\n[TEST] Kod: ${data.code}`,
          [{ text: 'Tamam' }]
        );
      } else {
        Alert.alert('Hata', 'Kod gönderilemedi');
      }
    } catch (error) {
      Alert.alert('Hata', 'Doğrulama kodu gönderilemedi');
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/services`);
      const data = await response.json();
      setServices(Array.isArray(data) ? data : []);
    } catch (error) {
      setServices([
        { _id: '1', name: 'Saç Kesimi', duration_minutes: 45, price: 150 },
        { _id: '2', name: 'Sakal Tıraşı', duration_minutes: 30, price: 100 },
        { _id: '3', name: 'Saç + Sakal', duration_minutes: 60, price: 220 },
        { _id: '4', name: 'Cilt Bakımı', duration_minutes: 40, price: 180 },
        { _id: '5', name: 'Kaş Dizaynı', duration_minutes: 20, price: 80 },
        { _id: '6', name: 'Bıyık Tıraşı', duration_minutes: 15, price: 50 },
        { _id: '7', name: 'Saç Boyama', duration_minutes: 90, price: 300 },
        { _id: '8', name: 'Ağda', duration_minutes: 35, price: 120 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadServiceExtras = async () => {
    try {
      const response = await fetch(`${API_URL}/service-extras/category/Saç`);
      const data = await response.json();
      setServiceExtras(data);
    } catch (error) {
      console.error('Error loading service extras:', error);
      setServiceExtras([]);
    }
  };

  const toggleExtra = (extraId) => {
    setSelectedExtras(prev => {
      if (prev.includes(extraId)) {
        return prev.filter(id => id !== extraId);
      } else {
        return [...prev, extraId];
      }
    });
  };

  const checkBlockedTime = async (date, time) => {
    try {
      const response = await fetch(`${API_URL}/blocked-times/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: date.toISOString(),
          time: time,
        }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error checking blocked time:', error);
      return { isBlocked: false };
    }
  };

  const loadAvailableSlots = async () => {
    try {
      setLoading(true);

      const blockedCheck = await checkBlockedTime(selectedDate, null);

      if (blockedCheck.isBlocked && blockedCheck.type === 'full_day') {
        Alert.alert(
          'Kapalı Gün',
          blockedCheck.reason || 'Kaan Herli bu tarihte çalışmamaktadır.',
          [{ text: 'Tamam' }]
        );
        setAvailableSlots([]);
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/appointments/available-slots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_id: '692deddaa00a8caa246cec0d',
          date: selectedDate.toISOString(),
          service_id: selectedService._id,
          is_admin: !!preselectedDate,
        }),
      });
      const data = await response.json();

      // Tüm saatleri oluştur (10:30 - 20:30 müşteri, 10:30 - 21:00 admin)
      const allSlots = [];
      const currentDate = new Date(selectedDate);
      const isAdmin = !!preselectedDate;

      const startTime = new Date(currentDate);
      startTime.setHours(10, 30, 0, 0);
      const endTime = new Date(currentDate);
      endTime.setHours(isAdmin ? 21 : 20, isAdmin ? 0 : 30, 0, 0);

      let slotStart = new Date(startTime);
      while (slotStart <= endTime) {
        const slotEnd = new Date(slotStart.getTime() + selectedService.duration_minutes * 60000);

        // Backend'den gelen boş saatlerde var mı kontrol et
        const isAvailable = Array.isArray(data) && data.some(availableSlot => {
          const availableStart = new Date(availableSlot.start_time).getTime();
          return availableStart === slotStart.getTime();
        });

        // Bloke saatleri kontrol et
        const slotTime = slotStart.toLocaleTimeString('tr-TR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        const blocked = await checkBlockedTime(selectedDate, slotTime);

        allSlots.push({
          start_time: slotStart.toISOString(),
          end_time: slotEnd.toISOString(),
          isAvailable: isAvailable && !blocked.isBlocked,
          isBlocked: blocked.isBlocked
        });

        slotStart = new Date(slotStart.getTime() + 30 * 60000);
      }

      setAvailableSlots(allSlots);
    } catch (error) {
      const slots = [];
      const currentDate = new Date(selectedDate);
      const isAdmin = !!preselectedDate;

      const startTime = new Date(currentDate);
      startTime.setHours(10, 30, 0, 0);
      const endTime = new Date(currentDate);
      endTime.setHours(isAdmin ? 21 : 20, isAdmin ? 0 : 30, 0, 0);

      let slotStart = new Date(startTime);
      while (slotStart <= endTime) {
        const slotEnd = new Date(slotStart.getTime() + selectedService.duration_minutes * 60000);

        slots.push({
          start_time: slotStart.toISOString(),
          end_time: slotEnd.toISOString(),
          isAvailable: true,
        });

        slotStart = new Date(slotStart.getTime() + 30 * 60000);
      }
      setAvailableSlots(slots);
    } finally {
      setLoading(false);
    }
  };

  const createAppointment = async () => {
    // Edit modunda sadece slot kontrolü yap
    if (isEditMode) {
      if (!selectedSlot) {
        Alert.alert('Hata', 'Lütfen yeni saat seçin');
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/appointments/update/${editAppointment._id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            start_time: selectedSlot.start_time,
          }),
        });

        if (response.ok) {
          Alert.alert(
            'Randevu Taşındı!',
            'Randevunuz başarıyla taşındı.',
            [
              {
                text: 'Tamam',
                onPress: () => navigation.goBack(),
              },
            ]
          );
        } else {
          Alert.alert('Hata', 'Randevu taşınamadı');
        }
      } catch (error) {
        Alert.alert('Hata', 'Bir hata oluştu');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Normal randevu oluşturma
    if (!selectedService || !selectedSlot) {
      Alert.alert('Hata', 'Lütfen hizmet ve saat seçin');
      return;
    }

    if (!isLoggedIn) {
      navigation.navigate('Register', {
        returnTo: 'Booking',
        returnParams: route.params,
      });
      return;
    }

    if (!phoneNumber || !customerName) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/appointments/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            name: customerName,
            phone_number: phoneNumber,
            email: customerEmail,
          },
          service_id: selectedService._id,
          staff_id: '692deddaa00a8caa246cec0d',
          start_time: selectedSlot.start_time,
          admin_created: !!preselectedDate, // Admin panelinden oluşturulmuş
          selected_extras: selectedExtras,
        }),
      });

      if (response.ok) {
        Alert.alert(
          'Randevu Oluşturuldu!',
          'Randevunuz başarıyla oluşturuldu.',
          [
            {
              text: 'Tamam',
              onPress: () => navigation.navigate('Home'),
            },
          ]
        );
      } else {
        Alert.alert('Hata', 'Randevu oluşturulamadı');
      }
    } catch (error) {
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const confirmAppointmentWithCode = async () => {
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
          phone_number: phoneNumber,
          code: verificationCode
        }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok || !verifyData.verified) {
        Alert.alert('Hata', verifyData.message || 'Geçersiz kod');
        return;
      }

      const response = await fetch(`${API_URL}/appointments/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pendingAppointmentData),
      });

      if (response.ok) {
        try {
          await AsyncStorage.setItem('userName', customerName);
          await AsyncStorage.setItem('userPhone', phoneNumber);
          await AsyncStorage.setItem('userEmail', customerEmail || '');
          await AsyncStorage.setItem('isLoggedIn', 'true');
          setIsLoggedIn(true);
        } catch (e) {
          console.error('AsyncStorage kayıt hatası:', e);
        }

        setShowVerificationModal(false);
        setVerificationCode('');
        setPendingAppointmentData(null);

        Alert.alert(
          'Randevu Oluşturuldu!',
          'Randevunuz başarıyla oluşturuldu.',
          [
            {
              text: 'Tamam',
              onPress: () => navigation.navigate('Home'),
            },
          ]
        );
      } else {
        Alert.alert('Hata', 'Randevu oluşturulamadı');
      }
    } catch (error) {
      Alert.alert('Hata', 'Randevu oluşturulurken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatFullDate = (date) => {
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      setSelectedSlot(null);
    }
  };

  const getServiceIcon = (name) => {
    const icons = {
      'Saç Kesimi': 'scissors-cutting',
      'Sakal Tıraşı': 'razor-single-edge',
      'Saç + Sakal': 'content-cut',
      'Cilt Bakımı': 'face-man-shimmer',
      'Kaş Dizaynı': 'eye',
      'Bıyık Tıraşı': 'mustache',
      'Saç Boyama': 'palette',
      'Ağda': 'fire',
    };
    return icons[name] || 'scissors-cutting';
  };

  const canProceedToDatetime = isEditMode || selectedService !== null;
  const canProceedToInfo = selectedService && selectedSlot;
  const canConfirm = isEditMode ? selectedSlot !== null : (selectedService && selectedSlot);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? 'Randevu Taşı' : 'Randevu Al'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 1. Hizmet Seçimi */}
        {!isEditMode && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Hizmet Seçin</Text>
              {selectedService && (
                <View style={styles.checkBadge}>
                  <MaterialCommunityIcons name="check" size={16} color="#fff" />
                </View>
              )}
            </View>

            {loading && services.length === 0 ? (
              <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
            ) : (
              <View style={styles.servicesList}>
                {services.map((service) => (
                  <TouchableOpacity
                    key={service._id}
                    style={[
                      styles.serviceCard,
                      selectedService?._id === service._id && styles.serviceCardSelected,
                    ]}
                    onPress={() => setSelectedService(service)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.serviceIcon}>
                      <MaterialCommunityIcons
                        name={getServiceIcon(service.name)}
                        size={28}
                        color={selectedService?._id === service._id ? Colors.primary : '#868E96'}
                      />
                    </View>
                    <View style={styles.serviceInfo}>
                      <Text style={styles.serviceName}>{service.name}</Text>
                      <Text style={styles.serviceDuration}>{service.duration_minutes} dk</Text>
                    </View>
                    <Text style={styles.servicePrice}>₺{service.price}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* 1.5 Hizmet Ayrıntıları */}
        {!isEditMode && selectedService && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Hizmet Ayrıntıları (Opsiyonel)</Text>
              {selectedExtras.length > 0 && (
                <View style={styles.checkBadge}>
                  <MaterialCommunityIcons name="check" size={16} color="#fff" />
                </View>
              )}
            </View>

            <Text style={styles.extrasSubtitle}>
              Birden fazla seçim yapabilirsiniz
            </Text>

            <View style={styles.extrasList}>
              {serviceExtras.map((extra) => (
                <TouchableOpacity
                  key={extra._id}
                  style={[
                    styles.extraCard,
                    selectedExtras.includes(extra._id) && styles.extraCardSelected,
                  ]}
                  onPress={() => toggleExtra(extra._id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.extraCheckbox}>
                    {selectedExtras.includes(extra._id) && (
                      <MaterialCommunityIcons name="check" size={16} color={Colors.primary} />
                    )}
                  </View>
                  <View style={styles.extraInfo}>
                    <Text style={styles.extraName}>{extra.name}</Text>
                    <View style={styles.extraMeta}>
                      {extra.duration_minutes > 0 && (
                        <Text style={styles.extraDuration}>{extra.duration_minutes} dk</Text>
                      )}
                      {extra.price > 0 && (
                        <Text style={styles.extraPrice}>+₺{extra.price}</Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 2. Tarih ve Saat */}
        <View style={[styles.section, !canProceedToDatetime && styles.sectionDisabled]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, !canProceedToDatetime && styles.sectionTitleDisabled]}>
              Tarih ve Saat
            </Text>
            {selectedSlot && (
              <View style={styles.checkBadge}>
                <MaterialCommunityIcons name="check" size={16} color="#fff" />
              </View>
            )}
          </View>

          {canProceedToDatetime && (
            <View>
              <TouchableOpacity
                style={styles.dateSelector}
                onPress={() => setShowDatePicker(true)}
              >
                <MaterialCommunityIcons name="calendar" size={22} color={Colors.primary} />
                <Text style={styles.dateSelectorText}>{formatFullDate(selectedDate)}</Text>
                <MaterialCommunityIcons name="chevron-down" size={22} color="#868E96" />
              </TouchableOpacity>

              {showDatePicker && Platform.OS !== 'web' && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}

              {loading ? (
                <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
              ) : availableSlots.length === 0 ? (
                <View style={styles.noSlots}>
                  <MaterialCommunityIcons name="calendar-remove" size={48} color="#868E96" />
                  <Text style={styles.noSlotsText}>Bu tarihte uygun saat yok</Text>
                </View>
              ) : (
                <View style={styles.slotsGrid}>
                  {availableSlots.map((slot, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.slotButton,
                        slot.isAvailable ? styles.slotButtonAvailable : styles.slotButtonBooked,
                        selectedSlot?.start_time === slot.start_time && styles.slotButtonSelected,
                      ]}
                      onPress={() => slot.isAvailable && setSelectedSlot(slot)}
                      disabled={!slot.isAvailable}
                      activeOpacity={slot.isAvailable ? 0.7 : 1}
                    >
                      <Text
                        style={[
                          styles.slotText,
                          slot.isAvailable ? styles.slotTextAvailable : styles.slotTextBooked,
                          selectedSlot?.start_time === slot.start_time && styles.slotTextSelected,
                        ]}
                      >
                        {formatDate(slot.start_time)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* 3. Kişisel Bilgiler */}
        {!isEditMode && (
          <View style={[styles.section, !canProceedToInfo && styles.sectionDisabled]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, !canProceedToInfo && styles.sectionTitleDisabled]}>
                Bilgileriniz
              </Text>
              {customerName && phoneNumber && (
                <View style={styles.checkBadge}>
                  <MaterialCommunityIcons name="check" size={16} color="#fff" />
                </View>
              )}
            </View>

          {canProceedToInfo && (
            <View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Ad Soyad</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Adınız ve Soyadınız"
                  placeholderTextColor="#ADB5BD"
                  value={customerName}
                  onChangeText={setCustomerName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Telefon</Text>
                <TextInput
                  style={styles.input}
                  placeholder="05XX XXX XX XX"
                  placeholderTextColor="#ADB5BD"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  maxLength={11}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>E-posta (Opsiyonel)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ornek@email.com"
                  placeholderTextColor="#ADB5BD"
                  value={customerEmail}
                  onChangeText={setCustomerEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>
          )}
          </View>
        )}

        {/* 4. Özet ve Onay */}
        {canConfirm && (
          <View style={styles.summarySection}>
            <Text style={styles.summaryTitle}>Randevu Özeti</Text>

            <View style={styles.summaryCard}>
              {!isEditMode && (
                <View style={styles.summaryRow}>
                  <MaterialCommunityIcons name="scissors-cutting" size={20} color={Colors.primary} />
                  <Text style={styles.summaryLabel}>Hizmet</Text>
                  <Text style={styles.summaryValue}>{selectedService.name}</Text>
                </View>
              )}

              <View style={styles.summaryRow}>
                <MaterialCommunityIcons name="calendar" size={20} color={Colors.primary} />
                <Text style={styles.summaryLabel}>{isEditMode ? 'Yeni Tarih' : 'Tarih'}</Text>
                <Text style={styles.summaryValue}>{formatFullDate(selectedDate)}</Text>
              </View>

              <View style={styles.summaryRow}>
                <MaterialCommunityIcons name="clock-outline" size={20} color={Colors.primary} />
                <Text style={styles.summaryLabel}>{isEditMode ? 'Yeni Saat' : 'Saat'}</Text>
                <Text style={styles.summaryValue}>{formatDate(selectedSlot.start_time)}</Text>
              </View>

              {!isEditMode && (
                <>
                  <View style={styles.summaryRow}>
                    <MaterialCommunityIcons name="account" size={20} color={Colors.primary} />
                    <Text style={styles.summaryLabel}>İsim</Text>
                    <Text style={styles.summaryValue}>{customerName}</Text>
                  </View>

                  <View style={styles.summaryDivider} />

                  <View style={styles.summaryRow}>
                    <MaterialCommunityIcons name="cash" size={24} color={Colors.primary} />
                    <Text style={styles.summaryLabel}>Toplam</Text>
                    <Text style={styles.summaryPrice}>₺{selectedService.price}</Text>
                  </View>
                </>
              )}
            </View>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={createAppointment}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="check-circle" size={24} color="#fff" />
                  <Text style={styles.confirmButtonText}>
                    {isEditMode ? 'Randevu Taşı' : 'Randevuyu Onayla'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* SMS Doğrulama Modalı */}
      <Modal
        visible={showVerificationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowVerificationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowVerificationModal(false)}
            >
              <MaterialCommunityIcons name="close" size={24} color="#1A1A1A" />
            </TouchableOpacity>

            <View style={styles.modalBody}>
              <View style={styles.modalIconContainer}>
                <MaterialCommunityIcons name="message-text" size={48} color={Colors.primary} />
              </View>

              <Text style={styles.modalTitle}>SMS Doğrulama</Text>
              <Text style={styles.modalDescription}>
                Telefon numaranıza gönderilen 6 haneli kodu girin
              </Text>
              <Text style={styles.modalPhone}>{phoneNumber}</Text>

              <TextInput
                style={styles.modalCodeInput}
                placeholder="000000"
                placeholderTextColor="#ADB5BD"
                value={verificationCode}
                onChangeText={setVerificationCode}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus={true}
              />

              {sentCode && (
                <Text style={styles.testCodeText}>[TEST] Kod: {sentCode}</Text>
              )}

              <TouchableOpacity
                style={[
                  styles.modalConfirmButton,
                  verificationCode.length !== 6 && styles.modalConfirmButtonDisabled,
                ]}
                onPress={confirmAppointmentWithCode}
                disabled={loading || verificationCode.length !== 6}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmButtonText}>Doğrula ve Onayla</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendButton}
                onPress={sendVerificationCode}
                disabled={loading}
              >
                <Text style={styles.resendButtonText}>Kodu Tekrar Gönder</Text>
              </TouchableOpacity>
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
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 24,
    marginTop: 24,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionDisabled: {
    opacity: 0.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  sectionTitleDisabled: {
    color: '#868E96',
  },
  checkBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servicesList: {
    gap: 12,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  serviceCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#fff',
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
    color: '#1A1A1A',
    marginBottom: 4,
  },
  serviceDuration: {
    fontSize: 13,
    color: '#868E96',
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  extrasSubtitle: {
    fontSize: 13,
    color: '#868E96',
    marginBottom: 16,
  },
  extrasList: {
    gap: 10,
  },
  extraCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  extraCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  extraCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#DEE2E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  extraInfo: {
    flex: 1,
  },
  extraName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  extraMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  extraDuration: {
    fontSize: 12,
    color: '#868E96',
  },
  extraPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 20,
  },
  dateSelectorText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
    marginLeft: 12,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotButton: {
    width: '30%',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  slotButtonAvailable: {
    backgroundColor: '#D4EDDA',
    borderColor: '#28A745',
  },
  slotButtonBooked: {
    backgroundColor: '#FFD6E0',
    borderColor: '#FFC0CB',
  },
  slotButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  slotText: {
    fontSize: 15,
    fontWeight: '600',
  },
  slotTextAvailable: {
    color: '#155724',
  },
  slotTextBooked: {
    color: '#C7254E',
  },
  slotTextSelected: {
    color: '#fff',
  },
  noSlots: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noSlotsText: {
    fontSize: 15,
    color: '#868E96',
    marginTop: 12,
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
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  summarySection: {
    marginHorizontal: 24,
    marginTop: 24,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  summaryCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#868E96',
    marginLeft: 12,
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#F1F3F5',
    marginVertical: 8,
  },
  summaryPrice: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primary,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  confirmButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  loader: {
    marginVertical: 20,
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
  modalClose: {
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
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  modalDescription: {
    fontSize: 15,
    color: '#868E96',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  modalPhone: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 24,
  },
  modalCodeInput: {
    width: '100%',
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    padding: 20,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 12,
    color: '#1A1A1A',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  testCodeText: {
    fontSize: 13,
    color: Colors.error,
    marginBottom: 24,
    fontWeight: '600',
  },
  modalConfirmButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalConfirmButtonDisabled: {
    backgroundColor: '#ADB5BD',
    opacity: 0.5,
  },
  modalConfirmButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  resendButton: {
    paddingVertical: 12,
  },
  resendButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
});
