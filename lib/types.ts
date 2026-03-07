export type ServiceType = "chatgpt" | "netflix" | "google_drive" | "spotify" | "youtube" | "other";

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
  renewalDate: string;  // ISO date
  notes: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  fbLink: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  accountId: string;
  slotLabel: string;    // "Slot 1", "Profile A"
  startDate: string;
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
  reminderDays: number; // days before renewal to remind
  adminPassword: string;
}

export interface Order {
  id: string;
  accountId: string;
  customerName: string;
  customerPhone: string;
  customerFb: string;
  amount: number;
  status: "pending" | "confirmed" | "expired";
  createdAt: string;
  expiresAt: string;
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
