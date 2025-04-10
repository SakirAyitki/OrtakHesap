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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../hooks/useAuth";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../types/auth.types";
import { useNavigation } from "@react-navigation/native";
import { Input } from "../../components/common/Input";
import { Feather, Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../utils/color";

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
      setValidationError("Tüm alanları doldurunuz");
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
              <Text style={styles.title}>Hesap Oluştur</Text>

              <Input
                placeholder="Ad Soyad"
                value={fullName}
                onChangeText={setFullName}
                leftIcon="person-outline"
                autoCapitalize="words"
              />

              <Input
                placeholder="E-Posta"
                value={email}
                onChangeText={setEmail}
                leftIcon="mail-outline"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Input
                placeholder="Şifre"
                value={password}
                onChangeText={setPassword}
                leftIcon="lock-closed-outline"
                rightIcon={showPassword ? "eye-outline" : "eye-off-outline"}
                onRightIconPress={() => setShowPassword(!showPassword)}
                secureTextEntry={!showPassword}
              />

              <Input
                placeholder="Şifre Tekrar"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                leftIcon="lock-closed-outline"
                rightIcon={
                  showConfirmPassword ? "eye-outline" : "eye-off-outline"
                }
                onRightIconPress={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                secureTextEntry={!showConfirmPassword}
              />

              {(validationError || error) && (
                <Text style={styles.errorText}>{validationError || error}</Text>
              )}

              <TouchableOpacity
                style={[
                  styles.registerButton,
                  isLoading && styles.disabledButton,
                ]}
                onPress={handleRegister}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>Hesap Oluştur</Text>
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Zaten Bir Hesabın var mı? </Text>
                <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                  <Text style={styles.loginText}>Giriş Yap</Text>
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.35,
    backgroundColor: COLORS.TERTIARY,
    borderBottomLeftRadius: width * 0.5,
    borderBottomRightRadius: width * 0.1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    zIndex: 1,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButton: {
    padding: 8,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
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
  errorText: {
    color: COLORS.NEGATIVE,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  registerButton: {
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
  loginText: {
    color: COLORS.PRIMARY,
    fontWeight: "bold",
  },
});
