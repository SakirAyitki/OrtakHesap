import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GroupStackParamList } from '../types/navigation.types';
import GroupsScreen from '../screens/groups/GroupsScreen';
import CreateGroupScreen from '../screens/groups/CreateGroupScreen';
import GroupDetailScreen from '../screens/groups/GroupDetailScreen';
import EditGroupScreen from '../screens/groups/GroupEditScreen';
import AddMemberScreen from '../screens/groups/AddMemberScreen';
import GroupSettingsScreen from '../screens/groups/GroupSettingsScreen';
import { COLORS } from '../utils/color';

const Stack = createNativeStackNavigator<GroupStackParamList>();

export default function GroupNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: COLORS.BACKGROUND,
        },
        headerTintColor: COLORS.TEXT_DARK,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen 
        name="GroupList" 
        component={GroupsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="CreateGroup" 
        component={CreateGroupScreen}
        options={{ title: 'Yeni Grup' }}
      />
      <Stack.Screen 
        name="GroupDetails" 
        component={GroupDetailScreen}
        options={{ title: 'Grup Detayı' }}
      />
      <Stack.Screen 
        name="EditGroup" 
        component={EditGroupScreen}
        options={{ title: 'Grubu Düzenle' }}
      />
      <Stack.Screen 
        name="AddMember" 
        component={AddMemberScreen}
        options={{ title: 'Üye Ekle' }}
      />
      <Stack.Screen 
        name="GroupSettings" 
        component={GroupSettingsScreen}
        options={{ title: 'Grup Ayarları' }}
      />
    </Stack.Navigator>
  );
} 