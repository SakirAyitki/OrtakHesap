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

type CreateExpenseScreenNavigationProp = NativeStackNavigationProp<
  GroupStackParamList,
  'CreateExpense'
>;

type CreateExpenseScreenRouteProp = RouteProp<
  GroupStackParamList,
  'CreateExpense'
>;

type CurrencyType = 'TRY' | 'USD' | 'EUR';
type SplitMethodType = 'equal' | 'percentage' | 'amount';

export default function CreateExpenseScreen() {
  const navigation = useNavigation<CreateExpenseScreenNavigationProp>();
  const route = useRoute<CreateExpenseScreenRouteProp>();
  const { groupId } = route.params;
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);

  // Grup üyelerini getir
  useEffect(() => {
    const fetchGroupMembers = async () => {
      try {
        const group = await firebaseService.getGroupById(groupId);
        if (group?.members) {
          setGroupMembers(group.members);
        }
      } catch (error) {
        console.error('Error fetching group members:', error);
      }
    };

    fetchGroupMembers();
  }, [groupId]);

  // Currency Picker State
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [currency, setCurrency] = useState<CurrencyType>('TRY');
  const [currencyItems] = useState([
    { label: 'Türk Lirası (₺)', value: 'TRY' },
    { label: 'Amerikan Doları ($)', value: 'USD' },
    { label: 'Euro (€)', value: 'EUR' },
  ]);

  // Split Method Picker State
  const [splitMethodOpen, setSplitMethodOpen] = useState(false);
  const [splitMethod, setSplitMethod] = useState<SplitMethodType>('equal');
  const [splitMethodItems] = useState([
    { label: 'Eşit Bölüşüm', value: 'equal' },
    { label: 'Yüzdesel Bölüşüm', value: 'percentage' },
    { label: 'Manuel Bölüşüm', value: 'amount' },
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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView style={styles.content}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Harcama Başlığı</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Örn: Market Alışverişi"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Açıklama (Opsiyonel)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Harcama hakkında detaylı açıklama"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Tutar</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
          </View>

          <View style={[styles.inputContainer, { zIndex: 3 }]}>
            <Text style={styles.label}>Para Birimi</Text>
            <DropDownPicker
              open={currencyOpen}
              value={currency}
              items={currencyItems}
              setOpen={setCurrencyOpen}
              setValue={setCurrency}
              {...dropdownStyles}
              placeholder="Para birimi seçin"
            />
          </View>

          <View style={[styles.inputContainer, { zIndex: 2 }]}>
            <Text style={styles.label}>Bölüşme Yöntemi</Text>
            <DropDownPicker
              open={splitMethodOpen}
              value={splitMethod}
              items={splitMethodItems}
              setOpen={setSplitMethodOpen}
              setValue={setSplitMethod}
              {...dropdownStyles}
              placeholder="Bölüşme yöntemi seçin"
            />
          </View>

          <View style={[styles.inputContainer, { zIndex: 1 }]}>
            <Text style={styles.label}>Kategori</Text>
            <DropDownPicker
              open={categoryOpen}
              value={category}
              items={categoryItems}
              setOpen={setCategoryOpen}
              setValue={setCategory}
              {...dropdownStyles}
              placeholder="Kategori seçin"
            />
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

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
              <Text style={styles.buttonText}>Harcama Oluştur</Text>
            )}
          </TouchableOpacity>
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
  content: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.TEXT_DARK,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  createButton: {
    backgroundColor: COLORS.PRIMARY,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: COLORS.NEGATIVE,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
}); 