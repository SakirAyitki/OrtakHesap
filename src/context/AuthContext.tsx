import React, { createContext, useReducer, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AuthState,
  AuthAction,
  AuthContextType,
  LoginCredentials,
  RegisterData,
} from "../types/auth.types";
import { User } from "../types/user.types";
import { firebaseService } from "../services/firebaseService";
import { onAuthStateChanged, onIdTokenChanged } from "firebase/auth";
import { auth } from "../config/firebase";
import { getAuthErrorMessage } from "../utils/errors";

// Context'in başlangıç değeri
const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  error: null,
};

// Context oluşturma
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

// Reducer fonksiyonu
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_USER":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        error: null,
      };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "LOGOUT":
      return { ...initialState, isLoading: false };
    default:
      return state;
  }
}

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Auth durumu değişikliklerini dinle
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const token = await user.getIdToken();
          await AsyncStorage.setItem("authToken", token);

          // Firebase user'ı User tipine dönüştürme işlemini firebaseService'e taşıyalım
          const userData = await firebaseService.getCurrentUser(user);

          await AsyncStorage.setItem("userData", JSON.stringify(userData));
          dispatch({ type: "SET_USER", payload: userData });
        } else {
          await AsyncStorage.removeItem("authToken");
          await AsyncStorage.removeItem("userData");
          dispatch({ type: "LOGOUT" });
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        dispatch({ type: "SET_ERROR", payload: "Kimlik doğrulama hatası" });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    });

    // Token değişikliklerini dinle
    const unsubscribeToken = onIdTokenChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        await AsyncStorage.setItem("authToken", token);
      }
    });

    // Cleanup
    return () => {
      unsubscribeAuth();
      unsubscribeToken();
    };
  }, []);

  // Giriş işlemi
  const login = async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await firebaseService.login(credentials);
      await AsyncStorage.setItem("authToken", response.token);
      await AsyncStorage.setItem("userData", JSON.stringify(response.user));
      dispatch({ type: "SET_USER", payload: response.user });
    } catch (error: any) {
      const errorMessage = getAuthErrorMessage(error);
      dispatch({ type: "SET_ERROR", payload: errorMessage });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  // Kayıt işlemi
  const register = async (data: RegisterData) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await firebaseService.register(data);
      await AsyncStorage.setItem("authToken", response.token);
      await AsyncStorage.setItem("userData", JSON.stringify(response.user));
      dispatch({ type: "SET_USER", payload: response.user });
    } catch (error: any) {
      const errorMessage = getAuthErrorMessage(error);
      dispatch({ type: "SET_ERROR", payload: errorMessage });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  // Çıkış işlemi
  const logout = async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      await firebaseService.logout();
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("userData");
      dispatch({ type: "LOGOUT" });
    } catch (error) {
      console.error("Logout error:", error);
      dispatch({ type: "SET_ERROR", payload: "Çıkış yapılırken bir hata oluştu" });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  // Email doğrulama
  const verifyEmail = async (email: string) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      await firebaseService.verifyEmail();
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: "Email doğrulama başarısız" });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  // Şifre sıfırlama
  const resetPassword = async (email: string) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      await firebaseService.resetPassword(email);
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: "Şifre sıfırlama başarısız" });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  // Kullanıcı güncelleme
  const updateUser = async (userData: Partial<User>) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const updatedUser = await firebaseService.updateUser(userData);
      await AsyncStorage.setItem("userData", JSON.stringify(updatedUser));
      dispatch({ type: "SET_USER", payload: updatedUser });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: "Kullanıcı güncelleme başarısız",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        verifyEmail,
        resetPassword,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
