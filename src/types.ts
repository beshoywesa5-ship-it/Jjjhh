export type TransactionType = 'expense' | 'income' | 'transfer';

export type AccountType = 'cash' | 'debit_card' | 'credit_card' | 'bank' | 'mobile_wallet';

export type FontSizeOption = 'compact' | 'normal' | 'large' | 'xlarge';

export type NumberFormatOption = 'arabic' | 'western';

export interface Expense {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  accountId: string;
  paymentMethod?: string;
  paymentMethodId: string;
  fromAccountId?: string;
  toAccountId?: string;
  note: string;
  merchant: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  currency?: string;
  tags?: string[];
  isRecurring?: boolean;
  recurringId?: string;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault?: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  periodStart: string;
  periodEnd: string;
  amount: number;
  currency?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  openingBalance: number;
  currency: string;
  color: string;
  icon?: string;
  isActive: boolean;
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AccountSummary {
  account: Account;
  totalIncome: number;
  totalExpense: number;
  currentBalance: number;
  transactionCount: number;
}

export interface RecurringTransaction {
  id: string;
  name?: string;
  note: string;
  amount: number;
  type: 'expense' | 'income';
  categoryId: string;
  accountId?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate?: string;
  nextOccurrence?: string;
  lastProcessedDate?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface Settings {
  id?: string;
  currency: string;
  currencySymbol?: string;
  theme: 'light' | 'dark';
  language?: 'ar' | 'en';
  numberFormat?: NumberFormatOption;
  fontSize?: FontSizeOption;
  notifications: boolean;
  biometricLock: boolean;
  showWalletsOnHome?: boolean;
  firstDayOfMonth: number;
  budgetNotificationThreshold: number;
  hasCompletedOnboarding: boolean;
  isDemoInitialized?: boolean;
  pinCode?: string;
  passcode?: string;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  color?: string;
  icon?: string;
  createdAt: string;
}

export interface BudgetPace {
  status: 'no_budget' | 'on_track' | 'watch' | 'attention' | 'under_budget' | 'over_budget';
  budget: number | null;
  totalSpent: number;
  remaining: number;
  percentUsed: number | null;
  requiredRemainingDailyAverage: number;
  daysElapsed: number;
  daysRemaining: number;
  daysInMonth: number;
  burnRate?: number;
  projectedTotal?: number;
  statusMessage?: string;
}

export interface FilterOptions {
  search: string;
  type: 'all' | 'expense' | 'income' | 'transfer';
  categoryIds: string[];
  paymentMethodIds: string[];
  accountIds?: string[];
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy: 'newest' | 'oldest' | 'highest' | 'lowest';
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: number;
  details: string[];
}
