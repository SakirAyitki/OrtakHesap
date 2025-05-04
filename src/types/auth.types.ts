import { User } from './user.types';

// Auth stack navigator için route parametre tipleri, sayfa geçişlerinde gönderilecek verileri belirtir
export type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
    ForgotPassword: undefined;
    ResetPassword: {
        token: string;
    };
    VerifyEmail: {
        email: string;
    };
    VerifyCode: {
        email: string;
        type: 'email' | 'password';
    };
};

// Auth durumunu yöneten state tipi
export interface AuthState {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: User | null;
    error: string | null;
}

// Giriş yapmak için gerekli kullanıcı bilgileri
export type LoginCredentials = {
    email: string;
    password: string;
};

// Kayıt olmak için gerekli kullanıcı bilgileri
export type RegisterData = {
    email: string;
    password: string;
    fullName: string;
    phoneNumber?: string;
    photoURL?: string;
    settings?: {
        language: 'tr' | 'en';
        currency: 'TRY' | 'USD' | 'EUR';
    };
};

// Auth action tipleri
export type AuthAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGOUT' };

// Auth hata tipleri
export type AuthError = {
  code: string;
  message: string;
};

// Context için tip tanımlaması
export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  verifyEmail: (email: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
}
