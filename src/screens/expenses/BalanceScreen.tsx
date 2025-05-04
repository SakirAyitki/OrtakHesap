import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/color';
import { firebaseService } from '../../services/firebaseService';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/formatters';
import { Group } from '../../types/group.types';
import { Expense } from '../../types/expense.types';
import { useAuth } from '../../hooks/useAuth';

type BalanceSummary = {
  totalReceivable: number; // Alacak
  totalPayable: number;    // Borç
  netBalance: number;      // Net durum
  currency: string;
};

type UserBalance = {
  userId: string;
  fullName: string;
  email: string;
  balance: number;
};

export default function BalanceScreen() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [balanceSummary, setBalanceSummary] = useState<BalanceSummary>({
    totalReceivable: 0,
    totalPayable: 0,
    netBalance: 0,
    currency: 'TRY'
  });
  const [userBalances, setUserBalances] = useState<UserBalance[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    fetchBalanceData();
  }, []);

  const fetchBalanceData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      // Grupları getir
      const userGroups = await firebaseService.getUserGroups();
      setGroups(userGroups);

      let totalReceivable = 0;
      let totalPayable = 0;
      const allExpenses: Expense[] = [];
      const balancesByUser: { [key: string]: UserBalance } = {};

      // Tüm gruplardan harcamaları topla
      for (const group of userGroups) {
        const expenses = await firebaseService.getExpenses(group.id);
        
        // Her harcama için bakiyeleri hesapla
        expenses.forEach(expense => {
          // Grup üye sayısına göre kişi başı payı hesapla
          const perPersonShare = expense.amount / group.members.length;

          // Harcamayı yapan kişinin alacağını hesapla
          if (expense.paidBy === user.id) {
            // Kendi payım hariç diğerlerinin paylarını alacak olarak ekle
            const receivableAmount = expense.amount - perPersonShare;
            totalReceivable += receivableAmount;
          }

          // Eğer gruptaysam ve ödemeyi ben yapmadıysam borcumu ekle
          if (group.members.some(m => m.id === user.id) && expense.paidBy !== user.id) {
            totalPayable += perPersonShare;
          }

          // Diğer grup üyelerinin bakiyelerini hesapla
          group.members.forEach(member => {
            if (!balancesByUser[member.id]) {
              balancesByUser[member.id] = {
                userId: member.id,
                fullName: member.fullName,
                email: member.email,
                balance: 0
              };
            }

            if (member.id === expense.paidBy) {
              // Ödemeyi yapan kişinin alacağını hesapla
              balancesByUser[member.id].balance += (expense.amount - perPersonShare);
            } else {
              // Diğer üyelerin borçlarını hesapla
              balancesByUser[member.id].balance -= perPersonShare;
            }
          });
        });

        allExpenses.push(...expenses);
      }

      // Bakiye özetini güncelle
      const netBalance = totalReceivable - totalPayable;
      setBalanceSummary({
        totalReceivable,
        totalPayable,
        netBalance,
        currency: 'TRY'
      });

      // Kişi bazlı bakiyeleri ayarla
      setUserBalances(Object.values(balancesByUser));

      // Son harcamaları ayarla (son 10 harcama)
      setRecentExpenses(
        allExpenses
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 10)
      );

    } catch (error) {
      console.error('Error fetching balance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchBalanceData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderUserBalanceItem = ({ item }: { item: UserBalance }) => (
    <View style={styles.balanceItem}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.fullName}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
      </View>
      <Text style={[
        styles.balanceAmount,
        { color: item.balance >= 0 ? COLORS.POSITIVE : COLORS.NEGATIVE }
      ]}>
        {formatCurrency(item.balance, balanceSummary.currency)}
      </Text>
    </View>
  );

  const renderExpenseItem = ({ item }: { item: Expense }) => (
    <View style={styles.expenseItem}>
      <View style={styles.expenseInfo}>
        <Text style={styles.expenseTitle}>{item.title}</Text>
        <Text style={styles.expenseDate}>{formatDate(item.createdAt)}</Text>
      </View>
      <Text style={styles.expenseAmount}>
        {formatCurrency(item.amount, item.currency)}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bakiye</Text>
      </View>

      <FlatList
        data={userBalances}
        renderItem={renderUserBalanceItem}
        keyExtractor={item => item.userId}
        onRefresh={handleRefresh}
        refreshing={isRefreshing}
        ListHeaderComponent={
          <>
            <View style={styles.summaryCard}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Toplam Alacak</Text>
                <Text style={[styles.summaryValue, styles.positiveAmount]}>
                  {formatCurrency(balanceSummary.totalReceivable, balanceSummary.currency)}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Toplam Borç</Text>
                <Text style={[styles.summaryValue, styles.negativeAmount]}>
                  {formatCurrency(balanceSummary.totalPayable, balanceSummary.currency)}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Net Durum</Text>
                <Text style={[
                  styles.summaryValue,
                  balanceSummary.netBalance >= 0 ? styles.positiveAmount : styles.negativeAmount
                ]}>
                  {formatCurrency(balanceSummary.netBalance, balanceSummary.currency)}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Kişi Bazlı Özet</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Henüz bir işlem yok</Text>
            <Text style={styles.emptySubText}>
              Harcama ekleyerek bakiyenizi görüntüleyebilirsiniz
            </Text>
          </View>
        }
        ListFooterComponent={
          recentExpenses.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Son Hareketler</Text>
              {recentExpenses.map(expense => (
                <View key={expense.id} style={styles.expenseItem}>
                  <View style={styles.expenseInfo}>
                    <Text style={styles.expenseTitle}>{expense.title}</Text>
                    <Text style={styles.expenseDate}>
                      {formatDate(expense.createdAt)}
                    </Text>
                  </View>
                  <Text style={styles.expenseAmount}>
                    {formatCurrency(expense.amount, expense.currency)}
                  </Text>
                </View>
              ))}
            </View>
          ) : null
        }
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
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
  listContent: {
    flexGrow: 1,
  },
  summaryCard: {
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
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: COLORS.TEXT_GRAY,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  positiveAmount: {
    color: COLORS.POSITIVE,
  },
  negativeAmount: {
    color: COLORS.NEGATIVE,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.BORDER,
    marginVertical: 8,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
    marginBottom: 16,
  },
  balanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.TEXT_DARK,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.TEXT_GRAY,
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.TEXT_DARK,
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 14,
    color: COLORS.TEXT_GRAY,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.TEXT_DARK,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.TEXT_GRAY,
    textAlign: 'center',
  },
});
