import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';

export default function CalendarSettingsScreen({ navigation }) {
  const [workingHours, setWorkingHours] = useState({
    startTime: '10:30',
    endTime: '21:00',
  });
  const [workingDays, setWorkingDays] = useState({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: true,
    sunday: false,
  });
  const [slotDuration, setSlotDuration] = useState(30);
  const [autoApprove, setAutoApprove] = useState(false);

  const handleSave = () => {
    Alert.alert('Başarılı', 'Takvim ayarları kaydedildi');
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Takvim Ayarları</Text>
      <View style={styles.backButton} />
    </View>
  );

  const renderSection = (title, children) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const renderWorkingDayItem = (day, label) => (
    <View style={styles.settingItem} key={day}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      <Switch
        value={workingDays[day]}
        onValueChange={(value) => setWorkingDays({ ...workingDays, [day]: value })}
        trackColor={{ false: Colors.borderDark, true: Colors.primaryLight }}
        thumbColor={workingDays[day] ? Colors.primary : Colors.textLight}
      />
    </View>
  );

  const renderSlotDurationItem = (duration) => (
    <TouchableOpacity
      key={duration}
      style={[styles.slotItem, slotDuration === duration && styles.slotItemActive]}
      onPress={() => setSlotDuration(duration)}
    >
      <Text style={[styles.slotText, slotDuration === duration && styles.slotTextActive]}>
        {duration} dk
      </Text>
      {slotDuration === duration && (
        <MaterialCommunityIcons name="check-circle" size={20} color={Colors.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {renderSection(
            'Çalışma Saatleri',
            <>
              <View style={styles.timeContainer}>
                <View style={styles.timeItem}>
                  <Text style={styles.timeLabel}>Başlangıç</Text>
                  <Text style={styles.timeValue}>{workingHours.startTime}</Text>
                </View>
                <MaterialCommunityIcons name="arrow-right" size={24} color={Colors.textSecondary} />
                <View style={styles.timeItem}>
                  <Text style={styles.timeLabel}>Bitiş</Text>
                  <Text style={styles.timeValue}>{workingHours.endTime}</Text>
                </View>
              </View>
              <Text style={styles.helperText}>
                Randevuların alınabileceği saat aralığı
              </Text>
            </>
          )}

          {renderSection(
            'Çalışma Günleri',
            <>
              {renderWorkingDayItem('monday', 'Pazartesi')}
              {renderWorkingDayItem('tuesday', 'Salı')}
              {renderWorkingDayItem('wednesday', 'Çarşamba')}
              {renderWorkingDayItem('thursday', 'Perşembe')}
              {renderWorkingDayItem('friday', 'Cuma')}
              {renderWorkingDayItem('saturday', 'Cumartesi')}
              {renderWorkingDayItem('sunday', 'Pazar')}
            </>
          )}

          {renderSection(
            'Randevu Slotu Süresi',
            <>
              <View style={styles.slotContainer}>
                {renderSlotDurationItem(15)}
                {renderSlotDurationItem(30)}
                {renderSlotDurationItem(45)}
                {renderSlotDurationItem(60)}
              </View>
              <Text style={styles.helperText}>
                Takvimde randevuların gösterileceği zaman aralığı
              </Text>
            </>
          )}

          {renderSection(
            'Otomatik Onay',
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Randevuları otomatik onayla</Text>
                <Text style={styles.settingDescription}>
                  Yeni randevular onay beklemeden otomatik kabul edilir
                </Text>
              </View>
              <Switch
                value={autoApprove}
                onValueChange={setAutoApprove}
                trackColor={{ false: Colors.borderDark, true: Colors.primaryLight }}
                thumbColor={autoApprove ? Colors.primary : Colors.textLight}
              />
            </View>
          )}

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <MaterialCommunityIcons name="check" size={20} color={Colors.textWhite} />
            <Text style={styles.saveButtonText}>Ayarları Kaydet</Text>
          </TouchableOpacity>
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
  section: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  timeItem: {
    flex: 1,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  timeValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  helperText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  slotContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  slotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  slotItemActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  slotText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  slotTextActive: {
    color: Colors.primary,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textWhite,
  },
});
