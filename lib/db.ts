import fs from "fs";
import path from "path";
import { Account, User, Subscription, Payment, Settings, Service } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");

function readJSON<T>(filename: string, defaultValue: T): T {
  const filePath = path.join(DATA_DIR, filename);
  try {
    if (!fs.existsSync(filePath)) return defaultValue;
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

function writeJSON<T>(filename: string, data: T): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2));
}

// --- Services ---
export const servicesDB = {
  getAll: () => readJSON<Service[]>("services.json", DEFAULT_SERVICES),
  getById: (id: string) => servicesDB.getAll().find(s => s.id === id),
  save: (services: Service[]) => writeJSON("services.json", services),
  create: (data: Omit<Service, "id">) => {
    const services = servicesDB.getAll();
    const newService: Service = { id: crypto.randomUUID(), ...data };
    services.push(newService);
    servicesDB.save(services);
    return newService;
  },
  update: (id: string, data: Partial<Service>) => {
    const services = servicesDB.getAll().map(s => s.id === id ? { ...s, ...data } : s);
    servicesDB.save(services);
    return services.find(s => s.id === id);
  },
  delete: (id: string) => {
    const services = servicesDB.getAll().filter(s => s.id !== id);
    servicesDB.save(services);
  },
};

// --- Accounts ---
export const accountsDB = {
  getAll: () => readJSON<Account[]>("accounts.json", []),
  getById: (id: string) => accountsDB.getAll().find(a => a.id === id),
  save: (accounts: Account[]) => writeJSON("accounts.json", accounts),
  create: (data: Omit<Account, "id" | "createdAt">) => {
    const accounts = accountsDB.getAll();
    const newAccount: Account = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...data };
    accounts.push(newAccount);
    accountsDB.save(accounts);
    return newAccount;
  },
  update: (id: string, data: Partial<Account>) => {
    const accounts = accountsDB.getAll().map(a => a.id === id ? { ...a, ...data } : a);
    accountsDB.save(accounts);
    return accounts.find(a => a.id === id);
  },
  delete: (id: string) => {
    const accounts = accountsDB.getAll().filter(a => a.id !== id);
    accountsDB.save(accounts);
  },
};

// --- Users ---
export const usersDB = {
  getAll: () => readJSON<User[]>("users.json", []),
  getById: (id: string) => usersDB.getAll().find(u => u.id === id),
  save: (users: User[]) => writeJSON("users.json", users),
  create: (data: Omit<User, "id" | "createdAt">) => {
    const users = usersDB.getAll();
    const newUser: User = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...data };
    users.push(newUser);
    usersDB.save(users);
    return newUser;
  },
  update: (id: string, data: Partial<User>) => {
    const users = usersDB.getAll().map(u => u.id === id ? { ...u, ...data } : u);
    usersDB.save(users);
    return users.find(u => u.id === id);
  },
  delete: (id: string) => {
    usersDB.save(usersDB.getAll().filter(u => u.id !== id));
  },
};

// --- Subscriptions ---
export const subscriptionsDB = {
  getAll: () => readJSON<Subscription[]>("subscriptions.json", []),
  getById: (id: string) => subscriptionsDB.getAll().find(s => s.id === id),
  getByAccount: (accountId: string) => subscriptionsDB.getAll().filter(s => s.accountId === accountId && s.status === "active"),
  getByUser: (userId: string) => subscriptionsDB.getAll().filter(s => s.userId === userId),
  save: (subs: Subscription[]) => writeJSON("subscriptions.json", subs),
  create: (data: Omit<Subscription, "id" | "createdAt">) => {
    const subs = subscriptionsDB.getAll();
    const newSub: Subscription = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...data };
    subs.push(newSub);
    subscriptionsDB.save(subs);
    return newSub;
  },
  update: (id: string, data: Partial<Subscription>) => {
    const subs = subscriptionsDB.getAll().map(s => s.id === id ? { ...s, ...data } : s);
    subscriptionsDB.save(subs);
    return subs.find(s => s.id === id);
  },
  delete: (id: string) => {
    subscriptionsDB.save(subscriptionsDB.getAll().filter(s => s.id !== id));
  },
};

// --- Payments ---
export const paymentsDB = {
  getAll: () => readJSON<Payment[]>("payments.json", []),
  getById: (id: string) => paymentsDB.getAll().find(p => p.id === id),
  getByUser: (userId: string) => paymentsDB.getAll().filter(p => p.userId === userId),
  getByMonth: (month: string) => paymentsDB.getAll().filter(p => p.month === month),
  save: (payments: Payment[]) => writeJSON("payments.json", payments),
  create: (data: Omit<Payment, "id" | "createdAt">) => {
    const payments = paymentsDB.getAll();
    const newPayment: Payment = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...data };
    payments.push(newPayment);
    paymentsDB.save(payments);
    return newPayment;
  },
  update: (id: string, data: Partial<Payment>) => {
    const payments = paymentsDB.getAll().map(p => p.id === id ? { ...p, ...data } : p);
    paymentsDB.save(payments);
    return payments.find(p => p.id === id);
  },
  delete: (id: string) => {
    paymentsDB.save(paymentsDB.getAll().filter(p => p.id !== id));
  },
};

// --- Settings ---
export const settingsDB = {
  get: () => readJSON<Settings>("settings.json", DEFAULT_SETTINGS),
  save: (settings: Settings) => writeJSON("settings.json", settings),
  update: (data: Partial<Settings>) => {
    const settings = { ...settingsDB.get(), ...data };
    settingsDB.save(settings);
    return settings;
  },
};

// --- Defaults ---
const DEFAULT_SERVICES: Service[] = [
  { id: "chatgpt", name: "ChatGPT Plus", type: "chatgpt", icon: "🤖" },
  { id: "netflix", name: "Netflix", type: "netflix", icon: "🎬" },
  { id: "google_drive", name: "Google Drive", type: "google_drive", icon: "💾" },
  { id: "spotify", name: "Spotify", type: "spotify", icon: "🎵" },
  { id: "youtube", name: "YouTube Premium", type: "youtube", icon: "▶️" },
];

const DEFAULT_SETTINGS: Settings = {
  bankId: "MB",
  bankBin: "970422",
  accountNo: "",
  accountName: "",
  reminderDays: 7,
  adminPassword: "admin123",
};
