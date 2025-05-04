import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../utils/color';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GroupStackParamList } from '../../types/navigation.types';
import { firebaseService } from '../../services/firebaseService';
import { useAuth } from '../../hooks/useAuth';
import { Group } from '../../types/group.types';

type GroupSettingsScreenNavigationProp = NativeStackNavigationProp<
  GroupStackParamList,
  'GroupSettings'
>;

type GroupSettingsScreenRouteProp = RouteProp<
  GroupStackParamList,
  'GroupSettings'
>;

export default function GroupSettingsScreen() {
  const navigation = useNavigation<GroupSettingsScreenNavigationProp>();
  const route = useRoute<GroupSettingsScreenRouteProp>();
  const { groupId } = route.params;
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [group, setGroup] = useState<Group | null>(null);
  const [notificationSettings, setNotificationSettings] = useState({
    expenseNotifications: true,
    memberNotifications: true,
    balanceNotifications: true,
  });

  useEffect(() => {
    fetchGroupDetails();
  }, [groupId]);

  const fetchGroupDetails = async () => {
    try {
      setIsLoading(true);
      const groupData = await firebaseService.getGroupById(groupId);
      setGroup(groupData);
    } catch (error) {
      console.error('Error fetching group details:', error);
      Alert.alert('Hata', 'Grup bilgileri yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditGroup = () => {
    if (group) {
      navigation.navigate('EditGroup', { group });
    }
  };

  const handleLeaveGroup = async () => {
    if (!group || !user) return;

    Alert.alert(
      'Gruptan Ayrıl',
      'Bu gruptan ayrılmak istediğinize emin misiniz?',
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Ayrıl',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              // Grup üyelerinden kullanıcıyı çıkar
              const updatedMembers = group.members.filter(member => member.id !== user.id);
              await firebaseService.updateGroup(groupId, { members: updatedMembers });
              navigation.navigate('GroupList');
            } catch (error) {
              console.error('Error leaving group:', error);
              Alert.alert('Hata', 'Gruptan ayrılırken bir hata oluştu');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteGroup = async () => {
    if (!group || !user) return;

    // Sadece grup sahibi grubu silebilir
    if (group.createdBy !== user.id) {
      Alert.alert('Hata', 'Sadece grup sahibi grubu silebilir');
      return;
    }

    Alert.alert(
      'Grubu Sil',
      'Bu grubu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await firebaseService.deleteGroup(groupId);
              navigation.navigate('GroupList');
            } catch (error) {
              console.error('Error deleting group:', error);
              Alert.alert('Hata', 'Grup silinirken bir hata oluştu');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleNotificationToggle = async (setting: keyof typeof notificationSettings) => {
    try {
      const newSettings = {
        ...notificationSettings,
        [setting]: !notificationSettings[setting],
      };
      setNotificationSettings(newSettings);
      
      // TODO: Implement notification settings update in Firebase
      await firebaseService.updateGroup(groupId, {
        settings: {
          notifications: newSettings,
          autoApproveExpenses: group?.settings?.autoApproveExpenses ?? true,
          allowMemberInvite: group?.settings?.allowMemberInvite ?? true
        },
      });
    } catch (error) {
      console.error('Error updating notification settings:', error);
      Alert.alert('Hata', 'Bildirim ayarları güncellenirken bir hata oluştu');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Grup bulunamadı</Text>
      </View>
    );
  }

  const isGroupOwner = user?.id === group.createdBy;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Grup Bilgileri</Text>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleEditGroup}
          >
            <View style={styles.settingContent}>
              <Ionicons name="create-outline" size={24} color={COLORS.TEXT_DARK} />
              <Text style={styles.settingText}>Grubu Düzenle</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={COLORS.TEXT_GRAY} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bildirimler</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Ionicons name="cash-outline" size={24} color={COLORS.TEXT_DARK} />
              <Text style={styles.settingText}>Harcama Bildirimleri</Text>
            </View>
            <Switch
              value={notificationSettings.expenseNotifications}
              onValueChange={() => handleNotificationToggle('expenseNotifications')}
              trackColor={{ false: COLORS.BORDER, true: COLORS.PRIMARY }}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Ionicons name="people-outline" size={24} color={COLORS.TEXT_DARK} />
              <Text style={styles.settingText}>Üye Bildirimleri</Text>
            </View>
            <Switch
              value={notificationSettings.memberNotifications}
              onValueChange={() => handleNotificationToggle('memberNotifications')}
              trackColor={{ false: COLORS.BORDER, true: COLORS.PRIMARY }}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Ionicons name="wallet-outline" size={24} color={COLORS.TEXT_DARK} />
              <Text style={styles.settingText}>Bakiye Bildirimleri</Text>
            </View>
            <Switch
              value={notificationSettings.balanceNotifications}
              onValueChange={() => handleNotificationToggle('balanceNotifications')}
              trackColor={{ false: COLORS.BORDER, true: COLORS.PRIMARY }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tehlikeli Bölge</Text>
          <TouchableOpacity
            style={[styles.settingItem, styles.dangerItem]}
            onPress={handleLeaveGroup}
          >
            <View style={styles.settingContent}>
              <Ionicons name="exit-outline" size={24} color={COLORS.NEGATIVE} />
              <Text style={[styles.settingText, styles.dangerText]}>
                Gruptan Ayrıl
              </Text>
            </View>
          </TouchableOpacity>

          {isGroupOwner && (
            <TouchableOpacity
              style={[styles.settingItem, styles.dangerItem]}
              onPress={handleDeleteGroup}
            >
              <View style={styles.settingContent}>
                <Ionicons name="trash-outline" size={24} color={COLORS.NEGATIVE} />
                <Text style={[styles.settingText, styles.dangerText]}>
                  Grubu Sil
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.NEGATIVE,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 8,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    color: COLORS.TEXT_DARK,
    marginLeft: 12,
  },
  dangerItem: {
    backgroundColor: COLORS.NEGATIVE_LIGHT,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  dangerText: {
    color: COLORS.NEGATIVE,
  },
}); 