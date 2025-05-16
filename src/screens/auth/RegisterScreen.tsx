import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Keyboard,
  TouchableWithoutFeedback,
  TextInput,
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

type RegisterScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "Register"
>;

const { width, height } = Dimensions.get("window");

export default function RegisterScreen() {
  const { register, error } = useAuth();
  const navigation = useNavigation<RegisterScreenNavigationProp>();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateForm = () => {
    if (!fullName || !email || !password || !confirmPassword) {
      setValidationError("Lütfen tüm alanları doldurunuz");
      return false;
    }
    if (password !== confirmPassword) {
      setValidationError("Şifreler eşleşmiyor");
      return false;
    }
    if (password.length < 6) {
      setValidationError("Şifre en az 6 karakter olmalıdır");
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      await register({
        email,
        password,
        fullName,
      });
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
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.TEXT_LIGHT} />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={['#FFFFFF', '#F0F0F0']}
              style={styles.logoGradient}
            >
              <MaterialIcons name="person-add" size={36} color={COLORS.PRIMARY} />
            </LinearGradient>
          </View>
          <Text style={styles.appTitle}>OrtakHesap</Text>
          <Text style={styles.appTagline}>Hesabınızı hemen oluşturun</Text>
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
                <Text style={styles.title}>Hesap Oluştur</Text>
                <Text style={styles.subtitle}>Birkaç adımda hemen hesabınızı oluşturun</Text>

                {/* Full Name Input */}
                <View style={styles.inputContainer}>
                  <View style={styles.iconContainer}>
                    <MaterialIcons
                      name="person"
                      size={22}
                      color={COLORS.PRIMARY}
                    />
                  </View>
                  <TextInput
                    style={styles.input}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Ad Soyad"
                    autoCapitalize="words"
                    placeholderTextColor={COLORS.TEXT_GRAY}
                  />
                </View>

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

                {/* Confirm Password Input */}
                <View style={styles.inputContainer}>
                  <View style={styles.iconContainer}>
                    <MaterialCommunityIcons
                      name="lock-check-outline"
                      size={22}
                      color={COLORS.PRIMARY}
                    />
                  </View>
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Şifre Tekrar"
                    secureTextEntry={!showConfirmPassword}
                    placeholderTextColor={COLORS.TEXT_GRAY}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Feather
                      name={showConfirmPassword ? "eye" : "eye-off"}
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

                {/* Register Button */}
                <TouchableOpacity
                  style={[styles.registerButton, isLoading && styles.disabledButton]}
                  onPress={handleRegister}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.buttonText}>
                      {isLoading ? "Kaydediliyor..." : "Hesap Oluştur"}
                    </Text>
                    {!isLoading && (
                      <MaterialIcons name="person-add-alt" size={20} color={COLORS.TEXT_LIGHT} style={styles.buttonIcon} />
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Login Link */}
                <View style={styles.footer}>
                  <Text style={styles.footerText}>Zaten bir hesabın var mı? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                    <Text style={styles.loginText}>Giriş Yap</Text>
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
    marginTop: 10,
    paddingHorizontal: 20,
  },
  backButton: {
    position: "absolute",
    left: 20,
    top: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
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
    paddingBottom: 40,
  },
  formContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    marginTop: 20,
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
  registerButton: {
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
  loginText: {
    color: COLORS.PRIMARY,
    fontWeight: "bold",
    fontSize: 14,
  },
});
