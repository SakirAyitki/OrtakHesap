import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../../utils/color";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { GroupStackParamList } from "../../types/navigation.types";
import { firebaseService } from "../../services/firebaseService";
import { User } from "../../types/user.types";
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 16;
const CARD_WIDTH = width - (CARD_MARGIN * 2);

type AddMemberScreenNavigationProp = NativeStackNavigationProp<
  GroupStackParamList,
  "AddMember"
>;

type AddMemberScreenRouteProp = RouteProp<GroupStackParamList, "AddMember">;

export default function AddMemberScreen() {
  const navigation = useNavigation<AddMemberScreenNavigationProp>();
  const route = useRoute<AddMemberScreenRouteProp>();
  const { groupId } = route.params;

  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [groupName, setGroupName] = useState<string>("");

  // React Navigation'ın varsayılan header'ını gizle
  useEffect(() => {
    navigation.setOptions({
      headerShown: false
    });

    // Grup adını getir
    const fetchGroupName = async () => {
      try {
        const group = await firebaseService.getGroupById(groupId);
        if (group?.name) {
          setGroupName(group.name);
        }
      } catch (error) {
        console.error('Error fetching group name:', error);
      }
    };

    fetchGroupName();
  }, [navigation, groupId]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);
    setSearchResults([]);

    try {
      console.log("Starting user search with query:", searchQuery.trim());
      const users = await firebaseService.searchUsers(searchQuery.trim());
      console.log("Search results:", users);
      setSearchResults(users);
    } catch (error) {
      console.error("Error searching users:", error);
      setError("Kullanıcı araması sırasında bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMember = async (user: User) => {
    try {
      setIsAdding(true);
      setError(null);

      // Önce grup bilgilerini al
      const group = await firebaseService.getGroupById(groupId);

      // Kullanıcı zaten üye mi kontrol et
      if (group.members.some(member => member.id === user.id)) {
        Alert.alert("Hata", "Bu kullanıcı zaten grubun üyesi");
        return;
      }

      // Üye ekle
      await firebaseService.updateGroup(groupId, {
        members: [...group.members, {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          photoURL: user.photoURL
        }],
      });

      Alert.alert("Başarılı", "Üye başarıyla eklendi", [
        { text: "Tamam", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error("Error adding member:", error);
      setError("Üye eklenirken bir hata oluştu");
    } finally {
      setIsAdding(false);
    }
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <View style={styles.userItem}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.fullName}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
      </View>
      <TouchableOpacity
        style={[styles.addButton, isAdding && styles.disabledButton]}
        onPress={() => handleAddMember(item)}
        disabled={isAdding}
      >
        {isAdding ? (
          <ActivityIndicator size="small" color={COLORS.PRIMARY} />
        ) : (
          <Ionicons name="add" size={24} color={COLORS.PRIMARY} />
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.TEXT_LIGHT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Üye Ekle</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Grup Bilgisi */}
      <View style={styles.groupInfoContainer}>
        <MaterialIcons name="group" size={18} color={COLORS.PRIMARY} />
        <Text style={styles.groupInfoText}>
          Grup: <Text style={styles.groupNameText}>{groupName}</Text>
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="E-posta ile kullanıcı ara"
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor={COLORS.TEXT_GRAY}
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearch}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={COLORS.TEXT_LIGHT} />
            ) : (
              <Ionicons name="search" size={20} color={COLORS.TEXT_LIGHT} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color={COLORS.NEGATIVE} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={searchResults}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="person-search" size={48} color={COLORS.TEXT_GRAY} />
            <Text style={styles.emptyText}>
              {searchQuery
                ? "Kullanıcı bulunamadı"
                : "Kullanıcı aramak için yukarıdaki arama kutusunu kullanın"}
            </Text>
          </View>
        }
      />
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
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.TEXT_LIGHT,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 44,
  },
  groupInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  groupInfoText: {
    fontSize: 14,
    color: COLORS.TEXT_DARK,
    marginLeft: 8,
  },
  groupNameText: {
    fontWeight: 'bold',
  },
  searchContainer: {
    padding: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    overflow: 'hidden',
  },
  searchInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.TEXT_DARK,
  },
  searchButton: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.NEGATIVE_LIGHT,
    padding: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.NEGATIVE,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: COLORS.SHADOW,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_DARK,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.TEXT_GRAY,
  },
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 20,
  },
  disabledButton: {
    opacity: 0.5,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.TEXT_GRAY,
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
});
