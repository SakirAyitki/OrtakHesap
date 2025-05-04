import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/color';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GroupStackParamList } from '../../types/navigation.types';
import { Group } from '../../types/group.types';
import { firebaseService } from '../../services/firebaseService';
import { Expense } from '../../types/expense.types';
import { formatDate, formatCurrency } from '../../utils/formatters';

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

  useEffect(() => {
    fetchGroupDetails();
    fetchExpenses();
  }, [groupId]);

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
      const fetchedExpenses = await firebaseService.getExpenses(groupId);
      setExpenses(fetchedExpenses);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setIsExpensesLoading(false);
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
      navigation.navigate('EditGroup', { group });
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

  const renderExpenseItem = ({ item }: { item: Expense }) => (
    <TouchableOpacity
      style={styles.expenseItem}
      onPress={() => handleExpensePress(item.id)}
    >
      <View style={styles.expenseInfo}>
        <Text style={styles.expenseTitle}>{item.title}</Text>
        <Text style={styles.expenseDate}>
          {formatDate(item.createdAt)}
        </Text>
      </View>
      <View style={styles.expenseAmount}>
        <Text style={styles.amountText}>
          {formatCurrency(item.amount, item.currency)}
        </Text>
        <Text style={[
          styles.statusText,
          item.status === 'settled' ? styles.settledStatus : styles.pendingStatus
        ]}>
          {item.status === 'settled' ? 'Ödendi' : 'Bekliyor'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => {
    if (!group) return null;

    return (
      <>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.groupName}>{group.name}</Text>
            {group.description && (
              <Text style={styles.description}>{group.description}</Text>
            )}
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
            <TouchableOpacity 
              style={styles.editButton}
              onPress={handleEditPress}
            >
              <Ionicons name="create-outline" size={24} color={COLORS.PRIMARY} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Para Birimi</Text>
              <Text style={styles.infoValue}>
                {getCurrencySymbol(group.currency)}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Bölüşüm</Text>
              <Text style={styles.infoValue}>
                {getSplitMethodText(group.splitMethod)}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Toplam Bakiye</Text>
              <Text style={[
                styles.infoValue,
                { color: group.balance >= 0 ? COLORS.POSITIVE : COLORS.NEGATIVE }
              ]}>
                {getCurrencySymbol(group.currency)}{Math.abs(group.balance)}
              </Text>
            </View>
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
            <Text style={styles.sectionTitle}>Üyeler</Text>
            <Text style={styles.memberCount}>{group.members.length} üye</Text>
          </View>
          {group.members.length === 0 ? (
            <Text style={styles.emptyText}>Henüz üye eklenmemiş</Text>
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

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Harcamalar</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleCreateExpense}
            >
              <Ionicons name="add" size={24} color={COLORS.PRIMARY} />
            </TouchableOpacity>
          </View>
          {isExpensesLoading ? (
            <ActivityIndicator size="small" color={COLORS.PRIMARY} />
          ) : expenses.length === 0 ? (
            <Text style={styles.emptyText}>
              Henüz harcama eklenmemiş
            </Text>
          ) : null}
        </View>
      </>
    );
  };

  const renderFooter = () => (
    <TouchableOpacity 
      style={styles.settingsButton}
      onPress={handleSettingsPress}
    >
      <Ionicons name="settings-outline" size={20} color={COLORS.TEXT_DARK} />
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
    switch (method) {
      case 'equal': return 'Eşit Bölüşüm';
      case 'percentage': return 'Yüzdesel Bölüşüm';
      case 'amount': return 'Manuel Bölüşüm';
      default: return method;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={expenses}
        renderItem={renderExpenseItem}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        onRefresh={handleRefresh}
        refreshing={isRefreshing}
        contentContainerStyle={styles.listContent}
      />
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
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  headerContent: {
    flex: 1,
    marginRight: 16,
  },
  groupName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_DARK,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: COLORS.TEXT_GRAY,
  },
  editButton: {
    padding: 8,
    backgroundColor: COLORS.TERTIARY,
    borderRadius: 8,
  },
  infoCard: {
    margin: 16,
    padding: 16,
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 12,
    shadowColor: COLORS.SHADOW,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: COLORS.TERTIARY,
    padding: 16,
    borderRadius: 12,
    minWidth: 150,
  },
  actionButtonText: {
    color: COLORS.PRIMARY,
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
  },
  memberCount: {
    fontSize: 14,
    color: COLORS.TEXT_GRAY,
  },
  memberList: {
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.TERTIARY,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  expenseInfo: {
    flex: 1,
    marginRight: 12,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 14,
    color: COLORS.TEXT_GRAY,
  },
  expenseAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  settledStatus: {
    color: COLORS.POSITIVE,
  },
  pendingStatus: {
    color: COLORS.NEGATIVE,
  },
  addButton: {
    padding: 8,
    backgroundColor: COLORS.TERTIARY,
    borderRadius: 8,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 16,
    backgroundColor: COLORS.TERTIARY,
    borderRadius: 8,
  },
  settingsButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: COLORS.TEXT_DARK,
    fontWeight: '500',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.TERTIARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontWeight: '500',
    color: COLORS.TEXT_DARK,
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 14,
    color: COLORS.TEXT_GRAY,
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
  emptyText: {
    fontSize: 16,
    color: COLORS.TEXT_GRAY,
    textAlign: 'center',
    marginVertical: 16,
  },
  listContent: {
    padding: 16,
  },
});
