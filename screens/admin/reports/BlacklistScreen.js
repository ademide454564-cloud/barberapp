import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import { API_URL } from '../../../config';

export default function BlacklistScreen({ navigation }) {
  const [blacklist, setBlacklist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    loadBlacklist();
  }, []);

  const loadBlacklist = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/blacklist`);
      const data = await response.json();
      setBlacklist(data);
    } catch (error) {
      Alert.alert('Hata', 'Kara liste yüklenirken bir hata oluştu');
      setBlacklist([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!phone.trim()) {
      Alert.alert('Uyarı', 'Telefon numarası girin');
      return;
    }

    try {
      await fetch(`${API_URL}/blacklist/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phone, reason }),
      });

      Alert.alert('Başarılı', 'Kara listeye eklendi');
      setShowAddModal(false);
      setPhone('');
      setReason('');
      loadBlacklist();
    } catch (error) {
      Alert.alert('Hata', 'Ekleme başarısız');
    }
  };

  const handleRemove = (item) => {
    Alert.alert('Kara Listeden Çıkar', 'Çıkarmak istediğinize emin misiniz?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Çıkar',
        onPress: async () => {
          try {
            await fetch(`${API_URL}/blacklist/${item._id}`, { method: 'DELETE' });
            Alert.alert('Başarılı', 'Kara listeden çıkarıldı');
            loadBlacklist();
          } catch (error) {
            Alert.alert('Hata', 'Çıkarma başarısız');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kara Liste</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)}>
          <MaterialCommunityIcons name="plus" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      ) : (
        <ScrollView style={styles.scrollView}>
          {blacklist.map((item) => (
            <View key={item._id} style={styles.card}>
              <View style={styles.cardContent}>
                <MaterialCommunityIcons name="account-cancel" size={32} color={Colors.danger} />
                <View style={styles.cardInfo}>
                  <Text style={styles.cardPhone}>{item.phone_number}</Text>
                  {item.reason && <Text style={styles.cardReason}>{item.reason}</Text>}
                </View>
              </View>
              <TouchableOpacity onPress={() => handleRemove(item)}>
                <MaterialCommunityIcons name="close-circle" size={24} color={Colors.danger} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      <Modal visible={showAddModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Kara Listeye Ekle</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <TextInput
                style={styles.input}
                placeholder="Telefon Numarası"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Sebep (Opsiyonel)"
                value={reason}
                onChangeText={setReason}
                multiline
              />
              <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
                <Text style={styles.saveBtnText}>Ekle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  loader: { marginTop: 60 },
  scrollView: { flex: 1, padding: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardBackground,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  cardContent: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  cardInfo: { flex: 1 },
  cardPhone: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  cardReason: { fontSize: 14, color: Colors.textSecondary },
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  modalBody: { padding: 20 },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: Colors.textWhite },
});
