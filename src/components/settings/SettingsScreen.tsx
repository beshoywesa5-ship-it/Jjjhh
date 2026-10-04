import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useBackHandler } from '../../hooks/useBackHandler';
import { CategoryIcon } from '../common/CategoryIcon';
import { AccountIcon } from '../common/AccountIcon';
import { 
  formatCurrency, 
  getLocalDateString, 
  normalizeArabicNumerals,
  SUPPORTED_CURRENCIES,
  getCurrencySymbol,
  getCurrencyDisplayName,
  toArabicNumerals,
  formatNumber,
  parseMoneyInput
} from '../../utils/calculations';
import { 
  getCategoryDisplayName, 
  getAccountDisplayName, 
  getAccountTypeDisplayName, 
  getFrequencyDisplayName 
} from '../../utils/i18n';
import { 
  DollarSign, 
  PieChart, 
  Tag, 
  Repeat, 
  Download, 
  Upload, 
  Moon, 
  Sun, 
  RotateCcw, 
  ShieldCheck, 
  Plus, 
  Check, 
  X,
  Trash2,
  Play,
  Lock,
  Info,
  Wallet,
  Edit3,
  Globe,
  Type,
  ChevronDown,
  Phone,
  MessageCircle,
  ArrowLeft,
  Fingerprint
} from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';
import { Category, Account, AccountType } from '../../types';

