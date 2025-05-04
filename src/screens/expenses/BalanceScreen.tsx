import React, { useState, useEffect } from 'react';
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
import { firebaseService } from '../../services/firebaseService';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/formatters';
import { Group } from '../../types/group.types';
import { Expense } from '../../types/expense.types';
import { useAuth } from '../../hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 16;
const CARD_WIDTH = width - (CARD_MARGIN * 2);

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

  const renderSummaryCard = () => (
    <View style={styles.summaryCard}>
      <LinearGradient
        colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Genel Bakiye Durumu</Text>
        </View>

        <View style={styles.balanceInfo}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>Toplam Alacak</Text>
            <Text style={[styles.balanceValue, styles.positiveAmount]}>
              {formatCurrency(balanceSummary.totalReceivable, balanceSummary.currency)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>Toplam Borç</Text>
            <Text style={[styles.balanceValue, styles.negativeAmount]}>
              {formatCurrency(balanceSummary.totalPayable, balanceSummary.currency)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>Net Durum</Text>
            <Text style={[
              styles.balanceValue,
              balanceSummary.netBalance >= 0 ? styles.positiveAmount : styles.negativeAmount
            ]}>
              {formatCurrency(balanceSummary.netBalance, balanceSummary.currency)}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderUserBalanceItem = ({ item }: { item: UserBalance }) => (
    <View style={styles.userCard}>
      <LinearGradient
        colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Text style={styles.avatarText}>
              {item.fullName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.fullName}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
          </View>
        </View>
        <View style={styles.balanceContainer}>
          <Text style={[
            styles.balanceAmount,
            item.balance >= 0 ? styles.positiveAmount : styles.negativeAmount
          ]}>
            {formatCurrency(item.balance, balanceSummary.currency)}
          </Text>
          <Text style={styles.balanceStatus}>
            {item.balance >= 0 ? 'Alacak' : 'Borç'}
          </Text>
        </View>
      </LinearGradient>
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
      </View>

      <FlatList
        data={userBalances}
        renderItem={renderUserBalanceItem}
        keyExtractor={item => item.userId}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onRefresh={handleRefresh}
        refreshing={isRefreshing}
        ListHeaderComponent={renderSummaryCard}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="wallet-outline" size={80} color={COLORS.PRIMARY} />
            </View>
            <Text style={styles.emptyText}>
              Henüz bir işlem yok
            </Text>
            <Text style={styles.emptySubText}>
              Gruplarınızdaki harcamalar burada listelenecek
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
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: CARD_MARGIN,
    paddingTop: 16,
  },
  summaryCard: {
    width: CARD_WIDTH,
    marginBottom: 24,
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
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_LIGHT,
  },
  balanceInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  balanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  positiveAmount: {
    color: COLORS.POSITIVE,
  },
  negativeAmount: {
    color: COLORS.NEGATIVE,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 8,
  },
  userCard: {
    width: CARD_WIDTH,
    marginBottom: 12,
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_LIGHT,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_LIGHT,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  balanceContainer: {
    alignItems: 'flex-end',
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  balanceStatus: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 32,
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
  },
});
