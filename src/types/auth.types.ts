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

// Authentication durumunu yöneten state tipi
export type AuthState = {
    isLoading: boolean;
    isAuthenticated: boolean;
    user: User | null;
    error: string | null;
};

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


