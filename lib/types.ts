export type ServiceType = "chatgpt" | "netflix" | "google_drive" | "spotify" | "youtube" | "capcut" | "other";

export interface Service {
  id: string;
  name: string;
  type: ServiceType;
  icon: string;
}

export interface Account {
  id: string;
  serviceId: string;
  label: string;        // "Netflix Gia đình 1"
  email: string;
  password: string;     // plain text (personal use only)
  totalSlots: number;
  monthlyFee: number;   // VND per slot/month
  yearlyFee: number;    // VND per slot/year (0 = no yearly option)
  renewalDate: string;  // ISO date
  notes: string;
  joinLink: string;
  requireEmail: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  fbLink: string;
  lookupPin: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  accountId: string;
  slotLabel: string;    // "Slot 1", "Profile A"
  startDate: string;
  endDate: string;
  duration: number;     // months: 1, 3, 6, 12
  status: "active" | "cancelled";
  createdAt: string;
}

export interface Payment {
  id: string;
  subscriptionId: string;
  userId: string;
  accountId: string;
  amount: number;
  month: string;        // "2026-03"
  status: "pending" | "paid" | "overdue";
  paidAt: string | null;
  note: string;
  createdAt: string;
}

export interface Settings {
  bankId: string;       // "MB", "VCB", "TCB"
  bankBin: string;      // numeric bin for VietQR
  accountNo: string;
  accountName: string;
  reminderDays: number;
  adminPassword: string;
  shopTitle: string;
  shopDescription: string;
  transferNote: string;
  ogImage: string;
  telegramBotToken: string;
  telegramChatId: string;
}

export interface Order {
  id: string;
  accountId: string;
  customerName: string;
  customerPhone: string;
  customerFb: string;
  customerEmail: string;
  amount: number;
  duration: number;     // months: 1, 3, 6, 12
  promoCodeId?: string | null;
  status: "pending" | "confirmed" | "expired";
  customerConfirmed: boolean;
  paymentProof?: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface PromoCode {
  id: string;
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  applicableAccountIds: string[];
  expiresAt: string | null;
  maxUses: number;
  usedCount: number;
  active: boolean;
  createdAt: string;
}

// Enriched types for display
export interface AccountWithService extends Account {
  service: Service;
  activeSlots: number;
}

export interface SubscriptionWithDetails extends Subscription {
  user: User;
  account: AccountWithService;
}

export interface PaymentWithDetails extends Payment {
  user: User;
  account: AccountWithService;
  subscription: Subscription;
}
