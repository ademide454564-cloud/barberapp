import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import { API_URL } from '../../../config';

export default function GalleryManagementScreen({ navigation }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoType, setNewPhotoType] = useState('gallery'); // 'gallery' or 'featured'
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/photos/admin/all`);
      const data = await response.json();
      setPhotos(data);
    } catch (error) {
      console.error('Error loading photos:', error);
      Alert.alert('Hata', 'Fotoğraflar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAddPhoto = async () => {
    if (!newPhotoUrl.trim()) {
      Alert.alert('Hata', 'Lütfen fotoğraf URL\'si girin');
      return;
    }

    try {
      setAdding(true);
      const response = await fetch(`${API_URL}/photos/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: newPhotoUrl.trim(),
          type: newPhotoType,
        }),
      });

      if (response.ok) {
        Alert.alert('Başarılı', 'Fotoğraf başarıyla eklendi');
        setShowAddModal(false);
        setNewPhotoUrl('');
        setNewPhotoType('gallery');
        loadPhotos();
      } else {
        const error = await response.text();
        Alert.alert('Hata', 'Fotoğraf eklenirken bir hata oluştu: ' + error);
      }
    } catch (error) {
      console.error('Error adding photo:', error);
      Alert.alert('Hata', 'Fotoğraf eklenirken bir hata oluştu');
    } finally {
      setAdding(false);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    Alert.alert(
      'Fotoğrafı Sil',
      'Bu fotoğrafı kalıcı olarak silmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/photos/${photoId}`, {
                method: 'DELETE',
              });

              if (response.ok) {
                Alert.alert('Başarılı', 'Fotoğraf silindi');
                loadPhotos();
              } else {
                Alert.alert('Hata', 'Fotoğraf silinirken bir hata oluştu');
              }
            } catch (error) {
              console.error('Error deleting photo:', error);
              Alert.alert('Hata', 'Fotoğraf silinirken bir hata oluştu');
            }
          },
        },
      ]
    );
  };

  const handleToggleVisibility = async (photoId) => {
    try {
      const response = await fetch(`${API_URL}/photos/toggle-visibility/${photoId}`, {
        method: 'POST',
      });

      if (response.ok) {
        loadPhotos();
      } else {
        Alert.alert('Hata', 'Görünürlük değiştirilirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Error toggling visibility:', error);
      Alert.alert('Hata', 'Görünürlük değiştirilirken bir hata oluştu');
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Galeri Yönetimi</Text>
      <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addButton}>
        <MaterialCommunityIcons name="plus" size={24} color={Colors.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderPhotoCard = (photo) => (
    <View key={photo._id} style={styles.photoCard}>
      <Image
        source={{ uri: photo.url }}
        style={styles.photoImage}
        resizeMode="cover"
      />
      <View style={styles.photoOverlay}>
        <View style={styles.photoBadges}>
          {photo.type === 'featured' && (
            <View style={styles.featuredBadge}>
              <MaterialCommunityIcons name="star" size={16} color={Colors.textWhite} />
              <Text style={styles.badgeText}>Öne Çıkan</Text>
            </View>
          )}
          <View style={[styles.visibilityBadge, !photo.is_active && styles.hiddenBadge]}>
            <Text style={styles.badgeText}>
              {photo.is_active ? 'Görünür' : 'Gizli'}
            </Text>
          </View>
        </View>

        <View style={styles.photoActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleToggleVisibility(photo._id)}
          >
            <MaterialCommunityIcons
              name={photo.is_active ? 'eye-off' : 'eye'}
              size={20}
              color={Colors.textWhite}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeletePhoto(photo._id)}
          >
            <MaterialCommunityIcons name="delete" size={20} color={Colors.textWhite} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <Text style={styles.description}>
              Galerinize fotoğraf ekleyin, silin veya görünürlüğünü değiştirin
            </Text>

            {photos.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="image-off" size={64} color={Colors.textLight} />
                <Text style={styles.emptyText}>Henüz fotoğraf eklenmemiş</Text>
              </View>
            ) : (
              <View style={styles.photoGrid}>
                {photos.map(renderPhotoCard)}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      <Modal visible={showAddModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yeni Fotoğraf Ekle</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Fotoğraf URL *</Text>
                <View style={styles.inputContainer}>
                  <MaterialCommunityIcons name="link" size={20} color={Colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    placeholder="https://example.com/photo.jpg"
                    placeholderTextColor={Colors.textLight}
                    value={newPhotoUrl}
                    onChangeText={setNewPhotoUrl}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Fotoğraf Tipi</Text>
                <View style={styles.typeSelector}>
                  <TouchableOpacity
                    style={[styles.typeButton, newPhotoType === 'gallery' && styles.typeButtonActive]}
                    onPress={() => setNewPhotoType('gallery')}
                  >
                    <Text style={[styles.typeButtonText, newPhotoType === 'gallery' && styles.typeButtonTextActive]}>
                      Galeri
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeButton, newPhotoType === 'featured' && styles.typeButtonActive]}
                    onPress={() => setNewPhotoType('featured')}
                  >
                    <MaterialCommunityIcons
                      name="star"
                      size={16}
                      color={newPhotoType === 'featured' ? Colors.textWhite : Colors.textSecondary}
                    />
                    <Text style={[styles.typeButtonText, newPhotoType === 'featured' && styles.typeButtonTextActive]}>
                      Öne Çıkan
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, adding && styles.submitButtonDisabled]}
                onPress={handleAddPhoto}
                disabled={adding}
              >
                {adding ? (
                  <ActivityIndicator color={Colors.textWhite} />
                ) : (
                  <>
                    <MaterialCommunityIcons name="check" size={20} color={Colors.textWhite} />
                    <Text style={styles.submitButtonText}>Fotoğraf Ekle</Text>
                  </>
                )}
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
  addButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  loader: {
    marginTop: 60,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.cardBackground,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 8,
    justifyContent: 'space-between',
  },
  photoBadges: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  visibilityBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  hiddenBadge: {
    backgroundColor: Colors.textSecondary,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textWhite,
  },
  photoActions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: Colors.danger,
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
    backgroundColor: Colors.background,
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
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  typeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  typeButtonTextActive: {
    color: Colors.textWhite,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textWhite,
  },
});
