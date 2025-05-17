import { User, UserSummary } from './user.types';
import { GroupMember } from './group.types';

// Temel harcama bilgilerini içeren tip
export type Expense = {
    id: string;
    groupId: string;
    title: string;
    description?: string;
    amount: number;
    currency: 'TRY' | 'USD' | 'EUR';
    paidBy: string; // User ID
    paidByUser?: GroupMember; // User details who paid
    splitMethod: 'equal' | 'percentage' | 'amount';
    participants: ExpenseParticipant[];
    category?: string;
    date: Date;
    createdAt: Date;
    updatedAt: Date;
    attachments?: string[]; // URLs
};

// Harcama kategorileri
export const EXPENSE_CATEGORIES = [
    'Yiyecek & İçecek',
    'Market',
    'Ulaşım',
    'Konaklama',
    'Eğlence',
    'Alışveriş',
    'Faturalar',
    'Diğer'
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];


// Harcamaya katılan kişilerin detayları
export type ExpenseParticipant = {
    userId: string;
    share: number; // Tutar veya yüzde
    paid: boolean;
    paidAmount?: number;
    paidAt?: Date;
};

// Yeni harcama oluşturmak için gerekli veriler
export type CreateExpenseData = Omit<Expense, 
    'id' | 'createdAt' | 'updatedAt' | 'status'
>;

// Harcama güncelleme verileri
export type UpdateExpenseData = Partial<CreateExpenseData>;

// Harcama özeti (liste görünümü için)
export type ExpenseSummary = Pick<Expense, 
    'id' | 'title' | 'amount' | 'currency' | 'date'
> & {
    paidByUser: GroupMember;
    participantCount: number;
};
