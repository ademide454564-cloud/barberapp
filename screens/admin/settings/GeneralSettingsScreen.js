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

export default function GeneralSettingsScreen({ navigation }) {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowOnlineBooking, setAllowOnlineBooking] = useState(true);
  const [requirePhoneVerification, setRequirePhoneVerification] = useState(true);
  const [showPricesPublicly, setShowPricesPublicly] = useState(true);
  const [allowReviews, setAllowReviews] = useState(true);

  const handleSave = () => {
    Alert.alert('Başarılı', 'Genel ayarlar kaydedildi');
  };

  const handleClearCache = () => {
    Alert.alert(
      'Önbelleği Temizle',
      'Önbellek temizlenecek. Emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Temizle',
          onPress: () => Alert.alert('Başarılı', 'Önbellek temizlendi'),
        },
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Genel Ayarlar</Text>
      <View style={styles.backButton} />
    </View>
  );

  const renderSection = (title, children) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const renderSettingItem = (label, description, value, onValueChange, danger = false) => (
    <View style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingLabel, danger && styles.dangerText]}>{label}</Text>
        {description && (
          <Text style={styles.settingDescription}>{description}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.borderDark, true: danger ? Colors.dangerLight : Colors.primaryLight }}
        thumbColor={value ? danger ? Colors.danger : Colors.primary : Colors.textLight}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {renderSection(
            'Sistem Ayarları',
            <>
              {renderSettingItem(
                'Bakım Modu',
                'Bakım modunda müşteriler randevu alamaz',
                maintenanceMode,
                setMaintenanceMode,
                true
              )}
              {renderSettingItem(
                'Online Randevu',
                'Müşterilerin online randevu almasına izin ver',
                allowOnlineBooking,
                setAllowOnlineBooking
              )}
              {renderSettingItem(
                'Telefon Doğrulama',
                'Randevu alırken telefon doğrulaması iste',
                requirePhoneVerification,
                setRequirePhoneVerification
              )}
            </>
          )}

          {renderSection(
            'Görünürlük Ayarları',
            <>
              {renderSettingItem(
                'Fiyatları Göster',
                'Hizmet fiyatlarını herkese açık göster',
                showPricesPublicly,
                setShowPricesPublicly
              )}
              {renderSettingItem(
                'Yorum Sistemi',
                'Müşterilerin yorum yapmasına izin ver',
                allowReviews,
                setAllowReviews
              )}
            </>
          )}

          {renderSection(
            'İşlem Ayarları',
            <>
              <TouchableOpacity style={styles.actionButton} onPress={handleClearCache}>
                <View style={styles.actionIcon}>
                  <MaterialCommunityIcons name="delete-sweep" size={24} color={Colors.warning} />
                </View>
                <View style={styles.actionInfo}>
                  <Text style={styles.actionLabel}>Önbelleği Temizle</Text>
                  <Text style={styles.actionDescription}>
                    Geçici dosyaları ve önbelleği temizle
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.textLight} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => Alert.alert('Hakkında', 'Kaan Herli Kuaför Salonu v1.0.0')}
              >
                <View style={styles.actionIcon}>
                  <MaterialCommunityIcons name="information" size={24} color={Colors.primary} />
                </View>
                <View style={styles.actionInfo}>
                  <Text style={styles.actionLabel}>Uygulama Bilgisi</Text>
                  <Text style={styles.actionDescription}>
                    Versiyon ve sistem bilgileri
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.textLight} />
              </TouchableOpacity>
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
  dangerText: {
    color: Colors.danger,
  },
  settingDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionInfo: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  actionDescription: {
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
