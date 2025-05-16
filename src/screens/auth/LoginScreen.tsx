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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../hooks/useAuth";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../types/auth.types";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons, Feather, Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../utils/color";

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
      setValidationError("Tüm alanları doldurunuz");
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
        {/* Background Wave */}
        <View style={styles.backgroundWave} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="flame" size={24} color="black" />
          </View>
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
            keyboardShouldPersistTaps="always"
            scrollEventThrottle={16}
          >
            <View style={styles.form}>
              <Text style={styles.title}>Giriş Yap</Text>

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons
                    name="email-outline"
                    size={20}
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
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons
                    name="lock-outline"
                    size={20}
                    color={COLORS.PRIMARY}
                  />
                </View>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Şifre"
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Feather
                    name={showPassword ? "eye" : "eye-off"}
                    size={20}
                    color="#888"
                  />
                </TouchableOpacity>
              </View>
              
              {(validationError || error) && (
                <Text style={styles.errorText}>{validationError || error}</Text>
              )}

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.disabledButton]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>Giriş Yap</Text>
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
  backgroundWave: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.35,
    backgroundColor: COLORS.TERTIARY,
    borderBottomLeftRadius: width * 0.5,
    borderBottomRightRadius: width * 0.1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    zIndex: 1,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  menuButton: {
    padding: 8,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  form: {
    padding: 24,
    marginTop: height * 0.08,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: COLORS.TEXT_DARK,
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
    marginBottom: 24,
    position: "relative",
  },
  iconContainer: {
    paddingRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.TEXT_DARK,
  },
  eyeIcon: {
    padding: 8,
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  rememberMeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  checked: {
    width: 10,
    height: 10,
    backgroundColor: COLORS.PRIMARY,
  },
  rememberMeText: {
    color: COLORS.TEXT_GRAY,
    fontSize: 14,
  },
  errorText: {
    color: COLORS.NEGATIVE,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  forgotPasswordText: {
    color: COLORS.TEXT_GRAY,
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: COLORS.PRIMARY,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 24,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.TEXT_DARK,
    fontSize: 16,
    fontWeight: "bold",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    color: COLORS.TEXT_GRAY,
  },
  signUpText: {
    color: COLORS.PRIMARY,
    fontWeight: "bold",
  },
});
