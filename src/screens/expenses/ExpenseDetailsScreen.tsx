import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/color';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GroupStackParamList } from '../../types/navigation.types';
import { firebaseService } from '../../services/firebaseService';
import { Expense } from '../../types/expense.types';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import { useAuth } from '../../hooks/useAuth';

type ExpenseDetailsScreenNavigationProp = NativeStackNavigationProp<
  GroupStackParamList,
  'ExpenseDetails'
>;

type ExpenseDetailsScreenRouteProp = RouteProp<
  GroupStackParamList,
  'ExpenseDetails'
>;

export default function ExpenseDetailsScreen() {
  const navigation = useNavigation<ExpenseDetailsScreenNavigationProp>();
  const route = useRoute<ExpenseDetailsScreenRouteProp>();
  const { groupId, expenseId } = route.params;
  const { user } = useAuth();

  const [expense, setExpense] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenseDetails = async () => {
    try {
      const expenseData = await firebaseService.getExpenseById(groupId, expenseId);
      setExpense(expenseData);
      setError(null);
    } catch (error) {
      console.error('Error fetching expense details:', error);
      setError('Harcama detayları yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchExpenseDetails();
  }, [groupId, expenseId]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchExpenseDetails();
  };

  const handleEdit = () => {
    if (expense) {
      navigation.navigate('EditExpense', { groupId, expense });
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Harcamayı Sil',
      'Bu harcamayı silmek istediğinize emin misiniz?',
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await firebaseService.deleteExpense(groupId, expenseId);
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting expense:', error);
              Alert.alert('Hata', 'Harcama silinirken bir hata oluştu');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchExpenseDetails}>
          <Text style={styles.retryButtonText}>Tekrar Dene</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!expense) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Harcama bulunamadı</Text>
      </View>
    );
  }

  const isOwner = user?.id === expense.paidBy;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.expenseTitle}>{expense.title}</Text>
            <Text style={styles.expenseAmount}>
              {formatCurrency(expense.amount, expense.currency)}
            </Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <ActivityIndicator size="small" color={COLORS.PRIMARY} />
              ) : (
                <Ionicons name="refresh" size={24} color={COLORS.PRIMARY} />
              )}
            </TouchableOpacity>
            {isOwner && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={handleEdit}
              >
                <Ionicons name="create-outline" size={24} color={COLORS.PRIMARY} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Details */}
        <View style={styles.section}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tarih</Text>
            <Text style={styles.detailValue}>{formatDate(expense.date)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Kategori</Text>
            <Text style={styles.detailValue}>{expense.category}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ödeyen</Text>
            <Text style={styles.detailValue}>
              {expense.paidByUser?.fullName || 'Bilinmeyen Kullanıcı'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Bölüşüm</Text>
            <Text style={styles.detailValue}>
              {expense.splitMethod === 'equal' ? 'Eşit' :
               expense.splitMethod === 'percentage' ? 'Yüzdesel' : 'Manuel'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Durum</Text>
            <Text style={[
              styles.detailValue,
              expense.status === 'settled' && styles.settledStatus,
              expense.status === 'pending' && styles.pendingStatus,
            ]}>
              {expense.status === 'settled' ? 'Ödendi' : 'Bekliyor'}
            </Text>
          </View>

          {expense.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.detailLabel}>Açıklama</Text>
              <Text style={styles.description}>{expense.description}</Text>
            </View>
          )}
        </View>

        {/* Participants */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Katılımcılar</Text>
          {expense.participants.length === 0 ? (
            <Text style={styles.emptyText}>Henüz katılımcı eklenmemiş</Text>
          ) : (
            expense.participants.map((participant, index) => (
              <View key={participant.userId} style={styles.participantItem}>
                <Text style={styles.participantName}>
                  {participant.userId === user?.id ? 'Siz' : 'Kullanıcı'}
                </Text>
                <Text style={styles.participantShare}>
                  {formatCurrency(participant.share, expense.currency)}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Delete Button */}
        {isOwner && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={20} color={COLORS.NEGATIVE} />
            <Text style={styles.deleteButtonText}>Harcamayı Sil</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  headerContent: {
    flex: 1,
    marginRight: 16,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    padding: 8,
    backgroundColor: COLORS.TERTIARY,
    borderRadius: 8,
    marginRight: 8,
  },
  editButton: {
    padding: 8,
    backgroundColor: COLORS.TERTIARY,
    borderRadius: 8,
  },
  expenseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_DARK,
    marginBottom: 8,
  },
  expenseAmount: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 16,
    color: COLORS.TEXT_GRAY,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.TEXT_DARK,
  },
  settledStatus: {
    color: COLORS.POSITIVE,
  },
  pendingStatus: {
    color: COLORS.NEGATIVE,
  },
  descriptionContainer: {
    marginTop: 16,
  },
  description: {
    fontSize: 16,
    color: COLORS.TEXT_DARK,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
    marginBottom: 16,
  },
  participantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  participantName: {
    fontSize: 16,
    color: COLORS.TEXT_DARK,
  },
  participantShare: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.TEXT_DARK,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.TEXT_GRAY,
    textAlign: 'center',
    paddingVertical: 16,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 16,
    backgroundColor: COLORS.NEGATIVE_LIGHT,
    borderRadius: 8,
  },
  deleteButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: COLORS.NEGATIVE,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
    color: COLORS.NEGATIVE,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 16,
    fontWeight: '500',
  },
}); 