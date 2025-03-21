    // Temel kullanıcı bilgileri
    export type User = {
        id: string;
        email: string;
        fullName: string;
        photoURL?: string;
        createdAt: Date | string;
        updatedAt: Date | string;
        phoneNumber?: string;
        isEmailVerified: boolean;
    };

    // Kullanıcı ayarları
    export type UserSettings = {
        language: 'tr' | 'en';
        currency: 'TRY' | 'USD' | 'EUR';
        notifications: {
            email: boolean;
            push: boolean;
        };
        theme: 'light' | 'dark' | 'system';
    };

    // Kullanıcı istatistikleri
    export type UserStats = {
        totalGroups: number;
        totalExpenses: number;
        totalBalance: number;
        joinedAt: Date | string;
    };

    // Kullanıcı profil güncelleme verileri
    export type UserUpdateData = Partial<{
        fullName: string;
        photoURL: string;
        phoneNumber: string;
        settings: Partial<UserSettings>;
    }>;

    // Kullanıcı özet bilgileri (grup üyeleri listesi gibi yerlerde kullanılabilir)
    export type UserSummary = Pick<User, 'id' | 'fullName' | 'photoURL'>;

    // Yeni kullanıcı oluşturmak için gerekli veriler
    export type CreateUserData = Omit<User, 
        'id' | 'createdAt' | 'updatedAt' | 'isEmailVerified'
    >;

    // Kullanıcı oluşturma yanıtı
    export type CreateUserResponse = User & {
        authToken: string;
        refreshToken: string;
    };
