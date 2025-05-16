import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/color';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GroupStackParamList } from '../../types/navigation.types';
import { Group } from '../../types/group.types';
import { firebaseService } from '../../services/firebaseService';
import { Expense } from '../../types/expense.types';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

type GroupDetailScreenNavigationProp = NativeStackNavigationProp<
  GroupStackParamList,
  'GroupDetails'
>;

type GroupDetailScreenRouteProp = RouteProp<
  GroupStackParamList,
  'GroupDetails'
>;

export default function GroupDetailScreen() {
  const navigation = useNavigation<GroupDetailScreenNavigationProp>();
  const route = useRoute<GroupDetailScreenRouteProp>();
  const { groupId } = route.params;

  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isExpensesLoading, setIsExpensesLoading] = useState(true);
  const [isRefreshingExpenses, setIsRefreshingExpenses] = useState(false);
  const [errorExpenses, setErrorExpenses] = useState<string | null>(null);

  useEffect(() => {
    fetchGroupDetails();
    fetchExpenses();
  }, [groupId]);

  useFocusEffect(
    useCallback(() => {
      fetchGroupDetails();
      fetchExpenses();
    }, [groupId])
  );

  useEffect(() => {
    navigation.setOptions({
      headerShown: false
    });
  }, [navigation]);

  const fetchGroupDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const groupData = await firebaseService.getGroupById(groupId);
      setGroup(groupData);
    } catch (error) {
      console.error('Error fetching group details:', error);
      setError('Grup detayları yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExpenses = async () => {
    try {
      setIsExpensesLoading(true);
      setErrorExpenses(null);
      const fetchedExpenses = await firebaseService.getExpenses(groupId);
      setExpenses(fetchedExpenses);
      calculateGroupBalance(fetchedExpenses);
    } catch (error) {
      console.error('Expenses loading error:', error);
      setErrorExpenses('Harcamaları yüklenirken bir hata oluştu');
    } finally {
      setIsExpensesLoading(false);
    }
  };

  const refreshExpenses = async () => {
    try {
      setIsRefreshingExpenses(true);
      setErrorExpenses(null);
      const fetchedExpenses = await firebaseService.getExpenses(groupId);
      setExpenses(fetchedExpenses);
      calculateGroupBalance(fetchedExpenses);
    } catch (error) {
      console.error('Refreshing expenses error:', error);
      setErrorExpenses('Harcamaları yenilerken bir hata oluştu');
    } finally {
      setIsRefreshingExpenses(false);
    }
  };

  const calculateGroupBalance = (groupExpenses: Expense[]) => {
    if (!group || !groupExpenses.length) return;
    
    const memberBalances: { [userId: string]: number } = {};
    
    group.members.forEach(member => {
      memberBalances[member.id] = 0;
    });
    
    groupExpenses.forEach(expense => {
      if (memberBalances[expense.paidBy] !== undefined) {
        memberBalances[expense.paidBy] += expense.amount;
      }
      
      const participantCount = expense.participants.length > 0 
        ? expense.participants.length 
        : group.members.length;
      
      const perPersonShare = expense.amount / participantCount;
      
      if (expense.participants.length > 0) {
        expense.participants.forEach(participant => {
          if (memberBalances[participant.userId] !== undefined) {
            memberBalances[participant.userId] -= perPersonShare;
          }
        });
      } else {
        group.members.forEach(member => {
          if (member.id !== expense.paidBy && memberBalances[member.id] !== undefined) {
            memberBalances[member.id] -= perPersonShare;
          }
        });
      }
    });
    
    const calculatedBalance = Object.values(memberBalances).reduce((sum, balance) => sum + balance, 0);
    
    if (group && calculatedBalance !== group.balance) {
      setGroup(prevGroup => {
        if (!prevGroup) return null;
        return { ...prevGroup, balance: calculatedBalance };
      });
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchGroupDetails();
      await fetchExpenses();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleEditPress = () => {
    if (group) {
      navigation.navigate('EditGroup', { groupId });
    }
  };

  const handleAddMember = () => {
    navigation.navigate('AddMember', { groupId });
  };

  const handleCreateExpense = () => {
    navigation.navigate('CreateExpense', { groupId });
  };

  const handleExpensePress = (expenseId: string) => {
    navigation.navigate('ExpenseDetails', { groupId, expenseId });
  };

  const handleSettingsPress = () => {
    navigation.navigate('GroupSettings', { groupId });
  };

  const renderExpenseItem = ({ item }: { item: Expense }) => {
    const dateStr = formatDate(item.createdAt).includes('/') 
      ? formatDate(item.createdAt) 
      : formatDate(item.createdAt).replace('-', ' ');
    
    const participantCount = item.participants.length > 0 
      ? item.participants.length 
      : group?.members.length || 0;
    
    return (
      <TouchableOpacity
        style={styles.expenseCard}
        onPress={() => handleExpensePress(item.id)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#007BFF', '#0056E0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cardGradient}
        >
          <View style={styles.cardHeader}>
            <View style={styles.expenseInfo}>
              <Text style={styles.expenseTitle}>{item.title || 'Me'}</Text>
              <Text style={styles.expenseDate}>{dateStr}</Text>
            </View>
            <View style={styles.expenseAmount}>
              <Text style={styles.amountText}>
                {formatCurrency(item.amount, item.currency)}
              </Text>
              <View style={[
                styles.statusBadge,
                item.status === 'settled' ? styles.settledBadge : styles.pendingBadge
              ]}>
                <Text style={styles.statusText}>
                  {item.status === 'settled' ? 'Ödendi' : 'Bekliyor'}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
        
        <View style={styles.cardFooter}>
          <View style={styles.footerInfo}>
            <Text style={styles.footerLabel}>Ödeyen</Text>
            <Text style={styles.footerValue}>{item.paidByUser?.fullName || 'Bilinmiyor'}</Text>
          </View>
          <View style={styles.footerInfo}>
            <Text style={styles.footerLabel}>Katılımcılar</Text>
            <Text style={styles.footerValue}>{participantCount} kişi</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => {
    if (!group) return null;

    return (
      <>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={24} color={COLORS.TEXT_LIGHT} />
            </TouchableOpacity>
            <Text style={styles.title}>{group.name}</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={handleRefresh}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <ActivityIndicator size="small" color={COLORS.TEXT_LIGHT} />
                ) : (
                  <Ionicons name="refresh" size={24} color={COLORS.TEXT_LIGHT} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerAddButton}
                onPress={handleEditPress}
              >
                <Ionicons name="create-outline" size={24} color={COLORS.TEXT_LIGHT} />
              </TouchableOpacity>
            </View>
          </View>


        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleCreateExpense}
          >
            <Ionicons name="add-circle-outline" size={24} color={COLORS.PRIMARY} />
            <Text style={styles.actionButtonText}>Harcama Ekle</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleAddMember}
          >
            <Ionicons name="person-add-outline" size={24} color={COLORS.PRIMARY} />
            <Text style={styles.actionButtonText}>Üye Ekle</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.headerSectionTitle}>Üyeler</Text>
            <Text style={styles.memberCount}>{group.members.length} üye</Text>
          </View>
          {group.members.length === 0 ? (
            <Text style={styles.headerEmptyText}>Henüz üye eklenmemiş</Text>
          ) : (
            <View style={styles.memberList}>
              {group.members.map((member) => (
                <View key={member.id} style={styles.memberItem}>
                  <View style={styles.memberAvatar}>
                    {member.photoURL ? (
                      <Image 
                        source={{ uri: member.photoURL }} 
                        style={styles.avatarImage} 
                      />
                    ) : (
                      <Text style={styles.avatarText}>
                        {member.fullName?.charAt(0).toUpperCase() || '?'}
                      </Text>
                    )}
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.fullName || 'İsimsiz Kullanıcı'}</Text>
                    <Text style={styles.memberEmail}>{member.email}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderContainer}>
            <View style={styles.sectionTitleContainer}>
              <MaterialIcons name="receipt" size={24} color={COLORS.PRIMARY} />
              <Text style={styles.expensesSectionTitle}>Harcamalar</Text>
            </View>
            <TouchableOpacity
              style={styles.expenseAddButton}
              onPress={handleCreateExpense}
            >
              <Text style={styles.addButtonText}>+ Yeni Harcama</Text>
            </TouchableOpacity>
          </View>

          {isExpensesLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={COLORS.PRIMARY} />
            </View>
          ) : errorExpenses ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                Harcamalar yüklenirken bir hata oluştu
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={fetchExpenses}
              >
                <Text style={styles.retryButtonText}>Tekrar Dene</Text>
              </TouchableOpacity>
            </View>
          ) : expenses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="receipt-long" size={48} color={COLORS.TEXT_GRAY} />
              <Text style={styles.headerEmptyText}>Henüz harcama bulunmuyor</Text>
              <TouchableOpacity
                style={styles.emptyActionButton}
                onPress={handleCreateExpense}
              >
                <Text style={styles.emptyActionButtonText}>Harcama Ekle</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={expenses}
              renderItem={renderExpenseItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.expensesList}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
              nestedScrollEnabled={false}
              style={styles.expensesListContainer}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshingExpenses}
                  onRefresh={refreshExpenses}
                  colors={[COLORS.PRIMARY]}
                />
              }
            />
          )}
        </View>
      </>
    );
  };

  const renderFooter = () => (
    <TouchableOpacity 
      style={styles.settingsButton}
      onPress={handleSettingsPress}
    >
      <Ionicons name="settings-outline" size={20} color={COLORS.PRIMARY} />
      <Text style={styles.settingsButtonText}>Grup Ayarları</Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchGroupDetails}>
          <Text style={styles.retryButtonText}>Tekrar Dene</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Grup bulunamadı</Text>
      </View>
    );
  }

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'TRY': return '₺';
      case 'USD': return '$';
      case 'EUR': return '€';
      default: return currency;
    }
  };

  const getSplitMethodText = (method: string) => {
    return 'Eşit Bölüşüm';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.PRIMARY]}
          />
        }
      >
        {renderHeader()}
        {renderFooter()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
    padding: 20,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 15,
    backgroundColor: COLORS.PRIMARY,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: COLORS.SHADOW,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.TEXT_LIGHT,
    flex: 1,
    textAlign: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerAddButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    marginHorizontal: 10,
    marginTop: 0,
    marginBottom: 10,
    padding: 16,
    backgroundColor: COLORS.TERTIARY,
    shadowOpacity: 2,
    elevation: 0,
    borderWidth: 1,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 25,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.TEXT_GRAY,
    marginBottom: 6,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    paddingVertical: 24,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: COLORS.TERTIARY,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.03)',
    shadowColor: COLORS.SHADOW,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    minWidth: 130,
  },
  actionButtonText: {
    color: COLORS.PRIMARY,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  section: {
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: COLORS.TERTIARY,
    borderRadius: 16,
    shadowColor: COLORS.SHADOW,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.03)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  memberCount: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.TEXT_GRAY,
    backgroundColor: 'rgba(142, 142, 147, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  memberList: {
    minHeight: 100,
  },
  expenseCard: {
    marginBottom: 16,
    marginHorizontal: 2,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    backgroundColor: 'white',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  cardGradient: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseInfo: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_LIGHT,
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 0,
  },
  expenseAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_LIGHT,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.TEXT_LIGHT,
  },
  settledBadge: {
    backgroundColor: 'rgba(52, 199, 89, 0.4)',
  },
  pendingBadge: {
    backgroundColor: 'rgba(243, 115, 112, 0.7)',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0, 0, 0, 0.03)',
  },
  footerInfo: {
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 13,
    color: COLORS.TEXT_GRAY,
    marginBottom: 4,
  },
  footerValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 16,
    marginTop: 8,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0, 
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 0,
  },
  settingsButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(198, 198, 200, 0.3)',
  },
  memberAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 14,
    color: COLORS.TEXT_GRAY,
  },
  headerEmptyText: {
    fontSize: 16,
    color: COLORS.TEXT_GRAY,
    textAlign: 'center',
    marginVertical: 16,
    fontStyle: 'italic',
  },
  listContent: {
    padding: 0,
    paddingBottom: 16,
  },
  groupTitleCard: {
    padding: 16,
    backgroundColor: COLORS.TERTIARY,
    borderRadius: 16,
    marginBottom: 16,
  },
  groupTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.TEXT_DARK,
  },
  groupDescriptionText: {
    fontSize: 14,
    color: COLORS.TEXT_GRAY,
    marginTop: 4,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionContainer: {
    marginTop: 24,
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expensesSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_DARK,
    marginLeft: 8,
  },
  expenseAddButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  addButtonText: {
    color: COLORS.TEXT_LIGHT,
    fontWeight: '600',
    fontSize: 14,
  },
  loaderContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.TEXT_GRAY,
    marginTop: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyActionButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyActionButtonText: {
    color: COLORS.TEXT_LIGHT,
    fontWeight: '600',
  },
  expensesList: {
    paddingBottom: 8,
  },
  expensesListContainer: {
    flexGrow: 0,
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
});
