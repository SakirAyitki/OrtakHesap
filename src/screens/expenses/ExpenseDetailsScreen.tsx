import React, { useState, useEffect, useCallback } from 'react';
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
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
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
  const [groupMembers, setGroupMembers] = useState<any[]>([]);

  const fetchExpenseDetails = async () => {
    try {
      setIsLoading(true);
      const expenseData = await firebaseService.getExpenseById(groupId, expenseId);
      setExpense(expenseData);
      
      const groupData = await firebaseService.getGroupById(groupId);
      if (groupData?.members) {
        setGroupMembers(groupData.members);
      }
      
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

  useFocusEffect(
    useCallback(() => {
      fetchExpenseDetails();
    }, [groupId, expenseId])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchExpenseDetails();
  };

  const handleEdit = () => {
    if (expense) {
      navigation.navigate('EditExpense', { groupId, expenseId });
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
              Eşit
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

        {/* Katılımcılar Bölümü */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Katılımcılar</Text>
            <Text style={styles.participantCount}>
              {expense.participants?.length > 0 
                ? expense.participants.length 
                : groupMembers.length} kişi
            </Text>
          </View>
          
          {expense.participants && expense.participants.length > 0 ? (
            <View style={styles.participantsList}>
              {expense.participants.map((participant, index) => {
                // Katılımcı bilgisini bul
                const participantUser = expense.paidByUser && expense.paidByUser.id === participant.userId 
                  ? expense.paidByUser 
                  : groupMembers.find(member => member.id === participant.userId);
                
                return (
                  <View key={participant.userId || index} style={styles.participantItem}>
                    <View style={styles.participantAvatar}>
                      <Text style={styles.avatarText}>
                        {participantUser?.fullName?.charAt(0).toUpperCase() || '?'}
                      </Text>
                    </View>
                    <View style={styles.participantInfo}>
                      <Text style={styles.participantName}>
                        {participantUser?.fullName || 'Katılımcı ' + (index + 1)}
                        {participant.userId === expense.paidBy && ' (Ödeyen)'}
                      </Text>
                      <Text style={styles.participantStatus}>
                        Eşit Pay
                      </Text>
                    </View>
                    <View style={[
                      styles.participantBadge,
                      participant.paid ? styles.paidBadge : styles.pendingBadge
                    ]}>
                      <Text style={styles.badgeText}>
                        {participant.paid ? 'Ödendi' : 'Bekliyor'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : groupMembers.length > 0 ? (
            <View style={styles.participantsList}>
              {groupMembers.map((member, index) => {
                const isPayer = expense.paidBy === member.id;
                
                return (
                  <View key={member.id || index} style={styles.participantItem}>
                    <View style={styles.participantAvatar}>
                      <Text style={styles.avatarText}>
                        {member?.fullName?.charAt(0).toUpperCase() || '?'}
                      </Text>
                    </View>
                    <View style={styles.participantInfo}>
                      <Text style={styles.participantName}>
                        {member?.fullName || 'Üye ' + (index + 1)}
                        {isPayer && ' (Ödeyen)'}
                      </Text>
                      <Text style={styles.participantStatus}>
                        Eşit Pay
                      </Text>
                    </View>
                    <View style={[
                      styles.participantBadge,
                      isPayer ? styles.paidBadge : styles.pendingBadge
                    ]}>
                      <Text style={styles.badgeText}>
                        {isPayer ? 'Ödendi' : 'Bekliyor'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color={COLORS.TEXT_GRAY} />
              <Text style={styles.emptyText}>Bu harcama için katılımcı bulunamadı</Text>
            </View>
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
  emptyText: {
    fontSize: 16,
    color: COLORS.TEXT_GRAY,
    textAlign: 'center',
    paddingVertical: 16,
    fontStyle: 'italic',
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
  participantsList: {
    marginTop: 12,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.PRIMARY + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.TEXT_DARK,
    marginBottom: 4,
  },
  participantStatus: {
    fontSize: 14,
    color: COLORS.TEXT_GRAY,
  },
  participantBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.TEXT_LIGHT,
    paddingHorizontal: 4,
  },
  paidBadge: {
    backgroundColor: 'rgba(52, 199, 89, 0.8)',
  },
  pendingBadge: {
    backgroundColor: 'rgba(255, 59, 48, 0.8)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  participantCount: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.TEXT_GRAY,
    backgroundColor: 'rgba(142, 142, 147, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  infoMessageContainer: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  infoMessage: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    textAlign: 'center',
  },
}); 