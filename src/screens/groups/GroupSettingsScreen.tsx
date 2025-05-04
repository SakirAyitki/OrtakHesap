import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../utils/color';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GroupStackParamList } from '../../types/navigation.types';

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

  const handleLeaveGroup = () => {
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
              // TODO: Implement leave group
              navigation.navigate('GroupList');
            } catch (error) {
              Alert.alert('Hata', 'Gruptan ayrılırken bir hata oluştu');
            }
          },
        },
      ]
    );
  };

  const handleDeleteGroup = () => {
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
              // TODO: Implement delete group
              navigation.navigate('GroupList');
            } catch (error) {
              Alert.alert('Hata', 'Grup silinirken bir hata oluştu');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Genel</Text>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => {
              // TODO: Implement notification settings
            }}
          >
            <View style={styles.settingContent}>
              <Ionicons name="notifications-outline" size={24} color={COLORS.TEXT_DARK} />
              <Text style={styles.settingText}>Bildirimler</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={COLORS.TEXT_GRAY} />
          </TouchableOpacity>
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