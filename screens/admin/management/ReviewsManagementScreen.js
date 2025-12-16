import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import { API_URL } from '../../../config';

export default function ReviewsManagementScreen({ navigation }) {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ averageRating: 0, totalReviews: 0 });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadReviews();
    loadStats();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/reviews`);
      const data = await response.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading reviews:', error);
      Alert.alert('Hata', 'Yorumlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_URL}/reviews/average-rating`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleToggleVisibility = async (reviewId) => {
    try {
      const response = await fetch(`${API_URL}/reviews/toggle-visibility/${reviewId}`, {
        method: 'POST',
      });

      if (response.ok) {
        Alert.alert('Başarılı', 'Görünürlük değiştirildi');
        loadReviews();
        loadStats();
      } else {
        Alert.alert('Hata', 'Görünürlük değiştirilirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Error toggling visibility:', error);
      Alert.alert('Hata', 'Görünürlük değiştirilirken bir hata oluştu');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadReviews(), loadStats()]);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Yorumlar</Text>
      <View style={styles.backButton} />
    </View>
  );

  const renderStatsCard = () => (
    <View style={styles.statsCard}>
      <View style={styles.statItem}>
        <View style={styles.statIconContainer}>
          <MaterialCommunityIcons name="star" size={32} color={Colors.warning} />
        </View>
        <View style={styles.statInfo}>
          <Text style={styles.statValue}>{stats.averageRating}</Text>
          <Text style={styles.statLabel}>Ortalama Puan</Text>
        </View>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <View style={styles.statIconContainer}>
          <MaterialCommunityIcons name="comment-text" size={32} color={Colors.primary} />
        </View>
        <View style={styles.statInfo}>
          <Text style={styles.statValue}>{stats.totalReviews}</Text>
          <Text style={styles.statLabel}>Toplam Yorum</Text>
        </View>
      </View>
    </View>
  );

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <MaterialCommunityIcons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={16}
          color={Colors.warning}
        />
      );
    }
    return <View style={styles.stars}>{stars}</View>;
  };

  const renderReviewCard = (review) => {
    const reviewDate = new Date(review.createdAt);
    const formattedDate = reviewDate.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    return (
      <View key={review._id} style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
          <View style={styles.customerInfo}>
            <View style={styles.customerAvatar}>
              <MaterialCommunityIcons name="account" size={24} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.customerName}>{review.customer_id?.name || 'Müşteri'}</Text>
              <Text style={styles.reviewDate}>{formattedDate}</Text>
            </View>
          </View>
          {review.is_visible ? (
            <View style={styles.visibleBadge}>
              <MaterialCommunityIcons name="eye" size={14} color={Colors.textWhite} />
              <Text style={styles.badgeText}>Görünür</Text>
            </View>
          ) : (
            <View style={styles.hiddenBadge}>
              <MaterialCommunityIcons name="eye-off" size={14} color={Colors.textWhite} />
              <Text style={styles.badgeText}>Gizli</Text>
            </View>
          )}
        </View>

        <View style={styles.ratingContainer}>
          {renderStars(review.rating)}
          <Text style={styles.ratingText}>{review.rating}/5</Text>
        </View>

        {review.comment && (
          <Text style={styles.reviewComment}>{review.comment}</Text>
        )}

        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => handleToggleVisibility(review._id)}
        >
          <MaterialCommunityIcons
            name={review.is_visible ? 'eye-off' : 'eye'}
            size={18}
            color={Colors.primary}
          />
          <Text style={styles.toggleButtonText}>
            {review.is_visible ? 'Gizle' : 'Göster'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderHeader()}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.content}>
          {renderStatsCard()}

          <Text style={styles.sectionTitle}>Tüm Yorumlar</Text>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
          ) : reviews.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="comment-off" size={64} color={Colors.textLight} />
              <Text style={styles.emptyText}>Henüz yorum yapılmamış</Text>
            </View>
          ) : (
            <View style={styles.reviewsList}>
              {reviews.map(renderReviewCard)}
            </View>
          )}
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
  loader: {
    marginTop: 40,
  },
  statsCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
    letterSpacing: -0.3,
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
  reviewsList: {
    gap: 12,
  },
  reviewCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 14,
    padding: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  visibleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  hiddenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.textSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textWhite,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  reviewComment: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: 6,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
});
