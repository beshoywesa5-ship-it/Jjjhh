import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CategoryIcon } from '../common/CategoryIcon';
import { AccountIcon } from '../common/AccountIcon';
import { WalletManagementModal } from '../tools/WalletManagementModal';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useBackHandler } from '../../hooks/useBackHandler';
import { 
  formatCurrency, 
  getTodayExpenses, 
  getLocalDateString,
  toArabicNumerals
} from '../../utils/calculations';
import { 
  getCategoryDisplayName, 
  getAccountDisplayName, 
  getAccountTypeDisplayName,
  formatDateLabel 
} from '../../utils/i18n';
import { 
  Plus, 
  ChevronRight, 
  Calendar, 
  ArrowLeftRight, 
  Wallet, 
  Eye, 
  EyeOff, 
  X
} from 'lucide-react';

export const HomeScreen: React.FC = () => {
  const { 
    expenses, 
    categories, 
    accounts,
    accountSummaries,
    budgetPace, 
    referenceDate,
    settings, 
    openAddExpense, 
    setViewingExpense,
    setActiveTab,
    setFilters,
    isPrivacyMode,
    togglePrivacyMode,
    language,
    numberFormat,
    t
  } = useApp();

  const formatNum = (val: number | string) => {
    return language === 'ar' ? toArabicNumerals(val) : String(val);
  };

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [dismissEveningPing, setDismissEveningPing] = useState(false);

  useBackHandler(isWalletModalOpen, () => setIsWalletModalOpen(false), 'home-wallet');

  useBodyScrollLock(isWalletModalOpen);

  const isEvening = useMemo(() => {
    const hour = new Date().getHours();
    return hour >= 20;
  }, []);

  // Today's spending summary
  const todayData = useMemo(() => {
    const todayStr = getLocalDateString(referenceDate);
    return getTodayExpenses(expenses, todayStr);
  }, [expenses, referenceDate]);

  // Recent 4 transactions
  const recentTransactions = useMemo(() => {
    return [...expenses]
      .filter(e => !e.isDeleted)
      .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))
      .slice(0, 4);
  }, [expenses]);

  const categoryMap = useMemo(() => {
    return new Map(categories.map(c => [c.id, c]));
  }, [categories]);

  const hasBudget = budgetPace.status !== 'no_budget' && budgetPace.budget !== null && budgetPace.budget > 0;
  const todayStr = getLocalDateString(referenceDate);

  const availableAmount = hasBudget ? (budgetPace.requiredRemainingDailyAverage || 0) : todayData.total;
  const rawFormattedAvailable = Math.round(availableAmount).toLocaleString('en-US');
  const formattedAvailableNumber = isPrivacyMode 
    ? '••••' 
    : (language === 'ar' ? toArabicNumerals(rawFormattedAvailable) : rawFormattedAvailable);
  const currencyAbbr = language === 'ar' ? 'ج.م' : settings.currency;

  return (
    <div className="space-y-3.5 pb-24 text-slate-900 dark:text-slate-100">
      {/* 1. TOP HEADER: UNIFIED SINGLE ROW (DATE ON RIGHT, DAYS REMAINING & PRIVACY EYE ON LEFT) */}
      <div className="pt-1 flex items-center justify-between gap-2">
        <h1 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white tracking-tight truncate flex-1 min-w-0">
          {formatDateLabel(todayStr, language)}
        </h1>

        {/* Left Side (in RTL): Days Remaining Badge & Privacy Eye Toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Day of Month / Days Remaining Badge */}
          <div className="flex items-center gap-1.5 px-2.5 h-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 font-semibold shadow-2xs shrink-0">
            <Calendar size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="whitespace-nowrap">
              {hasBudget && budgetPace.daysRemaining > 0 
                ? (language === 'ar' ? `${formatNum(budgetPace.daysRemaining)} يوم متبقي` : `${formatNum(budgetPace.daysRemaining)}d left`)
                : (language === 'ar' ? `اليوم ${formatNum(budgetPace.daysElapsed)}` : `Day ${formatNum(budgetPace.daysElapsed)}`)}
            </span>
          </div>

          {/* Privacy Eye Toggle */}
          <button
            type="button"
            onClick={togglePrivacyMode}
            title={isPrivacyMode ? (language === 'ar' ? 'إظهار الأرقام' : 'Show amounts') : (language === 'ar' ? 'إخفاء الأرقام' : 'Hide amounts')}
            className={`w-8 h-8 rounded-xl border transition-all cursor-pointer shadow-2xs flex items-center justify-center shrink-0 ${
              isPrivacyMode 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' 
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {isPrivacyMode ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      {/* EVENING PING BANNER (Only in evening if 0 expenses logged) */}
      {isEvening && !dismissEveningPing && todayData.count === 0 && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2.5 animate-in fade-in">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg shrink-0">🌙</span>
            <p className="text-xs font-bold text-amber-900 dark:text-amber-200 truncate">
              {language === 'ar' ? 'هل نسيت تسجيل مصاريف اليوم؟' : "Did you forget today's expenses?"}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => openAddExpense()}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              {language === 'ar' ? 'سجل الآن' : 'Log now'}
            </button>
            <button
              type="button"
              onClick={() => setDismissEveningPing(true)}
              className="p-1 text-amber-600/70 hover:text-amber-800 dark:text-amber-400 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* 2. UNIFIED HERO OBSIDIAN CARD (Combines budget pace + today's spending) */}
      <div className="relative overflow-hidden rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-[#070b14] via-[#0d1527] to-[#151c38] text-white shadow-none border border-blue-500/20 space-y-3">
        {/* Ambient glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top: Available Today and Amount on the SAME LINE */}
        <div className="relative flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-baseline gap-2 flex-wrap min-w-0">
            <span className="text-xs sm:text-sm font-semibold text-slate-300 select-none shrink-0">
              {hasBudget ? t.home.dailyAllowance : t.home.todaySpending}:
            </span>
            <div className="flex items-baseline gap-1.5 min-w-0">
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 bg-clip-text text-transparent tracking-tight tabular-nums truncate">
                {formattedAvailableNumber}
              </span>
              <span className="text-xs font-bold text-amber-300/80 select-none shrink-0">
                {currencyAbbr}
              </span>
            </div>
          </div>

          {!hasBudget && (
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className="text-xs font-bold text-blue-300 hover:text-white underline cursor-pointer shrink-0"
            >
              {t.home.setBudget}
            </button>
          )}
        </div>

        {/* Financial Metrics Strip - Stacked Horizontal Rows */}
        <div className="relative pt-2 border-t border-white/10 space-y-1.5 text-xs">
          {/* Row 1: Today Spending */}
          <div className="flex items-center justify-between gap-2 py-1.5 px-3 rounded-xl bg-white/5 border border-white/5">
            <span className="text-slate-300 font-medium shrink-0">
              {t.home.todaySpending}
            </span>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs sm:text-sm font-bold text-white tabular-nums">
                {formatCurrency(todayData.total, settings.currency, language, isPrivacyMode, numberFormat)}
              </span>
              {todayData.count > 0 && (
                <span className="text-xs text-slate-300 font-medium shrink-0 bg-white/10 px-1.5 py-0.5 rounded-md">
                  {formatNum(todayData.count)} {language === 'ar' ? 'معاملة' : 'txns'}
                </span>
              )}
            </div>
          </div>

          {/* Row 2: Budget Remaining */}
          <div className="flex items-center justify-between gap-2 py-1.5 px-3 rounded-xl bg-white/5 border border-white/5">
            <span className="text-slate-300 font-medium shrink-0">
              {t.home.remaining}
            </span>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs sm:text-sm font-bold text-white tabular-nums">
                {hasBudget ? formatCurrency(budgetPace.remaining || 0, settings.currency, language, isPrivacyMode, numberFormat) : '—'}
              </span>
              {hasBudget && budgetPace.percentUsed !== null && (
                <span className="text-xs text-slate-300 font-medium shrink-0 bg-white/10 px-1.5 py-0.5 rounded-md">
                  {formatNum(budgetPace.percentUsed)}{language === 'ar' ? '٪' : '%'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {hasBudget && budgetPace.percentUsed !== null && (
          <div className="relative space-y-1 pt-0.5">
            <div className="w-full bg-white/15 rounded-full h-1.5 overflow-hidden">
              <div
                style={{ width: `${Math.min(100, Math.max(0, budgetPace.percentUsed))}%` }}
                className={`h-full rounded-full transition-all duration-500 ${
                  budgetPace.status === 'over_budget' 
                    ? 'bg-rose-500' 
                    : budgetPace.status === 'watch' || budgetPace.status === 'attention' 
                    ? 'bg-amber-400' 
                    : 'bg-emerald-400'
                }`}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
              <span>{budgetPace.daysRemaining > 1 ? (language === 'ar' ? `باقي ${formatNum(budgetPace.daysRemaining)} يوماً` : `${formatNum(budgetPace.daysRemaining)} days left`) : (language === 'ar' ? 'اليوم الأخير' : 'Final day')}</span>
              <span>{t.home.thisMonth}: {formatCurrency(budgetPace.budget || 0, settings.currency, language, isPrivacyMode, numberFormat)}</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. MULTI-WALLET HORIZONTAL STRIP (Switch off by default) */}
      {!!settings.showWalletsOnHome && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                <Wallet size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                  {language === 'ar' ? 'محافظك' : 'Wallets'}
                </h2>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {t.home.netWorth}: <strong className="text-slate-900 dark:text-white font-bold">{formatCurrency(accountSummaries.totalNetWorth, settings.currency, language, isPrivacyMode, numberFormat)}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => openAddExpense({ type: 'transfer' })}
                className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ArrowLeftRight size={14} className="rtl:rotate-180" />
                <span>{t.home.transfer}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsWalletModalOpen(true)}
                className="text-xs font-bold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 px-2 py-1 rounded-lg cursor-pointer transition-colors"
              >
                {t.home.manage}
              </button>
            </div>
          </div>

          {/* Wallets Horizontal Scroll */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {accountSummaries.summaries
              .filter(s => s.account.isActive)
              .map(s => {
                const isCredit = s.account.type === 'credit_card';
                const isOwed = s.currentBalance < 0;

                return (
                  <div
                    key={s.account.id}
                    onClick={() => {
                      setFilters(prev => ({
                        ...prev,
                        paymentMethodIds: [s.account.id],
                      }));
                      setActiveTab('transactions');
                    }}
                    className="min-w-[135px] max-w-[170px] shrink-0 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col justify-between gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-all active:scale-98"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <AccountIcon type={s.account.type} color={s.account.color} size={15} />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                        {getAccountDisplayName(s.account.name, language)}
                      </span>
                    </div>
                    <div>
                      <span className={`text-sm font-bold block tracking-tight tabular-nums truncate ${
                        isOwed ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                      }`}>
                        {formatCurrency(s.currentBalance, settings.currency, language, isPrivacyMode, numberFormat)}
                      </span>
                      <span className="text-xs text-slate-400 block truncate font-medium mt-0.5">
                        {isCredit ? (isOwed ? t.home.debt : t.home.available) : getAccountTypeDisplayName(s.account.type, language)}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* 4. RECENT TRANSACTIONS */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {t.home.recentTransactions}
          </h2>
          <button
            type="button"
            onClick={() => setActiveTab('transactions')}
            className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            <span>{t.home.viewAll}</span>
            <ChevronRight size={15} className="rtl:rotate-180" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <p className="text-base font-bold text-slate-800 dark:text-slate-200">
              {t.home.noTransactionsYet}
            </p>
            <button
              type="button"
              onClick={() => openAddExpense()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus size={16} />
              <span>{t.nav.addExpense}</span>
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-xs">
            {recentTransactions.map(exp => {
              const cat = categoryMap.get(exp.categoryId);
              const isExp = exp.type === 'expense';
              const isTransfer = exp.type === 'transfer';

              return (
                <div
                  key={exp.id}
                  onClick={() => setViewingExpense(exp)}
                  className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {isTransfer ? (
                      <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <ArrowLeftRight size={18} className="rtl:rotate-180" />
                      </div>
                    ) : (
                      <CategoryIcon
                        name={cat?.icon || 'MoreHorizontal'}
                        color={cat?.color || '#2563EB'}
                        size={20}
                      />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 truncate">
                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {isTransfer ? t.addExpense.typeTransfer : getCategoryDisplayName(cat?.name || 'Other', language)}
                        </span>
                        {exp.note && (
                          <>
                            <span className="text-slate-300 dark:text-slate-600 text-sm">·</span>
                            <span className="text-sm text-slate-500 dark:text-slate-400 truncate">
                              {exp.note}
                            </span>
                          </>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 block font-medium mt-0.5">
                        {exp.date === todayStr ? t.transactions.today : formatDateLabel(exp.date, language)} · {language === 'ar' ? toArabicNumerals(exp.time || '12:00') : (exp.time || '12:00')}
                      </span>
                    </div>
                  </div>

                  <div className="text-end shrink-0 ms-2">
                    <span className={`text-sm sm:text-base font-bold tracking-tight tabular-nums ${
                      isTransfer 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : isExp 
                        ? 'text-slate-900 dark:text-white' 
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {isTransfer ? '⇄ ' : isExp ? '− ' : '+ '}
                      {formatCurrency(exp.amount, settings.currency, language, isPrivacyMode, numberFormat)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Wallet Management Modal */}
      <WalletManagementModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </div>
  );
};
