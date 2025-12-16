import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';

export default function CalendarDayView({ appointments, timeSlot, onAppointmentPress }) {
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
                <View style={styles.emptySlot}>
                  <Text style={styles.emptyText}>Boş</Text>
                </View>
              ) : (
                hourAppointments.map((apt) => {
                  const startDate = new Date(apt.start_time);
                  const minutes = startDate.getMinutes();

                  return (
                    <TouchableOpacity
                      key={apt._id}
                      style={styles.appointmentBlock}
                      onPress={() => onAppointmentPress(apt)}
                    >
                      <View style={styles.appointmentHeader}>
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
