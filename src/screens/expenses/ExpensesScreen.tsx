import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/color';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { ExpensesStackParamList } from '../../navigation/ExpensesNavigator';
import { AppTabParamList } from '../../navigation/AppNavigator';
import { GroupStackParamList } from '../../types/navigation.types';
import { firebaseService } from '../../services/firebaseService';
import { Expense } from '../../types/expense.types';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/formatters';
import { Group } from '../../types/group.types';

type ExpensesScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<ExpensesStackParamList, 'ExpensesList'>,
  CompositeNavigationProp<
    BottomTabNavigationProp<AppTabParamList>,
    NativeStackNavigationProp<GroupStackParamList>
  >
>;

export default function ExpensesScreen() {
  const navigation = useNavigation<ExpensesScreenNavigationProp>();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      fetchExpenses();
    }
  }, [selectedGroup]);

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      const fetchedGroups = await firebaseService.getUserGroups();
      setGroups(fetchedGroups);
      if (fetchedGroups.length > 0) {
        setSelectedGroup(fetchedGroups[0]);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      setError('Gruplar yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExpenses = async () => {
    if (!selectedGroup) return;
    
    try {
      const fetchedExpenses = await firebaseService.getExpenses(selectedGroup.id);
      setExpenses(fetchedExpenses);
      setError(null);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setError('Harcamalar yüklenirken bir hata oluştu');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchGroups();
      if (selectedGroup) {
        await fetchExpenses();
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleGroupSelect = (group: Group) => {
    setSelectedGroup(group);
  };

  const handleCreateExpense = () => {
    if (selectedGroup) {
      navigation.navigate('CreateExpense', { groupId: selectedGroup.id });
    }
  };

  const handleExpensePress = (expenseId: string) => {
    if (selectedGroup) {
      navigation.navigate('ExpenseDetails', { 
        groupId: selectedGroup.id, 
        expenseId 
      });
    }
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
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Tekrar Dene</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (groups.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Harcamalar</Text>
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Henüz bir grubunuz yok</Text>
          <Text style={styles.emptySubText}>
            Harcama eklemek için önce bir grup oluşturun
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate('Groups', { screen: 'CreateGroup' })}
          >
            <Text style={styles.buttonText}>Grup Oluştur</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Harcamalar</Text>
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
            style={styles.addButton}
            onPress={handleCreateExpense}
          >
            <Ionicons name="add" size={24} color={COLORS.PRIMARY} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.groupSelector}>
        <FlatList
          horizontal
          data={groups}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.groupChip,
                selectedGroup?.id === item.id && styles.selectedGroupChip
              ]}
              onPress={() => handleGroupSelect(item)}
            >
              <Text style={[
                styles.groupChipText,
                selectedGroup?.id === item.id && styles.selectedGroupChipText
              ]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.groupList}
        />
      </View>

      <FlatList
        data={expenses}
        renderItem={renderExpenseItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        onRefresh={handleRefresh}
        refreshing={isRefreshing}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Henüz bir harcama yok
            </Text>
            <Text style={styles.emptySubText}>
              Yeni bir harcama ekleyerek başlayın
            </Text>
          </View>
        }
      />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_DARK,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.TERTIARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.TERTIARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupSelector: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  groupList: {
    paddingHorizontal: 16,
  },
  groupChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.TERTIARY,
    marginRight: 8,
  },
  selectedGroupChip: {
    backgroundColor: COLORS.PRIMARY,
  },
  groupChipText: {
    fontSize: 14,
    color: COLORS.TEXT_DARK,
  },
  selectedGroupChipText: {
    color: COLORS.TEXT_LIGHT,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: COLORS.TEXT_DARK,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.TEXT_GRAY,
    textAlign: 'center',
    marginBottom: 24,
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
  createButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 16,
    fontWeight: '600',
  },
}); 