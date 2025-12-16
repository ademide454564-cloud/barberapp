import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { Colors } from '../../../constants/Colors';

export default function CalendarMonthView({ appointments, selectedDate, onDayPress }) {
  const getMonthDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days = [];
    const startDayOfWeek = firstDay.getDay();
    const adjustedStart = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    // Önceki aydan kalan günler
    for (let i = adjustedStart - 1; i >= 0; i--) {
      const day = new Date(year, month, -i);
      days.push({ date: day, isCurrentMonth: false });
    }

    // Bu ayın günleri
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const day = new Date(year, month, i);
      days.push({ date: day, isCurrentMonth: true });
    }

    // Sonraki aydan kalan günler
    const remainingDays = 42 - days.length; // 6 hafta x 7 gün
    for (let i = 1; i <= remainingDays; i++) {
      const day = new Date(year, month + 1, i);
      days.push({ date: day, isCurrentMonth: false });
    }

    return days;
  };

  const monthDays = getMonthDays();
  const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  const getAppointmentsCountForDay = (date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.start_time);
      return (
        aptDate.getDate() === date.getDate() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getFullYear() === date.getFullYear()
      );
    }).length;
  };

  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <View style={styles.container}>
      {/* Gün isimleri */}
      <View style={styles.weekDaysHeader}>
        {dayNames.map((day, index) => (
          <View key={index} style={styles.weekDayCell}>
            <Text style={styles.weekDayText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Takvim grid */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.calendarGrid}>
          {monthDays.map((item, index) => {
            const count = getAppointmentsCountForDay(item.date);
            const today = isToday(item.date);

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCell,
                  !item.isCurrentMonth && styles.dayCellInactive,
                  today && styles.dayCellToday,
                ]}
                onPress={() => item.isCurrentMonth && onDayPress(item.date)}
              >
                <Text
                  style={[
                    styles.dayText,
                    !item.isCurrentMonth && styles.dayTextInactive,
                    today && styles.dayTextToday,
                  ]}
                >
                  {item.date.getDate()}
                </Text>
                {count > 0 && item.isCurrentMonth && (
                  <View style={styles.appointmentIndicator}>
                    <Text style={styles.appointmentCount}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
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
  weekDaysHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBackground,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%', // 100% / 7
    aspectRatio: 1,
    borderWidth: 0.5,
    borderColor: Colors.border,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cardBackground,
  },
  dayCellInactive: {
    backgroundColor: Colors.background,
  },
  dayCellToday: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  dayTextInactive: {
    color: Colors.textLight,
  },
  dayTextToday: {
    color: Colors.primary,
    fontWeight: '700',
  },
  appointmentIndicator: {
    position: 'absolute',
    bottom: 4,
    backgroundColor: Colors.appointmentCard,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  appointmentCount: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textWhite,
  },
});
