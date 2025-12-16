import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { Colors } from '../../../constants/Colors';

export default function CalendarWeekView({ appointments, selectedDate, onAppointmentPress }) {
  // Seçili tarihin haftasını al
  const getWeekDays = () => {
    const days = [];
    const current = new Date(selectedDate);
    const dayOfWeek = current.getDay();
    const monday = new Date(current);
    monday.setDate(current.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const weekDays = getWeekDays();
  const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  const getAppointmentsForDay = (date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.start_time);
      return (
        aptDate.getDate() === date.getDate() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getFullYear() === date.getFullYear()
      );
    });
  };

  return (
    <View style={styles.container}>
      {/* Header günleri */}
      <View style={styles.weekHeader}>
        {weekDays.map((day, index) => {
          const isToday =
            day.getDate() === new Date().getDate() &&
            day.getMonth() === new Date().getMonth();

          return (
            <View key={index} style={styles.dayHeader}>
              <Text style={styles.dayName}>{dayNames[index]}</Text>
              <View style={[styles.dayNumber, isToday && styles.dayNumberToday]}>
                <Text style={[styles.dayNumberText, isToday && styles.dayNumberTextToday]}>
                  {day.getDate()}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Randevular */}
      <ScrollView style={styles.weekBody} showsVerticalScrollIndicator={false}>
        <View style={styles.daysRow}>
          {weekDays.map((day, index) => {
            const dayAppointments = getAppointmentsForDay(day);

            return (
              <View key={index} style={styles.dayColumn}>
                {dayAppointments.map((apt) => {
                  const startDate = new Date(apt.start_time);
                  const time = startDate.toLocaleTimeString('tr-TR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <TouchableOpacity
                      key={apt._id}
                      style={styles.weekAppointment}
                      onPress={() => onAppointmentPress(apt)}
                    >
                      <Text style={styles.weekAptTime}>{time}</Text>
                      <Text style={styles.weekAptCustomer} numberOfLines={1}>
                        {apt.customer_id?.name}
                      </Text>
                      <View
                        style={[
                          styles.weekStatusDot,
                          apt.status === 'Onaylandı' && styles.statusConfirmed,
                          apt.status === 'Beklemede' && styles.statusPending,
                        ]}
                      />
                    </TouchableOpacity>
                  );
                })}
                {dayAppointments.length === 0 && (
                  <Text style={styles.emptyDay}>Boş</Text>
                )}
              </View>
            );
          })}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  weekHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBackground,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
  },
  dayName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  dayNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberToday: {
    backgroundColor: Colors.primary,
  },
  dayNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  dayNumberTextToday: {
    color: Colors.textWhite,
  },
  weekBody: {
    flex: 1,
  },
  daysRow: {
    flexDirection: 'row',
  },
  dayColumn: {
    flex: 1,
    padding: 4,
    gap: 6,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  weekAppointment: {
    backgroundColor: Colors.appointmentCardLight,
    borderLeftWidth: 3,
    borderLeftColor: Colors.appointmentCard,
    borderRadius: 6,
    padding: 8,
    marginBottom: 4,
  },
  weekAptTime: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.appointmentCard,
    marginBottom: 3,
  },
  weekAptCustomer: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  weekStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    alignSelf: 'flex-start',
  },
  statusConfirmed: {
    backgroundColor: Colors.success,
  },
  statusPending: {
    backgroundColor: Colors.warning,
  },
  emptyDay: {
    fontSize: 11,
    color: Colors.textLight,
    textAlign: 'center',
    paddingVertical: 12,
  },
});
