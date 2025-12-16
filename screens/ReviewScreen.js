import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { API_URL } from '../config';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ReviewScreen({ route, navigation }) {
  const { appointmentId } = route.params;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitReview = async () => {
    if (rating === 0) {
      Alert.alert('Hata', 'Lütfen bir puan verin');
      return;
    }

    try {
      setLoading(true);
      const userDataStr = await AsyncStorage.getItem('userData');
      if (!userDataStr) {
        Alert.alert('Hata', 'Lütfen önce giriş yapın');
        setLoading(false);
        return;
      }

      const userData = JSON.parse(userDataStr);

      // Müşteri ID'sini al
      const response = await axios.get(`${API_URL}/customers`);
      const customer = response.data.find(c => c.phone_number === userData.phone_number);

      if (!customer) {
        Alert.alert('Hata', 'Kullanıcı bulunamadı');
        setLoading(false);
        return;
      }

      // Yorumu gönder
      await axios.post(`${API_URL}/reviews/create`, {
        customer_id: customer._id,
        appointment_id: appointmentId,
        rating,
        comment
      });

      Alert.alert(
        'Teşekkürler!',
        'Yorumunuz başarıyla kaydedildi',
        [
          {
            text: 'Tamam',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Review error:', error);
      Alert.alert('Hata', error.response?.data?.message || 'Yorum gönderilemedi');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={40}
              color={star <= rating ? '#FFD700' : '#ccc'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Deneyiminizi Değerlendirin</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          <Text style={styles.questionText}>
            Hizmetimizi nasıl buldunuz?
          </Text>

          {renderStars()}

          {rating > 0 && (
            <View style={styles.ratingTextContainer}>
              <Text style={styles.ratingText}>
                {rating === 1 && 'Çok Kötü'}
                {rating === 2 && 'Kötü'}
                {rating === 3 && 'Orta'}
                {rating === 4 && 'İyi'}
                {rating === 5 && 'Mükemmel'}
              </Text>
            </View>
          )}

          <Text style={styles.commentLabel}>
            Yorumunuz (İsteğe bağlı)
          </Text>

          <TextInput
            style={styles.commentInput}
            placeholder="Deneyiminizi bizimle paylaşın..."
            placeholderTextColor="#ADB5BD"
            multiline
            numberOfLines={5}
            value={comment}
            onChangeText={setComment}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmitReview}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Gönder</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  content: {
    padding: 24,
  },
  questionText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 30,
    letterSpacing: -0.5,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  starButton: {
    padding: 8,
  },
  ratingTextContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  ratingText: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primary,
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  commentInput: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    color: '#1A1A1A',
    fontSize: 16,
    minHeight: 140,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
