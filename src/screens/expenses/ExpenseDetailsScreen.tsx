import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../utils/color';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GroupStackParamList } from '../../types/navigation.types';
import { firebaseService } from '../../services/firebaseService';
import { Expense } from '../../types/expense.types';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import { useAuth } from '../../hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const CARD_MARGIN = 16;
const CARD_WIDTH = width - (CARD_MARGIN * 2);

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
  const [groupName, setGroupName] = useState<string>('');

  // React Navigation'ın varsayılan header'ını gizle
  useEffect(() => {
    navigation.setOptions({
      headerShown: false
    });
  }, [navigation]);

  const fetchExpenseDetails = async () => {
    try {
      setIsLoading(true);
      const expenseData = await firebaseService.getExpenseById(groupId, expenseId);
      setExpense(expenseData);
      
      const groupData = await firebaseService.getGroupById(groupId);
      if (groupData?.members) {
        setGroupMembers(groupData.members);
      }
      if (groupData?.name) {
        setGroupName(groupData.name);
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
  
  // Kategori ikonu getiren yardımcı fonksiyon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Yiyecek':
        return 'fast-food';
      case 'Ulaşım':
        return 'car';
      case 'Alışveriş':
        return 'cart';
      case 'Eğlence':
        return 'happy';
      case 'Sağlık':
        return 'medical';
      case 'Eğitim':
        return 'school';
      case 'Kira':
        return 'home';
      case 'Faturalar':
        return 'flash';
      default:
        return 'wallet';
    }
  };

  // Durum bilgisine göre renk dönen yardımcı fonksiyon
  const getStatusColor = (status: string) => {
    return status === 'settled' ? COLORS.POSITIVE : COLORS.NEGATIVE;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Gradient Header */}
      <LinearGradient
        colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.TEXT_LIGHT} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Harcama Detayı</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <ActivityIndicator size="small" color={COLORS.TEXT_LIGHT} />
              ) : (
                <Ionicons name="refresh" size={22} color={COLORS.TEXT_LIGHT} />
              )}
            </TouchableOpacity>
            {isOwner && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleEdit}
              >
                <Ionicons name="create-outline" size={22} color={COLORS.TEXT_LIGHT} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.expenseHeaderInfo}>
          <Text style={styles.expenseTitle}>{expense.title}</Text>
          <Text style={styles.expenseGroup}>Grup: {groupName}</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.expenseAmount}>
              {formatCurrency(expense.amount, expense.currency)}
            </Text>
          </View>
        </View>
      </LinearGradient>
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Detaylar Kartı */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="info" size={20} color={COLORS.PRIMARY} />
            <Text style={styles.cardTitle}>Harcama Detayları</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <MaterialCommunityIcons name="calendar" size={20} color={COLORS.PRIMARY} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Tarih</Text>
              <Text style={styles.detailValue}>{formatDate(expense.date)}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name={getCategoryIcon(expense.category || 'Diğer')} size={20} color={COLORS.PRIMARY} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Kategori</Text>
              <Text style={styles.detailValue}>{expense.category}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="person" size={20} color={COLORS.PRIMARY} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Ödeyen</Text>
              <Text style={styles.detailValue}>
                {expense.paidByUser?.fullName || 'Bilinmeyen Kullanıcı'}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <MaterialIcons name="pie-chart" size={20} color={COLORS.PRIMARY} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Bölüşüm</Text>
              <Text style={styles.detailValue}>Eşit</Text>
            </View>
          </View>

          {expense.description && (
            <View style={styles.descriptionContainer}>
              <View style={styles.detailIconContainer}>
                <MaterialIcons name="description" size={20} color={COLORS.PRIMARY} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Açıklama</Text>
                <Text style={styles.description}>{expense.description}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Katılımcılar Kartı */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="people" size={20} color={COLORS.PRIMARY} />
            <Text style={styles.cardTitle}>Katılımcılar</Text>
            <View style={styles.participantCount}>
              <Text style={styles.participantCountText}>
                {expense.participants?.length > 0 
                  ? expense.participants.length 
                  : groupMembers.length} kişi
              </Text>
            </View>
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
                    <View style={[
                      styles.participantAvatar,
                      participant.userId === expense.paidBy && styles.payerAvatar
                    ]}>
                      <Text style={[
                        styles.avatarText,
                        participant.userId === expense.paidBy && styles.payerAvatarText
                      ]}>
                        {participantUser?.fullName?.charAt(0).toUpperCase() || '?'}
                      </Text>
                    </View>
                    <View style={styles.participantInfo}>
                      <View style={styles.participantNameRow}>
                        <Text style={styles.participantName}>
                          {participantUser?.fullName || 'Katılımcı ' + (index + 1)}
                        </Text>
                        {participant.userId === expense.paidBy && (
                          <View style={styles.payerBadge}>
                            <Text style={styles.payerBadgeText}>Ödeyen</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.participantStatus}>
                        Eşit Pay: {formatCurrency(expense.amount / expense.participants.length, expense.currency)}
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
                    <View style={[
                      styles.participantAvatar,
                      isPayer && styles.payerAvatar
                    ]}>
                      <Text style={[
                        styles.avatarText,
                        isPayer && styles.payerAvatarText
                      ]}>
                        {member?.fullName?.charAt(0).toUpperCase() || '?'}
                      </Text>
                    </View>
                    <View style={styles.participantInfo}>
                      <View style={styles.participantNameRow}>
                        <Text style={styles.participantName}>
                          {member?.fullName || 'Üye ' + (index + 1)}
                        </Text>
                        {isPayer && (
                          <View style={styles.payerBadge}>
                            <Text style={styles.payerBadgeText}>Ödeyen</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.participantStatus}>
                        Eşit Pay: {formatCurrency(expense.amount / groupMembers.length, expense.currency)}
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
    padding: 20,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: COLORS.SHADOW,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_LIGHT,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expenseHeaderInfo: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  expenseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_LIGHT,
    marginBottom: 5,
    textAlign: 'center',
  },
  expenseGroup: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
  },
  amountContainer: {
    alignItems: 'center',
  },
  expenseAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.TEXT_LIGHT,
    marginBottom: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.SHADOW,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
    marginLeft: 8,
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detailIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.TEXT_GRAY,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.TEXT_DARK,
  },
  descriptionContainer: {
    flexDirection: 'row',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  description: {
    fontSize: 16,
    color: COLORS.TEXT_DARK,
    lineHeight: 22,
  },
  participantCount: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 12,
  },
  participantCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.PRIMARY,
  },
  participantsList: {
    gap: 12,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  payerAvatar: {
    backgroundColor: COLORS.PRIMARY,
  },
  payerAvatarText: {
    color: COLORS.TEXT_LIGHT,
  },
  participantInfo: {
    flex: 1,
  },
  participantNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.TEXT_DARK,
    marginRight: 8,
  },
  payerBadge: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  payerBadgeText: {
    fontSize: 10,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  participantStatus: {
    fontSize: 14,
    color: COLORS.TEXT_GRAY,
  },
  participantStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  paidBadge: {
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
  },
  pendingBadge: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.TEXT_GRAY,
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
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
    borderRadius: 12,
  },
  retryButtonText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 16,
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.NEGATIVE_LIGHT,
    paddingVertical: 16,
    borderRadius: 12,
    marginVertical: 8,
  },
  deleteButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: COLORS.NEGATIVE,
    fontWeight: '600',
  },
}); 