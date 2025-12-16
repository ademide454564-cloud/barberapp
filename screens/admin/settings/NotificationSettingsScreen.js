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

export default function NotificationSettingsScreen({ navigation }) {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [notifyNewAppointment, setNotifyNewAppointment] = useState(true);
  const [notifyAppointmentCancelled, setNotifyAppointmentCancelled] = useState(true);
  const [notifyDayBefore, setNotifyDayBefore] = useState(true);
  const [notifyHourBefore, setNotifyHourBefore] = useState(true);

  const handleSave = () => {
    Alert.alert('Başarılı', 'Bildirim ayarları kaydedildi');
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Bildirim Ayarları</Text>
      <View style={styles.backButton} />
    </View>
  );

  const renderSection = (title, children) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const renderSettingItem = (label, description, value, onValueChange) => (
    <View style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description && (
          <Text style={styles.settingDescription}>{description}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.borderDark, true: Colors.primaryLight }}
        thumbColor={value ? Colors.primary : Colors.textLight}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {renderSection(
            'Bildirim Kanalları',
            <>
              {renderSettingItem(
                'Push Bildirimleri',
                'Uygulama içi anlık bildirimler',
                pushEnabled,
                setPushEnabled
              )}
              {renderSettingItem(
                'SMS Bildirimleri',
                'Telefona SMS ile bildirimler',
                smsEnabled,
                setSmsEnabled
              )}
              {renderSettingItem(
                'E-posta Bildirimleri',
                'E-posta ile bildirimler',
                emailEnabled,
                setEmailEnabled
              )}
            </>
          )}

          {renderSection(
            'Randevu Bildirimleri',
            <>
              {renderSettingItem(
                'Yeni Randevu',
                'Yeni randevu oluşturulduğunda bildir',
                notifyNewAppointment,
                setNotifyNewAppointment
              )}
              {renderSettingItem(
                'Randevu İptali',
                'Randevu iptal edildiğinde bildir',
                notifyAppointmentCancelled,
                setNotifyAppointmentCancelled
              )}
            </>
          )}

          {renderSection(
            'Hatırlatma Bildirimleri',
            <>
              {renderSettingItem(
                '1 Gün Önce Hatırlatma',
                'Randevudan 1 gün önce müşteriye hatırlatma gönder',
                notifyDayBefore,
                setNotifyDayBefore
              )}
              {renderSettingItem(
                '1 Saat Önce Hatırlatma',
                'Randevudan 1 saat önce müşteriye hatırlatma gönder',
                notifyHourBefore,
                setNotifyHourBefore
              )}
            </>
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
