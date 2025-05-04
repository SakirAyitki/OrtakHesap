import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../utils/color';
import DropDownPicker from 'react-native-dropdown-picker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GroupStackParamList } from '../../types/navigation.types';
import { Group } from '../../types/group.types';
import { dropdownStyles } from '../../utils/dropdownTheme';

type GroupEditScreenNavigationProp = NativeStackNavigationProp<
  GroupStackParamList,
  'EditGroup'
>;

type GroupEditScreenRouteProp = RouteProp<
  GroupStackParamList,
  'EditGroup'
>;

type CurrencyType = 'TRY' | 'USD' | 'EUR';
type SplitMethodType = 'equal' | 'percentage' | 'amount';

export default function GroupEditScreen() {
  const navigation = useNavigation<GroupEditScreenNavigationProp>();
  const route = useRoute<GroupEditScreenRouteProp>();
  const { group } = route.params;

  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description || '');
  const [error, setError] = useState<string | null>(null);

  // Currency Picker State
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [currency, setCurrency] = useState<CurrencyType>(group.currency);
  const [currencyItems] = useState([
    { label: 'Türk Lirası (₺)', value: 'TRY' },
    { label: 'Amerikan Doları ($)', value: 'USD' },
    { label: 'Euro (€)', value: 'EUR' },
  ]);

  // Split Method Picker State
  const [splitMethodOpen, setSplitMethodOpen] = useState(false);
  const [splitMethod, setSplitMethod] = useState<SplitMethodType>(group.splitMethod);
  const [splitMethodItems] = useState([
    { label: 'Eşit Bölüşüm', value: 'equal' },
    { label: 'Yüzdesel Bölüşüm', value: 'percentage' },
    { label: 'Manuel Bölüşüm', value: 'amount' },
  ]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Grup adı zorunludur');
      return;
    }

    try {
      // TODO: Implement group update
      navigation.goBack();
    } catch (error) {
      setError('Grup güncellenirken bir hata oluştu');
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
            <Text style={styles.label}>Grup Adı</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Örn: Ev Arkadaşları"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Açıklama (Opsiyonel)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Grup hakkında kısa bir açıklama"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={[styles.inputContainer, { zIndex: 2 }]}>
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

          <View style={[styles.inputContainer, { zIndex: 1 }]}>
            <Text style={styles.label}>Harcama Bölüşme Yöntemi</Text>
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

          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSave}
          >
            <Text style={styles.buttonText}>Değişiklikleri Kaydet</Text>
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
  saveButton: {
    backgroundColor: COLORS.PRIMARY,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: {
    color: COLORS.TEXT_DARK,
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