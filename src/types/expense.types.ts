import { User, UserSummary } from './user.types';

// Temel harcama bilgilerini içeren tip
export type Expense = {
    id: string;
    groupId: string;
    description: string;
    amount: number;
    currency: 'TRY' | 'USD' | 'EUR';
    date: Date | string;
    createdAt: Date | string;
    updatedAt: Date | string;
    category: ExpenseCategory;
    paidBy: UserSummary;
    participants: ExpenseParticipant[];
    status: ExpenseStatus;
    notes?: string;
    attachments?: string[]; // Dosya URL'leri
};

// Harcama kategorileri
export type ExpenseCategory = 
    | 'Gıda' 
    | 'Ulaşım' 
    | 'Alış-Veriş'
    | 'İçerik'
    | 'Araç-Gereç'
    | 'Kiralama'
    | 'Diğer'
    | 'Hizmet'
    | 'Konut'
    | 'Eğitim'
    | 'Sağlık'
    | 'Kişisel'
    | 'Diğer';

// Harcama durumu
export type ExpenseStatus = 
    | 'pending'    // Henüz ödenmemiş
    | 'settled'    // Tamamen ödenmiş
    | 'partially_settled'; // Kısmen ödenmiş

// Harcamaya katılan kişilerin detayları
export type ExpenseParticipant = {
    user: UserSummary;
    share: number;        // Kişinin ödemesi gereken miktar
    paidAmount: number;   // Kişinin ödediği miktar
    settled: boolean;     // Kişinin ödemeyi tamamlayıp tamamlamadığı
};

// Yeni harcama oluşturmak için gerekli veriler
export type CreateExpenseData = Omit<Expense, 
    'id' | 'createdAt' | 'updatedAt' | 'status'
>;

// Harcama güncelleme verileri
export type UpdateExpenseData = Partial<CreateExpenseData>;

// Harcama özeti (liste görünümü için)
export type ExpenseSummary = Pick<Expense, 
    'id' | 'description' | 'amount' | 'currency' | 'date' | 'category' | 'status'
> & {
    paidBy: UserSummary;
};
