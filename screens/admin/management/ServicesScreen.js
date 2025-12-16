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

export default function ServicesScreen({ navigation }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({ name: '', price: '', duration: '' });

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/services`);
      const data = await response.json();
      setServices(Array.isArray(data) ? data : []);
    } catch (error) {
      Alert.alert('Hata', 'Hizmetler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price || !formData.duration) {
      Alert.alert('Uyarı', 'Tüm alanları doldurun');
      return;
    }

    try {
      const url = editingService
        ? `${API_URL}/services/update/${editingService._id}`
        : `${API_URL}/services/add`;

      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          price: parseInt(formData.price),
          duration: parseInt(formData.duration),
        }),
      });

      Alert.alert('Başarılı', editingService ? 'Hizmet güncellendi' : 'Hizmet eklendi');
      setShowAddModal(false);
      setEditingService(null);
      setFormData({ name: '', price: '', duration: '' });
      loadServices();
    } catch (error) {
      Alert.alert('Hata', 'Hizmet kaydedilemedi');
    }
  };

  const handleDelete = (service) => {
    Alert.alert(
      'Hizmeti Sil',
      `"${service.name}" hizmetini silmek istediğinize emin misiniz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await fetch(`${API_URL}/services/${service._id}`, { method: 'DELETE' });
              Alert.alert('Başarılı', 'Hizmet silindi');
              loadServices();
            } catch (error) {
              Alert.alert('Hata', 'Hizmet silinemedi');
            }
          },
        },
      ]
    );
  };

  const openEditModal = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      price: service.price.toString(),
      duration: service.duration.toString(),
    });
    setShowAddModal(true);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hizmetler</Text>
        <TouchableOpacity onPress={() => {
          setEditingService(null);
          setFormData({ name: '', price: '', duration: '' });
          setShowAddModal(true);
        }}>
          <MaterialCommunityIcons name="plus" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {services.map((service) => (
            <View key={service._id} style={styles.serviceCard}>
              <View style={styles.serviceIcon}>
                <MaterialCommunityIcons name="scissors-cutting" size={28} color={Colors.appointmentCard} />
              </View>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <View style={styles.serviceDetails}>
                  <View style={styles.detailItem}>
                    <MaterialCommunityIcons name="currency-try" size={16} color={Colors.textSecondary} />
                    <Text style={styles.detailText}>{service.price}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <MaterialCommunityIcons name="clock-outline" size={16} color={Colors.textSecondary} />
                    <Text style={styles.detailText}>{service.duration} dk</Text>
                  </View>
                </View>
              </View>
              <View style={styles.serviceActions}>
                <TouchableOpacity onPress={() => openEditModal(service)} style={styles.editBtn}>
                  <MaterialCommunityIcons name="pencil" size={20} color={Colors.appointmentCard} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(service)} style={styles.deleteBtn}>
                  <MaterialCommunityIcons name="delete" size={20} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Add/Edit Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingService ? 'Hizmeti Düzenle' : 'Yeni Hizmet'}
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Hizmet Adı</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Örn: Saç Kesimi"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Fiyat (₺)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Örn: 150"
                  keyboardType="numeric"
                  value={formData.price}
                  onChangeText={(text) => setFormData({ ...formData, price: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Süre (Dakika)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Örn: 30"
                  keyboardType="numeric"
                  value={formData.duration}
                  onChangeText={(text) => setFormData({ ...formData, duration: text })}
                />
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>
                  {editingService ? 'Güncelle' : 'Kaydet'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  loader: {
    marginTop: 60,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: Colors.appointmentCardLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  serviceDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  serviceActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.appointmentCardLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
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
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textWhite,
  },
});
