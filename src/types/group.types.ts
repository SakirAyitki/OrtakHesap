import { UserSummary } from './user.types';
import { ExpenseSummary } from './expense.types';

// Temel grup bilgilerini içeren tip
export type Group = {
    id: string;
    name: string;
    description?: string;
    createdAt: Date | string;
    updatedAt: Date | string;
    createdBy: UserSummary;
    image?: string;
    members: GroupMember[];
    settings: GroupSettings;
    status: GroupStatus;
};

// Grup üyelik detayları
export type GroupMember = {
    user: UserSummary;
    role: GroupRole;
    joinedAt: Date | string;
    balance: number;
    status: MembershipStatus;
};

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

// Üyelik durumu
export type MembershipStatus = 
    | 'active'    // Aktif üye
    | 'pending'   // Davet bekliyor
    | 'left';     // Gruptan ayrılmış

// Grup ayarları
export type GroupSettings = {
    currency: 'TRY' | 'USD' | 'EUR';
    splitMethod: 'equal' | 'percentage' | 'amount';
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
export type CreateGroupData = Omit<Group,
    'id' | 'createdAt' | 'updatedAt' | 'members' | 'status'
>;

// Grup güncelleme verileri
export type UpdateGroupData = Partial<CreateGroupData>;
