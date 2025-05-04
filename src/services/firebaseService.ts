import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  DocumentData,
  QueryDocumentSnapshot,
  addDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { User } from '../types/user.types';
import { Expense } from '../types/expense.types';
import { LoginCredentials, RegisterData } from '../types/auth.types';
import { auth, db } from '../config/firebase';
import { sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth';
import { CreateGroupData, GroupMember } from '../types/group.types';
import type { Group } from '../types/group.types';
import { CreateExpenseData, UpdateExpenseData } from '../types/expense.types';

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

class FirebaseService {
  // Mevcut kullanıcıyı getir
  getCurrentUser: (firebaseUser: FirebaseUser) => Promise<User> = async (firebaseUser) => {
    try {
      console.log('Getting current user data for:', firebaseUser.uid);
      
      // Önce Firestore'dan kullanıcı bilgilerini almayı dene
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (userDoc.exists()) {
        console.log('User found in Firestore');
        const data = userDoc.data();
        return {
          id: firebaseUser.uid,
          email: data.email || firebaseUser.email || '',
          fullName: data.fullName || firebaseUser.displayName || '',
          photoURL: data.photoURL || firebaseUser.photoURL || null,
          createdAt: (data.createdAt?.toDate() || firebaseUser.metadata.creationTime || new Date()).toString(),
          updatedAt: (data.updatedAt?.toDate() || firebaseUser.metadata.lastSignInTime || new Date()).toString(),
          isEmailVerified: data.isEmailVerified || firebaseUser.emailVerified || false,
          phoneNumber: data.phoneNumber || firebaseUser.phoneNumber || null,
          settings: data.settings || { language: 'tr', currency: 'TRY' }
        };
      }

      console.log('User not found in Firestore, using Authentication data');
      // Firestore'da yoksa Authentication verilerini kullan
      return {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        fullName: firebaseUser.displayName || '',
        photoURL: firebaseUser.photoURL || null,
        createdAt: (firebaseUser.metadata.creationTime || new Date()).toString(),
        updatedAt: (firebaseUser.metadata.lastSignInTime || new Date()).toString(),
        isEmailVerified: firebaseUser.emailVerified || false,
        phoneNumber: firebaseUser.phoneNumber || null,
        settings: { language: 'tr', currency: 'TRY' }
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      // Hata durumunda en azından Authentication verilerini döndür
      const defaultUser = mapFirebaseUserToUser(firebaseUser);
      return {
        ...defaultUser,
        photoURL: defaultUser.photoURL || null,
        phoneNumber: defaultUser.phoneNumber || null,
        settings: { language: 'tr', currency: 'TRY' }
      };
    }
  };

  // Giriş işlemi
  login: (credentials: LoginCredentials) => Promise<{ user: User; token: string }> = async (credentials) => {
    const { email, password } = credentials;
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    return {
      user: await this.getCurrentUser(userCredential.user),
      token: await userCredential.user.getIdToken(),
    };
  };

  // Kayıt işlemi
  register: (data: RegisterData) => Promise<{ user: User; token: string }> = async (data) => {
    try {
      const { email, password, fullName } = data;
      console.log('Starting registration with data:', { email, fullName });

      // Auth'da kullanıcı oluştur
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('User created in Authentication:', userCredential.user.uid);
      
      // Kullanıcı profilini güncelle
      console.log('Updating user profile with displayName:', fullName);
      await updateProfile(userCredential.user, {
        displayName: fullName,
        photoURL: data.photoURL || null,
      });

      // Firestore'a kullanıcı bilgilerini kaydet
      console.log('Saving user data to Firestore...');
      const userDoc = doc(db, 'users', userCredential.user.uid);
      
      // Undefined değerleri filtrele
      const userData = {
        email: email.toLowerCase(),
        fullName: fullName || '',
        photoURL: data.photoURL || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isEmailVerified: false,
        phoneNumber: data.phoneNumber || null,
        settings: {
          language: 'tr',
          currency: 'TRY'
        }
      };

      // Undefined değerleri olan alanları filtrele
      const cleanUserData = Object.fromEntries(
        Object.entries(userData).filter(([_, value]) => value !== undefined)
      );
      
      await setDoc(userDoc, cleanUserData);
      console.log('User data saved to Firestore');

      // Güncel kullanıcı bilgilerini al
      const currentUser = await this.getCurrentUser(userCredential.user);
      console.log('Current user data:', currentUser);

      return {
        user: currentUser,
        token: await userCredential.user.getIdToken(),
      };
    } catch (error) {
      console.error('Error during registration:', error);
      throw error;
    }
  };

  // Çıkış işlemi
  logout: () => Promise<void> = async () => {
    await signOut(auth);
  };

  // Email doğrulama
  verifyEmail: () => Promise<void> = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  // Şifre sıfırlama
  resetPassword: (email: string) => Promise<void> = async (email) => {
    await sendPasswordResetEmail(auth, email);
  };

  // Kullanıcı güncelleme
  updateUser: (userData: Partial<User>) => Promise<User> = async (userData) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Kullanıcı bulunamadı');

      // Firebase Auth profilini güncelle
      await updateProfile(user, {
        displayName: userData.fullName,
        photoURL: userData.photoURL,
      });

      // Firestore'daki kullanıcı dokümanını güncelle
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ...userData,
        updatedAt: serverTimestamp(),
      });

      // Güncellenmiş kullanıcı bilgilerini al
      const userDoc = await getDoc(userRef);
      const updatedUserData = userDoc.data();

      return {
        id: user.uid,
        email: user.email!,
        fullName: user.displayName || '',
        photoURL: user.photoURL || undefined,
        createdAt: user.metadata.creationTime!,
        updatedAt: user.metadata.lastSignInTime!,
        isEmailVerified: user.emailVerified,
        phoneNumber: user.phoneNumber || undefined,
        ...updatedUserData,
      };
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Kullanıcı bilgileri güncellenirken bir hata oluştu');
    }
  };

  // Grup yönetimi metodları
  async createGroup(groupData: CreateGroupData): Promise<string> {
    try {
      console.log('Creating group with data:', groupData);
      const groupsRef = collection(db, 'groups');
      console.log('Collection reference created');
      
      // Grup verilerini hazırla
      const groupToCreate = {
        ...groupData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'active',
      };
      
      console.log('Final group data to save:', groupToCreate);
      const newGroupRef = await addDoc(groupsRef, groupToCreate);
      console.log('Group created with ID:', newGroupRef.id);
      
      return newGroupRef.id;
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  }

  async getUserGroups(): Promise<Group[]> {
    try {
      const currentUser = await this.getCurrentUser(auth.currentUser as FirebaseUser);
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const groupsRef = collection(db, 'groups');
      const q = query(groupsRef, where('members', 'array-contains', currentUser.id));
      const groupsSnapshot = await getDocs(q);

      const groups = await Promise.all(
        groupsSnapshot.docs.map(async (doc: QueryDocumentSnapshot<DocumentData>) => {
          const groupData = doc.data();
          const memberDetails = await Promise.all(
            groupData.members.map(async (memberId: string) => {
              const user = await this.getUserById(memberId);
              return user ? {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                photoURL: user.photoURL,
              } : undefined;
            })
          );

          return {
            ...groupData,
            id: doc.id,
            members: memberDetails.filter(Boolean),
          } as Group;
        })
      );

      return groups;
    } catch (error) {
      console.error('Error getting user groups:', error);
      throw error;
    }
  }

  async getGroupById(groupId: string): Promise<Group> {
    try {
      console.log('Fetching group details:', groupId);
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);

      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }

      const groupData = groupDoc.data();
      
      // Önce mevcut kullanıcıyı al
      const currentUser = auth.currentUser;
      console.log('Current user:', currentUser?.uid);

      // Üye listesini oluştur
      const members = [];

      // Eğer mevcut kullanıcı grup üyesiyse, Firestore'dan bilgilerini al
      if (currentUser && groupData.members.includes(currentUser.uid)) {
        console.log('Fetching current user details from Firestore');
        const currentUserDoc = await getDoc(doc(db, 'users', currentUser.uid));
        
        if (currentUserDoc.exists()) {
          const userData = currentUserDoc.data();
          members.push({
            id: currentUser.uid,
            email: userData.email || currentUser.email || '',
            fullName: userData.fullName || currentUser.displayName || '',
            photoURL: userData.photoURL || currentUser.photoURL || null,
          });
        } else {
          // Firestore'da yoksa Authentication verilerini kullan
          members.push({
            id: currentUser.uid,
            email: currentUser.email || '',
            fullName: currentUser.displayName || '',
            photoURL: currentUser.photoURL || null,
          });
        }
      }

      // Diğer üyelerin bilgilerini al
      console.log('Fetching other member details for members:', groupData.members);
      const otherMembers = groupData.members.filter((id: string) => id !== currentUser?.uid);
      
      const memberPromises = otherMembers.map(async (memberId: string) => {
        try {
          console.log(`Fetching user document for member ID: ${memberId}`);
          const userDoc = await getDoc(doc(db, 'users', memberId));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log(`User data found for ${memberId}:`, userData);
            
            return {
              id: userDoc.id,
              email: userData.email || '',
              fullName: userData.fullName || '',
              photoURL: userData.photoURL || null,
            };
          }
          
          console.log(`User document not found for member ID: ${memberId}`);
          return null;
        } catch (error) {
          console.error(`Error fetching member ${memberId}:`, error);
          return null;
        }
      });

      const otherMemberDetails = (await Promise.all(memberPromises))
        .filter((member): member is NonNullable<typeof member> => member !== null);
      
      // Mevcut kullanıcı ve diğer üyeleri birleştir
      members.push(...otherMemberDetails);
      console.log('Final member list:', members);

      return {
        id: groupDoc.id,
        ...groupData,
        members,
        createdAt: groupData.createdAt?.toDate() || new Date(),
        updatedAt: groupData.updatedAt?.toDate() || new Date(),
      } as Group;
    } catch (error) {
      console.error('Error fetching group:', error);
      throw error;
    }
  }

  async updateGroup(groupId: string, updateData: Partial<Group>): Promise<void> {
    try {
      console.log('Updating group:', groupId, updateData);
      const groupRef = doc(db, 'groups', groupId);
      
      // Önce mevcut grup verilerini al
      const groupDoc = await getDoc(groupRef);
      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }
      const currentData = groupDoc.data();
      
      // Eğer members güncelleniyorsa, mevcut üyeleri koru ve yeni üyeleri ekle
      if (updateData.members) {
        console.log('Current members:', currentData.members);
        console.log('New members to add:', updateData.members);
        
        // Mevcut ve yeni üyeleri birleştir, tekrar edenleri kaldır
        const allMembers = Array.from(new Set([
          ...currentData.members,
          ...(Array.isArray(updateData.members) 
            ? updateData.members.map(member => typeof member === 'string' ? member : member.id)
            : [updateData.members]
          )
        ]));
        
        console.log('Final member list:', allMembers);
        
        await updateDoc(groupRef, {
          ...updateData,
          members: allMembers,
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(groupRef, {
          ...updateData,
          updatedAt: serverTimestamp(),
        });
      }
      
      console.log('Group updated successfully');
    } catch (error) {
      console.error('Error updating group:', error);
      throw error;
    }
  }

  // Kullanıcı arama
  async searchUsers(searchQuery: string): Promise<User[]> {
    try {
      console.log('Searching users with query:', searchQuery);
      const usersRef = collection(db, 'users');
      
      // Email ile tam eşleşme ara
      const q = query(usersRef, where('email', '==', searchQuery.toLowerCase()));
      const querySnapshot = await getDocs(q);

      console.log('Search results count:', querySnapshot.size);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          email: data.email || '',
          fullName: data.fullName || '',
          photoURL: data.photoURL,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          isEmailVerified: data.isEmailVerified || false,
          phoneNumber: data.phoneNumber,
        };
      });
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  // Harcama yönetimi metodları
  async createExpense(groupId: string, expenseData: CreateExpenseData): Promise<string> {
    try {
      console.log('Creating expense:', expenseData);
      const expensesRef = collection(db, 'groups', groupId, 'expenses');
      
      const expenseToCreate = {
        ...expenseData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'pending',
      };

      const docRef = await addDoc(expensesRef, expenseToCreate);
      console.log('Expense created with ID:', docRef.id);
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  }

  async getExpenses(groupId: string): Promise<Expense[]> {
    try {
      console.log('Fetching expenses for group:', groupId);
      const expensesRef = collection(db, 'groups', groupId, 'expenses');
      const q = query(expensesRef, orderBy('createdAt', 'desc'));
      
      const expensesSnapshot = await getDocs(q);
      console.log('Found expenses:', expensesSnapshot.size);

      const expenses = await Promise.all(
        expensesSnapshot.docs.map(async (doc: QueryDocumentSnapshot<DocumentData>) => {
          const expenseData = doc.data() as Omit<Expense, 'id'>;
          const paidByUser = await this.getUserById(expenseData.paidBy);

          return {
            ...expenseData,
            id: doc.id,
            createdAt: expenseData.createdAt instanceof Timestamp ? expenseData.createdAt.toDate() : new Date(),
            updatedAt: expenseData.updatedAt instanceof Timestamp ? expenseData.updatedAt.toDate() : new Date(),
            paidBy: expenseData.paidBy,
            paidByUser: paidByUser || undefined,
          } as Expense;
        })
      );

      return expenses;
    } catch (error) {
      console.error('Error getting group expenses:', error);
      throw error;
    }
  }

  async getExpenseById(groupId: string, expenseId: string): Promise<Expense> {
    try {
      console.log('Fetching expense:', expenseId);
      const expenseRef = doc(db, 'groups', groupId, 'expenses', expenseId);
      const expenseDoc = await getDoc(expenseRef);

      if (!expenseDoc.exists()) {
        throw new Error('Expense not found');
      }

      const data = expenseDoc.data() as Omit<Expense, 'id' | 'paidByUser'>;
      const paidByUser = await this.getUserById(data.paidBy);

      return {
        ...data,
        id: expenseDoc.id,
        paidByUser: paidByUser ? {
          id: paidByUser.id,
          fullName: paidByUser.fullName,
          email: paidByUser.email,
          photoURL: paidByUser.photoURL,
        } : undefined,
      };
    } catch (error) {
      console.error('Error fetching expense:', error);
      throw error;
    }
  }

  async updateExpense(groupId: string, expenseId: string, updateData: UpdateExpenseData): Promise<void> {
    try {
      console.log('Updating expense:', expenseId, updateData);
      const expenseRef = doc(db, 'groups', groupId, 'expenses', expenseId);
      
      await updateDoc(expenseRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
      });
      
      console.log('Expense updated successfully');
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  }

  async deleteExpense(groupId: string, expenseId: string): Promise<void> {
    try {
      console.log('Deleting expense:', expenseId);
      const expenseRef = doc(db, 'groups', groupId, 'expenses', expenseId);
      await deleteDoc(expenseRef);
      console.log('Expense deleted successfully');
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }

  async deleteGroup(groupId: string): Promise<void> {
    try {
      const groupRef = doc(db, 'groups', groupId);
      await deleteDoc(groupRef);
    } catch (error) {
      console.error('Error deleting group:', error);
      throw error;
    }
  }

  // Yardımcı metodlar
  private async getUserById(userId: string): Promise<GroupMember | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          id: userDoc.id,
          email: userData.email || '',
          fullName: userData.fullName || '',
          photoURL: userData.photoURL || null,
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error('Kullanıcı bulunamadı');

      // Mevcut şifre ile yeniden kimlik doğrulama
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Şifre güncelleme
      await updatePassword(user, newPassword);
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        throw new Error('Mevcut şifre yanlış');
      }
      throw error;
    }
  }

  async updateNotificationSettings(userId: string, settings: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    balanceAlerts: boolean;
    groupInvites: boolean;
  }): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        notificationSettings: settings
      });
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw new Error('Bildirim ayarları güncellenirken bir hata oluştu');
    }
  }
}

export const firebaseService = new FirebaseService();
