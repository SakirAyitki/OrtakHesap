import React, { useState, useCallback } from 'react';
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
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../utils/color';
import DropDownPicker from 'react-native-dropdown-picker';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GroupStackParamList } from '../../types/navigation.types';
import { dropdownStyles } from '../../utils/dropdownTheme';
import { firebaseService } from '../../services/firebaseService';
import { useAuth } from '../../hooks/useAuth';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type CreateGroupScreenNavigationProp = NativeStackNavigationProp<
  GroupStackParamList,
  'CreateGroup'
>;

type CurrencyType = 'TRY';
type SplitMethodType = 'equal';

type Member = {
  id: string;
  email: string;
  fullName?: string;
  photoURL?: string;
};

const { width } = Dimensions.get('window');
const CARD_MARGIN = 16;
const CARD_WIDTH = width - (CARD_MARGIN * 2);

export default function CreateGroupScreen() {
  const navigation = useNavigation<CreateGroupScreenNavigationProp>();
  const { user } = useAuth();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // Form adımı
  const [inviteEmail, setInviteEmail] = useState('');
  const [addedMembers, setAddedMembers] = useState<Member[]>([]);

  // Currency Picker State
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
  
  // E-posta doğrulama kontrolü
  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };
  
  // Üye ekleme fonksiyonu
  const handleAddMember = () => {
    if (!inviteEmail.trim()) {
      setError('Lütfen bir e-posta adresi girin');
      return;
    }
    
    if (!validateEmail(inviteEmail)) {
      setError('Lütfen geçerli bir e-posta adresi girin');
      return;
    }
    
    // Aynı e-postanın tekrar eklenmesini önle
    if (addedMembers.some(member => member.email === inviteEmail.trim())) {
      setError('Bu e-posta adresi zaten eklenmiş');
      return;
    }
    
    // Kendi e-postanızı eklemeyi engelle
    if (user?.email === inviteEmail.trim()) {
      setError('Kendinizi gruba zaten dahil edildiniz');
      return;
    }
    
    setAddedMembers([
      ...addedMembers, 
      { id: Date.now().toString(), email: inviteEmail.trim() }
    ]);
    setInviteEmail('');
    setError(null);
  };
  
  // Üye silme fonksiyonu
  const handleRemoveMember = (id: string) => {
    setAddedMembers(addedMembers.filter(member => member.id !== id));
  };

  // Form adımları arası geçiş
  const goToNextStep = () => {
    if (currentStep === 1) {
      // İlk adımdan sonra geçiş yapmadan önce grup adını kontrol et
      if (!name.trim()) {
        setError('Grup adı zorunludur');
        return;
      }
      setError(null);
    } else if (currentStep === 2) {
      // İkinci adımdan sonraki geçiş kontrolü
      setError(null);
    }
    setCurrentStep(currentStep + 1);
  };

  const goToPreviousStep = () => {
    setCurrentStep(currentStep - 1);
    setError(null);
  };

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
      
      // Grup üye listesi oluştur (grup sahibi dahil)
      const memberIds = [user.id];
      
      // Eklenen e-postaları kontrol et ve sistemde kayıtlı olanları gruba ekle
      const foundMembers: string[] = [];
      const notFoundEmails: string[] = [];
      
      if (addedMembers.length > 0) {
        console.log('Checking added members:', addedMembers.map(m => m.email));
        
        for (const member of addedMembers) {
          try {
            // E-posta ile kullanıcı arama yap
            const users = await firebaseService.searchUsers(member.email.trim());
            if (users.length > 0) {
              const foundUser = users[0];
              // Kullanıcı zaten listede var mı kontrol et
              if (!memberIds.includes(foundUser.id)) {
                memberIds.push(foundUser.id);
                foundMembers.push(foundUser.email);
                console.log('Found and added user:', foundUser.email);
              }
            } else {
              notFoundEmails.push(member.email);
              console.log('User not found:', member.email);
            }
          } catch (searchError) {
            console.error('Error searching user:', member.email, searchError);
            notFoundEmails.push(member.email);
          }
        }
      }
      
      const newGroup = {
        name: name.trim(),
        description: description.trim(),
        currency,
        splitMethod,
        createdBy: user.id,
        members: memberIds,
        balance: 0,
        settings: {
          autoApproveExpenses: true,
          allowMemberInvite: true,
        },
        status: 'active' as const,
      };

      console.log('New group data:', newGroup);
      console.log('Final member IDs:', memberIds);
      
      const groupId = await firebaseService.createGroup(newGroup);
      console.log('Group created successfully with ID:', groupId);
      
      // Başarı mesajı oluştur
      let successMessage = 'Grup başarıyla oluşturuldu.';
      if (foundMembers.length > 0) {
        successMessage += `\n\n${foundMembers.length} üye gruba eklendi:\n${foundMembers.join(', ')}`;
      }
      if (notFoundEmails.length > 0) {
        successMessage += `\n\n${notFoundEmails.length} e-posta sistemde bulunamadı:\n${notFoundEmails.join(', ')}\n\nBu kişileri daha sonra davet edebilirsiniz.`;
      }
      
      // Başarı mesajı göster
      Alert.alert(
        'Grup Oluşturuldu',
        successMessage,
        [
          { text: 'Tamam', onPress: () => navigation.navigate('GroupList') }
        ]
      );
    } catch (error) {
      console.error('Error creating group:', error);
      setError('Grup oluşturulurken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  // Dropdown menüler açıkken z-index yönetimi
  const zIndexValue = () => {
    if (splitMethodOpen) return 1000;
    return 1;
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="chevron-back" size={24} color={COLORS.TEXT_LIGHT} />
      </TouchableOpacity>
      <Text style={styles.title}>Yeni Grup</Text>
      <View style={styles.headerRight} />
    </View>
  );

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <View style={styles.stepContainer}>
        <View style={[styles.stepDot, currentStep >= 1 && styles.activeStepDot]}>
          <Text style={[styles.stepNumber, currentStep >= 1 && styles.activeStepNumber]}>1</Text>
        </View>
        <Text style={[styles.stepTitle, currentStep >= 1 && styles.activeStepTitle]}>Temel Bilgiler</Text>
      </View>
      <View style={styles.stepLine} />
      <View style={styles.stepContainer}>
        <View style={[styles.stepDot, currentStep >= 2 && styles.activeStepDot]}>
          <Text style={[styles.stepNumber, currentStep >= 2 && styles.activeStepNumber]}>2</Text>
        </View>
        <Text style={[styles.stepTitle, currentStep >= 2 && styles.activeStepTitle]}>Üyeler</Text>
      </View>
      <View style={styles.stepLine} />
      <View style={styles.stepContainer}>
        <View style={[styles.stepDot, currentStep >= 3 && styles.activeStepDot]}>
          <Text style={[styles.stepNumber, currentStep >= 3 && styles.activeStepNumber]}>3</Text>
        </View>
        <Text style={[styles.stepTitle, currentStep >= 3 && styles.activeStepTitle]}>Finans Ayarları</Text>
      </View>
    </View>
  );

  const renderFormStep1 = () => (
    <View style={styles.formCard}>
      <LinearGradient
        colors={['#ffffff', '#f5f5f7']}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
          <MaterialIcons name="group-add" size={24} color={COLORS.PRIMARY} />
          <Text style={styles.cardTitle}>Grup Detayları</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Grup Adı</Text>
          <View style={styles.inputWrapper}>
            <MaterialIcons 
              name="group" 
              size={22} 
              color={COLORS.TEXT_GRAY} 
              style={styles.inputIcon} 
            />
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Örn: Ev Arkadaşları"
              placeholderTextColor={COLORS.TEXT_GRAY}
            />
          </View>
          <Text style={styles.inputHelper}>Grup arkadaşlarınızın kolayca tanıyabileceği bir ad seçin</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Açıklama (Opsiyonel)</Text>
          <View style={styles.textAreaWrapper}>
            <TextInput
              style={styles.textArea}
              value={description}
              onChangeText={setDescription}
              placeholder="Grup amacı ve içeriğini açıklayın"
              placeholderTextColor={COLORS.TEXT_GRAY}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
          <Text style={styles.inputHelper}>
            Grubun amacını veya nasıl kullanılacağını açıklayın
          </Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color={COLORS.NEGATIVE} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={goToNextStep}
        >
          <Text style={styles.actionButtonText}>Devam Et</Text>
          <Ionicons name="arrow-forward" size={22} color={COLORS.TEXT_LIGHT} />
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  const renderFormStep2 = () => (
    <View style={styles.formCard}>
      <LinearGradient
        colors={['#ffffff', '#f5f5f7']}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
          <MaterialIcons name="people" size={24} color={COLORS.PRIMARY} />
          <Text style={styles.cardTitle}>Grup Üyeleri</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Gruba üye eklemek için e-posta adreslerini girebilirsiniz. Daha sonra da üye ekleyebilirsiniz.
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>E-posta Adresi</Text>
          <View style={styles.inputWrapper}>
            <MaterialIcons 
              name="email" 
              size={22} 
              color={COLORS.TEXT_GRAY} 
              style={styles.inputIcon} 
            />
            <TextInput
              style={styles.input}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              placeholder="ornek@email.com"
              placeholderTextColor={COLORS.TEXT_GRAY}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <Text style={styles.inputHelper}>
            Gruba eklemek istediğiniz kişinin e-posta adresini girin
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddMember}
        >
          <Ionicons name="add-circle-outline" size={20} color={COLORS.TEXT_LIGHT} />
          <Text style={styles.addButtonText}>Üye Ekle</Text>
        </TouchableOpacity>

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color={COLORS.NEGATIVE} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {addedMembers.length > 0 && (
          <View style={styles.membersContainer}>
            <Text style={styles.membersTitle}>Eklenen Üyeler ({addedMembers.length})</Text>
            <FlatList
              data={addedMembers}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={styles.memberItem}>
                  <View style={styles.memberInfo}>
                    <MaterialIcons name="person" size={20} color={COLORS.PRIMARY} />
                    <Text style={styles.memberEmail}>{item.email}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeMemberButton}
                    onPress={() => handleRemoveMember(item.id)}
                  >
                    <Ionicons name="close-circle" size={22} color={COLORS.NEGATIVE} />
                  </TouchableOpacity>
                </View>
              )}
              scrollEnabled={false}
              style={styles.membersList}
            />
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.backActionButton}
            onPress={goToPreviousStep}
          >
            <Ionicons name="arrow-back" size={22} color={COLORS.PRIMARY} />
            <Text style={styles.backActionButtonText}>Geri Dön</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={goToNextStep}
          >
            <Text style={styles.actionButtonText}>Devam Et</Text>
            <Ionicons name="arrow-forward" size={22} color={COLORS.TEXT_LIGHT} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  const renderFormStep3 = () => (
    <View style={[styles.formCard, { zIndex: zIndexValue() }]}>
      <LinearGradient
        colors={['#ffffff', '#f5f5f7']}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
          <MaterialIcons name="settings" size={24} color={COLORS.PRIMARY} />
          <Text style={styles.cardTitle}>Finans Ayarları</Text>
        </View>

        <View style={[styles.inputContainer]}>
          <Text style={styles.label}>Para Birimi</Text>
          <View style={styles.currencyContainer}>
            <View style={styles.currencyItem}>
              <MaterialIcons name="payment" size={22} color={COLORS.PRIMARY} style={styles.currencyIcon} />
              <Text style={styles.currencyText}>Türk Lirası (₺)</Text>
            </View>
          </View>
          <Text style={styles.inputHelper}>
            Şu an için sadece Türk Lirası desteklenmektedir
          </Text>
        </View>

        <View style={[styles.inputContainer, { zIndex: 1000 }]}>
          <Text style={styles.label}>Harcama Bölüşme Yöntemi</Text>
          <DropDownPicker
            open={splitMethodOpen}
            value={splitMethod}
            items={splitMethodItems}
            setOpen={setSplitMethodOpen}
            setValue={setSplitMethod}
            {...dropdownStyles}
            style={[dropdownStyles.style, styles.dropdown]}
            dropDownContainerStyle={[dropdownStyles.dropDownContainerStyle, styles.dropdownContainer]}
            placeholder="Bölüşme yöntemi seçin"
          />
          <Text style={styles.inputHelper}>
            Tüm harcamalar eşit olarak bölüşülecek
          </Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color={COLORS.NEGATIVE} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.backActionButton}
            onPress={goToPreviousStep}
          >
            <Ionicons name="arrow-back" size={22} color={COLORS.PRIMARY} />
            <Text style={styles.backActionButtonText}>Geri Dön</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, isLoading && styles.disabledButton]}
            onPress={handleCreate}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <ActivityIndicator size="small" color={COLORS.TEXT_LIGHT} style={{ marginRight: 8 }} />
                <Text style={styles.actionButtonText}>
                  {addedMembers.length > 0 ? 'Üyeler kontrol ediliyor...' : 'Grup oluşturuluyor...'}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.actionButtonText}>Grubu Oluştur</Text>
                <Ionicons name="checkmark-circle" size={22} color={COLORS.TEXT_LIGHT} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
        keyboardVerticalOffset={100}
      >
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {renderStepIndicator()}
          
          {currentStep === 1 && renderFormStep1()}
          {currentStep === 2 && renderFormStep2()}
          {currentStep === 3 && renderFormStep3()}
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.TEXT_LIGHT,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 44,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 24,
  },
  stepContainer: {
    alignItems: 'center',
    width: 90,
  },
  stepDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.TERTIARY,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.BORDER,
    marginBottom: 8,
  },
  activeStepDot: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_GRAY,
  },
  activeStepNumber: {
    color: COLORS.TEXT_LIGHT,
  },
  stepTitle: {
    fontSize: 12,
    color: COLORS.TEXT_GRAY,
    textAlign: 'center',
  },
  activeStepTitle: {
    color: COLORS.TEXT_DARK,
    fontWeight: '600',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.BORDER,
    marginHorizontal: 10,
    marginBottom: 8,
  },
  formCard: {
    width: CARD_WIDTH,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
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
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 12,
    fontSize: 16,
    color: COLORS.TEXT_DARK,
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
  inputHelper: {
    fontSize: 12,
    color: COLORS.TEXT_GRAY,
    marginTop: 4,
    marginLeft: 4,
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
  actionButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    flex: 1,
    maxWidth: '55%',
  },
  actionButtonText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  backActionButton: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
    flex: 1,
    maxWidth: '40%',
  },
  backActionButtonText: {
    color: COLORS.PRIMARY,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  createButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    flex: 1,
    maxWidth: '55%',
  },
  createButtonText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  dropdown: {
    borderRadius: 12,
    borderColor: COLORS.BORDER,
  },
  dropdownContainer: {
    borderRadius: 12,
    borderColor: COLORS.BORDER,
  },
  infoBox: {
    padding: 16,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 12,
    marginBottom: 20,
  },
  infoText: {
    color: COLORS.TEXT_DARK,
    fontSize: 14,
  },
  addButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  membersContainer: {
    marginVertical: 20,
  },
  membersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_DARK,
    marginBottom: 12,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    marginBottom: 8,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberEmail: {
    fontSize: 15,
    color: COLORS.TEXT_DARK,
    marginLeft: 8,
    flex: 1,
  },
  removeMemberButton: {
    padding: 4,
  },
  membersList: {
    maxHeight: 200,
  },
  currencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.WHITE,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  currencyIcon: {
    marginRight: 8,
  },
  currencyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_DARK,
  },
}); 