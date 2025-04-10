import { AuthError } from '../types/auth.types';

// Error mesajlarını kullanıcı dostu hale getiren fonksiyon
export const getAuthErrorMessage = (error: AuthError): string => {
  if (error?.code) {
    switch (error.code) {
      case 'auth/invalid-email':
        return 'Geçersiz e-posta adresi';
      case 'auth/user-disabled':
        return 'Bu hesap devre dışı bırakılmış';
      case 'auth/user-not-found':
        return 'Kullanıcı bulunamadı';
      case 'auth/wrong-password':
        return 'Hatalı şifre';
      case 'auth/email-already-in-use':
        return 'Bu e-posta adresi zaten kullanımda';
      case 'auth/weak-password':
        return 'Şifre çok zayıf';
      case 'auth/operation-not-allowed':
        return 'İşlem izni yok';
      case 'auth/network-request-failed':
        return 'Ağ bağlantısı hatası';
      default:
        return 'Bir hata oluştu';
    }
  }
  return error?.message || 'Beklenmeyen bir hata oluştu';
}; 