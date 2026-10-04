import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { 
  Expense, 
  Category, 
  Budget, 
  Account, 
  AccountSummary,
  RecurringTransaction, 
  Settings, 
  FilterOptions,
  BudgetPace,
  ImportResult,
  FontSizeOption,
  NumberFormatOption,
  SavingsGoal
} from '../types';
import { 
  localDB, 
  DEFAULT_BUDGET, 
  DEFAULT_CATEGORIES, 
  DEFAULT_ACCOUNTS,
  DEFAULT_SETTINGS 
} from '../db/indexedDB';
import { 
  calculateBudgetPace, 
  calculateAccountSummaries,
  validateAccount,
  validateTransfer,
  calculateNextOccurrence,
  validateBackupJSON,
  exportExpensesToCSV, 
  parseCSVWithAudit, 
  validateAmount, 
  validateCategory, 
  getLocalDateString,
  getLocalTimeString,
  getCurrentMonthPrefix,
  normalizeArabicNumerals
} from '../utils/calculations';
import { translations, Language, Translations, formatMonthLabel, formatDateLabel } from '../utils/i18n';

interface ToastState {
  id: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface AppContextType {
  // Data
  expenses: Expense[];
  categories: Category[];
  budget: Budget;
  accounts: Account[];
  recurring: RecurringTransaction[];
  settings: Settings;
  isLoading: boolean;

  // Aggregates & Pacing
  budgetPace: BudgetPace;
  frequentCategories: Category[];
  accountSummaries: {
    summaries: AccountSummary[];
    totalNetWorth: number;
    totalAssets: number;
    totalLiabilities: number;
  };
  referenceDate: Date;
  activePeriodLabel: string;

  // Navigation & Modals
  activeTab: 'home' | 'transactions' | 'insights' | 'settings';
  setActiveTab: (tab: 'home' | 'transactions' | 'insights' | 'settings') => void;
  isAddExpenseOpen: boolean;
  openAddExpense: (prefill?: Partial<Expense>) => void;
  closeAddExpense: () => void;
  editingExpense: Expense | null;
  setEditingExpense: (exp: Expense | null) => void;
  viewingExpense: Expense | null;
  setViewingExpense: (exp: Expense | null) => void;
  prefillExpense: Partial<Expense> | null;

  // Filters
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  resetFilters: () => void;
  filteredExpenses: Expense[];

  // CRUD Actions
  createExpense: (data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>) => Promise<Expense>;
  modifyExpense: (id: string, updates: Partial<Expense>) => Promise<Expense>;
  removeExpense: (id: string) => Promise<void>;
  undoDelete: () => Promise<void>;
  updateBudgetAmount: (amount: number) => Promise<void>;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  saveCategoryItem: (category: Category) => Promise<void>;
  toggleArchiveCategory: (id: string) => Promise<void>;
  deleteCategoryItem: (id: string) => Promise<void>;
  saveAccountItem: (account: Account) => Promise<void>;
  toggleArchiveAccount: (id: string) => Promise<void>;
  deleteAccountItem: (id: string) => Promise<void>;
  createTransfer: (data: { amount: number; fromAccountId: string; toAccountId: string; note?: string; date?: string; time?: string }) => Promise<Expense>;
  addRecurringItem: (rec: Omit<RecurringTransaction, 'id'>) => Promise<void>;
  removeRecurringItem: (id: string) => Promise<void>;
  processRecurringItem: (rec: RecurringTransaction) => Promise<void>;
  clearAllExpenses: () => Promise<void>;
  resetDatabaseToDemo: () => Promise<void>;

  // CSV & Backup
  downloadCSV: () => void;
  importCSVText: (csvText: string) => Promise<ImportResult>;
  downloadFullBackupJSON: () => void;
  importFullBackupJSON: (jsonText: string) => Promise<{ success: boolean; message: string }>;

  // Toast
  toast: ToastState | null;
  showToast: (message: string, actionLabel?: string, onAction?: () => void) => void;
  dismissToast: () => void;

  // Preference memory
  lastUsedCategoryId: string;
  lastUsedPaymentMethodId: string;

  // Language & Theme (i18n & Appearance)
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  numberFormat: NumberFormatOption;
  setNumberFormat: (format: NumberFormatOption) => Promise<void>;
  setCurrency: (currency: string) => Promise<void>;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => Promise<void>;
  toggleTheme: () => Promise<void>;
  fontSize: FontSizeOption;
  setFontSize: (size: FontSizeOption) => Promise<void>;
  isPrivacyMode: boolean;
  togglePrivacyMode: () => void;
  savingsGoals: SavingsGoal[];
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt'>) => void;
  updateSavingsGoal: (goal: SavingsGoal) => void;
  deleteSavingsGoal: (id: string) => void;
  duplicateExpense: (expense: Expense) => Promise<void>;
  t: Translations;
}

const initialFilters: FilterOptions = {
  search: '',
  type: 'all',
  categoryIds: [],
  paymentMethodIds: [],
  sortBy: 'newest',
};

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [budget, setBudget] = useState<Budget>(DEFAULT_BUDGET);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [settings, setSettings] = useState<Settings>(() => {
    let initialTheme: 'light' | 'dark' = 'light';
    let initialLang: 'en' | 'ar' = 'ar';
    let initialFontSize: FontSizeOption = 'normal';
    let initialNumberFormat: NumberFormatOption = 'arabic';
    try {
      const storedTheme = localStorage.getItem('masrofy_theme');
      if (storedTheme === 'dark' || storedTheme === 'light') {
        initialTheme = storedTheme;
      } else if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        initialTheme = 'dark';
      }
      const storedLang = localStorage.getItem('masrofy_lang');
      if (storedLang === 'ar' || storedLang === 'en') {
        initialLang = storedLang;
      }
      const storedNumFormat = localStorage.getItem('masrofy_number_format') as NumberFormatOption;
      if (storedNumFormat === 'arabic' || storedNumFormat === 'western') {
        initialNumberFormat = storedNumFormat;
      } else {
        initialNumberFormat = initialLang === 'ar' ? 'arabic' : 'western';
      }
      const storedFontSize = localStorage.getItem('masrofy_font_size') as FontSizeOption;
      if (storedFontSize && ['compact', 'normal', 'large', 'xlarge'].includes(storedFontSize)) {
        initialFontSize = storedFontSize;
      }
    } catch (e) {}
    return {
      ...DEFAULT_SETTINGS,
      theme: initialTheme,
      language: initialLang,
      numberFormat: initialNumberFormat,
      fontSize: initialFontSize,
    };
  });
  const [isLoading, setIsLoading] = useState(true);

  // Reference date: Dynamic real date for current device/browser
  const referenceDate = useMemo(() => new Date(), []);
  const activePeriodLabel = useMemo(() => {
    return formatMonthLabel(getCurrentMonthPrefix(referenceDate), settings.language === 'ar' ? 'ar' : 'en');
  }, [referenceDate, settings.language]);

  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<'home' | 'transactions' | 'insights' | 'settings'>('home');
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [prefillExpense, setPrefillExpense] = useState<Partial<Expense> | null>(null);

  // Toast & Undo
  const [toast, setToast] = useState<ToastState | null>(null);
  const [lastDeletedId, setLastDeletedId] = useState<string | null>(null);

  // Filters
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);

  // Privacy Mode (Hide financial figures)
  const [isPrivacyMode, setIsPrivacyMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('masrofy_privacy') === 'true';
    } catch {
      return false;
    }
  });

  const togglePrivacyMode = useCallback(() => {
    setIsPrivacyMode(prev => {
      const next = !prev;
      try {
        localStorage.setItem('masrofy_privacy', String(next));
      } catch {}
      return next;
    });
  }, []);

  // Savings Goals & Piggy Bank
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() => {
    try {
      const saved = localStorage.getItem('masrofy_goals');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Last used defaults
  const [lastUsedCategoryId, setLastUsedCategoryId] = useState('cat-food');
  const [lastUsedPaymentMethodId, setLastUsedPaymentMethodId] = useState('acc-card');

  // Language & Translation setup
  const currentLanguage: Language = settings.language === 'ar' ? 'ar' : 'en';
  const t = useMemo(() => translations[currentLanguage], [currentLanguage]);

  // Reactively sync document direction and language attribute
  useEffect(() => {
    const isAr = settings.language === 'ar';
    document.documentElement.dir = isAr ? 'rtl' : 'ltr';
    document.documentElement.lang = isAr ? 'ar' : 'en';
    try {
      localStorage.setItem('masrofy_lang', isAr ? 'ar' : 'en');
    } catch (e) {}
  }, [settings.language]);

  // Reactively sync HTML dark class and data-theme
  useEffect(() => {
    const isDark = settings.theme === 'dark';
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.classList.remove('dark');
    }
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDark ? '#020617' : '#F8FAFC');
    }
    try {
      localStorage.setItem('masrofy_theme', isDark ? 'dark' : 'light');
    } catch (e) {}
  }, [settings.theme]);

  // Reactively sync document data-font-size
  useEffect(() => {
    const size = settings.fontSize || 'normal';
    document.documentElement.setAttribute('data-font-size', size);
    try {
      localStorage.setItem('masrofy_font_size', size);
    } catch (e) {}
  }, [settings.fontSize]);

  const permanentDeleteTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load initial data from local IndexedDB
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      // Purge any stale soft-deleted expenses beyond the undo window
      await localDB.purgeDeletedExpenses();
      const [expList, catList, budgetData, accList, recList, setObj] = await Promise.all([
        localDB.getExpenses(),
        localDB.getCategories(),
        localDB.getBudget(),
        localDB.getAccounts(),
        localDB.getRecurring(),
        localDB.getSettings(),
      ]);

      // Clean up duplicate card/bank accounts if both acc-card and acc-bank exist
      let cleanedAccounts = accList;
      const hasBank = cleanedAccounts.some(a => a.id === 'acc-bank');
      const hasCard = cleanedAccounts.some(a => a.id === 'acc-card');
      if (hasBank && hasCard) {
        await localDB.deleteAccount('acc-card');
        cleanedAccounts = cleanedAccounts.filter(a => a.id !== 'acc-card');
        for (const exp of expList) {
          if (exp.accountId === 'acc-card' || exp.paymentMethodId === 'acc-card' || exp.fromAccountId === 'acc-card' || exp.toAccountId === 'acc-card') {
            await localDB.updateExpense(exp.id, {
              accountId: exp.accountId === 'acc-card' ? 'acc-bank' : exp.accountId,
              paymentMethodId: exp.paymentMethodId === 'acc-card' ? 'acc-bank' : exp.paymentMethodId,
              fromAccountId: exp.fromAccountId === 'acc-card' ? 'acc-bank' : exp.fromAccountId,
              toAccountId: exp.toAccountId === 'acc-card' ? 'acc-bank' : exp.toAccountId,
            });
          }
        }
      }

      // Deduplicate any accounts sharing the exact same type and name
      const seenAccountKeys = new Set<string>();
      const finalAccounts: Account[] = [];
      for (const a of cleanedAccounts) {
        const key = `${a.type}:${a.name.toLowerCase().trim()}`;
        if (!seenAccountKeys.has(key)) {
          seenAccountKeys.add(key);
          finalAccounts.push(a);
        } else {
          await localDB.deleteAccount(a.id);
        }
      }

      setExpenses(expList);
      setCategories(catList.length > 0 ? catList : DEFAULT_CATEGORIES);
      if (budgetData) setBudget(budgetData);
      setAccounts(finalAccounts.length > 0 ? finalAccounts : DEFAULT_ACCOUNTS);
      setRecurring(recList);
      if (setObj) setSettings(setObj);

      // Restore last used category from most recent expense
      if (expList.length > 0) {
        const sorted = [...expList].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        if (sorted[0]?.categoryId) setLastUsedCategoryId(sorted[0].categoryId);
        if (sorted[0]?.paymentMethodId) setLastUsedPaymentMethodId(sorted[0].paymentMethodId);
      }
    } catch (err) {
      console.error('Failed to load local database:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Toast handler with auto-dismiss (4 seconds)
  const showToast = useCallback((message: string, actionLabel?: string, onAction?: () => void) => {
    const id = `toast-${Date.now()}`;
    setToast({ id, message, actionLabel, onAction });
  }, []);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Fast Add Expense Modal controls
  const openAddExpense = useCallback((prefill?: Partial<Expense>) => {
    setPrefillExpense(prefill || null);
    setIsAddExpenseOpen(true);
  }, []);

  const closeAddExpense = useCallback(() => {
    setIsAddExpenseOpen(false);
    setPrefillExpense(null);
  }, []);

  // CRUD Operations
  const createExpense = useCallback(async (data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>) => {
    const created = await localDB.addExpense(data);
    setExpenses(prev => [created, ...prev]);
    setLastUsedCategoryId(data.categoryId);
    setLastUsedPaymentMethodId(data.paymentMethodId || 'acc-cash');
    return created;
  }, []);

  const modifyExpense = useCallback(async (id: string, updates: Partial<Expense>) => {
    const updated = await localDB.updateExpense(id, updates);
    setExpenses(prev => prev.map(e => e.id === id ? updated : e));
    if (viewingExpense?.id === id) {
      setViewingExpense(updated);
    }
    return updated;
  }, [viewingExpense]);

  const removeExpense = useCallback(async (id: string) => {
    // If there was a previous pending deletion, hard-delete it permanently now
    if (lastDeletedId && lastDeletedId !== id) {
      await localDB.deleteExpense(lastDeletedId, false);
    }

    // Immediately remove from UI state so totals and views update instantly
    setExpenses(prev => prev.filter(e => e.id !== id));
    if (viewingExpense?.id === id) {
      setViewingExpense(null);
    }

    // Mark as deleted in IndexedDB for the undo duration
    await localDB.deleteExpense(id, true);
    setLastDeletedId(id);

    if (permanentDeleteTimerRef.current) {
      clearTimeout(permanentDeleteTimerRef.current);
    }

    // Schedule permanent hard-delete in IndexedDB after 4.5 seconds
    permanentDeleteTimerRef.current = setTimeout(async () => {
      try {
        await localDB.deleteExpense(id, false);
        setLastDeletedId(prev => prev === id ? null : prev);
      } catch (e) {
        console.error('Failed to permanently delete expense', e);
      }
    }, 4500);

    // ONLY show an Undo snackbar for transaction deletion
    showToast(
      currentLanguage === 'ar' ? 'تم حذف المعاملة' : 'Transaction deleted',
      currentLanguage === 'ar' ? 'تراجع' : 'Undo',
      async () => {
        if (permanentDeleteTimerRef.current) {
          clearTimeout(permanentDeleteTimerRef.current);
        }
        await undoDelete();
      }
    );
  }, [viewingExpense, lastDeletedId, currentLanguage, showToast]);

  const undoDelete = useCallback(async () => {
    if (!lastDeletedId) return;
    try {
      if (permanentDeleteTimerRef.current) {
        clearTimeout(permanentDeleteTimerRef.current);
      }
      const restored = await localDB.restoreExpense(lastDeletedId);
      setExpenses(prev => [restored, ...prev]);
      setLastDeletedId(null);
      setToast(null);
    } catch (err) {
      console.error('Failed to restore expense', err);
    }
  }, [lastDeletedId]);

  const updateBudgetAmount = useCallback(async (amount: number) => {
    const updatedBudget: Budget = {
      ...budget,
      amount,
      updatedAt: new Date().toISOString(),
    };
    await localDB.saveBudget(updatedBudget);
    setBudget(updatedBudget);
  }, [budget]);

  const updateSettings = useCallback(async (newSettings: Partial<Settings>) => {
    const updated = { ...settings, ...newSettings };
    await localDB.saveSettings(updated);
    setSettings(updated);
  }, [settings]);

  const setLanguage = useCallback(async (lang: Language) => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang === 'ar' ? 'ar' : 'en';
    const nextNumFormat: NumberFormatOption = lang === 'ar' ? 'arabic' : 'western';
    try {
      localStorage.setItem('masrofy_lang', lang);
      localStorage.setItem('masrofy_number_format', nextNumFormat);
    } catch (e) {}
    await updateSettings({ language: lang, numberFormat: nextNumFormat });
  }, [updateSettings]);

  const setNumberFormat = useCallback(async (format: NumberFormatOption) => {
    try {
      localStorage.setItem('masrofy_number_format', format);
    } catch (e) {}
    await updateSettings({ numberFormat: format });
  }, [updateSettings]);

  const setCurrency = useCallback(async (currencyCode: string) => {
    await updateSettings({ currency: currencyCode, currencySymbol: currencyCode });
  }, [updateSettings]);

  const setTheme = useCallback(async (newTheme: 'light' | 'dark') => {
    await updateSettings({ theme: newTheme });
  }, [updateSettings]);

  const toggleTheme = useCallback(async () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    await updateSettings({ theme: nextTheme });
  }, [settings.theme, updateSettings]);

  const setFontSize = useCallback(async (size: FontSizeOption) => {
    await updateSettings({ fontSize: size });
  }, [updateSettings]);

  const saveCategoryItem = useCallback(async (category: Category) => {
    const val = validateCategory(category.name, categories, category.id);
    if (!val.valid) {
      showToast(val.error || 'Invalid category name');
      throw new Error(val.error);
    }
    const cleanCategory = { ...category, name: val.trimmedName };
    await localDB.saveCategory(cleanCategory);
    setCategories(prev => {
      const exists = prev.some(c => c.id === cleanCategory.id);
      if (exists) {
        return prev.map(c => c.id === cleanCategory.id ? cleanCategory : c);
      }
      return [...prev, cleanCategory];
    });
  }, [categories, showToast]);

  const toggleArchiveCategory = useCallback(async (id: string) => {
    const existing = categories.find(c => c.id === id);
    if (!existing) return;
    const updated: Category = {
      ...existing,
      isActive: !existing.isActive,
      updatedAt: new Date().toISOString(),
    };
    await localDB.saveCategory(updated);
    setCategories(prev => prev.map(c => c.id === id ? updated : c));
  }, [categories]);

  const deleteCategoryItem = useCallback(async (id: string) => {
    if (categories.length <= 1) {
      showToast(currentLanguage === 'ar' ? 'يجب أن تتبقى فئة واحدة على الأقل' : 'At least one category is required');
      return;
    }

    const remainingCategories = categories.filter(c => c.id !== id);
    const fallbackCategory = remainingCategories.find(c => c.id === 'cat-other') || remainingCategories[0];
    const fallbackId = fallbackCategory ? fallbackCategory.id : 'cat-other';

    // 1. Immediately update UI state for categories
    setCategories(remainingCategories);

    // 2. Fix last used category reference if it pointed to the deleted category
    if (lastUsedCategoryId === id) {
      setLastUsedCategoryId(fallbackId);
    }

    // 3. Clear from active filters if selected
    setFilters(prev => ({
      ...prev,
      categoryIds: prev.categoryIds ? prev.categoryIds.filter(cId => cId !== id) : [],
    }));

    // 4. Safely migrate existing expenses pointing to this category to fallback category
    const affectedExpenses = expenses.filter(e => e.categoryId === id);
    if (affectedExpenses.length > 0) {
      setExpenses(prev => prev.map(e => e.categoryId === id ? { ...e, categoryId: fallbackId } : e));
    }

    // 5. Migrate recurring transactions
    const affectedRecurring = recurring.filter(r => r.categoryId === id);
    if (affectedRecurring.length > 0) {
      setRecurring(prev => prev.map(r => r.categoryId === id ? { ...r, categoryId: fallbackId } : r));
    }

    // 6. Persist to local IndexedDB
    try {
      await localDB.deleteCategory(id);
      for (const exp of affectedExpenses) {
        await localDB.updateExpense(exp.id, { categoryId: fallbackId });
      }
      for (const rec of affectedRecurring) {
        await localDB.saveRecurring({ ...rec, categoryId: fallbackId });
      }
    } catch (err) {
      console.error('Failed to complete category deletion in storage:', err);
    }
  }, [categories, expenses, recurring, lastUsedCategoryId, currentLanguage, showToast]);

  // Account Management & Multi-Wallet actions
  const saveAccountItem = useCallback(async (account: Account) => {
    const val = validateAccount(account, accounts, account.id);
    if (!val.valid) {
      showToast(val.error || 'Invalid account details');
      throw new Error(val.error);
    }
    const cleanAccount: Account = {
      ...account,
      name: account.name.trim(),
      updatedAt: new Date().toISOString(),
    };
    await localDB.saveAccount(cleanAccount);
    setAccounts(prev => {
      const exists = prev.some(a => a.id === cleanAccount.id);
      if (exists) {
        return prev.map(a => a.id === cleanAccount.id ? cleanAccount : a);
      }
      return [...prev, cleanAccount];
    });
  }, [accounts, showToast]);

  const toggleArchiveAccount = useCallback(async (id: string) => {
    const existing = accounts.find(a => a.id === id);
    if (!existing) return;
    const updated: Account = {
      ...existing,
      isActive: !existing.isActive,
      isArchived: existing.isActive, // If active, now archived
      updatedAt: new Date().toISOString(),
    };
    await localDB.saveAccount(updated);
    setAccounts(prev => prev.map(a => a.id === id ? updated : a));
  }, [accounts]);

  const deleteAccountItem = useCallback(async (id: string) => {
    if (accounts.length <= 1) {
      showToast(currentLanguage === 'ar' ? 'يجب أن تتبقى محفظة واحدة على الأقل' : 'At least one wallet is required');
      return;
    }

    const remainingAccounts = accounts.filter(a => a.id !== id);
    const fallbackAccount = remainingAccounts[0];
    const fallbackId = fallbackAccount ? fallbackAccount.id : 'acc-cash';

    // 1. Immediately update UI state for wallets
    setAccounts(remainingAccounts);

    // 2. Fix last used wallet reference if it pointed to the deleted wallet
    if (lastUsedPaymentMethodId === id) {
      setLastUsedPaymentMethodId(fallbackId);
    }

    // 3. Clear from active filters if selected
    setFilters(prev => ({
      ...prev,
      paymentMethodIds: prev.paymentMethodIds ? prev.paymentMethodIds.filter(pId => pId !== id) : [],
    }));

    // 4. Safely migrate transactions referencing this deleted account to fallback wallet
    const affectedExpenses = expenses.filter(
      e => e.accountId === id || e.paymentMethodId === id || e.fromAccountId === id || e.toAccountId === id
    );

    if (affectedExpenses.length > 0) {
      setExpenses(prev => prev.map(e => {
        if (e.accountId === id || e.paymentMethodId === id || e.fromAccountId === id || e.toAccountId === id) {
          return {
            ...e,
            accountId: e.accountId === id ? fallbackId : e.accountId,
            paymentMethodId: e.paymentMethodId === id ? fallbackId : e.paymentMethodId,
            fromAccountId: e.fromAccountId === id ? fallbackId : e.fromAccountId,
            toAccountId: e.toAccountId === id ? fallbackId : e.toAccountId,
          };
        }
        return e;
      }));
    }

    // 5. Migrate recurring transactions
    const affectedRecurring = recurring.filter(r => r.accountId === id);
    if (affectedRecurring.length > 0) {
      setRecurring(prev => prev.map(r => r.accountId === id ? { ...r, accountId: fallbackId } : r));
    }

    // 6. Persist to local IndexedDB
    try {
      await localDB.deleteAccount(id);
      for (const exp of affectedExpenses) {
        await localDB.updateExpense(exp.id, {
          accountId: exp.accountId === id ? fallbackId : exp.accountId,
          paymentMethodId: exp.paymentMethodId === id ? fallbackId : exp.paymentMethodId,
          fromAccountId: exp.fromAccountId === id ? fallbackId : exp.fromAccountId,
          toAccountId: exp.toAccountId === id ? fallbackId : exp.toAccountId,
        });
      }
      for (const rec of affectedRecurring) {
        await localDB.saveRecurring({ ...rec, accountId: fallbackId });
      }
    } catch (err) {
      console.error('Failed to complete wallet deletion in storage:', err);
    }
  }, [accounts, expenses, recurring, lastUsedPaymentMethodId, currentLanguage, showToast]);

  const createTransfer = useCallback(async (data: {
    amount: number;
    fromAccountId: string;
    toAccountId: string;
    note?: string;
    date?: string;
    time?: string;
  }) => {
    const val = validateTransfer(data, accounts);
    if (!val.valid) {
      showToast(val.error || 'Invalid transfer');
      throw new Error(val.error);
    }
    const fromAcc = accounts.find(a => a.id === data.fromAccountId);
    const toAcc = accounts.find(a => a.id === data.toAccountId);
    const fromName = fromAcc?.name || 'Account';
    const toName = toAcc?.name || 'Account';

    const cleanAmount = Math.round(data.amount * 100) / 100;
    const transferTx = await localDB.addExpense({
      type: 'transfer',
      amount: cleanAmount,
      categoryId: 'cat-other',
      accountId: data.fromAccountId,
      fromAccountId: data.fromAccountId,
      toAccountId: data.toAccountId,
      paymentMethodId: data.fromAccountId,
      note: data.note?.trim() || `${fromName} → ${toName}`,
      merchant: `Transfer: ${fromName} → ${toName}`,
      date: data.date || getLocalDateString(),
      time: data.time || getLocalTimeString(),
    });
    setExpenses(prev => [transferTx, ...prev]);
    return transferTx;
  }, [accounts, showToast]);

  const addRecurringItem = useCallback(async (rec: Omit<RecurringTransaction, 'id'>) => {
    const id = `rec-${Date.now()}`;
    const item: RecurringTransaction = { ...rec, id };
    await localDB.saveRecurring(item);
    setRecurring(prev => [...prev, item]);
  }, []);

  const removeRecurringItem = useCallback(async (id: string) => {
    await localDB.deleteRecurring(id);
    setRecurring(prev => prev.filter(r => r.id !== id));
  }, []);

  const processRecurringItem = useCallback(async (rec: RecurringTransaction) => {
    const todayStr = getLocalDateString(referenceDate);

    // Duplicate protection: prevent double recording if processed for today
    const alreadyProcessedToday = expenses.some(
      e => !e.isDeleted &&
           e.date === todayStr &&
           Math.abs(e.amount - rec.amount) < 0.001 &&
           e.categoryId === rec.categoryId &&
           e.note.toLowerCase().includes(rec.note.toLowerCase())
    );

    if (alreadyProcessedToday) {
      showToast(`"${rec.note}" was already recorded for today`);
      return;
    }

    await createExpense({
      type: rec.type,
      amount: rec.amount,
      categoryId: rec.categoryId,
      accountId: rec.accountId || 'acc-card',
      paymentMethodId: rec.accountId || 'acc-card',
      note: `${rec.note} (Recurring)`,
      merchant: rec.note,
      date: todayStr,
      time: '09:00',
    });

    const nextOccurrence = calculateNextOccurrence(rec.nextOccurrence || todayStr, rec.frequency);
    const updatedRec: RecurringTransaction = {
      ...rec,
      lastProcessedDate: todayStr,
      nextOccurrence,
    };
    await localDB.saveRecurring(updatedRec);
    setRecurring(prev => prev.map(r => r.id === rec.id ? updatedRec : r));
  }, [createExpense, expenses, referenceDate, showToast]);

  const addSavingsGoal = useCallback((goal: Omit<SavingsGoal, 'id' | 'createdAt'>) => {
    const newGoal: SavingsGoal = {
      ...goal,
      id: `goal-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setSavingsGoals(prev => {
      const next = [...prev, newGoal];
      try { localStorage.setItem('masrofy_goals', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const updateSavingsGoal = useCallback((updatedGoal: SavingsGoal) => {
    setSavingsGoals(prev => {
      const next = prev.map(g => g.id === updatedGoal.id ? updatedGoal : g);
      try { localStorage.setItem('masrofy_goals', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const deleteSavingsGoal = useCallback((id: string) => {
    setSavingsGoals(prev => {
      const next = prev.filter(g => g.id !== id);
      try { localStorage.setItem('masrofy_goals', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const duplicateExpense = useCallback(async (expense: Expense) => {
    const todayStr = getLocalDateString(referenceDate);
    const timeStr = getLocalTimeString(referenceDate);
    await createExpense({
      type: expense.type,
      amount: expense.amount,
      categoryId: expense.categoryId,
      accountId: expense.accountId || 'acc-card',
      fromAccountId: expense.fromAccountId,
      toAccountId: expense.toAccountId,
      paymentMethodId: expense.paymentMethodId || 'acc-card',
      note: expense.note,
      merchant: expense.merchant,
      date: todayStr,
      time: timeStr,
    });
  }, [createExpense, referenceDate]);

  const clearAllExpenses = useCallback(async () => {
    await localDB.clearAllUserData();
    await loadData();
  }, [loadData]);

  const resetDatabaseToDemo = useCallback(async () => {
    await localDB.resetToDemo();
    await loadData();
  }, [loadData]);

  // CSV Export & Import
  const downloadCSV = useCallback(() => {
    const csvContent = exportExpensesToCSV(expenses, categories, settings.currency, accounts);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `DailyExpense_Ledger_${getLocalDateString(referenceDate)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV export downloaded');
  }, [expenses, categories, settings.currency, accounts, referenceDate, showToast]);

  const importCSVText = useCallback(async (csvText: string) => {
    const { items, result } = parseCSVWithAudit(csvText, categories, expenses, accounts);
    if (items.length === 0 && result.errors > 0) {
      showToast(result.details[0] || 'No valid transactions found in CSV');
      return result;
    }

    const payload = items.map(item => ({
      type: item.type || 'expense',
      amount: item.amount || 0,
      categoryId: item.categoryId || 'cat-other',
      accountId: item.accountId || 'acc-card',
      fromAccountId: item.fromAccountId,
      toAccountId: item.toAccountId,
      paymentMethodId: item.paymentMethodId || 'acc-card',
      note: item.note || '',
      merchant: item.merchant || '',
      date: item.date || getLocalDateString(referenceDate),
      time: item.time || '12:00',
    }));

    await localDB.bulkAddExpenses(payload);

    await loadData();
    let msg = `Imported ${result.imported} transactions`;
    if (result.skipped > 0) msg += ` (${result.skipped} duplicates skipped)`;
    if (result.errors > 0) msg += ` (${result.errors} invalid rows skipped)`;
    showToast(msg);
    return result;
  }, [categories, expenses, accounts, referenceDate, loadData, showToast]);

  // Full JSON Backup & Restore
  const downloadFullBackupJSON = useCallback(() => {
    const backupData = {
      version: 1,
      app: 'DailyExpense',
      exportedAt: new Date().toISOString(),
      expenses,
      categories,
      budget,
      accounts,
      recurring,
      settings,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `DailyExpense_Backup_${getLocalDateString(referenceDate)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Full JSON backup downloaded');
  }, [expenses, categories, budget, accounts, recurring, settings, referenceDate, showToast]);

  const importFullBackupJSON = useCallback(async (jsonText: string) => {
    const validation = validateBackupJSON(jsonText);
    if (!validation.valid || !validation.data) {
      const msg = validation.error || 'Invalid backup file structure';
      showToast(msg);
      return { success: false, message: msg };
    }

    try {
      await localDB.restoreFullBackup(validation.data);
      await loadData();
      showToast('Full backup restored successfully');
      return { success: true, message: 'Restored successfully' };
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || 'Failed to restore backup';
      showToast(msg);
      return { success: false, message: msg };
    }
  }, [loadData, showToast]);

  // Calculate Budget Pace & Intelligence
  const budgetPace = useMemo(() => {
    return calculateBudgetPace(expenses, budget, referenceDate);
  }, [expenses, budget, referenceDate]);

  // Frequently used categories calculated from real counts
  const frequentCategories = useMemo(() => {
    const countMap: Record<string, number> = {};
    expenses.forEach(e => {
      if (!e.isDeleted) {
        countMap[e.categoryId] = (countMap[e.categoryId] || 0) + 1;
      }
    });
    return [...categories]
      .filter(c => c.isActive)
      .sort((a, b) => (countMap[b.id] || 0) - (countMap[a.id] || 0));
  }, [expenses, categories]);

  // Account Summaries & Multi-Wallet Financial Engine (Phase 5)
  const accountSummaries = useMemo(() => {
    return calculateAccountSummaries(accounts, expenses);
  }, [accounts, expenses]);

  // Filter & Search Engine
  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const filteredExpenses = useMemo(() => {
    let list = expenses.filter(e => !e.isDeleted);

    // Search query
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      const qNorm = normalizeArabicNumerals(q);
      const catMap = new Map(categories.map(c => [c.id, c.name.toLowerCase()]));
      const accMap = new Map(accounts.map(a => [a.id, a.name.toLowerCase()]));
      list = list.filter(e => {
        const catName = catMap.get(e.categoryId) || '';
        const accName = accMap.get(e.accountId || '') || '';
        const fromAccName = accMap.get(e.fromAccountId || '') || '';
        const toAccName = accMap.get(e.toAccountId || '') || '';
        const amountStr = e.amount.toString();
        const dateFormatted = formatDateLabel(e.date, currentLanguage).toLowerCase();

        return (
          e.note.toLowerCase().includes(q) ||
          e.merchant.toLowerCase().includes(q) ||
          catName.includes(q) ||
          accName.includes(q) ||
          fromAccName.includes(q) ||
          toAccName.includes(q) ||
          amountStr.includes(qNorm) ||
          e.date.includes(qNorm) ||
          dateFormatted.includes(q) ||
          e.paymentMethodId.toLowerCase().includes(q) ||
          (e.type === 'transfer' && 'transfer'.includes(q))
        );
      });
    }

    // Type filter
    if (filters.type !== 'all') {
      list = list.filter(e => e.type === filters.type);
    }

    // Category filter
    if (filters.categoryIds.length > 0) {
      list = list.filter(e => filters.categoryIds.includes(e.categoryId));
    }

    // Payment method & Account filter
    if (filters.paymentMethodIds.length > 0) {
      list = list.filter(e => 
        filters.paymentMethodIds.includes(e.paymentMethodId) ||
        filters.paymentMethodIds.includes(e.accountId) ||
        (e.fromAccountId && filters.paymentMethodIds.includes(e.fromAccountId)) ||
        (e.toAccountId && filters.paymentMethodIds.includes(e.toAccountId))
      );
    }

    if (filters.accountIds && filters.accountIds.length > 0) {
      list = list.filter(e => 
        filters.accountIds!.includes(e.accountId) ||
        filters.accountIds!.includes(e.paymentMethodId) ||
        (e.fromAccountId && filters.accountIds!.includes(e.fromAccountId)) ||
        (e.toAccountId && filters.accountIds!.includes(e.toAccountId))
      );
    }

    // Date range
    if (filters.startDate) {
      list = list.filter(e => e.date >= filters.startDate!);
    }
    if (filters.endDate) {
      list = list.filter(e => e.date <= filters.endDate!);
    }

    // Min & Max amount
    if (filters.minAmount !== undefined && filters.minAmount > 0) {
      list = list.filter(e => e.amount >= filters.minAmount!);
    }
    if (filters.maxAmount !== undefined && filters.maxAmount > 0) {
      list = list.filter(e => e.amount <= filters.maxAmount!);
    }

    // Sorting
    list.sort((a, b) => {
      if (filters.sortBy === 'newest') {
        return `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`);
      }
      if (filters.sortBy === 'oldest') {
        return `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);
      }
      if (filters.sortBy === 'highest') {
        return b.amount - a.amount;
      }
      if (filters.sortBy === 'lowest') {
        return a.amount - b.amount;
      }
      return 0;
    });

    return list;
  }, [expenses, categories, accounts, filters]);

  return (
    <AppContext.Provider
      value={{
        expenses,
        categories,
        budget,
        accounts,
        recurring,
        settings,
        isLoading,
        budgetPace,
        frequentCategories,
        accountSummaries,
        referenceDate,
        activePeriodLabel,
        activeTab,
        setActiveTab,
        isAddExpenseOpen,
        openAddExpense,
        closeAddExpense,
        editingExpense,
        setEditingExpense,
        viewingExpense,
        setViewingExpense,
        prefillExpense,
        filters,
        setFilters,
        resetFilters,
        filteredExpenses,
        createExpense,
        modifyExpense,
        removeExpense,
        undoDelete,
        updateBudgetAmount,
        updateSettings,
        saveCategoryItem,
        toggleArchiveCategory,
        deleteCategoryItem,
        saveAccountItem,
        toggleArchiveAccount,
        deleteAccountItem,
        createTransfer,
        addRecurringItem,
        removeRecurringItem,
        processRecurringItem,
        clearAllExpenses,
        resetDatabaseToDemo,
        downloadCSV,
        importCSVText,
        downloadFullBackupJSON,
        importFullBackupJSON,
        toast,
        showToast,
        dismissToast,
        lastUsedCategoryId,
        lastUsedPaymentMethodId,
        language: currentLanguage,
        setLanguage,
        numberFormat: currentLanguage === 'ar' ? 'arabic' : 'western',
        setNumberFormat,
        setCurrency,
        theme: (settings.theme === 'dark' ? 'dark' : 'light') as 'light' | 'dark',
        setTheme,
        toggleTheme,
        fontSize: settings.fontSize || 'normal',
        setFontSize,
        isPrivacyMode,
        togglePrivacyMode,
        savingsGoals,
        addSavingsGoal,
        updateSavingsGoal,
        deleteSavingsGoal,
        duplicateExpense,
        t,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
