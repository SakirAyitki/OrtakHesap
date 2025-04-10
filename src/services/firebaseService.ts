import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { LoginCredentials, RegisterData } from '../types/auth.types';
import { User } from '../types/user.types';
import { auth } from '../config/firebase';

// Firebase user'ı User tipine dönüştüren yardımcı fonksiyon
const mapFirebaseUserToUser = (firebaseUser: FirebaseUser): User => ({
  id: firebaseUser.uid,
  email: firebaseUser.email!,
  fullName: firebaseUser.displayName || '',
  photoURL: firebaseUser.photoURL || undefined,
  createdAt: firebaseUser.metadata.creationTime!,
  updatedAt: firebaseUser.metadata.lastSignInTime!,
  isEmailVerified: firebaseUser.emailVerified,
  phoneNumber: firebaseUser.phoneNumber || undefined,
});

export const firebaseService = {
  // Mevcut kullanıcıyı getir
  getCurrentUser: async (firebaseUser: FirebaseUser): Promise<User> => {
    return mapFirebaseUserToUser(firebaseUser);
  },

  // Giriş işlemi
  login: async (credentials: LoginCredentials) => {
    const { email, password } = credentials;
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    return {
      user: mapFirebaseUserToUser(userCredential.user),
      token: await userCredential.user.getIdToken(),
    };
  },

  // Kayıt işlemi
  register: async (data: RegisterData) => {
    const { email, password, fullName } = data;
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    await updateProfile(userCredential.user, {
      displayName: fullName,
      photoURL: data.photoURL,
    });

    return {
      user: mapFirebaseUserToUser(userCredential.user),
      token: await userCredential.user.getIdToken(),
    };
  },

  // Çıkış işlemi
  logout: async () => {
    await signOut(auth);
  },

  // Email doğrulama
  verifyEmail: async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  },

  // Şifre sıfırlama
  resetPassword: async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  },

  // Kullanıcı güncelleme
  updateUser: async (userData: Partial<User>) => {
    if (!auth.currentUser) throw new Error('Kullanıcı bulunamadı');

    await updateProfile(auth.currentUser, {
      displayName: userData.fullName,
      photoURL: userData.photoURL,
    });

    // Güncellenmiş kullanıcı bilgilerini döndür
    return {
      id: auth.currentUser.uid,
      email: auth.currentUser.email!,
      fullName: auth.currentUser.displayName || '',
      photoURL: auth.currentUser.photoURL || undefined,
      createdAt: auth.currentUser.metadata.creationTime!,
      updatedAt: auth.currentUser.metadata.lastSignInTime!,
      isEmailVerified: auth.currentUser.emailVerified,
      phoneNumber: auth.currentUser.phoneNumber || undefined,
    };
  },
};
