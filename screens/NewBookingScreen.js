import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { API_URL } from '../config';

export default function NewBookingScreen({ route, navigation }) {
  const [loading, setLoading] = useState(false);
  const [serviceExtras, setServiceExtras] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [dates, setDates] = useState([]);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [expandedSection, setExpandedSection] = useState('service'); // 'service', 'date', 'time', null

  const [blockedDayMessage, setBlockedDayMessage] = useState('');
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [showTimeSection, setShowTimeSection] = useState(false);

  useEffect(() => {
    loadServiceExtras();
    checkLoginStatus();
    generateDates();
  }, []);

  useEffect(() => {
    // Sadece tarih değiştiğinde ve hizmetler seçilmişse saat yükle
    if (selectedDate && selectedServices.length > 0 && expandedSection === 'date') {
      loadAvailableSlots();
    }
  }, [selectedDate]);

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

  const generateDates = () => {
    const datesList = [];
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      datesList.push(date);
    }

    setDates(datesList);
  };

  const loadServiceExtras = async () => {
    try {
      const response = await fetch(`${API_URL}/service-extras/category/Saç`);
      const data = await response.json();
      setServiceExtras(data);
    } catch (error) {
      console.error('Error loading service extras:', error);
    }
  };

  const toggleService = (serviceId) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      } else {
        return [...prev, serviceId];
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
    console.log('=== loadAvailableSlots started ===');
    console.log('selectedDate:', selectedDate);
    console.log('selectedServices:', selectedServices);
    console.log('serviceExtras:', serviceExtras.length);

    try {
      setLoading(true);
      setShowTimeSection(false);

      if (!selectedDate) {
        console.error('No date selected');
        return;
      }

      if (selectedServices.length === 0) {
        console.error('No services selected');
        return;
      }

      if (serviceExtras.length === 0) {
        console.error('No service extras loaded yet');
        return;
      }

      // Check blocked time
      console.log('Checking blocked time...');
      const blockedCheck = await checkBlockedTime(selectedDate, null);
      console.log('Blocked check result:', blockedCheck);

      if (blockedCheck.isBlocked && blockedCheck.type === 'full_day') {
        setBlockedDayMessage(
          blockedCheck.reason || 'Kaan Herli bu tarihte çalışmamaktadır. Tarih seçimini değiştirerek tekrar deneyiniz.'
        );
        setShowBlockedModal(true);
        setAvailableSlots([]);
        setShowTimeSection(false);
        setLoading(false);
        return;
      }

      // Calculate total duration
      let totalDuration = 45; // Default duration
      if (selectedServices.length > 0) {
        totalDuration = 0;
        selectedServices.forEach(serviceId => {
          const service = serviceExtras.find(s => s._id === serviceId);
          if (service && service.duration_minutes > 0) {
            totalDuration += service.duration_minutes;
          }
        });
        // If no duration set, use default
        if (totalDuration === 0) totalDuration = 45;
      }
      console.log('Total duration:', totalDuration);

      // Use default service ID (created in backend)
      const serviceId = '69355fb1bd18f186c23d6e1e'; // Default "Genel Hizmet" service
      console.log('Using service ID:', serviceId);

      // Fetch available slots from backend
      const url = `${API_URL}/appointments/available-slots`;
      const body = {
        staff_id: '692deddaa00a8caa246cec0d',
        date: selectedDate.toISOString(),
        service_id: serviceId,
      };

      console.log('Fetching slots from:', url);
      console.log('Request body:', body);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`Failed to fetch slots: ${response.status}`);
      }

      const availableSlotsData = await response.json();
      console.log('Available slots from backend:', availableSlotsData.length);

      // Generate all slots (10:30 - 20:30)
      const allSlots = [];
      const currentDate = new Date(selectedDate);
      currentDate.setHours(0, 0, 0, 0);

      const startTime = new Date(currentDate);
      startTime.setHours(10, 30, 0, 0);
      const endTime = new Date(currentDate);
      endTime.setHours(20, 30, 0, 0);

      let slotStart = new Date(startTime);
      while (slotStart <= endTime) {
        // Check if this slot is in the available slots
        const isAvailable = Array.isArray(availableSlotsData) && availableSlotsData.some(availableSlot => {
          const availableStart = new Date(availableSlot.start_time);
          return (
            availableStart.getHours() === slotStart.getHours() &&
            availableStart.getMinutes() === slotStart.getMinutes() &&
            availableStart.toDateString() === slotStart.toDateString()
          );
        });

        allSlots.push({
          start_time: slotStart.toISOString(),
          end_time: new Date(slotStart.getTime() + totalDuration * 60000).toISOString(),
          isAvailable: isAvailable,
        });

        slotStart = new Date(slotStart.getTime() + 30 * 60000);
      }

      console.log('All slots generated:', allSlots.length);
      console.log('Available slots:', allSlots.filter(s => s.isAvailable).length);
      console.log('Booked slots:', allSlots.filter(s => !s.isAvailable).length);

      setAvailableSlots(allSlots);
      setShowTimeSection(true);
      setExpandedSection('time'); // Auto-open time section
      console.log('=== loadAvailableSlots completed successfully ===');
    } catch (error) {
      console.error('=== ERROR in loadAvailableSlots ===');
      console.error('Error type:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      Alert.alert('Hata', `Saatler yüklenirken bir hata oluştu: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const createAppointment = async () => {
    if (selectedServices.length === 0 || !selectedSlot) {
      Alert.alert('Hata', 'Lütfen hizmet ve saat seçin');
      return;
    }

    if (!isLoggedIn) {
      navigation.navigate('Register', {
        returnTo: 'Booking',
      });
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
          service_id: '69355fb1bd18f186c23d6e1e', // Default "Genel Hizmet" service
          staff_id: '692deddaa00a8caa246cec0d',
          start_time: selectedSlot.start_time,
          selected_extras: selectedServices,
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  const getDayName = (date) => {
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    return days[date.getDay()];
  };

  const getMonthName = (date) => {
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    return months[date.getMonth()];
  };

  const getTotalPrice = () => {
    let total = 0;
    selectedServices.forEach(serviceId => {
      const service = serviceExtras.find(s => s._id === serviceId);
      if (service) {
        total += service.price;
      }
    });
    return total;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Randevu Al</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 1. Hizmet Seçimi */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setExpandedSection(expandedSection === 'service' ? null : 'service')}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeaderLeft}>
              <View style={[styles.stepNumber, selectedServices.length > 0 && styles.stepNumberCompleted]}>
                {selectedServices.length > 0 ? (
                  <MaterialCommunityIcons name="check" size={18} color="#fff" />
                ) : (
                  <Text style={styles.stepNumberText}>1</Text>
                )}
              </View>
              <View>
                <Text style={styles.sectionTitle}>Hizmet Seç</Text>
                {selectedServices.length > 0 && (
                  <Text style={styles.sectionSubtitle}>{selectedServices.length} hizmet seçildi</Text>
                )}
              </View>
            </View>
            <MaterialCommunityIcons
              name={expandedSection === 'service' ? 'chevron-up' : 'chevron-down'}
              size={24}
              color="#868E96"
            />
          </TouchableOpacity>

          {expandedSection === 'service' && (
            <View style={styles.sectionContent}>
              <View style={styles.categoryHeader}>
                <MaterialCommunityIcons name="scissors-cutting" size={20} color={Colors.primary} />
                <Text style={styles.categoryTitle}>Saç Hizmetleri</Text>
              </View>

              <View style={styles.servicesList}>
                {serviceExtras.map((service) => (
                  <TouchableOpacity
                    key={service._id}
                    style={[
                      styles.serviceItem,
                      selectedServices.includes(service._id) && styles.serviceItemSelected,
                    ]}
                    onPress={() => toggleService(service._id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.serviceCheckbox}>
                      {selectedServices.includes(service._id) && (
                        <MaterialCommunityIcons name="check" size={18} color={Colors.primary} />
                      )}
                    </View>
                    <View style={styles.serviceInfo}>
                      <Text style={styles.serviceName}>{service.name}</Text>
                      <View style={styles.serviceMeta}>
                        {service.duration_minutes > 0 && (
                          <Text style={styles.serviceDuration}>{service.duration_minutes} dk</Text>
                        )}
                        {service.price > 0 && (
                          <Text style={styles.servicePrice}>₺{service.price}</Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {selectedServices.length > 0 && (
                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={() => {
                    setExpandedSection('date');
                  }}
                >
                  <Text style={styles.continueButtonText}>
                    Devam Et ({selectedServices.length} Hizmet)
                  </Text>
                  <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* 2. Personel Seçimi */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.sectionTitle}>Personel</Text>
            </View>
          </View>
          <View style={styles.sectionContent}>
            <View style={styles.staffCard}>
              <MaterialCommunityIcons name="account" size={24} color={Colors.primary} />
              <Text style={styles.staffName}>Kaan Herli</Text>
            </View>
          </View>
        </View>

        {/* 3. Tarih Seçimi */}
        {selectedServices.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setExpandedSection(expandedSection === 'date' ? null : 'date')}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeaderLeft}>
                <View style={[styles.stepNumber, selectedDate && styles.stepNumberCompleted]}>
                  {selectedDate ? (
                    <MaterialCommunityIcons name="check" size={18} color="#fff" />
                  ) : (
                    <Text style={styles.stepNumberText}>3</Text>
                  )}
                </View>
                <View>
                  <Text style={styles.sectionTitle}>Tarih Seç</Text>
                  {selectedDate && (
                    <Text style={styles.sectionSubtitle}>
                      {selectedDate.getDate()} {getMonthName(selectedDate)} - {getDayName(selectedDate)}
                    </Text>
                  )}
                </View>
              </View>
              <MaterialCommunityIcons
                name={expandedSection === 'date' ? 'chevron-up' : 'chevron-down'}
                size={24}
                color="#868E96"
              />
            </TouchableOpacity>

            {expandedSection === 'date' && (
              <View style={styles.sectionContent}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.datesScroll}
                >
                  {dates.map((date, index) => {
                    const isSelected = selectedDate.toDateString() === date.toDateString();
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[styles.dateCard, isSelected && styles.dateCardSelected]}
                        onPress={() => {
                          setSelectedDate(date);
                          setSelectedSlot(null); // Reset slot selection
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.dateDayName, isSelected && styles.dateTextSelected]}>
                          {getDayName(date)}
                        </Text>
                        <Text style={[styles.dateDay, isSelected && styles.dateTextSelected]}>
                          {date.getDate()}
                        </Text>
                        <Text style={[styles.dateMonth, isSelected && styles.dateTextSelected]}>
                          {getMonthName(date)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* 4. Saat Seçimi */}
        {showTimeSection && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setExpandedSection(expandedSection === 'time' ? null : 'time')}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeaderLeft}>
                <View style={[styles.stepNumber, selectedSlot && styles.stepNumberCompleted]}>
                  {selectedSlot ? (
                    <MaterialCommunityIcons name="check" size={18} color="#fff" />
                  ) : (
                    <Text style={styles.stepNumberText}>4</Text>
                  )}
                </View>
                <View>
                  <Text style={styles.sectionTitle}>Saat Seç</Text>
                  {selectedSlot && (
                    <Text style={styles.sectionSubtitle}>{formatDate(selectedSlot.start_time)}</Text>
                  )}
                </View>
              </View>
              <MaterialCommunityIcons
                name={expandedSection === 'time' ? 'chevron-up' : 'chevron-down'}
                size={24}
                color="#868E96"
              />
            </TouchableOpacity>

            {expandedSection === 'time' && (
              <View style={styles.sectionContent}>
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
        )}

        {/* Özet ve Onay */}
        {selectedSlot && (
          <View style={styles.summarySection}>
            <Text style={styles.summaryTitle}>Randevu Özeti</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Hizmetler:</Text>
                <Text style={styles.summaryValue}>{selectedServices.length} adet</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Toplam Ücret:</Text>
                <Text style={styles.summaryPrice}>₺{getTotalPrice()}</Text>
              </View>
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
                  <Text style={styles.confirmButtonText}>Randevuyu Onayla</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Blocked Day Modal */}
      <Modal
        visible={showBlockedModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBlockedModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowBlockedModal(false)}
        >
          <View style={styles.bottomModal}>
            <View style={styles.modalHandle} />
            <MaterialCommunityIcons name="calendar-remove" size={48} color="#DC2626" />
            <Text style={styles.modalTitle}>Bu Tarih Müsait Değil</Text>
            <Text style={styles.modalMessage}>{blockedDayMessage}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowBlockedModal(false)}
            >
              <Text style={styles.modalButtonText}>Anladım</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 24,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  stepNumberCompleted: {
    backgroundColor: '#28A745',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#868E96',
    marginTop: 4,
  },
  sectionContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#495057',
  },
  servicesList: {
    gap: 10,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  serviceItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  serviceCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#DEE2E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  serviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  serviceDuration: {
    fontSize: 13,
    color: '#868E96',
  },
  servicePrice: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    gap: 12,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  datesScroll: {
    paddingVertical: 8,
    gap: 12,
  },
  dateCard: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    minWidth: 80,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dateCardSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dateDayName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#868E96',
    marginBottom: 4,
  },
  dateDay: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  dateMonth: {
    fontSize: 13,
    fontWeight: '500',
    color: '#868E96',
  },
  dateTextSelected: {
    color: '#fff',
  },
  loader: {
    marginVertical: 20,
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
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotButton: {
    width: '30%',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
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
  summarySection: {
    marginHorizontal: 24,
    marginTop: 24,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#868E96',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#DEE2E6',
    borderRadius: 2,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 15,
    color: '#868E96',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
