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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../utils/color';
import { firebaseService } from '../../services/firebaseService';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/formatters';
import { Group } from '../../types/group.types';
import { Expense } from '../../types/expense.types';
import { useAuth } from '../../hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 16;
const CARD_WIDTH = width - (CARD_MARGIN * 2);

type BalanceSummary = {
  totalReceivable: number; // Alacak
  totalPayable: number;    // Borç
  netBalance: number;      // Net durum
  currency: string;
};

// Kim kime borçlu detaylı yapı
type DebtDetail = {
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
};

type UserBalance = {
  userId: string;
  fullName: string;
  email: string;
  balance: number;
  // Detaylı alacak/borç bilgisi
  debts: DebtDetail[];  // Kime borçlu
  credits: DebtDetail[]; // Kimden alacaklı
  isCurrentUser: boolean;
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
  const [debtDetails, setDebtDetails] = useState<DebtDetail[]>([]);

  // Sayfa açıldığında veri yüklemesi yap
  useEffect(() => {
    fetchBalanceData();
  }, []);

  // Sayfa odağa geldiğinde veri yüklemesi yap
  useFocusEffect(
    useCallback(() => {
      fetchBalanceData();
    }, [])
  );

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

      // Borç/alacak ilişkilerini toplamak için kullanılacak harita
      const consolidatedDebts = new Map<string, Map<string, number>>();

      // Tüm kullanıcılar için bakiye objelerini oluştur
      userGroups.forEach(group => {
        group.members.forEach(member => {
          if (!balancesByUser[member.id]) {
            balancesByUser[member.id] = {
              userId: member.id,
              fullName: member.fullName,
              email: member.email,
              balance: 0,
              debts: [],
              credits: [],
              isCurrentUser: member.id === user.id
            };
          }
          
          // Kullanıcı için borç/alacak haritası oluştur
          if (!consolidatedDebts.has(member.id)) {
            consolidatedDebts.set(member.id, new Map<string, number>());
          }
        });
      });

      // Tüm gruplardan harcamaları topla ve borç/alacak ilişkilerini hesapla
      for (const group of userGroups) {
        const expenses = await firebaseService.getExpenses(group.id);
        
        // Her harcama için bakiyeleri hesapla
        expenses.forEach(expense => {
          const paidByUser = group.members.find(m => m.id === expense.paidBy);
          if (!paidByUser) return;

          // Harcamaya katılan kişileri belirle
          const participatingMembers = expense.participants.length > 0 
            ? expense.participants.map(p => group.members.find(m => m.id === p.userId)).filter(Boolean)
            : group.members;
          
          // Kişi başı payı hesapla
          const perPersonShare = expense.amount / participatingMembers.length;

          // Ödeme yapan kişinin alacaklarını hesapla
          participatingMembers.forEach(member => {
            if (!member || member.id === expense.paidBy) return;
            
            // Borç ilişkisini ilgili haritalara ekle
            // Borçlu -> Alacaklı -> Miktar şeklinde kaydet
            const debtorMap = consolidatedDebts.get(member.id);
            
            if (debtorMap) {
              const currentDebt = debtorMap.get(expense.paidBy) || 0;
              debtorMap.set(expense.paidBy, currentDebt + perPersonShare);
            }
          });
        });

        allExpenses.push(...expenses);
      }
      
      // Net borç/alacak ilişkilerini hesapla ve çift sayımları önle
      const allDebtDetails: DebtDetail[] = [];
      const processedPairs = new Set<string>();
      
      // Her kullanıcı için borç/alacak ilişkilerini oluştur
      consolidatedDebts.forEach((relationships, userId) => {
        const userBalance = balancesByUser[userId];
        if (!userBalance) return;
        
        relationships.forEach((amount, otherUserId) => {
          const otherUserBalance = balancesByUser[otherUserId];
          if (!otherUserBalance) return;
          
          // Çift işlemi önlemek için sıralı pair anahtarı oluştur
          const pairKey = [userId, otherUserId].sort().join('-');
          if (processedPairs.has(pairKey)) return;
          processedPairs.add(pairKey);
          
          // İki kullanıcı arasındaki karşılıklı borçları net hesapla
          const otherRelationships = consolidatedDebts.get(otherUserId);
          const reverseAmount = otherRelationships?.get(userId) || 0;
          
          // Net borç tutarını hesapla
          const netAmount = amount - reverseAmount;
          
          if (Math.abs(netAmount) > 0.01) { // Küçük farklılıkları göz ardı et
            let debtDetail: DebtDetail;
            
            if (netAmount > 0) {
              // İlk kullanıcı ikinci kullanıcıya borçlu
              debtDetail = {
                fromUserId: userId,
                fromUserName: userBalance.fullName,
                toUserId: otherUserId,
                toUserName: otherUserBalance.fullName,
                amount: netAmount
              };
              
              // Kullanıcı borç listelerini güncelle
              userBalance.debts.push(debtDetail);
              userBalance.balance -= netAmount;
              
              // Karşı tarafın alacak listesini güncelle
              const creditDetail = {
                fromUserId: userId,
                fromUserName: userBalance.fullName,
                toUserId: otherUserId,
                toUserName: otherUserBalance.fullName,
                amount: netAmount
              };
              otherUserBalance.credits.push(creditDetail);
              otherUserBalance.balance += netAmount;
            } else {
              // İkinci kullanıcı ilk kullanıcıya borçlu
              debtDetail = {
                fromUserId: otherUserId,
                fromUserName: otherUserBalance.fullName,
                toUserId: userId,
                toUserName: userBalance.fullName,
                amount: -netAmount
              };
              
              // Kullanıcı alacak listesini güncelle
              const creditDetail = {
                fromUserId: otherUserId,
                fromUserName: otherUserBalance.fullName,
                toUserId: userId,
                toUserName: userBalance.fullName,
                amount: -netAmount
              };
              userBalance.credits.push(creditDetail);
              userBalance.balance += (-netAmount);
              
              // Karşı tarafın borç listesini güncelle
              otherUserBalance.debts.push(debtDetail);
              otherUserBalance.balance -= (-netAmount);
            }
            
            allDebtDetails.push(debtDetail);
            
            // Toplam alacak/borç hesapla (sadece mevcut kullanıcı için)
            if (userId === user.id) {
              if (netAmount > 0) {
                totalPayable += netAmount;
              } else {
                totalReceivable += (-netAmount);
              }
            } else if (otherUserId === user.id) {
              if (netAmount > 0) {
                totalReceivable += netAmount;
              } else {
                totalPayable += (-netAmount);
              }
            }
          }
        });
      });

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
      
      // Borç detaylarını ayarla
      setDebtDetails(allDebtDetails);

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

  // Kullanıcı arasındaki borç/alacak durumunu gösteren bileşen
  const renderDebtDetail = (detail: DebtDetail, isDebt: boolean) => (
    <View style={styles.debtDetailItem} key={`${detail.fromUserId}-${detail.toUserId}`}>
      <View style={styles.debtDetailDirection}>
        <Text style={styles.debtUserName}>
          {isDebt ? 'Borçlusunuz' : 'Alacaklısınız'}
        </Text>
        <View style={styles.debtArrow}>
          <Ionicons 
            name={isDebt ? "arrow-forward" : "arrow-back"} 
            size={16} 
            color={isDebt ? COLORS.NEGATIVE : COLORS.POSITIVE} 
          />
        </View>
        <Text style={styles.debtUserName}>
          {isDebt ? detail.toUserName : detail.fromUserName}
        </Text>
      </View>
      <Text style={[
        styles.debtAmount,
        isDebt ? styles.negativeAmount : styles.positiveAmount
      ]}>
        {formatCurrency(detail.amount, balanceSummary.currency)}
      </Text>
    </View>
  );

  // Herhangi iki kullanıcı arasındaki borç/alacak durumunu gösteren bileşen
  const renderUserDebtDetail = (detail: DebtDetail) => (
    <View style={styles.userDebtDetailItem} key={`${detail.fromUserId}-${detail.toUserId}`}>
      <View style={styles.userDebtDetailDirection}>
        <Text style={styles.userDebtFromName}>{detail.fromUserName}</Text>
        <View style={styles.userDebtArrow}>
          <MaterialCommunityIcons 
            name="arrow-right-bold" 
            size={16} 
            color={COLORS.TEXT_GRAY} 
          />
        </View>
        <Text style={styles.userDebtToName}>{detail.toUserName}</Text>
      </View>
      <Text style={styles.userDebtAmount}>
        {formatCurrency(detail.amount, balanceSummary.currency)}
      </Text>
    </View>
  );

  const renderUserBalanceItem = ({ item }: { item: UserBalance }) => {
    // Geçerli kullanıcı ise daha detaylı bir kart göster
    if (item.isCurrentUser) {
      return (
        <View style={[styles.userCard, styles.currentUserCard]}>
          <LinearGradient
            colors={['#6a11cb', '#2575fc']}
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
                <Text style={styles.userName}>{item.fullName} (Siz)</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
              </View>
              <View style={[
                styles.userNetBalanceBadge, 
                item.balance >= 0 ? styles.positiveBadge : styles.negativeBadge
              ]}>
                <Text style={styles.userNetBalanceText}>
                  {item.balance >= 0 ? 'Net Alacak' : 'Net Borç'}
                </Text>
              </View>
            </View>
            
            <View style={styles.balanceContainer}>
              <Text style={[
                styles.balanceAmount,
                item.balance >= 0 ? styles.positiveAmount : styles.negativeAmount
              ]}>
                {formatCurrency(Math.abs(item.balance), balanceSummary.currency)}
              </Text>
            </View>

            {/* Borç detayları göster */}
            {item.debts.length > 0 && (
              <View style={styles.debtDetailsSection}>
                <Text style={styles.debtsSectionTitle}>Borçlarınız</Text>
                <View style={styles.debtDetailsList}>
                  {item.debts.map((debt, index) => (
                    <View style={styles.debtDetailItem} key={`debt-${debt.toUserId}-${index}`}>
                      <View style={styles.debtDetailDirection}>
                        <Text style={styles.debtUserName}>Borçlusunuz</Text>
                        <View style={styles.debtArrow}>
                          <Ionicons 
                            name="arrow-forward" 
                            size={16} 
                            color={COLORS.NEGATIVE} 
                          />
                        </View>
                        <Text style={styles.debtUserName}>{debt.toUserName}</Text>
                      </View>
                      <Text style={[styles.debtAmount, styles.negativeAmount]}>
                        {formatCurrency(debt.amount, balanceSummary.currency)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Alacak detayları göster */}
            {item.credits.length > 0 && (
              <View style={styles.debtDetailsSection}>
                <Text style={styles.creditsSectionTitle}>Alacaklarınız</Text>
                <View style={styles.debtDetailsList}>
                  {item.credits.map((credit, index) => (
                    <View style={styles.debtDetailItem} key={`credit-${credit.fromUserId}-${index}`}>
                      <View style={styles.debtDetailDirection}>
                        <Text style={styles.debtUserName}>Alacaklısınız</Text>
                        <View style={styles.debtArrow}>
                          <Ionicons 
                            name="arrow-back" 
                            size={16} 
                            color={COLORS.POSITIVE} 
                          />
                        </View>
                        <Text style={styles.debtUserName}>{credit.fromUserName}</Text>
                      </View>
                      <Text style={[styles.debtAmount, styles.positiveAmount]}>
                        {formatCurrency(credit.amount, balanceSummary.currency)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </LinearGradient>
        </View>
      );
    }
    
    // Diğer kullanıcılar için sadece özet göster
    return (
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
          
          <View style={styles.balanceRelationship}>
            {/* Bu kullanıcı ile doğrudan borç/alacak ilişkimizi göster */}
            {(() => {
              // Bu kullanıcının size olan toplam borcu (onun debts listesinden)
              const userOwesYou = item.debts
                .filter(d => d.toUserId === user?.id)
                .reduce((sum, debt) => sum + debt.amount, 0);
                
              // Sizin bu kullanıcıya olan toplam borcunuz (sizin debts listesinden)
              const youOweUser = item.credits
                .filter(c => c.fromUserId === user?.id)
                .reduce((sum, credit) => sum + credit.amount, 0);
                
              // Net ilişki hesapla
              const netAmount = userOwesYou - youOweUser;
              
              if (Math.abs(netAmount) > 0.01) {
                if (netAmount > 0) {
                  // Bu kullanıcı size borçlu
                  return (
                    <View style={styles.relationshipItem}>
                      <Text style={styles.relationshipLabel}>Size borcu:</Text>
                      <Text style={[styles.relationshipAmount, {color: COLORS.POSITIVE}]}>
                        {formatCurrency(netAmount, balanceSummary.currency)}
                      </Text>
                    </View>
                  );
                } else {
                  // Siz bu kullanıcıya borçlusunuz
                  return (
                    <View style={styles.relationshipItem}>
                      <Text style={styles.relationshipLabel}>Ona borcunuz:</Text>
                      <Text style={[styles.relationshipAmount, {color: COLORS.NEGATIVE}]}>
                        {formatCurrency(-netAmount, balanceSummary.currency)}
                      </Text>
                    </View>
                  );
                }
              }
              
              return null;
            })()}
        </View>
      </LinearGradient>
    </View>
  );
  };

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
  currentUserCard: {
    marginBottom: 24,
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
  userNetBalanceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  positiveBadge: {
    backgroundColor: 'rgba(52, 199, 89, 0.4)',
  },
  negativeBadge: {
    backgroundColor: 'rgba(243, 115, 112, 0.7)',
  },
  userNetBalanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.TEXT_LIGHT,
  },
  balanceContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  balanceStatus: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  debtDetailsSection: {
    marginTop: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  debtsSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.NEGATIVE,
    marginBottom: 8,
  },
  creditsSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.POSITIVE,
    marginBottom: 8,
  },
  debtDetailsList: {
    gap: 8,
  },
  debtDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  debtDetailDirection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  debtUserName: {
    fontSize: 14,
    color: COLORS.TEXT_LIGHT,
  },
  debtArrow: {
    marginHorizontal: 8,
  },
  debtAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  balanceRelationship: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  relationshipItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  relationshipLabel: {
    fontSize: 14,
    color: COLORS.TEXT_LIGHT,
  },
  relationshipAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_LIGHT,
  },
  userDebtDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  userDebtDetailDirection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userDebtFromName: {
    fontSize: 14,
    color: COLORS.TEXT_GRAY,
  },
  userDebtToName: {
    fontSize: 14,
    color: COLORS.TEXT_GRAY,
  },
  userDebtArrow: {
    marginHorizontal: 8,
  },
  userDebtAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_GRAY,
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
