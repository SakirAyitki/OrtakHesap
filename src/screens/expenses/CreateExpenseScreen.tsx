import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../utils/color';
import DropDownPicker from 'react-native-dropdown-picker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GroupStackParamList } from '../../types/navigation.types';
import { firebaseService } from '../../services/firebaseService';
import { EXPENSE_CATEGORIES } from '../../types/expense.types';
import { useAuth } from '../../hooks/useAuth';
import { dropdownStyles } from '../../utils/dropdownTheme';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type CreateExpenseScreenNavigationProp = NativeStackNavigationProp<
  GroupStackParamList,
  'CreateExpense'
>;

type CreateExpenseScreenRouteProp = RouteProp<
  GroupStackParamList,
  'CreateExpense'
>;

type CurrencyType = 'TRY';
type SplitMethodType = 'equal';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 16;
const CARD_WIDTH = width - (CARD_MARGIN * 2);

export default function CreateExpenseScreen() {
  const navigation = useNavigation<CreateExpenseScreenNavigationProp>();
  const route = useRoute<CreateExpenseScreenRouteProp>();
  const { groupId } = route.params;
  const { user } = useAuth();

  // React Navigation'ın varsayılan header'ını gizle
  useEffect(() => {
    navigation.setOptions({
      headerShown: false
    });
  }, [navigation]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [groupName, setGroupName] = useState<string>('');

  // Grup üyelerini getir
  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        const group = await firebaseService.getGroupById(groupId);
        if (group?.members) {
          setGroupMembers(group.members);
        }
        if (group?.name) {
          setGroupName(group.name);
        }
      } catch (error) {
        console.error('Error fetching group details:', error);
      }
    };

    fetchGroupDetails();
  }, [groupId]);

  // Currency Picker State
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [currency, setCurrency] = useState<CurrencyType>('TRY');
  const [currencyItems] = useState([
    { label: 'Türk Lirası (₺)', value: 'TRY' },
  ]);

  // Split Method Picker State
  const [splitMethodOpen, setSplitMethodOpen] = useState(false);
  const [splitMethod, setSplitMethod] = useState<SplitMethodType>('equal');
  const [splitMethodItems] = useState([
    { label: 'Eşit Bölüşüm', value: 'equal' },
  ]);

  // Category Picker State
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [categoryItems] = useState(
    EXPENSE_CATEGORIES.map(cat => ({ label: cat, value: cat }))
  );

  const handleCreate = async () => {
    if (!title.trim()) {
      setError('Harcama başlığı zorunludur');
      return;
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Geçerli bir tutar giriniz');
      return;
    }

    if (!user) {
      setError('Kullanıcı oturumu bulunamadı');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Grup üyelerinden katılımcı listesi oluştur
      const participants = groupMembers.map(member => ({
        userId: member.id,
        share: 0, // Bu değer bölüşüm metoduna göre hesaplanacak
        paid: member.id === user?.id, // Ödeyen kişi ödemiş olarak işaretlenir
      }));

      const expenseData = {
        groupId,
        title: title.trim(),
        description: description.trim(),
        amount: Number(amount),
        currency,
        paidBy: user.id,
        splitMethod,
        category,
        date: new Date(),
        participants: participants,
        status: 'pending' as const,
      };

      const expenseId = await firebaseService.createExpense(groupId, expenseData);
      navigation.navigate('ExpenseDetails', { groupId, expenseId });
    } catch (error) {
      console.error('Error creating expense:', error);
      setError('Harcama oluşturulurken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  // DropDownPicker açıkken z-index yönetimi
  const getZIndexStyle = (pickerOpen: boolean, baseIndex: number) => {
    return {
      zIndex: pickerOpen ? 1000 - baseIndex : 10 - baseIndex
    };
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.TEXT_LIGHT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yeni Harcama</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Grup Bilgisi */}
      <View style={styles.groupInfoContainer}>
        <MaterialIcons name="group" size={18} color={COLORS.PRIMARY} />
        <Text style={styles.groupInfoText}>
          Grup: <Text style={styles.groupNameText}>{groupName}</Text>
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
        keyboardVerticalOffset={90}
      >
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Form Card */}
          <View style={styles.formCard}>
            <LinearGradient
              colors={['#ffffff', '#f5f5f7']}
              style={styles.cardGradient}
            >
              <View style={styles.cardHeader}>
                <MaterialIcons name="receipt-long" size={24} color={COLORS.PRIMARY} />
                <Text style={styles.cardTitle}>Harcama Detayları</Text>
              </View>

              {/* Başlık */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Harcama Başlığı</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons 
                    name="title" 
                    size={22} 
                    color={COLORS.TEXT_GRAY} 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    style={styles.input}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Örn: Market Alışverişi"
                    placeholderTextColor={COLORS.TEXT_GRAY}
                  />
                </View>
                <Text style={styles.inputHelper}>
                  Harcamanın amacını kısa ve anlaşılır bir şekilde belirtin
                </Text>
              </View>

              {/* Tutar ve Para Birimi */}
              <View style={styles.rowContainer}>
                {/* Tutar */}
                <View style={[styles.inputContainer, { flex: 2, marginRight: 8 }]}>
                  <Text style={styles.label}>Tutar</Text>
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputIcon}>
                      <Text style={styles.inputCurrencySymbol}>₺</Text>
                    </View>
                    <TextInput
                      style={styles.input}
                      value={amount}
                      onChangeText={setAmount}
                      placeholder="0.00"
                      keyboardType="decimal-pad"
                      placeholderTextColor={COLORS.TEXT_GRAY}
                    />
                  </View>
                </View>
                
                {/* Para Birimi */}
                <View style={[
                  styles.inputContainer, 
                  { flex: 1 }
                ]}>
                  <Text style={styles.label}>Para Birimi</Text>
                  <View style={styles.currencyContainer}>
                    <Text style={styles.currencySymbol}>₺</Text>
                    <Text style={styles.currencyText}>Türk Lirası</Text>
                  </View>
                </View>
              </View>

              {/* Kategori */}
              <View style={[
                styles.inputContainer,
                getZIndexStyle(categoryOpen, 2)
              ]}>
                <Text style={styles.label}>Kategori</Text>
                <DropDownPicker
                  open={categoryOpen}
                  value={category}
                  items={categoryItems}
                  setOpen={setCategoryOpen}
                  setValue={setCategory}
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropdownContainer}
                  placeholder="Kategori seçin"
                  ListEmptyComponent={() => (
                    <Text style={styles.emptyListText}>Kategori bulunamadı</Text>
                  )}
                />
                <Text style={styles.inputHelper}>
                  Harcamanızın kategorisini seçin
                </Text>
              </View>

              {/* Bölüşme Yöntemi */}
              <View style={[
                styles.inputContainer,
                getZIndexStyle(splitMethodOpen, 3)
              ]}>
                <Text style={styles.label}>Bölüşme Yöntemi</Text>
                <DropDownPicker
                  open={splitMethodOpen}
                  value={splitMethod}
                  items={splitMethodItems}
                  setOpen={setSplitMethodOpen}
                  setValue={setSplitMethod}
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropdownContainer}
                  placeholder="Bölüşme yöntemi seçin"
                />
                <Text style={styles.inputHelper}>
                  Tüm harcamalar grup üyeleri arasında eşit bölüşülecek
                </Text>
              </View>

              {/* Açıklama */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Açıklama (Opsiyonel)</Text>
                <View style={styles.textAreaWrapper}>
                  <TextInput
                    style={styles.textArea}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Harcama hakkında detaylı açıklama yazabilirsiniz..."
                    placeholderTextColor={COLORS.TEXT_GRAY}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </View>

              {/* Hata mesajı */}
              {error && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={20} color={COLORS.NEGATIVE} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Oluştur Button */}
              <TouchableOpacity 
                style={[
                  styles.createButton,
                  isLoading && styles.disabledButton
                ]}
                onPress={handleCreate}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={COLORS.TEXT_LIGHT} />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Harcama Oluştur</Text>
                    <Ionicons name="checkmark" size={20} color={COLORS.TEXT_LIGHT} style={styles.buttonIcon} />
                  </>
                )}
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  flex: {
    flex: 1,
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
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.TEXT_LIGHT,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 44,
  },
  groupInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  groupInfoText: {
    fontSize: 14,
    color: COLORS.TEXT_DARK,
    marginLeft: 8,
  },
  groupNameText: {
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 0,
  },
  formCard: {
    width: CARD_WIDTH,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
    shadowColor: COLORS.SHADOW,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  cardGradient: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_DARK,
    marginLeft: 12,
  },
  inputContainer: {
    marginBottom: 20,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.WHITE,
  },
  inputIcon: {
    padding: 12,
  },
  inputCurrencySymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_GRAY,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 12,
    fontSize: 16,
    color: COLORS.TEXT_DARK,
  },
  inputHelper: {
    fontSize: 12,
    color: COLORS.TEXT_GRAY,
    marginTop: 4,
    marginLeft: 4,
  },
  textAreaWrapper: {
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.WHITE,
  },
  textArea: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.TEXT_DARK,
    minHeight: 100,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    backgroundColor: COLORS.WHITE,
  },
  dropdownContainer: {
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    backgroundColor: COLORS.WHITE,
  },
  emptyListText: {
    padding: 10,
    textAlign: 'center',
    color: COLORS.TEXT_GRAY,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.NEGATIVE_LIGHT,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.NEGATIVE,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  createButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  currencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    padding: 12,
    backgroundColor: COLORS.WHITE,
    height: 48,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginRight: 8,
  },
  currencyText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.TEXT_DARK,
  },
}); 