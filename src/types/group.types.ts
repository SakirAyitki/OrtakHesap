import { UserSummary } from './user.types';
import { ExpenseSummary } from './expense.types';

// Temel grup bilgilerini içeren tip
export interface Group {
    id: string;
    name: string;
    description?: string;
    currency: 'TRY' | 'USD' | 'EUR';
    splitMethod: 'equal' | 'percentage' | 'amount';
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    image?: string;
    members: GroupMember[];
    balance: number;
    settings: GroupSettings;
    status: GroupStatus;
}

// Grup üyelik detayları
export interface GroupMember {
    id: string;
    fullName: string;
    email: string;
    photoURL?: string;
}

// Grup rolleri
export type GroupRole = 
    | 'admin'     // Tam yetkili
    | 'moderator' // Harcama ekleyebilir, üye yönetebilir
    | 'member';   // Sadece harcama ekleyebilir

// Grup durumu
export type GroupStatus = 
    | 'active'    // Aktif grup
    | 'archived'  // Arşivlenmiş grup
    | 'closed';   // Kapatılmış grup


// Grup ayarları
export type GroupSettings = {
    notifications: {
        expenseNotifications: boolean;
        memberNotifications: boolean;
        balanceNotifications: boolean;
    };
    autoApproveExpenses: boolean;
    allowMemberInvite: boolean;
};

// Grup özeti (liste görünümü için)
export type GroupSummary = Pick<Group, 
    'id' | 'name' | 'image'
> & {
    memberCount: number;
    totalBalance: number;
    recentExpenses: ExpenseSummary[];
};

// Yeni grup oluşturmak için gerekli veriler
export interface CreateGroupData {
    name: string;
    description?: string;
    members: string[];
}

// Grup güncelleme verileri
export type UpdateGroupData = Partial<CreateGroupData>;