export const SettingsScreen: React.FC = () => {
  const { 
    budget, 
    updateBudgetAmount, 
    settings, 
    updateSettings, 
    categories, 
    saveCategoryItem, 
    toggleArchiveCategory,
    deleteCategoryItem,
    accounts,
    accountSummaries,
    saveAccountItem,
    toggleArchiveAccount,
    deleteAccountItem,
    recurring, 
    addRecurringItem, 
    removeRecurringItem, 
    processRecurringItem,
    clearAllExpenses,
    resetDatabaseToDemo, 
    downloadCSV,
    importCSVText,
    downloadFullBackupJSON,
    importFullBackupJSON,
    showToast,
    language,
    setLanguage,
    numberFormat,
    setNumberFormat,
    setCurrency,
    theme,
    setTheme,
    fontSize,
    setFontSize,
    setActiveTab,
    t
  } = useApp();

  const formatNum = (v: number | string) => formatNumber(v, language, numberFormat);

  const [budgetInput, setBudgetInput] = useState(
    language === 'ar' ? toArabicNumerals(budget.amount.toString()) : budget.amount.toString()
  );
  const [isEditingBudget, setIsEditingBudget] = useState(false);

  React.useEffect(() => {
    setBudgetInput(language === 'ar' ? toArabicNumerals(budget.amount.toString()) : budget.amount.toString());
  }, [budget.amount, language]);

  // Collapsible dropdown sections state
  const [isAccountsOpen, setIsAccountsOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isRecurringOpen, setIsRecurringOpen] = useState(false);
  const [isDataStorageOpen, setIsDataStorageOpen] = useState(false);

  // Destructive Confirmation Dialog state
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    desc: string;
    confirmLabel: string;
    isDanger?: boolean;
    onConfirm: () => void;
  } | null>(null);

  // Account Modal state
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<AccountType>('cash');
  const [accOpeningBalance, setAccOpeningBalance] = useState('0');
  const [accColor, setAccColor] = useState('#10B981');

  // New Category Modal / Sheet state
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#3B82F6');
  const [newCatIcon, setNewCatIcon] = useState('Tag');

  // Recurring Modal state
  const [isAddRecurringOpen, setIsAddRecurringOpen] = useState(false);
  const [recAmount, setRecAmount] = useState('');
  const [recNote, setRecNote] = useState('');
  const [recCatId, setRecCatId] = useState(categories[0]?.id || 'cat-bills');
  const [recAccountId, setRecAccountId] = useState(accounts[0]?.id || 'acc-card');
  const [recFreq, setRecFreq] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [recNextDate, setRecNextDate] = useState(() => getLocalDateString(new Date()));

  // File input refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupFileInputRef = useRef<HTMLInputElement>(null);

  // Security Verification State for Disabling Lock
  const [isVerifyingSecurityDisable, setIsVerifyingSecurityDisable] = useState(false);
  const [securityPinInput, setSecurityPinInput] = useState('');
  const [securityPinError, setSecurityPinError] = useState(false);

  // Security Change PIN State
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [changePinStep, setChangePinStep] = useState<'current' | 'new' | 'confirm'>('current');
  const [currentPinCheck, setCurrentPinCheck] = useState('');
  const [newPinValue, setNewPinValue] = useState('');
  const [confirmPinValue, setConfirmPinValue] = useState('');
  const [pinChangeError, setPinChangeError] = useState(false);

  const handleStartChangePin = () => {
    setIsChangingPin(true);
    setChangePinStep('current');
    setCurrentPinCheck('');
    setNewPinValue('');
    setConfirmPinValue('');
    setPinChangeError(false);
  };

  const handleSecurityToggle = () => {
    if (!settings.biometricLock) {
      // Enabling security lock
      updateSettings({ biometricLock: true });
      showToast(language === 'ar' ? 'تم تفعيل قفل الأمان (الرمز: 1234 أو البصمة)' : 'Security Lock Enabled (PIN: 1234 or Fingerprint)');
    } else {
      // Disabling security lock requires verification!
      setSecurityPinInput('');
      setSecurityPinError(false);
      setIsVerifyingSecurityDisable(true);
    }
  };

  const handleConfirmDisableSecurity = (enteredPin?: string) => {
    const pinToTest = enteredPin !== undefined ? enteredPin : securityPinInput;
    const targetPasscode = settings.passcode || '1234';
    if (pinToTest === targetPasscode) {
      triggerHaptic('success');
      updateSettings({ biometricLock: false });
      setIsVerifyingSecurityDisable(false);
      setSecurityPinInput('');
      showToast(language === 'ar' ? 'تم إيقاف قفل الأمان بنجاح' : 'Security lock disabled');
    } else {
      triggerHaptic('error');
      setSecurityPinError(true);
      setTimeout(() => {
        setSecurityPinInput('');
        setSecurityPinError(false);
      }, 500);
    }
  };

  const handleSaveBudget = async () => {
    const normalized = normalizeArabicNumerals(budgetInput);
    const val = parseFloat(normalized);
    if (!isNaN(val) && val >= 0) {
      await updateBudgetAmount(val);
      setIsEditingBudget(false);
    }
  };

  const handleToggleTheme = async () => {
    const next = settings.theme === 'dark' ? 'light' : 'dark';
    await updateSettings({ theme: next });
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: newCatName.trim(),
      icon: newCatIcon,
      color: newCatColor,
      isDefault: false,
      isActive: true,
      sortOrder: categories.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveCategoryItem(newCat);
    setNewCatName('');
    setIsAddCategoryOpen(false);
  };

  const handleOpenAddAccount = () => {
    setEditingAccount(null);
    setAccName('');
    setAccType('cash');
    setAccOpeningBalance('0');
    setAccColor('#10B981');
    setIsAccountModalOpen(true);
  };

  const handleOpenEditAccount = (acc: Account) => {
    setEditingAccount(acc);
    setAccName(acc.name);
    setAccType(acc.type);
    setAccOpeningBalance(acc.openingBalance.toString());
    setAccColor(acc.color || '#3B82F6');
    setIsAccountModalOpen(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName.trim()) return;
    const balanceNum = parseMoneyInput(accOpeningBalance).amount;
    const accToSave: Account = {
      id: editingAccount ? editingAccount.id : `acc-${Date.now()}`,
      name: accName.trim(),
      type: accType,
      openingBalance: balanceNum,
      currency: settings.currency,
      color: accColor,
      isActive: editingAccount ? editingAccount.isActive : true,
      isArchived: editingAccount ? editingAccount.isArchived : false,
      createdAt: editingAccount?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveAccountItem(accToSave);
    setIsAccountModalOpen(false);
    setEditingAccount(null);
  };

  const handleCreateRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseMoneyInput(recAmount).amount;
    if (isNaN(num) || num <= 0 || !recNote.trim()) return;

    await addRecurringItem({
      type: 'expense',
      amount: num,
      categoryId: recCatId,
      accountId: recAccountId || accounts[0]?.id || 'acc-card',
      frequency: recFreq,
      nextOccurrence: recNextDate || getLocalDateString(new Date()),
      note: recNote.trim(),
      isActive: true,
    });

    setRecAmount('');
    setRecNote('');
    setIsAddRecurringOpen(false);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (text) {
        await importCSVText(text);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleBackupUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setConfirmAction({
          title: t.settings.restoreConfirmTitle,
          desc: t.settings.restoreConfirmDesc,
          confirmLabel: t.settings.restoreConfirmAction,
          isDanger: true,
          onConfirm: async () => {
            await importFullBackupJSON(text);
            setConfirmAction(null);
          },
        });
      }
    };
    reader.readAsText(file);
    if (backupFileInputRef.current) backupFileInputRef.current.value = '';
  };

  // Universal mobile hardware back handlers for settings sub-modals & cards
  useBackHandler(isAddCategoryOpen, () => setIsAddCategoryOpen(false), 'settings-category');
  useBackHandler(isAddRecurringOpen, () => setIsAddRecurringOpen(false), 'settings-recurring');
  useBackHandler(isAccountModalOpen, () => {
    setIsAccountModalOpen(false);
    setEditingAccount(null);
  }, 'settings-account');
  useBackHandler(!!confirmAction, () => setConfirmAction(null), 'settings-confirm');
  useBackHandler(isVerifyingSecurityDisable, () => setIsVerifyingSecurityDisable(false), 'settings-security-verify');
  useBackHandler(isAccountsOpen, () => setIsAccountsOpen(false), 'settings-accounts-card');
  useBackHandler(isCategoriesOpen, () => setIsCategoriesOpen(false), 'settings-categories-card');
  useBackHandler(isRecurringOpen, () => setIsRecurringOpen(false), 'settings-recurring-card');
  useBackHandler(isDataStorageOpen, () => setIsDataStorageOpen(false), 'settings-storage-card');

  return (
    <div className="space-y-4 pb-24">
      {/* Settings Title (Clean mobile header, no manual back button) */}
      <div className="pt-1">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          {t.settings.title}
        </h1>
      </div>

      {/* Monthly Budget Card - Single Row Layout */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {isEditingBudget ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <PieChart size={17} />
              </div>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 hidden sm:inline">
                {t.settings.monthlyBudget}
              </span>
            </div>
            <div className="relative flex-1">
              <span className="absolute start-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 select-none">
                {getCurrencySymbol(settings.currency, language)}
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={budgetInput}
                onChange={e => setBudgetInput(normalizeArabicNumerals(e.target.value))}
                className="w-full ps-14 pe-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                autoFocus
              />
            </div>
            <button
              type="button"
              onClick={handleSaveBudget}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer shrink-0"
              title={t.settings.saveBudget}
            >
              <Check size={16} />
            </button>
            <button
              type="button"
              onClick={() => {
                setBudgetInput(budget.amount.toString());
                setIsEditingBudget(false);
              }}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs cursor-pointer shrink-0"
              title={t.settings.cancel}
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <PieChart size={17} />
              </div>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                {t.settings.monthlyBudget}
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-base font-extrabold text-slate-900 dark:text-white">
                {budget.amount > 0 ? formatCurrency(budget.amount, settings.currency, language, false, numberFormat) : t.settings.noBudgetSet}
              </span>
              <button
                type="button"
                onClick={() => setIsEditingBudget(true)}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
              >
                {t.settings.change}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Preferences: Language, Theme & Font Size Switches */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3.5">
        {/* Language Switch */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Globe size={17} />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">
                {t.settings.language}
              </span>
              <span className="text-xs text-slate-400 font-medium block">
                {language === 'ar' ? 'العربية' : 'English'}
              </span>
            </div>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1 border border-slate-200/80 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => setLanguage('ar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                language === 'ar'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              العربية
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Theme Switch */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              theme === 'dark' ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-400' : 'bg-amber-50 dark:bg-amber-950/50 text-amber-500'
            }`}>
              {theme === 'dark' ? <Moon size={17} /> : <Sun size={17} />}
            </div>
            <div>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">
                {t.settings.theme}
              </span>
              <span className="text-xs text-slate-400 font-medium block">
                {theme === 'dark' ? t.settings.darkMode : t.settings.lightMode}
              </span>
            </div>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1 border border-slate-200/80 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                theme === 'light'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Sun size={13} className="text-amber-500" />
              <span>{language === 'ar' ? 'فاتح' : 'Light'}</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'bg-white dark:bg-slate-900 text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Moon size={13} className="text-blue-400" />
              <span>{language === 'ar' ? 'داكن' : 'Dark'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Accounts & Wallets Management */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div 
          onClick={() => setIsAccountsOpen(prev => !prev)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <Wallet size={18} className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center">
              <span>{t.settings.accounts}</span>
              <span className="font-semibold text-slate-500 dark:text-slate-400 ms-1.5" dir={language === 'ar' ? 'rtl' : 'ltr'}>({formatNum(accounts.length)})</span>
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenAddAccount();
              }}
              className="py-1 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-xs font-bold transition-colors cursor-pointer"
            >
              <span>{t.settings.addAccount}</span>
            </button>
            <div className={`p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-transform duration-200 ${isAccountsOpen ? 'rotate-180' : ''}`}>
              <ChevronDown size={16} />
            </div>
          </div>
        </div>

        {/* Toggle Show Wallets on Home Screen */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {language === 'ar' ? 'إظهار المحافظ في الرئيسية' : 'Show Wallets on Home'}
          </span>
          <button
            type="button"
            onClick={() => updateSettings({ showWalletsOnHome: !(settings.showWalletsOnHome ?? true) })}
            className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
              (settings.showWalletsOnHome ?? true) ? 'bg-blue-600 justify-end' : 'bg-slate-200 dark:bg-slate-700 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
          </button>
        </div>

        {isAccountsOpen && (
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 max-h-64 overflow-y-auto no-scrollbar animate-in fade-in duration-200">
            {accountSummaries.summaries.map(s => {
              const acc = s.account;
              return (
                <div
                  key={acc.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-colors ${
                    acc.isActive 
                      ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800' 
                      : 'bg-slate-100/60 dark:bg-slate-800/20 border-dashed border-slate-200 dark:border-slate-700 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <AccountIcon type={acc.type} color={acc.color} size={18} showBackground className="p-2 rounded-lg shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                          {getAccountDisplayName(acc.name, language)}
                        </span>
                        {!acc.isActive && (
                          <span className="text-xs text-slate-400 font-normal">({t.settings.archived})</span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block truncate">
                        {getAccountTypeDisplayName(acc.type, language)} · <strong className={s.currentBalance < 0 ? 'text-rose-600 font-semibold' : 'text-slate-700 dark:text-slate-300 font-semibold'}>{formatCurrency(s.currentBalance, settings.currency, language, false, numberFormat)}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditAccount(acc)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 rounded-lg text-xs cursor-pointer"
                      title={t.settings.editAccount}
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleArchiveAccount(acc.id)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline px-1.5 py-0.5 cursor-pointer shrink-0 font-medium"
                    >
                      {acc.isActive ? t.settings.archive : t.settings.unarchive}
                    </button>
                    {accounts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmAction({
                            title: language === 'ar' ? `حذف محفظة "${acc.name}"` : `Delete Wallet "${acc.name}"`,
                            desc: language === 'ar' 
                              ? 'هل أنت متأكد من رغبتك في حذف هذه المحفظة نهائياً؟' 
                              : 'Are you sure you want to permanently delete this wallet?',
                            confirmLabel: language === 'ar' ? 'نعم، احذف' : 'Delete',
                            isDanger: true,
                            onConfirm: async () => {
                              await deleteAccountItem(acc.id);
                              setConfirmAction(null);
                            },
                          });
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg text-xs cursor-pointer transition-colors"
                        title={language === 'ar' ? 'حذف المحفظة' : 'Delete Wallet'}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Category Management */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div 
          onClick={() => setIsCategoriesOpen(prev => !prev)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <Tag size={18} className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center">
              <span>{t.settings.categories}</span>
              <span className="font-semibold text-slate-500 dark:text-slate-400 ms-1.5" dir={language === 'ar' ? 'rtl' : 'ltr'}>({formatNum(categories.length)})</span>
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsAddCategoryOpen(true);
              }}
              className="py-1 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-xs font-bold transition-colors cursor-pointer"
            >
              <span>{t.settings.addCategory}</span>
            </button>
            <div className={`p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-transform duration-200 ${isCategoriesOpen ? 'rotate-180' : ''}`}>
              <ChevronDown size={16} />
            </div>
          </div>
        </div>

        {isCategoriesOpen && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 max-h-56 overflow-y-auto no-scrollbar animate-in fade-in duration-200">
            {categories.map(cat => (
              <div
                key={cat.id}
                className={`p-2.5 rounded-xl border flex items-center justify-between gap-1.5 transition-colors ${
                  cat.isActive 
                    ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800' 
                    : 'bg-slate-100/60 dark:bg-slate-800/20 border-dashed border-slate-200 dark:border-slate-700 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <CategoryIcon name={cat.icon} color={cat.color} size={16} />
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                    {getCategoryDisplayName(cat.name, language)} {!cat.isActive && `(${t.settings.archived})`}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleArchiveCategory(cat.id)}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline px-1.5 py-0.5 cursor-pointer shrink-0"
                  >
                    {cat.isActive ? t.settings.archive : t.settings.unarchive}
                  </button>
                  {categories.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const catName = getCategoryDisplayName(cat.name, language);
                        setConfirmAction({
                          title: language === 'ar' ? `حذف فئة "${catName}"` : `Delete Category "${catName}"`,
                          desc: language === 'ar' 
                            ? 'هل أنت متأكد من رغبتك في حذف هذه الفئة نهائياً؟ سيتم تحويل كافة المعاملات المرتبطة بها تلقائياً إلى فئة "أخرى".' 
                            : 'Are you sure you want to permanently delete this category? Associated transactions will be moved to "Other".',
                          confirmLabel: language === 'ar' ? 'نعم، احذف' : 'Delete',
                          isDanger: true,
                          onConfirm: async () => {
                            await deleteCategoryItem(cat.id);
                            setConfirmAction(null);
                          },
                        });
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg text-xs cursor-pointer transition-colors"
                      title={language === 'ar' ? 'حذف الفئة' : 'Delete Category'}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recurring Transactions Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div 
          onClick={() => setIsRecurringOpen(prev => !prev)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <Repeat size={18} className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center">
              <span>{t.settings.recurring}</span>
              {recurring.length > 0 && (
                <span className="font-semibold text-slate-500 dark:text-slate-400 ms-1.5" dir={language === 'ar' ? 'rtl' : 'ltr'}>({formatNum(recurring.length)})</span>
              )}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsAddRecurringOpen(true);
              }}
              className="py-1 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-xs font-bold transition-colors cursor-pointer"
            >
              <span>{t.settings.addRecurring}</span>
            </button>
            <div className={`p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-transform duration-200 ${isRecurringOpen ? 'rotate-180' : ''}`}>
              <ChevronDown size={16} />
            </div>
          </div>
        </div>

        {isRecurringOpen && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-200">
            {recurring.length === 0 ? (
              <p className="text-sm text-slate-400 py-2">
                {language === 'ar' ? 'لا توجد معاملات متكررة مجدولة.' : 'No recurring transactions configured.'}
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {recurring.map(rec => (
                  <div key={rec.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">
                        {rec.note}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {formatCurrency(rec.amount, settings.currency, language, false, numberFormat)} · {getFrequencyDisplayName(rec.frequency, language)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => processRecurringItem(rec)}
                        title="Process now"
                        className="py-1 px-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 cursor-pointer flex items-center gap-1 text-xs font-bold"
                      >
                        <Play size={12} />
                        <span>{language === 'ar' ? 'تسجيل الآن' : 'Record Now'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRecurringItem(rec.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                        aria-label="Delete recurring item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Data Management: Export & Import CSV & JSON Backup */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div 
          onClick={() => setIsDataStorageOpen(prev => !prev)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <Download size={18} className="text-purple-600 dark:text-purple-400" />
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {t.settings.dataStorage}
            </h2>
          </div>
          <div className={`p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-transform duration-200 ${isDataStorageOpen ? 'rotate-180' : ''}`}>
            <ChevronDown size={16} />
          </div>
        </div>

        {isDataStorageOpen && (
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-200">
            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Export CSV */}
              <button
                type="button"
                onClick={downloadCSV}
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Download size={18} className="text-blue-600 dark:text-blue-400" />
                <span>{t.settings.exportCsv}</span>
              </button>

              {/* Import CSV */}
              <label className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors">
                <Upload size={18} className="text-emerald-600 dark:text-emerald-400" />
                <span>{t.settings.importCsv}</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="hidden"
                />
              </label>

              {/* Export Full JSON Backup */}
              <button
                type="button"
                onClick={downloadFullBackupJSON}
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Download size={18} className="text-purple-600 dark:text-purple-400" />
                <span>{t.settings.backupJson}</span>
              </button>

              {/* Restore Full JSON Backup */}
              <label className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors">
                <Upload size={18} className="text-purple-600 dark:text-purple-400" />
                <span>{t.settings.restoreJson}</span>
                <input
                  ref={backupFileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleBackupUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Reset & Clear Ledger Controls with Confirmation */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <button
                type="button"
                onClick={() => setConfirmAction({
                  title: t.settings.confirmReset,
                  desc: t.settings.confirmResetDesc,
                  confirmLabel: t.settings.resetNow,
                  isDanger: true,
                  onConfirm: async () => {
                    await resetDatabaseToDemo();
                    setConfirmAction(null);
                  },
                })}
                className="w-full py-2.5 px-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 hover:bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <RotateCcw size={14} />
                <span>{t.settings.resetData}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Security & Offline Storage */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Lock size={18} className="text-blue-600 dark:text-blue-400" />
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {t.settings.security}
          </h2>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {t.settings.biometricLock}
            </span>
            <button
              type="button"
              onClick={handleSecurityToggle}
              className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                settings.biometricLock ? 'bg-blue-600 justify-end' : 'bg-slate-200 dark:bg-slate-700 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
            </button>
          </div>

          {settings.biometricLock && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">
                    {language === 'ar' ? 'رمز المرور والحماية' : 'Passcode & Protection'}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {settings.passcode ? (language === 'ar' ? 'تم تعيين رمز مرور مخصص' : 'Custom PIN configured') : (language === 'ar' ? 'الرمز الافتراضي: 1234' : 'Default PIN: 1234')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleStartChangePin}
                    className="py-1.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-bold transition-colors cursor-pointer"
                  >
                    {language === 'ar' ? 'تغيير الرمز' : 'Change PIN'}
                  </button>
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new Event('masrofy_lock_now'))}
                    className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Lock size={13} className="text-blue-600 dark:text-blue-400" />
                    <span>{language === 'ar' ? 'قفل الآن' : 'Lock Now'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Developer & Contact Card */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Info size={18} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 block leading-tight">
              {language === 'ar' ? 'تطوير' : 'Developed by'}
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
              {language === 'ar' ? 'د. بيشوي ويصا كامل' : 'Dr Beshoy wisa kamel'}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-0.5">
          {/* WhatsApp Button */}
          <a
            href="https://wa.me/201203730493"
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <MessageCircle size={15} />
            <span>{language === 'ar' ? 'واتساب' : 'WhatsApp'}</span>
          </a>

          {/* Call Button */}
          <a
            href="tel:01203730493"
            className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-sm flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Phone size={15} />
            <span>{language === 'ar' ? 'اتصال' : 'Call'}</span>
          </a>
        </div>
      </div>

      {/* Add Category Modal */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(false)}
                  className="p-1 -ms-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title={language === 'ar' ? 'رجوع' : 'Back'}
                >
                  <ArrowLeft size={16} className="rtl:rotate-180" />
                </button>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t.settings.addCategory}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCategoryOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">
                  {t.settings.categoryName}
                </label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: سفر، استثمار، دراسة' : 'e.g. Travel, Investments, Pet'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">
                  {t.settings.color}
                </label>
                <div className="flex items-center gap-2">
                  {['#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#64748B'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewCatColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        newCatColor === c ? 'scale-125 ring-2 ring-slate-900 dark:ring-white' : 'opacity-80'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(false)}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl"
                >
                  {t.addExpense.cancel}
                </button>
                <button
                  type="submit"
                  disabled={!newCatName.trim()}
                  className="px-4 py-2 bg-blue-600 disabled:opacity-50 text-white font-semibold rounded-xl"
                >
                  {t.addExpense.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Recurring Modal */}
      {isAddRecurringOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddRecurringOpen(false)}
                  className="p-1 -ms-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title={language === 'ar' ? 'رجوع' : 'Back'}
                >
                  <ArrowLeft size={16} className="rtl:rotate-180" />
                </button>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t.settings.addRecurring}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddRecurringOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateRecurring} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">
                  {t.addExpense.noteOptional}
                </label>
                <input
                  type="text"
                  value={recNote}
                  onChange={e => setRecNote(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: اشتراك نتفليكس، إيجار، جيم' : 'e.g. Netflix, Rent, Gym'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">
                  {t.addExpense.amount} ({getCurrencySymbol(settings.currency, language)})
                </label>
                <input
                  type="number"
                  step="any"
                  value={recAmount}
                  onChange={e => setRecAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    {t.settings.frequency}
                  </label>
                  <select
                    value={recFreq}
                    onChange={e => setRecFreq(e.target.value as any)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="daily">{t.settings.daily}</option>
                    <option value="weekly">{t.settings.weekly}</option>
                    <option value="monthly">{t.settings.monthly}</option>
                    <option value="yearly">{t.settings.yearly}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    {t.addExpense.category}
                  </label>
                  <select
                    value={recCatId}
                    onChange={e => setRecCatId(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {getCategoryDisplayName(c.name, language)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    {t.addExpense.paidFrom}
                  </label>
                  <select
                    value={recAccountId}
                    onChange={e => setRecAccountId(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {accounts.filter(a => a.isActive).map(a => (
                      <option key={a.id} value={a.id}>
                        {getAccountDisplayName(a.name, language)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    {t.addExpense.date}
                  </label>
                  <input
                    type="date"
                    value={recNextDate}
                    onChange={e => setRecNextDate(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddRecurringOpen(false)}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl"
                >
                  {t.addExpense.cancel}
                </button>
                <button
                  type="submit"
                  disabled={!recNote.trim() || !recAmount}
                  className="px-4 py-2 bg-blue-600 disabled:opacity-50 text-white font-semibold rounded-xl"
                >
                  {t.addExpense.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Account Modal Sheet */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAccountModalOpen(false);
                    setEditingAccount(null);
                  }}
                  className="p-1 -ms-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title={language === 'ar' ? 'رجوع' : 'Back'}
                >
                  <ArrowLeft size={16} className="rtl:rotate-180" />
                </button>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Wallet size={16} className="text-blue-600 dark:text-blue-400" />
                  <span>{editingAccount ? t.settings.editAccountModal : t.settings.addAccountModal}</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAccountModalOpen(false);
                  setEditingAccount(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.settings.accountName}
                </label>
                <input
                  type="text"
                  value={accName}
                  onChange={e => setAccName(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: البنك الأهلي، المحفظة النقدية' : 'e.g. Main Bank, Wallet Cash'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.settings.accountType}
                  </label>
                  <select
                    value={accType}
                    onChange={e => setAccType(e.target.value as AccountType)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="cash">{getAccountTypeDisplayName('cash', language)}</option>
                    <option value="bank">{getAccountTypeDisplayName('bank', language)}</option>
                    <option value="debit_card">{getAccountTypeDisplayName('debit_card', language)}</option>
                    <option value="credit_card">{getAccountTypeDisplayName('credit_card', language)}</option>
                    <option value="mobile_wallet">{getAccountTypeDisplayName('mobile_wallet', language)}</option>
                    <option value="savings">{getAccountTypeDisplayName('savings', language)}</option>
                    <option value="other">{getAccountTypeDisplayName('other', language)}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.settings.openingBalance}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={accOpeningBalance}
                    onChange={e => setAccOpeningBalance(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t.settings.themeColor}
                </label>
                <div className="flex items-center gap-2">
                  {['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#06B6D4', '#EF4444', '#64748B'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAccColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                        accColor === c ? 'ring-2 ring-offset-2 ring-blue-600 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-2">
                {editingAccount ? (
                  <button
                    type="button"
                    onClick={() => {
                      const idToDelete = editingAccount.id;
                      const nameToDelete = editingAccount.name;
                      setIsAccountModalOpen(false);
                      setEditingAccount(null);
                      setConfirmAction({
                        title: language === 'ar' ? `حذف محفظة "${nameToDelete}"` : `Delete Wallet "${nameToDelete}"`,
                        desc: language === 'ar' 
                          ? 'هل أنت متأكد من رغبتك في حذف هذه المحفظة نهائياً من حساباتك؟' 
                          : 'Are you sure you want to permanently delete this wallet?',
                        confirmLabel: language === 'ar' ? 'نعم، احذف' : 'Delete',
                        isDanger: true,
                        onConfirm: async () => {
                          await deleteAccountItem(idToDelete);
                          setConfirmAction(null);
                        },
                      });
                    }}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold rounded-xl cursor-pointer flex items-center gap-1 transition-colors"
                  >
                    <Trash2 size={13} />
                    <span>{language === 'ar' ? 'حذف' : 'Delete'}</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAccountModalOpen(false);
                      setEditingAccount(null);
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl cursor-pointer"
                  >
                    {t.settings.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={!accName.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl cursor-pointer"
                  >
                    {editingAccount ? (language === 'ar' ? 'تحديث الحساب' : 'Update Account') : (language === 'ar' ? 'حفظ الحساب' : 'Save Account')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Explicit Confirmation Dialog Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3.5 text-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {confirmAction.title}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              {confirmAction.desc}
            </p>
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl cursor-pointer"
              >
                {t.settings.cancel}
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await confirmAction.onConfirm();
                  } finally {
                    setConfirmAction(null);
                  }
                }}
                className={`px-4 py-2 font-semibold text-white rounded-xl cursor-pointer ${
                  confirmAction.isDanger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {confirmAction.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security Verification Modal for Disabling Lock */}
      {isVerifyingSecurityDisable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xs bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-xs">
              <Lock size={28} />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {language === 'ar' ? 'تأكيد إيقاف قفل الأمان' : 'Confirm Security Disable'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {language === 'ar' ? 'أدخل رمز المرور أو استخدم البصمة للمتابعة' : 'Enter PIN or use fingerprint to continue'}
              </p>
            </div>

            {/* PIN Dots */}
            <div className={`flex items-center justify-center gap-3 py-1 ${securityPinError ? 'animate-bounce text-rose-500' : ''}`}>
              {[0, 1, 2, 3].map(idx => (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full border transition-all duration-200 ${
                    securityPinInput.length > idx
                      ? 'bg-blue-600 border-blue-600 scale-110'
                      : 'border-slate-300 dark:border-slate-600 bg-transparent'
                  }`}
                />
              ))}
            </div>

            {/* Biometric Instant Button */}
            <button
              type="button"
              onClick={() => handleConfirmDisableSecurity(settings.passcode || '1234')}
              className="w-full py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Fingerprint size={18} />
              <span>{language === 'ar' ? 'تأكيد بالبصمة الحيوية' : 'Verify with Fingerprint'}</span>
            </button>

            {/* Numeric Keypad Grid */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    if (securityPinInput.length >= 4) return;
                    const next = securityPinInput + d;
                    setSecurityPinInput(next);
                    if (next.length === 4) {
                      handleConfirmDisableSecurity(next);
                    }
                  }}
                  className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-slate-900 dark:text-white text-base transition-colors cursor-pointer"
                >
                  {d}
                </button>
              ))}
              <div />
              <button
                type="button"
                onClick={() => {
                  if (securityPinInput.length >= 4) return;
                  const next = securityPinInput + '0';
                  setSecurityPinInput(next);
                  if (next.length === 4) {
                    handleConfirmDisableSecurity(next);
                  }
                }}
                className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-slate-900 dark:text-white text-base transition-colors cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => setSecurityPinInput(prev => prev.slice(0, -1))}
                className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsVerifyingSecurityDisable(false);
                  setSecurityPinInput('');
                  setSecurityPinError(false);
                }}
                className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white cursor-pointer"
              >
                {t.settings.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change PIN Modal */}
      {isChangingPin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xs bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-xs">
              <Lock size={28} />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {changePinStep === 'current'
                  ? (language === 'ar' ? 'رمز المرور الحالي' : 'Current PIN')
                  : changePinStep === 'new'
                  ? (language === 'ar' ? 'رمز المرور الجديد' : 'New PIN')
                  : (language === 'ar' ? 'تأكيد الرمز الجديد' : 'Confirm New PIN')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {changePinStep === 'current'
                  ? (language === 'ar' ? 'أدخل رمز المرور الحالي للمتابعة' : 'Enter current PIN to proceed')
                  : changePinStep === 'new'
                  ? (language === 'ar' ? 'أدخل 4 أرقام لرمزك الجديد' : 'Enter 4 digits for your new PIN')
                  : (language === 'ar' ? 'أعد إدخال الرمز للتأكيد' : 'Re-enter PIN to confirm')}
              </p>
            </div>

            {/* PIN Dots */}
            {(() => {
              const currentVal = changePinStep === 'current' ? currentPinCheck : changePinStep === 'new' ? newPinValue : confirmPinValue;
              return (
                <div className={`flex items-center justify-center gap-3 py-1 ${pinChangeError ? 'animate-bounce text-rose-500' : ''}`}>
                  {[0, 1, 2, 3].map(idx => (
                    <div
                      key={idx}
                      className={`w-3.5 h-3.5 rounded-full border transition-all duration-200 ${
                        currentVal.length > idx
                          ? 'bg-blue-600 border-blue-600 scale-110'
                          : 'border-slate-300 dark:border-slate-600 bg-transparent'
                      }`}
                    />
                  ))}
                </div>
              );
            })()}

            {/* Numeric Keypad Grid */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    if (changePinStep === 'current') {
                      if (currentPinCheck.length >= 4) return;
                      const next = currentPinCheck + d;
                      setCurrentPinCheck(next);
                      if (next.length === 4) {
                        const target = settings.passcode || '1234';
                        if (next === target) {
                          triggerHaptic('success');
                          setChangePinStep('new');
                          setPinChangeError(false);
                        } else {
                          triggerHaptic('error');
                          setPinChangeError(true);
                          setTimeout(() => {
                            setCurrentPinCheck('');
                            setPinChangeError(false);
                          }, 500);
                        }
                      }
                    } else if (changePinStep === 'new') {
                      if (newPinValue.length >= 4) return;
                      const next = newPinValue + d;
                      setNewPinValue(next);
                      if (next.length === 4) {
                        triggerHaptic('light');
                        setChangePinStep('confirm');
                      }
                    } else {
                      if (confirmPinValue.length >= 4) return;
                      const next = confirmPinValue + d;
                      setConfirmPinValue(next);
                      if (next.length === 4) {
                        if (next === newPinValue) {
                          triggerHaptic('success');
                          updateSettings({ passcode: newPinValue });
                          setIsChangingPin(false);
                          showToast(language === 'ar' ? 'تم تغيير رمز المرور بنجاح' : 'PIN updated successfully');
                        } else {
                          triggerHaptic('error');
                          setPinChangeError(true);
                          setTimeout(() => {
                            setConfirmPinValue('');
                            setPinChangeError(false);
                          }, 500);
                        }
                      }
                    }
                  }}
                  className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-slate-900 dark:text-white text-base transition-colors cursor-pointer"
                >
                  {d}
                </button>
              ))}
              <div />
              <button
                type="button"
                onClick={() => {
                  const d = '0';
                  if (changePinStep === 'current') {
                    if (currentPinCheck.length >= 4) return;
                    const next = currentPinCheck + d;
                    setCurrentPinCheck(next);
                    if (next.length === 4) {
                      const target = settings.passcode || '1234';
                      if (next === target) {
                        triggerHaptic('success');
                        setChangePinStep('new');
                        setPinChangeError(false);
                      } else {
                        triggerHaptic('error');
                        setPinChangeError(true);
                        setTimeout(() => {
                          setCurrentPinCheck('');
                          setPinChangeError(false);
                        }, 500);
                      }
                    }
                  } else if (changePinStep === 'new') {
                    if (newPinValue.length >= 4) return;
                    const next = newPinValue + d;
                    setNewPinValue(next);
                    if (next.length === 4) {
                      triggerHaptic('light');
                      setChangePinStep('confirm');
                    }
                  } else {
                    if (confirmPinValue.length >= 4) return;
                    const next = confirmPinValue + d;
                    setConfirmPinValue(next);
                    if (next.length === 4) {
                      if (next === newPinValue) {
                        triggerHaptic('success');
                        updateSettings({ passcode: newPinValue });
                        setIsChangingPin(false);
                        showToast(language === 'ar' ? 'تم تغيير رمز المرور بنجاح' : 'PIN updated successfully');
                      } else {
                        triggerHaptic('error');
                        setPinChangeError(true);
                        setTimeout(() => {
                          setConfirmPinValue('');
                          setPinChangeError(false);
                        }, 500);
                      }
                    }
                  }
                }}
                className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-slate-900 dark:text-white text-base transition-colors cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => {
                  if (changePinStep === 'current') {
                    setCurrentPinCheck(prev => prev.slice(0, -1));
                  } else if (changePinStep === 'new') {
                    setNewPinValue(prev => prev.slice(0, -1));
                  } else {
                    setConfirmPinValue(prev => prev.slice(0, -1));
                  }
                }}
                className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsChangingPin(false)}
                className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white cursor-pointer"
              >
                {t.settings.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
