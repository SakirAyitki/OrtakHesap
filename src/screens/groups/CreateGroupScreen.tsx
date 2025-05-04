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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../utils/color';
import DropDownPicker from 'react-native-dropdown-picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GroupStackParamList } from '../../types/navigation.types';
import { dropdownStyles } from '../../utils/dropdownTheme';
import { firebaseService } from '../../services/firebaseService';
import { useAuth } from '../../hooks/useAuth';

type CreateGroupScreenNavigationProp = NativeStackNavigationProp<
  GroupStackParamList,
  'CreateGroup'
>;

type CurrencyType = 'TRY' | 'USD' | 'EUR';
type SplitMethodType = 'equal' | 'percentage' | 'amount';

export default function CreateGroupScreen() {
  const navigation = useNavigation<CreateGroupScreenNavigationProp>();
  const { user } = useAuth();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Grup adı zorunludur');
      return;
    }

    if (!user) {
      setError('Kullanıcı oturumu bulunamadı');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Creating new group with user:', user.id);
      const newGroup = {
        name: name.trim(),
        description: description.trim(),
        currency,
        splitMethod,
        createdBy: user.id,
        members: [user.id],
        balance: 0,
        settings: {
          autoApproveExpenses: true,
          allowMemberInvite: true,
        },
        status: 'active' as const,
      };

      console.log('New group data:', newGroup);
      const groupId = await firebaseService.createGroup(newGroup);
      console.log('Group created successfully with ID:', groupId);
      
      // Grup oluşturulduktan sonra detaylarını kontrol et
      const createdGroup = await firebaseService.getGroupById(groupId);
      console.log('Created group details:', createdGroup);

      navigation.navigate('GroupList');
    } catch (error) {
      console.error('Error creating group:', error);
      setError('Grup oluşturulurken bir hata oluştu');
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
              <Text style={styles.buttonText}>Grup Oluştur</Text>
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