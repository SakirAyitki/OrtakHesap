import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/color';
import { NavigatorScreenParams } from '@react-navigation/native';
import { GroupStackParamList } from '../types/navigation.types';
import { ExpensesStackParamList } from './ExpensesNavigator';

// Navigators & Screens
import GroupNavigator from './GroupNavigator';
import ExpensesNavigator from './ExpensesNavigator';
import BalanceScreen from '../screens/expenses/BalanceScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

// Types
export type AppTabParamList = {
  Groups: NavigatorScreenParams<GroupStackParamList>;
  Expenses: NavigatorScreenParams<ExpensesStackParamList>;
  Balance: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Groups':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'Expenses':
              iconName = focused ? 'list' : 'list-outline';
              break;
            case 'Balance':
              iconName = focused ? 'wallet' : 'wallet-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.PRIMARY,
        tabBarInactiveTintColor: COLORS.TEXT_GRAY,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: COLORS.BORDER,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      })}
    >
      <Tab.Screen 
        name="Groups" 
        component={GroupNavigator}
        options={{ title: 'Gruplar' }}
      />
      <Tab.Screen 
        name="Expenses" 
        component={ExpensesNavigator}
        options={{ title: 'Harcamalar' }}
      />
      <Tab.Screen 
        name="Balance" 
        component={BalanceScreen}
        options={{ title: 'Bakiye' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profil' }}
      />
    </Tab.Navigator>
  );
}
