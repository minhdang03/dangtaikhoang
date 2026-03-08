import { prisma } from "./prisma";
import type { Service, Account, User, Subscription, Payment, Settings, Order } from "./types";

// Prisma DateTime → ISO string converters
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toAccount = (a: any): Account => ({ ...a, createdAt: a.createdAt.toISOString() });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toUser = (u: any): User => ({ ...u, createdAt: u.createdAt.toISOString() });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toSub = (s: any): Subscription => ({ ...s, createdAt: s.createdAt.toISOString() });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toPayment = (p: any): Payment => ({
  ...p,
  createdAt: p.createdAt.toISOString(),
  paidAt: p.paidAt ? p.paidAt.toISOString() : null,
});

const DEFAULT_SERVICES: Omit<Service, never>[] = [
  { id: "chatgpt", name: "ChatGPT Plus", type: "chatgpt", icon: "🤖" },
  { id: "netflix", name: "Netflix", type: "netflix", icon: "🎬" },
  { id: "google_drive", name: "Google Drive", type: "google_drive", icon: "💾" },
  { id: "spotify", name: "Spotify", type: "spotify", icon: "🎵" },
  { id: "youtube", name: "YouTube Premium", type: "youtube", icon: "▶️" },
];

const DEFAULT_SETTINGS: Omit<Settings, never> = {
  bankId: "MB",
  bankBin: "970422",
  accountNo: "",
  accountName: "",
  reminderDays: 7,
  adminPassword: "admin123",
};

// --- Services ---
export const servicesDB = {
  getAll: async (): Promise<Service[]> => {
    const services = await prisma.service.findMany({ orderBy: { name: "asc" } });
    if (services.length > 0) return services as Service[];
    await prisma.service.createMany({ data: DEFAULT_SERVICES, skipDuplicates: true });
    return prisma.service.findMany({ orderBy: { name: "asc" } }) as Promise<Service[]>;
  },
  getById: async (id: string): Promise<Service | null> => {
    return prisma.service.findUnique({ where: { id } }) as Promise<Service | null>;
  },
  create: async (data: Omit<Service, "id">): Promise<Service> => {
    return prisma.service.create({ data: { id: crypto.randomUUID(), ...data } }) as Promise<Service>;
  },
  update: async (id: string, data: Partial<Service>): Promise<Service | null> => {
    return prisma.service.update({ where: { id }, data }) as Promise<Service>;
  },
  delete: async (id: string): Promise<void> => {
    await prisma.service.delete({ where: { id } });
  },
};

// --- Accounts ---
export const accountsDB = {
  getAll: async (): Promise<Account[]> => {
    const rows = await prisma.account.findMany({ orderBy: { createdAt: "asc" } });
    return rows.map(toAccount);
  },
  getById: async (id: string): Promise<Account | null> => {
    const row = await prisma.account.findUnique({ where: { id } });
    return row ? toAccount(row) : null;
  },
  create: async (data: Omit<Account, "id" | "createdAt">): Promise<Account> => {
    const row = await prisma.account.create({ data });
    return toAccount(row);
  },
  update: async (id: string, data: Partial<Account>): Promise<Account | null> => {
    const row = await prisma.account.update({ where: { id }, data });
    return toAccount(row);
  },
  delete: async (id: string): Promise<void> => {
    await prisma.account.delete({ where: { id } });
  },
};

// --- Users ---
export const usersDB = {
  getAll: async (): Promise<User[]> => {
    const rows = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
    return rows.map(toUser);
  },
  getById: async (id: string): Promise<User | null> => {
    const row = await prisma.user.findUnique({ where: { id } });
    return row ? toUser(row) : null;
  },
  create: async (data: Omit<User, "id" | "createdAt">): Promise<User> => {
    const row = await prisma.user.create({ data });
    return toUser(row);
  },
  update: async (id: string, data: Partial<User>): Promise<User | null> => {
    const row = await prisma.user.update({ where: { id }, data });
    return toUser(row);
  },
  delete: async (id: string): Promise<void> => {
    await prisma.user.delete({ where: { id } });
  },
};

