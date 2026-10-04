import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { CategoryIcon } from '../common/CategoryIcon';
import { AccountIcon } from '../common/AccountIcon';
import { CategoryDetailModal } from './CategoryDetailModal';
import { useBackHandler } from '../../hooks/useBackHandler';
import { 
  formatCurrency, 
  getCurrentMonthPrefix,
  getPreviousMonthString,
  getNextMonthString,
  calculateMonthInsights,
  toArabicNumerals
} from '../../utils/calculations';
import { 
  formatMonthLabel, 
  formatMonthShortLabel, 
  getCategoryDisplayName, 
  getAccountDisplayName 
} from '../../utils/i18n';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  Receipt, 
  PieChart,
  Plus,
  Wallet,
  ArrowLeft
} from 'lucide-react';
import { Category, Expense } from '../../types';

export const InsightsScreen: React.FC = () => {
  const { 
    expenses, 
    categories, 
    accounts,
    settings, 
    referenceDate, 
    setViewingExpense, 
    setActiveTab, 
    openAddExpense, 
    language, 
    numberFormat,
    t 
  } = useApp();

  const formatNum = (val: number | string) => {
    return language === 'ar' ? toArabicNumerals(val) : String(val);
  };

  const currentMonthPrefix = useMemo(() => getCurrentMonthPrefix(referenceDate), [referenceDate]);

  // Selected month state (default to current month)
  const [selectedMonthPrefix, setSelectedMonthPrefix] = useState<string>(currentMonthPrefix);
  const [activeDailyBarIndex, setActiveDailyBarIndex] = useState<number | null>(null);
  const [selectedCategoryForModal, setSelectedCategoryForModal] = useState<Category | null>(null);

  useBackHandler(!!selectedCategoryForModal, () => setSelectedCategoryForModal(null), 'insights-category');

  // Month navigation guards
  const canGoNext = selectedMonthPrefix < currentMonthPrefix;

  const handlePrevMonth = () => {
    setSelectedMonthPrefix(prev => getPreviousMonthString(prev));
    setActiveDailyBarIndex(null);
  };

  const handleNextMonth = () => {
    if (canGoNext) {
      setSelectedMonthPrefix(prev => getNextMonthString(prev));
      setActiveDailyBarIndex(null);
    }
  };

  // Centralized, high-performance month analytics (O(N) single-pass)
  const insights = useMemo(() => {
    return calculateMonthInsights(expenses, categories, selectedMonthPrefix, referenceDate, accounts, language);
  }, [expenses, categories, selectedMonthPrefix, referenceDate, accounts, language]);

  // Filtered expenses for category detail drill-down (strictly selected month, non-deleted, expense-only)
  const selectedMonthExpenses = useMemo(() => {
    return expenses.filter(e => 
      !e.isDeleted && 
      e.type === 'expense' && 
      e.date.startsWith(selectedMonthPrefix)
    );
  }, [expenses, selectedMonthPrefix]);

  const maxHistoricalTotal = useMemo(() => {
    return Math.max(...insights.historical6Months.map(m => m.total), 100);
  }, [insights.historical6Months]);

  return (
    <div className="space-y-4 pb-24">
      {/* Top Header (Clean mobile header, no manual back button) */}
      <div className="pt-1">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          {t.insights.title}
        </h1>
      </div>

      {/* 1. HISTORICAL MONTH SELECTOR */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label={t.insights.previousMonth}
          >
            <ChevronLeft size={18} className="rtl:rotate-180" />
          </button>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {formatMonthLabel(selectedMonthPrefix, language)}
              </h2>
              {insights.isCurrentMonth && (
                <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                  {t.insights.current}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {insights.isCurrentMonth 
                ? t.insights.dayOf.replace('{day}', formatNum(insights.daysElapsed)).replace('{total}', formatNum(insights.daysInMonth))
                : t.insights.calendarDays.replace('{days}', formatNum(insights.daysInMonth))}
            </p>
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            disabled={!canGoNext}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              canGoNext 
                ? 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800' 
                : 'text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-50'
            }`}
            aria-label={t.insights.nextMonth}
          >
            <ChevronRight size={18} className="rtl:rotate-180" />
          </button>
        </div>

        {/* Quick 6-Month Switching Pills (grid so current month at the end is completely visible and never cut off) */}
        <div className="grid grid-cols-6 gap-1 pt-2 border-t border-slate-100 dark:border-slate-800/80 w-full">
          {insights.historical6Months.map(m => {
            const isSelected = m.monthPrefix === selectedMonthPrefix;
            return (
              <button
                key={m.monthPrefix}
                type="button"
                onClick={() => {
                  setSelectedMonthPrefix(m.monthPrefix);
                  setActiveDailyBarIndex(null);
                }}
                className={`py-1.5 px-0.5 rounded-lg text-xs font-semibold text-center whitespace-nowrap transition-all cursor-pointer truncate ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {formatMonthShortLabel(m.monthPrefix, language)}
              </button>
            );
          })}
        </div>
      </div>

      {/* SPARSE DATA CHECK: Zero transactions empty state */}
      {insights.transactionCount === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Receipt size={24} />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
              {t.insights.noDataForMonth.replace('{month}', formatMonthLabel(selectedMonthPrefix, language))}
            </h2>
          </div>
          <div className="pt-2 flex justify-center gap-2">
            {!insights.isCurrentMonth && (
              <button
                type="button"
                onClick={() => setSelectedMonthPrefix(currentMonthPrefix)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
              >
                {t.insights.jumpToCurrentMonth}
              </button>
            )}
            <button
              type="button"
              onClick={() => openAddExpense()}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Plus size={16} />
              <span>{t.insights.addExpense}</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 2. MONTHLY OVERVIEW METRICS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                {t.insights.totalSpent}
              </span>
              <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1 tracking-tight truncate tabular-nums">
                {formatCurrency(insights.totalSpent, settings.currency, language, false, numberFormat)}
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block truncate">
                {formatMonthLabel(selectedMonthPrefix, language)}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                {t.insights.dailyAverage}
              </span>
              <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1 tracking-tight truncate tabular-nums">
                {formatCurrency(insights.dailyAverage, settings.currency, language, false, numberFormat)}
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block truncate">
                {insights.isCurrentMonth 
                  ? t.home.overDays.replace('{days}', formatNum(insights.daysElapsed)) 
                  : t.home.overDays.replace('{days}', formatNum(insights.daysInMonth))}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                {t.insights.transactionsCount}
              </span>
              <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1 tracking-tight tabular-nums">
                {formatNum(insights.transactionCount)}
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block truncate">
                {t.insights.loggedExpenses}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                {t.insights.vsPreviousMonth}
              </span>
              {insights.monthComparison.hasPrevData ? (
                <>
                  <div className="text-sm sm:text-base font-bold mt-1 tracking-tight flex items-center gap-1 text-slate-800 dark:text-slate-200 truncate tabular-nums">
                    {insights.monthComparison.difference >= 0 ? '+' : '−'}
                    {formatCurrency(Math.abs(insights.monthComparison.difference), settings.currency, language, false, numberFormat)}
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block truncate">
                    {insights.monthComparison.percentageChange !== null && insights.monthComparison.percentageChange >= 0 ? '+' : ''}
                    {formatNum(insights.monthComparison.percentageChange ?? 0)}{language === 'ar' ? '٪' : '%'} · {formatMonthShortLabel(insights.monthComparison.prevMonthPrefix, language)}
                  </span>
                </>
              ) : (
                <>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2 truncate">
                    {language === 'ar' ? 'لا توجد بيانات سابقة' : 'No previous data'}
                  </div>
                  <span className="text-xs text-slate-400 mt-1 block truncate">
                    {language === 'ar' ? 'الفترة الأولى المسجلة' : 'First tracked period'}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* 3. TOP CATEGORY & SPENDING CONCENTRATION */}
          {insights.topCategory && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  {t.insights.topCategory}
                </h2>
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {formatNum(insights.top3Share)}{language === 'ar' ? '٪' : '%'} {t.insights.ofTotal}
                </span>
              </div>

              {/* Factual Statement (Clear readable 14px body text) */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {language === 'ar' ? (
                  <>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {getCategoryDisplayName(insights.topCategory.category.name, 'ar')}
                    </span>
                    {' '}تمثل{' '}
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {formatNum(insights.topCategory.percentage)}٪
                    </span>
                    {' '}من إنفاق شهر {formatMonthLabel(selectedMonthPrefix, 'ar')} ({formatCurrency(insights.topCategory.total, settings.currency, 'ar', false, 'arabic')} عبر {formatNum(insights.topCategory.count)} {insights.topCategory.count === 1 ? 'معاملة' : 'معاملات'}).
                  </>
                ) : (
                  <>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {insights.topCategory.category.name}
                    </span>
                    {' '}represents{' '}
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {formatNum(insights.topCategory.percentage)}%
                    </span>
                    {' '}of {formatMonthLabel(selectedMonthPrefix, 'en')} spending ({formatCurrency(insights.topCategory.total, settings.currency, 'en', false, 'western')} across {formatNum(insights.topCategory.count)} {insights.topCategory.count === 1 ? 'transaction' : 'transactions'}).
                  </>
                )}
              </div>

              {/* Top 3 Distribution Pills */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                {insights.top3Categories.map((item) => (
                  <div 
                    key={item.category.id}
                    onClick={() => setSelectedCategoryForModal(item.category)}
                    className="p-2.5 bg-slate-50/80 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.category.color }} />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                        {getCategoryDisplayName(item.category.name, language)}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white block">
                      {formatNum(item.percentage)}{language === 'ar' ? '٪' : '%'}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5 truncate">
                      {formatCurrency(item.total, settings.currency, language, false, numberFormat)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. CATEGORY INTELLIGENCE: Ranked Breakdown (Where Did My Money Go?) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  {t.insights.whereDidMoneyGo}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t.insights.rankBreakdown} {formatMonthLabel(selectedMonthPrefix, language)}
                </p>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {t.insights.tapCategoryToView}
              </span>
            </div>

            <div className="space-y-3 pt-1">
              {insights.categoryBreakdown.map(item => {
                const avgTxn = item.count > 0 ? Math.round(item.total / item.count) : 0;
                return (
                  <div
                    key={item.category.id}
                    onClick={() => setSelectedCategoryForModal(item.category)}
                    className="group cursor-pointer p-2 -mx-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <CategoryIcon
                          name={item.category.icon}
                          color={item.category.color}
                          size={18}
                        />
                        <div className="min-w-0">
                          <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 transition-colors block leading-tight">
                            {getCategoryDisplayName(item.category.name, language)}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                            {formatNum(item.count)} {t.insights.txns} · {formatCurrency(avgTxn, settings.currency, language, false, numberFormat)} {t.insights.avg}
                          </span>
                        </div>
                      </div>

                      <div className="text-end shrink-0">
                        <span className="font-bold text-sm text-slate-900 dark:text-white block">
                          {formatCurrency(item.total, settings.currency, language, false, numberFormat)}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                          {formatNum(item.percentage)}{language === 'ar' ? '٪' : '%'}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.max(1, item.percentage))}%`,
                          backgroundColor: item.category.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. ADDITIONAL FACTUAL INSIGHTS */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {t.insights.largestTransaction}
              </span>
              <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1 truncate">
                {insights.largestExpense ? formatCurrency(insights.largestExpense.amount, settings.currency) : '—'}
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block truncate">
                {insights.largestExpense?.note || insights.largestExpense?.merchant || t.insights.singleLargest}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {t.insights.highestDay}
              </span>
              <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1 truncate">
                {insights.highestSpendingDay ? formatCurrency(insights.highestSpendingDay.amount, settings.currency, language, false, numberFormat) : '—'}
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block truncate">
                {insights.highestSpendingDay ? `${t.insights.dayOf.replace('{day}', formatNum(insights.highestSpendingDay.day)).replace('{total}', formatNum(insights.daysInMonth))} (${formatNum(insights.highestSpendingDay.count)} ${t.insights.txns})` : '—'}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {t.insights.averageTransaction}
              </span>
              <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1 truncate">
                {insights.averageTransaction > 0 ? formatCurrency(insights.averageTransaction, settings.currency, language, false, numberFormat) : '—'}
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block truncate">
                {t.insights.perTransaction}
              </span>
            </div>
          </div>

          {/* 6. SELECTED MONTH DAILY SPENDING TREND */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  {t.insights.dailyTrendTitle}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t.insights.dailyActivityAcross.replace('{days}', formatNum(insights.daysInMonth)).replace('{month}', formatMonthLabel(selectedMonthPrefix, language))}
                </p>
              </div>
              {activeDailyBarIndex !== null && insights.dailyTrend[activeDailyBarIndex] && (
                <div className="text-end">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">
                    {language === 'ar' ? `يوم ${formatNum(insights.dailyTrend[activeDailyBarIndex].day)}` : `Day ${formatNum(insights.dailyTrend[activeDailyBarIndex].day)}`}
                  </span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(insights.dailyTrend[activeDailyBarIndex].amount, settings.currency, language, false, numberFormat)}
                  </span>
                </div>
              )}
            </div>

            {/* Daily Bar Chart */}
            <div className="pt-2">
              <div className="h-32 w-full flex items-end gap-0.5 sm:gap-1 px-0.5">
                {insights.dailyTrend.map((d, index) => {
                  const heightPercent = insights.maxDailyAmount > 0 
                    ? (d.amount / insights.maxDailyAmount) * 100 
                    : 0;
                  const isHovered = activeDailyBarIndex === index;
                  const isToday = insights.isCurrentMonth && d.day === insights.daysElapsed;

                  return (
                    <div
                      key={d.day}
                      onMouseEnter={() => setActiveDailyBarIndex(index)}
                      onMouseLeave={() => setActiveDailyBarIndex(null)}
                      onClick={() => setActiveDailyBarIndex(index)}
                      className="flex-1 h-full flex flex-col justify-end items-center cursor-pointer group"
                      title={language === 'ar' 
                        ? `يوم ${d.day}: ${formatCurrency(d.amount, settings.currency)} (${d.count} ${d.count === 1 ? 'معاملة' : 'معاملات'})` 
                        : `Day ${d.day}: ${formatCurrency(d.amount, settings.currency)} (${d.count} transactions)`}
                    >
                      <div
                        style={{ height: `${d.amount > 0 ? Math.max(8, heightPercent) : 3}%` }}
                        className={`w-full rounded-t-xs transition-all ${
                          isHovered 
                            ? 'bg-blue-600 dark:bg-blue-400' 
                            : isToday 
                              ? 'bg-blue-500 font-bold' 
                              : d.amount > 0 
                                ? 'bg-slate-300 dark:bg-slate-700 group-hover:bg-blue-500' 
                                : 'bg-slate-100 dark:bg-slate-800'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* X-Axis day markers */}
              <div className="flex justify-between text-xs font-medium text-slate-400 pt-1.5 px-0.5 border-t border-slate-100 dark:border-slate-800">
                <span>{language === 'ar' ? 'يوم 1' : 'Day 1'}</span>
                <span>{language === 'ar' ? 'يوم 10' : 'Day 10'}</span>
                <span>{language === 'ar' ? 'يوم 20' : 'Day 20'}</span>
                <span>{language === 'ar' ? `يوم ${insights.daysInMonth}` : `Day ${insights.daysInMonth}`}</span>
              </div>
            </div>
          </div>

          {/* 7. HISTORICAL 6-MONTH SPENDING TREND */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                  {t.insights.sixMonthTrend}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t.insights.historicalMonthlyTotals}
                </p>
              </div>
            </div>

            <div className="pt-2">
              <div className="h-32 w-full flex items-end gap-2 px-1">
                {insights.historical6Months.map(m => {
                  const heightPercent = maxHistoricalTotal > 0 
                    ? (m.total / maxHistoricalTotal) * 100 
                    : 0;
                  const isSelected = m.monthPrefix === selectedMonthPrefix;

                  return (
                    <div
                      key={m.monthPrefix}
                      onClick={() => {
                        setSelectedMonthPrefix(m.monthPrefix);
                        setActiveDailyBarIndex(null);
                      }}
                      className="flex-1 h-full flex flex-col justify-end items-center cursor-pointer group"
                      title={`${m.fullLabel}: ${formatCurrency(m.total, settings.currency, language, false, numberFormat)}`}
                    >
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                        {formatCurrency(m.total, settings.currency, language, false, numberFormat)}
                      </span>
                      <div
                        style={{ height: `${m.total > 0 ? Math.max(10, heightPercent) : 4}%` }}
                        className={`w-full rounded-t-lg transition-all ${
                          isSelected 
                            ? 'bg-blue-600 dark:bg-blue-500 shadow-xs' 
                            : m.total > 0 
                              ? 'bg-slate-200 dark:bg-slate-700 group-hover:bg-blue-400' 
                              : 'bg-slate-100 dark:bg-slate-800'
                        }`}
                      />
                      <span className={`text-xs mt-2 block font-medium ${
                        isSelected 
                          ? 'font-bold text-blue-600 dark:text-blue-400' 
                          : 'text-slate-400'
                      }`}>
                        {formatMonthShortLabel(m.monthPrefix, language)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 8. SPENDING BY ACCOUNT & PAYMENT METHOD */}
          {insights.spendingByAccount && insights.spendingByAccount.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                    <Wallet size={15} className="text-blue-600 dark:text-blue-400" />
                    <span>{t.insights.spendingByAccountTitle}</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t.insights.accountDistribution}
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                {insights.spendingByAccount.map(accItem => (
                  <div key={accItem.accountId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <AccountIcon 
                          type={accItem.accountType as any} 
                          color={accItem.accountColor} 
                          size={14} 
                        />
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {getAccountDisplayName(accItem.accountName, language)}
                        </span>
                        <span className="text-xs text-slate-400">
                          <bdi>({formatNum(accItem.count)} {t.insights.txns})</bdi>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                          {formatCurrency(accItem.total, settings.currency, language, false, numberFormat)}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 w-11 text-end tabular-nums">
                          {formatNum(accItem.percentage)}{language === 'ar' ? '٪' : '%'}
                        </span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.max(0, accItem.percentage))}%`,
                          backgroundColor: accItem.accountColor || '#3B82F6',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Category Detail Modal (Enhanced with month context) */}
      <CategoryDetailModal
        category={selectedCategoryForModal}
        expenses={selectedMonthExpenses}
        currency={settings.currency}
        totalPeriodSpend={insights.totalSpent}
        monthLabel={formatMonthLabel(selectedMonthPrefix, language)}
        onClose={() => setSelectedCategoryForModal(null)}
        onSelectTransaction={(exp) => setViewingExpense(exp)}
      />
    </div>
  );
};
