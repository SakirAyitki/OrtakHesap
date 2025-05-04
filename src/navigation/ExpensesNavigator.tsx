import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from '../utils/color';

// Screens
import ExpensesScreen from '../screens/expenses/ExpensesScreen';
import CreateExpenseScreen from '../screens/expenses/CreateExpenseScreen';
import ExpenseDetailsScreen from '../screens/expenses/ExpenseDetailsScreen';
import EditExpenseScreen from '../screens/expenses/EditExpenseScreen';

// Types
export type ExpensesStackParamList = {
  ExpensesList: undefined;
  CreateExpense: { groupId: string };
  ExpenseDetails: { groupId: string; expenseId: string };
  EditExpense: { groupId: string; expenseId: string };
};

const Stack = createNativeStackNavigator<ExpensesStackParamList>();

export default function ExpensesNavigator() {
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
        name="ExpensesList"
        component={ExpensesScreen}
        options={{ headerShown: false }}
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
    </Stack.Navigator>
  );
} 