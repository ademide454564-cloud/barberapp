import React, { useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Animated, Alert } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import { API_URL } from '../../../config';

export default function CalendarDayView({ appointments, timeSlot, onAppointmentPress, onEmptySlotPress, selectedDate, onAppointmentDrop }) {
  // Saat aralıkları (08:00 - 22:00)
  const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 8-22

  const getAppointmentsForHour = (hour) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.start_time);
      return aptDate.getHours() === hour;
    });
  };

  const formatTime = (hour) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  const handleDragEnd = async (appointment, event, newHour) => {
    if (event.nativeEvent.state === State.END) {
      const translateY = event.nativeEvent.translationY;

      // Her saat satırı yaklaşık 80px yüksekliğinde
      const hoursDragged = Math.round(translateY / 80);
      const currentHour = new Date(appointment.start_time).getHours();
      const targetHour = currentHour + hoursDragged;

      // Saat sınırlarını kontrol et (8-22 arası)
      if (targetHour < 8 || targetHour > 22) {
        Alert.alert('Hata', 'Çalışma saatleri dışına randevu taşıyamazsınız (08:00 - 22:00)');
        return;
      }

      // Yeni start_time oluştur
      const newStartTime = new Date(appointment.start_time);
      newStartTime.setHours(targetHour);

      try {
        // Backend'e güncelleme isteği gönder
        const response = await fetch(`${API_URL}/appointments/reschedule/${appointment._id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            start_time: newStartTime,
          }),
        });

        if (response.ok) {
          Alert.alert('Başarılı', 'Randevu taşındı');
          if (onAppointmentDrop) {
            onAppointmentDrop();
          }
        } else {
          Alert.alert('Hata', 'Randevu taşınamadı');
        }
      } catch (error) {
        Alert.alert('Hata', 'Bir hata oluştu');
      }
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {hours.map((hour) => {
        const hourAppointments = getAppointmentsForHour(hour);

        return (
          <View key={hour} style={styles.hourRow}>
            <View style={styles.timeColumn}>
              <Text style={styles.timeText}>{formatTime(hour)}</Text>
            </View>

            <View style={styles.appointmentsColumn}>
              {hourAppointments.length === 0 ? (
                <TouchableOpacity
                  style={styles.emptySlot}
                  onPress={() => {
                    if (onEmptySlotPress && selectedDate) {
                      const slotTime = new Date(selectedDate);
                      slotTime.setHours(hour, 0, 0, 0);
                      onEmptySlotPress(slotTime);
                    }
                  }}
                >
                  <MaterialCommunityIcons name="plus-circle-outline" size={20} color={Colors.primary} />
                  <Text style={styles.emptyText}>Randevu Ekle</Text>
                </TouchableOpacity>
              ) : (
                hourAppointments.map((apt) => {
                  const startDate = new Date(apt.start_time);
                  const minutes = startDate.getMinutes();
                  const translateY = useRef(new Animated.Value(0)).current;

                  return (
                    <PanGestureHandler
                      key={apt._id}
                      onGestureEvent={Animated.event(
                        [{ nativeEvent: { translationY: translateY } }],
                        { useNativeDriver: true }
                      )}
                      onHandlerStateChange={(e) => handleDragEnd(apt, e, hour)}
                    >
                      <Animated.View
                        style={[
                          styles.appointmentBlock,
                          {
                            transform: [{ translateY: translateY }],
                          },
                        ]}
                      >
                        <TouchableOpacity
                          onPress={() => onAppointmentPress(apt)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.appointmentHeader}>
                            <View style={styles.dragHandle}>
                              <MaterialCommunityIcons name="drag-horizontal-variant" size={20} color={Colors.textSecondary} />
                            </View>
                            <Text style={styles.appointmentTime}>
                              {formatTime(hour)}:{minutes.toString().padStart(2, '0')}
                            </Text>
                            <View
                              style={[
                                styles.statusDot,
                                apt.status === 'Onaylandı' && styles.statusConfirmed,
                                apt.status === 'Beklemede' && styles.statusPending,
                              ]}
                            />
                          </View>
                          <Text style={styles.appointmentCustomer}>
                            {apt.customer_id?.name}
                          </Text>
                          <Text style={styles.appointmentService}>
                            {apt.service_id?.name}
                          </Text>
                          <Text style={styles.appointmentPrice}>₺{apt.service_id?.price}</Text>
                        </TouchableOpacity>
                      </Animated.View>
                    </PanGestureHandler>
                  );
                })
              )}
            </View>
          </View>
        );
      })}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hourRow: {
    flexDirection: 'row',
    minHeight: 80,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  timeColumn: {
    width: 70,
    paddingTop: 8,
    paddingLeft: 12,
    backgroundColor: Colors.background,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  appointmentsColumn: {
    flex: 1,
    padding: 8,
    gap: 8,
  },
  emptySlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textLight,
  },
  appointmentBlock: {
    backgroundColor: Colors.appointmentCardLight,
    borderLeftWidth: 4,
    borderLeftColor: Colors.appointmentCard,
    borderRadius: 8,
    padding: 12,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dragHandle: {
    marginRight: 8,
    padding: 4,
  },
  appointmentTime: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.appointmentCard,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusConfirmed: {
    backgroundColor: Colors.success,
  },
  statusPending: {
    backgroundColor: Colors.warning,
  },
  appointmentCustomer: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 3,
  },
  appointmentService: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  appointmentPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.appointmentCard,
  },
});
