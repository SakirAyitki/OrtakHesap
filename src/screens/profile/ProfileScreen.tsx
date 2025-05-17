import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
  Switch,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/color';
import { useAuth } from '../../hooks/useAuth';
import { firebaseService } from '../../services/firebaseService';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 20;
const CARD_WIDTH = width - (CARD_MARGIN * 2);

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    balanceAlerts: true,
    groupInvites: true,
  });

  const handleUpdateProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert('Hata', 'İsim alanı boş bırakılamaz');
      return;
    }

    try {
      setIsLoading(true);
      await updateUser({
        fullName: fullName.trim(),
      });
      Alert.alert('Başarılı', 'Profil bilgileriniz güncellendi');
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Hata', 'Profil güncellenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Hata', 'Tüm şifre alanları doldurulmalıdır');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Hata', 'Yeni şifreler eşleşmiyor');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Hata', 'Yeni şifre en az 6 karakter olmalıdır');
      return;
    }

    try {
      setIsLoading(true);
      await firebaseService.updatePassword(currentPassword, newPassword);
      Alert.alert('Başarılı', 'Şifreniz başarıyla güncellendi');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Şifre güncellenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleNotification = async (setting: keyof typeof notificationSettings) => {
    if (!user) return;

    try {
      const newSettings = {
        ...notificationSettings,
        [setting]: !notificationSettings[setting],
      };
      
      setNotificationSettings(newSettings);
      await firebaseService.updateNotificationSettings(user.id, newSettings);
    } catch (error) {
      setNotificationSettings(prevSettings => ({
        ...prevSettings,
        [setting]: !prevSettings[setting],
      }));
      Alert.alert('Hata', 'Bildirim ayarları güncellenirken bir hata oluştu');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profil</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profil Bilgileri */}
        <View style={styles.card}>
          <LinearGradient
            colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <View style={styles.profileSection}>
              <View style={styles.avatarOuterContainer}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                  style={styles.avatarContainer}
                >
                  <Text style={styles.avatarText}>
                    {user?.fullName?.charAt(0).toUpperCase() || '?'}
                  </Text>
                </LinearGradient>
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Ad Soyad</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color="rgba(255,255,255,0.8)" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, !isEditing && styles.disabledInput]}
                    value={fullName}
                    onChangeText={setFullName}
                    editable={isEditing}
                    placeholder="Ad Soyad"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>E-posta</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color="rgba(255,255,255,0.8)" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.disabledInput]}
                    value={email}
                    editable={false}
                    placeholder="E-posta"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  />
                </View>
              </View>

              {!isEditing ? (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setIsEditing(true)}
                >
                  <Ionicons name="create-outline" size={20} color={COLORS.TEXT_LIGHT} style={styles.buttonIcon} />
                  <Text style={styles.editButtonText}>Profili Düzenle</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.editActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={() => {
                      setIsEditing(false);
                      setFullName(user?.fullName || '');
                    }}
                  >
                    <Ionicons name="close-outline" size={20} color={COLORS.TEXT_LIGHT} style={styles.buttonIcon} />
                    <Text style={styles.cancelButtonText}>İptal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.saveButton]}
                    onPress={handleUpdateProfile}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color={COLORS.TEXT_LIGHT} />
                    ) : (
                      <>
                        <Ionicons name="checkmark-outline" size={20} color={COLORS.TEXT_LIGHT} style={styles.buttonIcon} />
                        <Text style={styles.saveButtonText}>Kaydet</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </LinearGradient>
        </View>

        {/* Şifre Değiştirme */}
        <View style={styles.card}>
          <LinearGradient
            colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <View style={styles.cardHeader}>
              <Ionicons name="lock-closed-outline" size={24} color={COLORS.TEXT_LIGHT} />
              <Text style={styles.cardTitle}>Şifre Değiştirme</Text>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mevcut Şifre</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="key-outline" size={20} color="rgba(255,255,255,0.8)" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                  placeholder="Mevcut şifrenizi girin"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Yeni Şifre</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.8)" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  placeholder="Yeni şifrenizi girin"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Yeni Şifre (Tekrar)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.8)" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  placeholder="Yeni şifrenizi tekrar girin"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.changePasswordButton,
                (!currentPassword || !newPassword || !confirmPassword) && styles.disabledButton
              ]}
              onPress={handleChangePassword}
              disabled={!currentPassword || !newPassword || !confirmPassword || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.TEXT_LIGHT} />
              ) : (
                <>
                  <Ionicons name="key" size={20} color={COLORS.TEXT_LIGHT} style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Şifreyi Değiştir</Text>
                </>
              )}
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Çıkış Yap */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={COLORS.TEXT_LIGHT} style={styles.buttonIcon} />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  content: {
    flex: 1,
    padding: CARD_MARGIN,
  },
  card: {
    width: CARD_WIDTH,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: COLORS.SHADOW,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  cardGradient: {
    padding: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_LIGHT,
    marginLeft: 12,
  },
  profileSection: {
    alignItems: 'center',
  },
  avatarOuterContainer: {
    padding: 3,
    borderRadius: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 84,
    height: 84,
    borderRadius: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.TEXT_LIGHT,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputIcon: {
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 12,
    fontSize: 16,
    color: COLORS.TEXT_LIGHT,
  },
  disabledInput: {
    opacity: 0.7,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 12,
  },
  buttonIcon: {
    marginRight: 8,
  },
  editButtonText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 16,
    fontWeight: '600',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: COLORS.POSITIVE,
    marginLeft: 8,
  },
  cancelButtonText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 16,
    fontWeight: '600',
  },
  changePasswordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.POSITIVE,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 42,
    padding: 16,
    backgroundColor: COLORS.NEGATIVE,
    borderRadius: 12,
  },
  logoutText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 16,
    fontWeight: '600',
  },
});