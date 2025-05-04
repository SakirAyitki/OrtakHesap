import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GroupStackParamList } from '../../types/navigation.types';
import { firebaseService } from '../../services/firebaseService';
import { Expense } from '../../types/expense.types';
import { COLORS } from '../../utils/color';
import { EXPENSE_CATEGORIES, ExpenseCategory } from '../../utils/constants';
import { Picker } from '@react-native-picker/picker';

type EditExpenseScreenNavigationProp = NativeStackNavigationProp<
  GroupStackParamList,
  'EditExpense'
>;

type EditExpenseScreenRouteProp = RouteProp<
  GroupStackParamList,
  'EditExpense'
>;

export default function EditExpenseScreen() {
  const navigation = useNavigation<EditExpenseScreenNavigationProp>();
  const route = useRoute<EditExpenseScreenRouteProp>();
  const { groupId, expense: initialExpense } = route.params;

  const [title, setTitle] = useState(initialExpense.title);
  const [description, setDescription] = useState(initialExpense.description || '');
  const [amount, setAmount] = useState(initialExpense.amount.toString());
  const [currency, setCurrency] = useState(initialExpense.currency);
  const [category, setCategory] = useState(initialExpense.category);
  const [splitMethod, setSplitMethod] = useState(initialExpense.splitMethod);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Başlık alanı zorunludur');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Geçerli bir tutar giriniz');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedExpense: Partial<Expense> = {
        title: title.trim(),
        description: description.trim(),
        amount: amountNum,
        currency,
        category,
        splitMethod,
        updatedAt: new Date().toISOString(),
      };

      await firebaseService.updateExpense(groupId, initialExpense.id, updatedExpense);
      navigation.goBack();
    } catch (error) {
      console.error('Error updating expense:', error);
      setError('Harcama güncellenirken bir hata oluştu');
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
          {/* Title Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Başlık</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Harcama başlığı"
              placeholderTextColor={COLORS.TEXT_GRAY}
            />
          </View>

          {/* Description Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Açıklama (Opsiyonel)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Harcama açıklaması"
              placeholderTextColor={COLORS.TEXT_GRAY}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Amount and Currency Input */}
          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 2 }]}>
              <Text style={styles.label}>Tutar</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={COLORS.TEXT_GRAY}
              />
            </View>

            <View style={[styles.inputContainer, { flex: 1, marginLeft: 12 }]}>
              <Text style={styles.label}>Para Birimi</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={currency}
                  onValueChange={(value) => setCurrency(value)}
                  style={styles.picker}
                >
                  <Picker.Item label="TRY" value="TRY" />
                  <Picker.Item label="USD" value="USD" />
                  <Picker.Item label="EUR" value="EUR" />
                </Picker>
              </View>
            </View>
          </View>

          {/* Category Picker */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Kategori</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={category}
                onValueChange={(value) => setCategory(value)}
                style={styles.picker}
              >
                {EXPENSE_CATEGORIES.map((cat: ExpenseCategory) => (
                  <Picker.Item key={cat} label={cat} value={cat} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Split Method Picker */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Bölüşüm Yöntemi</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={splitMethod}
                onValueChange={(value) => setSplitMethod(value)}
                style={styles.picker}
              >
                <Picker.Item label="Eşit" value="equal" />
                <Picker.Item label="Yüzdesel" value="percentage" />
                <Picker.Item label="Manuel" value="amount" />
              </Picker>
            </View>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.disabledButton]}
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={COLORS.TEXT_LIGHT} />
            ) : (
              <Text style={styles.saveButtonText}>Kaydet</Text>
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
    flex: 1,
    padding: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: COLORS.TEXT_DARK,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: COLORS.TERTIARY,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.TEXT_DARK,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pickerContainer: {
    backgroundColor: COLORS.TERTIARY,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    color: COLORS.TEXT_DARK,
  },
  saveButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  disabledButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: COLORS.NEGATIVE,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
}); 