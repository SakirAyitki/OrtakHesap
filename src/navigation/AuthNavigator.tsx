import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../types/auth.types";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import ResetPasswordScreen from "../screens/auth/ResetPasswordScreen";
import VerifyEmailScreen from "../screens/auth/VerifyEmailScreen";
import VerifyCodeScreen from "../screens/auth/VerifyCodeScreen";

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right',
      }}
      initialRouteName="Login"
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
      />

      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
      />

      <Stack.Screen 
        name="ResetPassword" 
        component={ResetPasswordScreen}
      />

      <Stack.Screen 
        name="VerifyEmail" 
        component={VerifyEmailScreen}
      />

      <Stack.Screen 
        name="VerifyCode" 
        component={VerifyCodeScreen}
      />
    </Stack.Navigator>
  );
}
