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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/color';
import { useAuth } from '../../hooks/useAuth';
import firebaseService from '../../services/firebaseService';

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
      // Hata durumunda eski ayarlara geri dön
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
      <ScrollView style={styles.content}>
        {/* Profil Başlığı */}
        <View style={styles.header}>
          <Text style={styles.title}>Profil</Text>
        </View>

        {/* Profil Bilgileri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profil Bilgileri</Text>
          
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
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>E-posta</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={email}
                editable={false}
                placeholder="E-posta"
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
        </View>

        {/* Şifre Değiştirme */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Şifre Değiştirme</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mevcut Şifre</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              placeholder="Mevcut şifrenizi girin"
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
        </View>

        {/* Bildirim Ayarları */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bildirim Tercihleri</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingText}>E-posta Bildirimleri</Text>
            <Switch
              value={notificationSettings.emailNotifications}
              onValueChange={() => handleToggleNotification('emailNotifications')}
              trackColor={{ false: COLORS.BORDER, true: COLORS.PRIMARY }}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingText}>Push Bildirimleri</Text>
            <Switch
              value={notificationSettings.pushNotifications}
              onValueChange={() => handleToggleNotification('pushNotifications')}
              trackColor={{ false: COLORS.BORDER, true: COLORS.PRIMARY }}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingText}>Bakiye Uyarıları</Text>
            <Switch
              value={notificationSettings.balanceAlerts}
              onValueChange={() => handleToggleNotification('balanceAlerts')}
              trackColor={{ false: COLORS.BORDER, true: COLORS.PRIMARY }}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingText}>Grup Davetleri</Text>
            <Switch
              value={notificationSettings.groupInvites}
              onValueChange={() => handleToggleNotification('groupInvites')}
              trackColor={{ false: COLORS.BORDER, true: COLORS.PRIMARY }}
            />
          </View>
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
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_DARK,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
    marginBottom: 16,
  },
  profileSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.TERTIARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: COLORS.TEXT_GRAY,
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
  disabledInput: {
    backgroundColor: COLORS.BACKGROUND,
    color: COLORS.TEXT_GRAY,
  },
  editButton: {
    backgroundColor: COLORS.PRIMARY,
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
    backgroundColor: COLORS.BACKGROUND,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  saveButton: {
    backgroundColor: COLORS.PRIMARY,
    marginLeft: 8,
  },
  cancelButtonText: {
    color: COLORS.TEXT_DARK,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 16,
    fontWeight: '600',
  },
  changePasswordButton: {
    backgroundColor: COLORS.PRIMARY,
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
    color: COLORS.TEXT_DARK,
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