// --- Subscriptions ---
export const subscriptionsDB = {
  getAll: async (): Promise<Subscription[]> => {
    const rows = await prisma.subscription.findMany({ orderBy: { createdAt: "asc" } });
    return rows.map(toSub);
  },
  getById: async (id: string): Promise<Subscription | null> => {
    const row = await prisma.subscription.findUnique({ where: { id } });
    return row ? toSub(row) : null;
  },
  getByAccount: async (accountId: string): Promise<Subscription[]> => {
    const rows = await prisma.subscription.findMany({
      where: { accountId, status: "active" },
    });
    return rows.map(toSub);
  },
  getByUser: async (userId: string): Promise<Subscription[]> => {
    const rows = await prisma.subscription.findMany({ where: { userId } });
    return rows.map(toSub);
  },
  create: async (data: Omit<Subscription, "id" | "createdAt">): Promise<Subscription> => {
    const row = await prisma.subscription.create({ data });
    return toSub(row);
  },
  update: async (id: string, data: Partial<Subscription>): Promise<Subscription | null> => {
    const row = await prisma.subscription.update({ where: { id }, data });
    return toSub(row);
  },
  delete: async (id: string): Promise<void> => {
    await prisma.subscription.delete({ where: { id } });
  },
};

// --- Payments ---
export const paymentsDB = {
  getAll: async (): Promise<Payment[]> => {
    const rows = await prisma.payment.findMany({ orderBy: { createdAt: "asc" } });
    return rows.map(toPayment);
  },
  getById: async (id: string): Promise<Payment | null> => {
    const row = await prisma.payment.findUnique({ where: { id } });
    return row ? toPayment(row) : null;
  },
  getByUser: async (userId: string): Promise<Payment[]> => {
    const rows = await prisma.payment.findMany({ where: { userId } });
    return rows.map(toPayment);
  },
  getByMonth: async (month: string): Promise<Payment[]> => {
    const rows = await prisma.payment.findMany({ where: { month } });
    return rows.map(toPayment);
  },
  create: async (data: Omit<Payment, "id" | "createdAt">): Promise<Payment> => {
    const row = await prisma.payment.create({
      data: {
        ...data,
        paidAt: data.paidAt ? new Date(data.paidAt) : null,
      },
    });
    return toPayment(row);
  },
  update: async (id: string, data: Partial<Payment>): Promise<Payment | null> => {
    const row = await prisma.payment.update({
      where: { id },
      data: {
        ...data,
        paidAt: data.paidAt !== undefined
          ? (data.paidAt ? new Date(data.paidAt) : null)
          : undefined,
      },
    });
    return toPayment(row);
  },
  delete: async (id: string): Promise<void> => {
    await prisma.payment.delete({ where: { id } });
  },
};

// --- Settings ---
export const settingsDB = {
  get: async (): Promise<Settings> => {
    const row = await prisma.settings.findUnique({ where: { id: 1 } });
    if (row) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _, ...settings } = row;
      return settings as Settings;
    }
    await prisma.settings.create({ data: { id: 1, ...DEFAULT_SETTINGS } });
    return DEFAULT_SETTINGS;
  },
  save: async (settings: Settings): Promise<void> => {
    await prisma.settings.upsert({
      where: { id: 1 },
      create: { id: 1, ...settings },
      update: settings,
    });
  },
  update: async (data: Partial<Settings>): Promise<Settings> => {
    const current = await settingsDB.get();
    const updated = { ...current, ...data };
    await settingsDB.save(updated);
    return updated;
  },
};

// --- Orders ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toOrder = (o: any): Order => ({
  ...o,
  createdAt: o.createdAt.toISOString(),
  expiresAt: o.expiresAt.toISOString(),
});

export const ordersDB = {
  getAll: async (): Promise<Order[]> => {
    const rows = await prisma.order.findMany({ orderBy: { createdAt: "desc" } });
    return rows.map(toOrder);
  },
  getPending: async (): Promise<Order[]> => {
    const rows = await prisma.order.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toOrder);
  },
  getById: async (id: string): Promise<Order | null> => {
    const row = await prisma.order.findUnique({ where: { id } });
    return row ? toOrder(row) : null;
  },
  create: async (data: Omit<Order, "id" | "createdAt">): Promise<Order> => {
    const row = await prisma.order.create({
      data: { ...data, expiresAt: new Date(data.expiresAt) },
    });
    return toOrder(row);
  },
  update: async (id: string, data: Partial<Order>): Promise<Order | null> => {
    const row = await prisma.order.update({
      where: { id },
      data: {
        ...data,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      },
    });
    return toOrder(row);
  },
};
