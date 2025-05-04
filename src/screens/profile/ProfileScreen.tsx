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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/color';
import { useAuth } from '../../hooks/useAuth';
import { firebaseService } from '../../services/firebaseService';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 16;
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

      <ScrollView style={styles.content}>
        {/* Profil Bilgileri */}
        <View style={styles.card}>
          <LinearGradient
            colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <View style={styles.profileSection}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {user?.fullName?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Ad Soyad</Text>
                <TextInput
                  style={[styles.input, !isEditing && styles.disabledInput]}
                  value={fullName}
                  onChangeText={setFullName}
                  editable={isEditing}
                  placeholder="Ad Soyad"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>E-posta</Text>
                <TextInput
                  style={[styles.input, styles.disabledInput]}
                  value={email}
                  editable={false}
                  placeholder="E-posta"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                />
              </View>

              {!isEditing ? (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setIsEditing(true)}
                >
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
                      <Text style={styles.saveButtonText}>Kaydet</Text>
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
            <Text style={styles.cardTitle}>Şifre Değiştirme</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mevcut Şifre</Text>
              <TextInput
                style={styles.input}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                placeholder="Mevcut şifrenizi girin"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Yeni Şifre</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder="Yeni şifrenizi girin"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Yeni Şifre (Tekrar)</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="Yeni şifrenizi tekrar girin"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
              />
            </View>

            <TouchableOpacity
              style={[styles.changePasswordButton, (!currentPassword || !newPassword || !confirmPassword) && styles.disabledButton]}
              onPress={handleChangePassword}
              disabled={!currentPassword || !newPassword || !confirmPassword || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.TEXT_LIGHT} />
              ) : (
                <Text style={styles.buttonText}>Şifreyi Değiştir</Text>
              )}
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Bildirim Ayarları */}
        <View style={styles.card}>
          <LinearGradient
            colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <Text style={styles.cardTitle}>Bildirim Tercihleri</Text>
            
            <View style={styles.settingItem}>
              <Text style={styles.settingText}>E-posta Bildirimleri</Text>
              <Switch
                value={notificationSettings.emailNotifications}
                onValueChange={() => handleToggleNotification('emailNotifications')}
                trackColor={{ false: 'rgba(255, 255, 255, 0.3)', true: 'rgba(255, 255, 255, 0.3)' }}
                thumbColor={notificationSettings.emailNotifications ? COLORS.POSITIVE : COLORS.TEXT_LIGHT}
              />
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingText}>Push Bildirimleri</Text>
              <Switch
                value={notificationSettings.pushNotifications}
                onValueChange={() => handleToggleNotification('pushNotifications')}
                trackColor={{ false: 'rgba(255, 255, 255, 0.3)', true: 'rgba(255, 255, 255, 0.3)' }}
                thumbColor={notificationSettings.pushNotifications ? COLORS.POSITIVE : COLORS.TEXT_LIGHT}
              />
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingText}>Bakiye Uyarıları</Text>
              <Switch
                value={notificationSettings.balanceAlerts}
                onValueChange={() => handleToggleNotification('balanceAlerts')}
                trackColor={{ false: 'rgba(255, 255, 255, 0.3)', true: 'rgba(255, 255, 255, 0.3)' }}
                thumbColor={notificationSettings.balanceAlerts ? COLORS.POSITIVE : COLORS.TEXT_LIGHT}
              />
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingText}>Grup Davetleri</Text>
              <Switch
                value={notificationSettings.groupInvites}
                onValueChange={() => handleToggleNotification('groupInvites')}
                trackColor={{ false: 'rgba(255, 255, 255, 0.3)', true: 'rgba(255, 255, 255, 0.3)' }}
                thumbColor={notificationSettings.groupInvites ? COLORS.POSITIVE : COLORS.TEXT_LIGHT}
              />
            </View>
          </LinearGradient>
        </View>

        {/* Çıkış Yap */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
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
  cardGradient: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_LIGHT,
    marginBottom: 16,
  },
  profileSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.TEXT_LIGHT,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.TEXT_LIGHT,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  disabledInput: {
    opacity: 0.7,
  },
  editButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
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
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
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
    backgroundColor: COLORS.POSITIVE,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 16,
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingText: {
    fontSize: 16,
    color: COLORS.TEXT_LIGHT,
  },
  logoutButton: {
    margin: 16,
    padding: 16,
    backgroundColor: COLORS.NEGATIVE,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 16,
    fontWeight: '600',
  },
});