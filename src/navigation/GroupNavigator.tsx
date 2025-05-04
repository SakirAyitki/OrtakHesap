import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GroupStackParamList } from '../types/navigation.types';
import GroupListScreen from '../screens/groups/GroupListScreen';
import GroupDetailScreen from '../screens/groups/GroupDetailScreen';
import CreateGroupScreen from '../screens/groups/CreateGroupScreen';
import AddMemberScreen from '../screens/groups/AddMemberScreen';
import CreateExpenseScreen from '../screens/expenses/CreateExpenseScreen';
import ExpenseDetailsScreen from '../screens/expenses/ExpenseDetailsScreen';
import EditExpenseScreen from '../screens/expenses/EditExpenseScreen';
import EditGroupScreen from '../screens/groups/EditGroupScreen';
import GroupSettingsScreen from '../screens/groups/GroupSettingsScreen';
import { COLORS } from '../utils/color';

const Stack = createNativeStackNavigator<GroupStackParamList>();

export default function GroupNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.BACKGROUND,
        },
        headerTintColor: COLORS.TEXT_DARK,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="GroupList"
        component={GroupListScreen}
        options={{ title: 'Gruplar' }}
      />
      <Stack.Screen
        name="GroupDetail"
        component={GroupDetailScreen}
        options={{ title: 'Grup Detayı' }}
      />
      <Stack.Screen
        name="CreateGroup"
        component={CreateGroupScreen}
        options={{ title: 'Yeni Grup' }}
      />
      <Stack.Screen
        name="AddMember"
        component={AddMemberScreen}
        options={{ title: 'Üye Ekle' }}
      />
      <Stack.Screen
        name="CreateExpense"
        component={CreateExpenseScreen}
        options={{ title: 'Yeni Harcama' }}
      />
      <Stack.Screen
        name="ExpenseDetails"
        component={ExpenseDetailsScreen}
        options={{ title: 'Harcama Detayı' }}
      />
      <Stack.Screen
        name="EditExpense"
        component={EditExpenseScreen}
        options={{ title: 'Harcama Düzenle' }}
      />
      <Stack.Screen
        name="EditGroup"
        component={EditGroupScreen}
        options={{
          title: 'Grubu Düzenle',
          headerBackTitle: 'Geri',
        }}
      />
      <Stack.Screen
        name="GroupSettings"
        component={GroupSettingsScreen}
        options={{
          title: 'Grup Ayarları',
          headerBackTitle: 'Geri',
        }}
      />
    </Stack.Navigator>
  );
} 