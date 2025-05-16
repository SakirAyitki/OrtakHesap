import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../../utils/color";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { GroupStackParamList } from "../../types/navigation.types";
import { firebaseService } from "../../services/firebaseService";
import { User } from "../../types/user.types";

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
      if (group.members.includes(user.id)) {
        Alert.alert("Hata", "Bu kullanıcı zaten grubun üyesi");
        return;
      }

      // Üye ekle
      await firebaseService.updateGroup(groupId, {
        members: [...group.members, user.id],
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
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="E-posta ile kullanıcı ara"
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.PRIMARY} />
          ) : (
            <Ionicons name="search" size={24} color={COLORS.PRIMARY} />
          )}
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <FlatList
        data={searchResults}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
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
  searchContainer: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    fontSize: 16,
    color: COLORS.TEXT_DARK,
  },
  searchButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.TERTIARY,
    borderRadius: 8,
  },
  listContent: {
    padding: 16,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "500",
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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.TERTIARY,
    borderRadius: 20,
  },
  disabledButton: {
    opacity: 0.5,
  },
  emptyContainer: {
    padding: 16,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.TEXT_GRAY,
    textAlign: "center",
  },
  errorText: {
    color: COLORS.NEGATIVE,
    fontSize: 14,
    textAlign: "center",
    padding: 16,
  },
});
