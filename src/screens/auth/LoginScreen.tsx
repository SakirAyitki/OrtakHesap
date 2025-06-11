import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Image,
  Dimensions,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../hooks/useAuth";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../types/auth.types";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons, Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../../utils/color";
import { LinearGradient } from "expo-linear-gradient";

type LoginScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "Login"
>;

const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
  const { login, error } = useAuth();
  const navigation = useNavigation<LoginScreenNavigationProp>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateForm = () => {
    if (!email || !password) {
      setValidationError("Lütfen tüm alanları doldurunuz");
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleLogin = async () => {
    try {
      if (!validateForm()) return;
      setIsLoading(true);
      await login({ email, password });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />

        {/* Gradient Background */}
        <LinearGradient
          colors={[COLORS.PRIMARY, COLORS.SECONDARY, '#004080']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        />

        {/* Header with Logo */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={['#FFFFFF', '#F0F0F0']}
              style={styles.logoGradient}
            >
              <MaterialIcons name="account-balance-wallet" size={36} color={COLORS.PRIMARY} />
            </LinearGradient>
          </View>
          <Text style={styles.appTitle}>OrtakHesap</Text>
          <Text style={styles.appTagline}>Harcamalarınızı birlikte yönetin</Text>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formContainer}>
              <View style={styles.formCard}>
                <Text style={styles.title}>Giriş Yap</Text>
                <Text style={styles.subtitle}>Hesabınıza giriş yaparak harcamalarınızı yönetmeye devam edin</Text>

                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <View style={styles.iconContainer}>
                    <MaterialCommunityIcons
                      name="email-outline"
                      size={22}
                      color={COLORS.PRIMARY}
                    />
                  </View>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="E-Posta"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor={COLORS.TEXT_GRAY}
                  />
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <View style={styles.iconContainer}>
                    <MaterialCommunityIcons
                      name="lock-outline"
                      size={22}
                      color={COLORS.PRIMARY}
                    />
                  </View>
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Şifre"
                    secureTextEntry={!showPassword}
                    placeholderTextColor={COLORS.TEXT_GRAY}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Feather
                      name={showPassword ? "eye" : "eye-off"}
                      size={20}
                      color={COLORS.TEXT_GRAY}
                    />
                  </TouchableOpacity>
                </View>
                
                {/* Error Messages */}
                {(validationError || error) && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={20} color={COLORS.NEGATIVE} />
                    <Text style={styles.errorText}>{validationError || error}</Text>
                  </View>
                )}

                {/* Login Button */}
                <TouchableOpacity
                  style={[styles.loginButton, isLoading && styles.disabledButton]}
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.buttonText}>
                      {isLoading ? "Giriş Yapılıyor..." : "Giriş Yap"}
                    </Text>
                    {!isLoading && (
                      <MaterialIcons name="login" size={20} color={COLORS.TEXT_LIGHT} style={styles.buttonIcon} />
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Sign Up Link */}
                <View style={styles.footer}>
                  <Text style={styles.footerText}>Hesabın yok mu? </Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate("Register")}
                  >
                    <Text style={styles.signUpText}>Hesap Oluştur</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  gradientBackground: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: height * 0.5,
  },
  header: {
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.SHADOW,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: COLORS.TEXT_LIGHT,
    marginBottom: 8,
  },
  appTagline: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 16,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  formContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    marginTop: 30,
  },
  formCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 24,
    padding: 24,
    shadowColor: COLORS.SHADOW,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: COLORS.TEXT_DARK,
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.TEXT_GRAY,
    marginBottom: 32,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: 12,
    backgroundColor: COLORS.WHITE,
    marginBottom: 20,
    shadowColor: COLORS.SHADOW,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: COLORS.TEXT_DARK,
  },
  eyeIcon: {
    paddingHorizontal: 15,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.NEGATIVE_LIGHT,
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  errorText: {
    color: COLORS.NEGATIVE,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  forgotPasswordButton: {
    alignSelf: "flex-end",
    marginBottom: 30,
  },
  forgotPasswordText: {
    color: COLORS.PRIMARY,
    fontSize: 14,
    fontWeight: "600",
  },
  loginButton: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: {
      width: 0, 
      height: 4
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonIcon: {
    marginLeft: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    color: COLORS.TEXT_GRAY,
    fontSize: 14,
  },
  signUpText: {
    color: COLORS.PRIMARY,
    fontWeight: "bold",
    fontSize: 14,
  },
});
