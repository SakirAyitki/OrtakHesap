import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/color';
import { useNavigation, CompositeNavigationProp, useFocusEffect } from '@react-navigation/native';
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
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 16;
const CARD_WIDTH = width - (CARD_MARGIN * 2);

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

  useFocusEffect(
    useCallback(() => {
      fetchGroups();
    }, [])
  );

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
      style={styles.expenseCard}
      onPress={() => handleExpensePress(item.id)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
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

          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.footerInfo}>
            <Text style={styles.footerLabel}>Ödeyen</Text>
            <Text style={styles.footerValue}>{item.paidByUser?.fullName || 'Bilinmiyor'}</Text>
          </View>
          <View style={styles.footerInfo}>
            <Text style={styles.footerLabel}>Katılımcılar</Text>
            <Text style={styles.footerValue}>
              {item.participants.length > 0 
                ? item.participants.length 
                : selectedGroup?.members.length || 0} kişi
            </Text>
          </View>
        </View>
      </LinearGradient>
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
          <View style={styles.emptyIconContainer}>
            <Ionicons name="wallet-outline" size={80} color={COLORS.PRIMARY} />
          </View>
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
              <ActivityIndicator size="small" color={COLORS.TEXT_LIGHT} />
            ) : (
              <Ionicons name="refresh" size={24} color={COLORS.TEXT_LIGHT} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleCreateExpense}
          >
            <Ionicons name="add" size={24} color={COLORS.TEXT_LIGHT} />
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
        showsVerticalScrollIndicator={false}
        onRefresh={handleRefresh}
        refreshing={isRefreshing}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="receipt-outline" size={80} color={COLORS.PRIMARY} />
            </View>
            <Text style={styles.emptyText}>
              Henüz bir harcama yok
            </Text>
            <Text style={styles.emptySubText}>
              Yeni bir harcama ekleyerek başlayın
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateExpense}
            >
              <Text style={styles.buttonText}>Harcama Ekle</Text>
            </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupSelector: {
    paddingVertical: 16,
    backgroundColor: COLORS.BACKGROUND,
  },
  groupList: {
    paddingHorizontal: 20,
  },
  groupChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.TERTIARY,
    marginRight: 12,
    shadowColor: COLORS.SHADOW,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedGroupChip: {
    backgroundColor: COLORS.PRIMARY,
  },
  groupChipText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
  },
  selectedGroupChipText: {
    color: COLORS.TEXT_LIGHT,
  },
  listContent: {
    padding: CARD_MARGIN,
    paddingTop: 8,
  },
  expenseCard: {
    width: CARD_WIDTH,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.SHADOW,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  cardGradient: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  expenseInfo: {
    flex: 1,
    marginRight: 12,
  },
  expenseTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_LIGHT,
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  expenseAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_LIGHT,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  settledBadge: {
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
  },
  pendingBadge: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.TEXT_LIGHT,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 16,
  },
  footerInfo: {
    alignItems: 'center',
    flex: 1,
  },
  footerLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  footerValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_LIGHT,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 100,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.TERTIARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: COLORS.SHADOW,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 16,
    color: COLORS.TEXT_GRAY,
    textAlign: 'center',
    marginBottom: 32,
  },
  errorText: {
    color: COLORS.NEGATIVE,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_LIGHT,
  },
}); 