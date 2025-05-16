import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../utils/color';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GroupStackParamList } from '../../types/navigation.types';
import { firebaseService } from '../../services/firebaseService';
import { Group } from '../../types/group.types';

type EditGroupScreenNavigationProp = NativeStackNavigationProp<
  GroupStackParamList,
  'EditGroup'
>;

type EditGroupScreenRouteProp = RouteProp<GroupStackParamList, 'EditGroup'>;

export default function EditGroupScreen() {
  const navigation = useNavigation<EditGroupScreenNavigationProp>();
  const route = useRoute<EditGroupScreenRouteProp>();
  const { groupId } = route.params;

  const [group, setGroup] = useState<Group | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Grup bilgilerini yükle
  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        setIsInitialLoading(true);
        const groupData = await firebaseService.getGroupById(groupId);
        setGroup(groupData);
        setName(groupData.name || '');
        setDescription(groupData.description || '');
        setError(null);
      } catch (error) {
        console.error('Error fetching group details:', error);
        setError('Grup bilgileri yüklenirken bir hata oluştu');
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchGroupDetails();
  }, [groupId]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Hata', 'Grup adı boş olamaz');
      return;
    }

    if (!group) {
      Alert.alert('Hata', 'Grup bilgileri yüklenemedi');
      return;
    }

    try {
      setIsLoading(true);
      await firebaseService.updateGroup(groupId, {
        name: name.trim(),
        description: description.trim(),
      });
      navigation.goBack();
    } catch (error) {
      console.error('Error updating group:', error);
      Alert.alert('Hata', 'Grup güncellenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitialLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  if (error || !group) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Grup bulunamadı'}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.content}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Grup Adı</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Grup adını girin"
              placeholderTextColor={COLORS.TEXT_GRAY}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Açıklama</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Grup açıklaması girin"
              placeholderTextColor={COLORS.TEXT_GRAY}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.WHITE} />
            ) : (
              <Text style={styles.buttonText}>Kaydet</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.NEGATIVE,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 16,
    fontWeight: '500',
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
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.TEXT_DARK,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  button: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
}); 