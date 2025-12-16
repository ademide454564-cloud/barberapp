import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import { API_URL } from '../../../config';

export default function AddCustomerScreen({ navigation }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const validateInputs = () => {
    if (!name.trim()) {
      Alert.alert('Hata', 'Lütfen müşteri adını girin');
      return false;
    }
    if (!phone.trim()) {
      Alert.alert('Hata', 'Lütfen telefon numarası girin');
      return false;
    }
    if (phone.trim().length < 10) {
      Alert.alert('Hata', 'Lütfen geçerli bir telefon numarası girin');
      return false;
    }
    return true;
  };

  const handleAddCustomer = async () => {
    if (!validateInputs()) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/customers/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          phone_number: phone.trim(),
          email: email.trim() || undefined,
        }),
      });

      if (response.ok) {
        Alert.alert('Başarılı', 'Müşteri başarıyla eklendi', [
          {
            text: 'Tamam',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        const error = await response.text();
        Alert.alert('Hata', 'Müşteri eklenirken bir hata oluştu: ' + error);
      }
    } catch (error) {
      console.error('Error adding customer:', error);
      Alert.alert('Hata', 'Müşteri eklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Yeni Müşteri Ekle</Text>
      <View style={styles.backButton} />
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="account-plus" size={64} color={Colors.primary} />
          </View>

          <Text style={styles.description}>
            Yeni müşteri bilgilerini girin
          </Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ad Soyad *</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="account" size={20} color={Colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Müşteri adı ve soyadı"
                  placeholderTextColor={Colors.textLight}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Telefon Numarası *</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="phone" size={20} color={Colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="05XX XXX XX XX"
                  placeholderTextColor={Colors.textLight}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={11}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-posta (Opsiyonel)</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="email" size={20} color={Colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="ornek@email.com"
                  placeholderTextColor={Colors.textLight}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.addButton, loading && styles.addButtonDisabled]}
              onPress={handleAddCustomer}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.textWhite} />
              ) : (
                <>
                  <MaterialCommunityIcons name="check" size={20} color={Colors.textWhite} />
                  <Text style={styles.addButtonText}>Müşteri Ekle</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
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
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textWhite,
  },
});
