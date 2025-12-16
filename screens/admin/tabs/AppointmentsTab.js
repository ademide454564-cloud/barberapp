import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import { API_URL } from '../../../config';
import CalendarDayView from '../components/CalendarDayView';
import CalendarWeekView from '../components/CalendarWeekView';
import CalendarMonthView from '../components/CalendarMonthView';

const AppointmentsTab = React.memo(({ navigation }) => {
  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const [viewMode, setViewMode] = useState('day'); // 'day', 'week', 'month'
  const [timeSlot, setTimeSlot] = useState(30); // 5, 10, 15, 30 dakika
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAppointments();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [selectedDate, viewMode]);

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/appointments`);
      const data = await response.json();

      // Filter appointments based on view mode and date
      const filtered = filterAppointmentsByView(data);
      setAppointments(filtered);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, viewMode]);

  const filterAppointmentsByView = useCallback((data) => {
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);

    let endDate = new Date(selectedDate);

    if (viewMode === 'day') {
      endDate.setHours(23, 59, 59, 999);
    } else if (viewMode === 'week') {
      endDate.setDate(endDate.getDate() + 7);
    } else if (viewMode === 'month') {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    return data.filter(apt => {
      const aptDate = new Date(apt.start_time);
      return aptDate >= startOfDay && aptDate <= endDate && apt.status !== 'İptal Edildi';
    });
  }, [selectedDate, viewMode]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAppointments();
    setRefreshing(false);
  }, [loadAppointments]);

  const changeDate = useCallback((direction) => {
    const newDate = new Date(selectedDate);

    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + direction);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    }

    setSelectedDate(newDate);
  }, [selectedDate, viewMode]);

  const goToToday = useCallback(() => {
    setSelectedDate(new Date());
  }, []);

  const handleApprove = useCallback(async (id) => {
    try {
      await fetch(`${API_URL}/appointments/approve/${id}`, { method: 'POST' });
      Alert.alert('Başarılı', 'Randevu onaylandı');
      loadAppointments();
    } catch (error) {
      Alert.alert('Hata', 'Randevu onaylanırken bir hata oluştu');
    }
  }, [loadAppointments]);

  const handleCancel = useCallback(async (id) => {
    Alert.alert(
      'Randevu İptali',
      'Bu randevuyu iptal etmek istediğinize emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'İptal Et',
          style: 'destructive',
          onPress: async () => {
            try {
              await fetch(`${API_URL}/appointments/cancel/${id}`, { method: 'POST' });
              Alert.alert('Başarılı', 'Randevu iptal edildi');
              loadAppointments();
            } catch (error) {
              Alert.alert('Hata', 'Randevu iptal edilirken bir hata oluştu');
            }
          },
        },
      ]
    );
  }, [loadAppointments]);

  const renderHeader = useCallback(() => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Randevular</Text>
      <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.homeButton}>
        <MaterialCommunityIcons name="home" size={24} color={Colors.primary} />
      </TouchableOpacity>
    </View>
  ), [navigation]);

  const renderViewModeSelector = useCallback(() => (
    <View style={styles.viewModeContainer}>
      <View style={styles.viewModeButtons}>
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'day' && styles.viewModeButtonActive]}
          onPress={() => setViewMode('day')}
        >
          <MaterialCommunityIcons
            name="calendar-today"
            size={18}
            color={viewMode === 'day' ? Colors.textWhite : Colors.textSecondary}
          />
          <Text style={[styles.viewModeText, viewMode === 'day' && styles.viewModeTextActive]}>
            Gün
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'week' && styles.viewModeButtonActive]}
          onPress={() => setViewMode('week')}
        >
          <MaterialCommunityIcons
            name="calendar-week"
            size={18}
            color={viewMode === 'week' ? Colors.textWhite : Colors.textSecondary}
          />
          <Text style={[styles.viewModeText, viewMode === 'week' && styles.viewModeTextActive]}>
            Hafta
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'month' && styles.viewModeButtonActive]}
          onPress={() => setViewMode('month')}
        >
          <MaterialCommunityIcons
            name="calendar-month"
            size={18}
            color={viewMode === 'month' ? Colors.textWhite : Colors.textSecondary}
          />
          <Text style={[styles.viewModeText, viewMode === 'month' && styles.viewModeTextActive]}>
            Ay
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.timeSlotSelector}>
        <Text style={styles.timeSlotLabel}>Aralık:</Text>
        {[5, 10, 15, 30].map((minutes) => (
          <TouchableOpacity
            key={minutes}
            style={[styles.timeSlotButton, timeSlot === minutes && styles.timeSlotButtonActive]}
            onPress={() => setTimeSlot(minutes)}
          >
            <Text style={[styles.timeSlotText, timeSlot === minutes && styles.timeSlotTextActive]}>
              {minutes}dk
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  ), [viewMode, timeSlot, setViewMode, setTimeSlot]);

  const renderDateNavigator = useCallback(() => (
    <View style={styles.dateNavigator}>
      <TouchableOpacity style={styles.navButton} onPress={() => changeDate(-1)}>
        <MaterialCommunityIcons name="chevron-left" size={28} color={Colors.primary} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.dateDisplay} onPress={goToToday}>
        <Text style={styles.dateText}>
          {selectedDate.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </Text>
        <Text style={styles.todayHint}>Bugüne dön</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navButton} onPress={() => changeDate(1)}>
        <MaterialCommunityIcons name="chevron-right" size={28} color={Colors.primary} />
      </TouchableOpacity>
    </View>
  ), [selectedDate, changeDate, goToToday]);

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showManageModal, setShowManageModal] = useState(false);

  const renderAppointmentCard = useCallback((appointment) => {
    const startDate = new Date(appointment.start_time);
    const formattedTime = startDate.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <TouchableOpacity
        key={appointment._id}
        style={styles.appointmentCard}
        onPress={() => {
          setSelectedAppointment(appointment);
          setShowManageModal(true);
        }}
      >
        <View style={styles.appointmentHeader}>
          <View style={styles.appointmentTime}>
            <MaterialCommunityIcons name="clock-outline" size={20} color={Colors.appointmentCard} />
            <Text style={styles.appointmentTimeText}>{formattedTime}</Text>
          </View>
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

        <View style={styles.appointmentBody}>
          <View style={styles.appointmentIcon}>
            <MaterialCommunityIcons name="scissors-cutting" size={28} color={Colors.appointmentCard} />
          </View>
          <View style={styles.appointmentInfo}>
            <Text style={styles.appointmentService}>{appointment.service_id?.name}</Text>
            <Text style={styles.appointmentCustomer}>{appointment.customer_id?.name}</Text>
            <Text style={styles.appointmentPhone}>{appointment.customer_id?.phone_number}</Text>
          </View>
          <View style={styles.appointmentPrice}>
            <Text style={styles.priceText}>₺{appointment.service_id?.price}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [setSelectedAppointment, setShowManageModal]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {renderHeader()}
      {renderViewModeSelector()}
      {renderDateNavigator()}

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      ) : viewMode === 'day' ? (
        <CalendarDayView
          appointments={appointments}
          timeSlot={timeSlot}
          onAppointmentPress={(apt) => {
            setSelectedAppointment(apt);
            setShowManageModal(true);
          }}
        />
      ) : viewMode === 'week' ? (
        <CalendarWeekView
          appointments={appointments}
          selectedDate={selectedDate}
          onAppointmentPress={(apt) => {
            setSelectedAppointment(apt);
            setShowManageModal(true);
          }}
        />
      ) : (
        <CalendarMonthView
          appointments={appointments}
          selectedDate={selectedDate}
          onDayPress={(date) => {
            setSelectedDate(date);
            setViewMode('day');
          }}
        />
      )}

      {/* Manage Appointment Modal */}
      <Modal visible={showManageModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Randevu Yönetimi</Text>
              <TouchableOpacity onPress={() => {
                setShowManageModal(false);
                setSelectedAppointment(null);
              }}>
                <MaterialCommunityIcons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {selectedAppointment && (
              <View style={styles.modalBody}>
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="account" size={20} color={Colors.textSecondary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Müşteri</Text>
                    <Text style={styles.infoValue}>{selectedAppointment.customer_id?.name}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="scissors-cutting" size={20} color={Colors.textSecondary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Hizmet</Text>
                    <Text style={styles.infoValue}>{selectedAppointment.service_id?.name}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="phone" size={20} color={Colors.textSecondary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Telefon</Text>
                    <Text style={styles.infoValue}>{selectedAppointment.customer_id?.phone_number}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="cash" size={20} color={Colors.textSecondary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Fiyat</Text>
                    <Text style={styles.infoValue}>₺{selectedAppointment.service_id?.price}</Text>
                  </View>
                </View>

                <View style={styles.modalActions}>
                  {selectedAppointment.status === 'Beklemede' && (
                    <TouchableOpacity
                      style={styles.approveBtn}
                      onPress={() => {
                        handleApprove(selectedAppointment._id);
                        setShowManageModal(false);
                      }}
                    >
                      <MaterialCommunityIcons name="check" size={20} color={Colors.textWhite} />
                      <Text style={styles.approveBtnText}>Onayla</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => {
                      handleCancel(selectedAppointment._id);
                      setShowManageModal(false);
                    }}
                  >
                    <MaterialCommunityIcons name="close" size={20} color={Colors.textWhite} />
                    <Text style={styles.cancelBtnText}>İptal Et</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
});

export default AppointmentsTab;

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
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  homeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewModeContainer: {
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  viewModeButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: Colors.background,
    borderRadius: 12,
    gap: 6,
  },
  viewModeButtonActive: {
    backgroundColor: Colors.primary,
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  viewModeTextActive: {
    color: Colors.textWhite,
  },
  timeSlotSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeSlotLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginRight: 4,
  },
  timeSlotButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeSlotButtonActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  timeSlotText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  timeSlotTextActive: {
    color: Colors.primary,
  },
  dateNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardBackground,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDisplay: {
    alignItems: 'center',
  },
  dateText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  todayHint: {
    fontSize: 12,
    color: Colors.textSecondary,
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
  appointmentsList: {
    padding: 16,
    gap: 12,
  },
  appointmentCard: {
    backgroundColor: Colors.appointmentCardLight,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.appointmentCard,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  appointmentTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appointmentTimeText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.appointmentCard,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  statusConfirmed: {
    backgroundColor: Colors.success,
  },
  statusPending: {
    backgroundColor: Colors.warning,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textWhite,
  },
  appointmentBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentService: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  appointmentCustomer: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  appointmentPhone: {
    fontSize: 12,
    color: Colors.textLight,
  },
  appointmentPrice: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.appointmentCard,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  modalBody: {
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  approveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textWhite,
  },
  cancelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.danger,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textWhite,
  },
});
