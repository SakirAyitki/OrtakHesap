import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../hooks/useAuth";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../types/auth.types";
import { useNavigation } from "@react-navigation/native";
import { Input } from "../../components/common/Input";

type RegisterScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "Register"
>;

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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.form}>
            <Text style={styles.title}>Hesap Oluştur</Text>
            <Text style={styles.subtitle}>Ortak Hesap'a hoş geldiniz</Text>

            <Input
              placeholder="Ad Soyad"
              value={fullName}
              onChangeText={setFullName}
              leftIcon="person-outline"
              autoCapitalize="words"
            />

            <Input
              placeholder="E-posta"
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
              <Text style={styles.buttonText}>
                {isLoading ? "Kaydediliyor..." : "Kayıt Ol"}
              </Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Zaten hesabınız var mı?</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.loginText}>Giriş Yap</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  form: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 32,
    textAlign: "center",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  registerButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  footerText: {
    color: "#666",
    marginRight: 4,
  },
  loginText: {
    color: "#007AFF",
    fontWeight: "bold",
  },
});
