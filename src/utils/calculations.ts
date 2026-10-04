import { 
  Expense, 
  Category, 
  Budget, 
  Account, 
  AccountSummary, 
  BudgetPace, 
  ImportResult,
  NumberFormatOption 
} from '../types';

export const SUPPORTED_CURRENCIES = [
  { code: 'EGP', symbol: 'ج.م', nameAr: 'جنيه مصري', nameEn: 'Egyptian Pound' },
  { code: 'SAR', symbol: 'ر.س', nameAr: 'ريال سعودي', nameEn: 'Saudi Riyal' },
  { code: 'AED', symbol: 'د.إ', nameAr: 'درهم إماراتي', nameEn: 'UAE Dirham' },
  { code: 'KWD', symbol: 'د.ك', nameAr: 'دينار كويتي', nameEn: 'Kuwaiti Dinar' },
  { code: 'QAR', symbol: 'ر.ق', nameAr: 'ريال قطري', nameEn: 'Qatari Riyal' },
  { code: 'USD', symbol: '$', nameAr: 'دولار أمريكي', nameEn: 'US Dollar' },
  { code: 'EUR', symbol: '€', nameAr: 'يورو', nameEn: 'Euro' },
  { code: 'GBP', symbol: '£', nameAr: 'جنيه إسترليني', nameEn: 'British Pound' },
];

export function getCurrencySymbol(code: string, lang = 'ar'): string {
  const match = SUPPORTED_CURRENCIES.find(c => c.code === code);
  if (!match) return code;
  if (lang === 'ar') return match.symbol;
  return match.code;
}

export function getCurrencyDisplayName(code: string, lang = 'ar'): string {
  const match = SUPPORTED_CURRENCIES.find(c => c.code === code);
  if (!match) return code;
  return lang === 'ar' ? `${match.nameAr} (${match.symbol})` : `${match.nameEn} (${match.symbol})`;
}

export function toArabicNumerals(val: number | string): string {
  const str = String(val);
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return str.replace(/[0-9]/g, d => arabicDigits[parseInt(d, 10)]);
}

export function normalizeArabicNumerals(str: string): string {
  if (!str) return '';
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  
  let result = str;
  for (let i = 0; i < 10; i++) {
    result = result.split(arabicDigits[i]).join(String(i));
    result = result.split(persianDigits[i]).join(String(i));
  }
  // Replace Arabic decimal comma or alternative separators
  result = result.replace(/٫/g, '.').replace(/,/g, '');
  return result;
}

export function parseMoneyInput(str: string): { valid: boolean; amount: number; error?: string } {
  if (!str || !str.trim()) {
    return { valid: false, amount: 0, error: 'Amount is required' };
  }
  const normalized = normalizeArabicNumerals(str);
  const num = parseFloat(normalized);
  if (isNaN(num) || !isFinite(num) || num <= 0) {
    return { valid: false, amount: 0, error: 'Amount must be greater than zero' };
  }
  return { valid: true, amount: Math.round(num * 100) / 100 };
}

export function formatNumber(
  num: number | string,
  langOrFormat?: string | NumberFormatOption,
  format?: NumberFormatOption
): string {
  const n = typeof num === 'number' ? num : parseFloat(String(num)) || 0;
  const formatted = n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  const isArabic = format === 'arabic' || langOrFormat === 'arabic' || langOrFormat === 'ar';
  return isArabic ? toArabicNumerals(formatted) : formatted;
}

export function formatCurrency(
  amount: number,
  currency = 'EGP',
  lang = 'ar',
  isPrivacyMode = false,
  format?: NumberFormatOption
): string {
  if (isPrivacyMode) return '••••';
  const cleanAmount = Math.round(amount * 100) / 100;
  const numFormatted = formatNumber(cleanAmount, format || (lang === 'ar' ? 'arabic' : 'western'));
  const symbol = lang === 'ar' ? (currency === 'EGP' ? 'ج.م' : getCurrencySymbol(currency)) : currency;
  return lang === 'ar' ? `${numFormatted} ${symbol}` : `${symbol} ${numFormatted}`;
}

export function addMoney(a: number, b: number): number {
  return Math.round((a + b) * 100) / 100;
}

export function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getLocalTimeString(date = new Date()): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function getCurrentMonthPrefix(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getPreviousMonthString(yearMonth: string): string {
  const [yStr, mStr] = yearMonth.split('-');
  let year = parseInt(yStr, 10);
  let month = parseInt(mStr, 10) - 1;
  if (month < 1) {
    month = 12;
    year -= 1;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function getNextMonthString(yearMonth: string): string {
  const [yStr, mStr] = yearMonth.split('-');
  let year = parseInt(yStr, 10);
  let month = parseInt(mStr, 10) + 1;
  if (month > 12) {
    month = 1;
    year += 1;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function getTodayExpenses(expenses: Expense[], todayDateStr: string): { total: number; count: number; expenses: Expense[] } {
  const list = expenses.filter(e => !e.isDeleted && e.date === todayDateStr && e.type === 'expense');
  const total = list.reduce((sum, e) => sum + e.amount, 0);
  return {
    total: Math.round(total * 100) / 100,
    count: list.length,
    expenses: list,
  };
}

export function calculateBudgetPace(expenses: Expense[], budget: Budget | null, referenceDate = new Date()): BudgetPace {
  const monthPrefix = getCurrentMonthPrefix(referenceDate);
  const now = referenceDate;
  const currentDay = now.getDate();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysElapsed = Math.min(currentDay, daysInMonth);
  const daysRemaining = Math.max(0, daysInMonth - daysElapsed);

  const monthExpenses = expenses.filter(
    e => !e.isDeleted && e.type === 'expense' && e.date.startsWith(monthPrefix)
  );
  const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const cleanSpent = Math.round(totalSpent * 100) / 100;

  if (!budget || !budget.amount || budget.amount <= 0) {
    return {
      status: 'no_budget',
      budget: null,
      totalSpent: cleanSpent,
      remaining: 0,
      percentUsed: null,
      requiredRemainingDailyAverage: 0,
      daysElapsed,
      daysRemaining,
      daysInMonth,
    };
  }

  const budgetAmount = budget.amount;
  const remaining = Math.round((budgetAmount - cleanSpent) * 100) / 100;
  const percentUsed = Math.min(999, Math.round((cleanSpent / budgetAmount) * 100));

  const effectiveDaysRemaining = Math.max(1, daysRemaining);
  const requiredRemainingDailyAverage = remaining > 0 ? Math.round((remaining / effectiveDaysRemaining) * 100) / 100 : 0;
  const expectedPaceSpent = (budgetAmount / daysInMonth) * daysElapsed;

  let status: BudgetPace['status'] = 'on_track';
  if (cleanSpent > budgetAmount) {
    status = 'over_budget';
  } else if (cleanSpent > expectedPaceSpent * 1.15) {
    status = 'watch';
  } else if (cleanSpent > expectedPaceSpent * 1.05) {
    status = 'attention';
  } else {
    status = 'under_budget';
  }

  return {
    status,
    budget: budgetAmount,
    totalSpent: cleanSpent,
    remaining,
    percentUsed,
    requiredRemainingDailyAverage,
    daysElapsed,
    daysRemaining,
    daysInMonth,
    projectedTotal: daysElapsed > 0 ? Math.round((cleanSpent / daysElapsed) * daysInMonth) : 0,
  };
}

export function calculateAccountSummaries(accounts: Account[], expenses: Expense[]) {
  const summaries: AccountSummary[] = accounts.map(acc => {
    let income = 0;
    let expense = 0;
    let count = 0;

    expenses.forEach(e => {
      if (e.isDeleted) return;

      if (e.type === 'expense' && (e.accountId === acc.id || e.paymentMethodId === acc.id)) {
        expense += e.amount;
        count++;
      } else if (e.type === 'income' && (e.accountId === acc.id || e.paymentMethodId === acc.id)) {
        income += e.amount;
        count++;
      } else if (e.type === 'transfer') {
        if (e.fromAccountId === acc.id) {
          expense += e.amount;
          count++;
        }
        if (e.toAccountId === acc.id) {
          income += e.amount;
          count++;
        }
      }
    });

    const isCredit = acc.type === 'credit_card';
    const currentBalance = isCredit
      ? (acc.openingBalance - expense + income)
      : (acc.openingBalance + income - expense);

    return {
      account: acc,
      totalIncome: Math.round(income * 100) / 100,
      totalExpense: Math.round(expense * 100) / 100,
      currentBalance: Math.round(currentBalance * 100) / 100,
      transactionCount: count,
    };
  });

  let totalAssets = 0;
  let totalLiabilities = 0;

  summaries.forEach(s => {
    if (!s.account.isActive) return;
    if (s.account.type === 'credit_card') {
      if (s.currentBalance < 0) {
        totalLiabilities += Math.abs(s.currentBalance);
      } else {
        totalAssets += s.currentBalance;
      }
    } else {
      if (s.currentBalance >= 0) {
        totalAssets += s.currentBalance;
      } else {
        totalLiabilities += Math.abs(s.currentBalance);
      }
    }
  });

  const totalNetWorth = Math.round((totalAssets - totalLiabilities) * 100) / 100;

  return {
    summaries,
    totalNetWorth,
    totalAssets: Math.round(totalAssets * 100) / 100,
    totalLiabilities: Math.round(totalLiabilities * 100) / 100,
  };
}

export function calculateMonthInsights(
  expenses: Expense[],
  categories: Category[],
  selectedMonthPrefix: string,
  referenceDate = new Date(),
  accounts: Account[] = [],
  language = 'ar'
) {
  const [yStr, mStr] = selectedMonthPrefix.split('-');
  const year = parseInt(yStr, 10);
  const month = parseInt(mStr, 10);
  const daysInMonth = new Date(year, month, 0).getDate();

  const currentMonthPrefix = getCurrentMonthPrefix(referenceDate);
  const isCurrentMonth = selectedMonthPrefix === currentMonthPrefix;
  const daysElapsed = isCurrentMonth ? Math.min(referenceDate.getDate(), daysInMonth) : daysInMonth;

  const monthExpenses = expenses.filter(
    e => !e.isDeleted && e.type === 'expense' && e.date.startsWith(selectedMonthPrefix)
  );

  const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const cleanTotalSpent = Math.round(totalSpent * 100) / 100;
  const transactionCount = monthExpenses.length;
  const dailyAverage = daysElapsed > 0 ? Math.round((cleanTotalSpent / daysElapsed) * 100) / 100 : 0;
  const averageTransaction = transactionCount > 0 ? Math.round((cleanTotalSpent / transactionCount) * 100) / 100 : 0;

  // Largest Expense
  const sortedByAmount = [...monthExpenses].sort((a, b) => b.amount - a.amount);
  const largestExpense = sortedByAmount[0] || null;

  // Category breakdown
  const catMap = new Map(categories.map(c => [c.id, c]));
  const catTotals: Record<string, { total: number; count: number }> = {};

  monthExpenses.forEach(e => {
    if (!catTotals[e.categoryId]) {
      catTotals[e.categoryId] = { total: 0, count: 0 };
    }
    catTotals[e.categoryId].total += e.amount;
    catTotals[e.categoryId].count += 1;
  });

  const categoryBreakdown = Object.entries(catTotals)
    .map(([catId, data]) => {
      const category = catMap.get(catId) || {
        id: catId,
        name: 'Other',
        icon: 'MoreHorizontal',
        color: '#64748B',
        isActive: true,
        sortOrder: 99,
        createdAt: '',
        updatedAt: '',
      };
      const total = Math.round(data.total * 100) / 100;
      const percentage = cleanTotalSpent > 0 ? Math.round((total / cleanTotalSpent) * 1000) / 10 : 0;
      return {
        category,
        total,
        count: data.count,
        percentage,
      };
    })
    .sort((a, b) => b.total - a.total);

  const topCategory = categoryBreakdown[0] || null;
  const top3Categories = categoryBreakdown.slice(0, 3);
  const top3Share = top3Categories.reduce((sum, c) => sum + c.percentage, 0);

  // Daily Trend (1 to daysInMonth)
  const dailyMap: Record<number, { amount: number; count: number }> = {};
  for (let d = 1; d <= daysInMonth; d++) {
    dailyMap[d] = { amount: 0, count: 0 };
  }

  monthExpenses.forEach(e => {
    const day = parseInt(e.date.split('-')[2], 10);
    if (day >= 1 && day <= daysInMonth) {
      dailyMap[day].amount += e.amount;
      dailyMap[day].count += 1;
    }
  });

  const dailyTrend = Object.entries(dailyMap).map(([dayStr, data]) => ({
    day: parseInt(dayStr, 10),
    amount: Math.round(data.amount * 100) / 100,
    count: data.count,
  }));

  const maxDailyAmount = Math.max(...dailyTrend.map(d => d.amount), 0);

  // Highest spending day
  const sortedDays = [...dailyTrend].sort((a, b) => b.amount - a.amount);
  const highestSpendingDay = sortedDays[0] && sortedDays[0].amount > 0 ? sortedDays[0] : null;

  // Historical 6 Months
  const historical6Months = [];
  let iterMonth = selectedMonthPrefix;
  for (let i = 0; i < 6; i++) {
    const mExpenses = expenses.filter(
      e => !e.isDeleted && e.type === 'expense' && e.date.startsWith(iterMonth)
    );
    const mTotal = Math.round(mExpenses.reduce((s, e) => s + e.amount, 0) * 100) / 100;
    historical6Months.unshift({
      monthPrefix: iterMonth,
      total: mTotal,
      fullLabel: iterMonth,
    });
    iterMonth = getPreviousMonthString(iterMonth);
  }

  // Previous month comparison
  const prevMonthPrefix = getPreviousMonthString(selectedMonthPrefix);
  const prevExpenses = expenses.filter(
    e => !e.isDeleted && e.type === 'expense' && e.date.startsWith(prevMonthPrefix)
  );
  const prevTotal = Math.round(prevExpenses.reduce((s, e) => s + e.amount, 0) * 100) / 100;
  const hasPrevData = prevExpenses.length > 0;
  const difference = Math.round((cleanTotalSpent - prevTotal) * 100) / 100;
  const percentageChange = hasPrevData && prevTotal > 0
    ? Math.round(((cleanTotalSpent - prevTotal) / prevTotal) * 100)
    : null;

  const monthComparison = {
    hasPrevData,
    prevTotal,
    difference,
    percentageChange,
    prevMonthPrefix,
  };

  // Spending by Account
  const accMap = new Map(accounts.map(a => [a.id, a]));
  const accTotals: Record<string, { total: number; count: number }> = {};

  monthExpenses.forEach(e => {
    const aId = e.accountId || e.paymentMethodId || 'acc-cash';
    if (!accTotals[aId]) {
      accTotals[aId] = { total: 0, count: 0 };
    }
    accTotals[aId].total += e.amount;
    accTotals[aId].count += 1;
  });

  const spendingByAccount = Object.entries(accTotals).map(([accId, data]) => {
    const acc = accMap.get(accId);
    const total = Math.round(data.total * 100) / 100;
    const percentage = cleanTotalSpent > 0 ? Math.round((total / cleanTotalSpent) * 100) : 0;
    return {
      accountId: accId,
      accountName: acc?.name || 'Account',
      accountType: acc?.type || 'cash',
      accountColor: acc?.color || '#3B82F6',
      total,
      count: data.count,
      percentage,
    };
  }).sort((a, b) => b.total - a.total);

  return {
    isCurrentMonth,
    daysInMonth,
    daysElapsed,
    totalSpent: cleanTotalSpent,
    transactionCount,
    dailyAverage,
    averageTransaction,
    largestExpense,
    topCategory,
    top3Categories,
    top3Share: Math.round(top3Share * 10) / 10,
    categoryBreakdown,
    dailyTrend,
    maxDailyAmount,
    highestSpendingDay,
    historical6Months,
    monthComparison,
    spendingByAccount,
  };
}

export function predictCategoryFromText(text: string, categoriesOrExpenses?: Category[] | Expense[]): string | null {
  if (!text) return null;
  const t = text.toLowerCase();
  
  const keywords: Record<string, string[]> = {
    'cat-food': ['مطعم', 'اكل', 'أكل', 'غدا', 'عشا', 'فطار', 'وجبة', 'سوبرماركت', 'كنتاكي', 'ماك', 'food', 'restaurant', 'coffee', 'cafe', 'قهوة', 'كافيه'],
    'cat-groceries': ['خضار', 'فاكهة', 'بقالة', 'تموين', 'سوق', 'ماركت', 'لبن', 'جبن', 'عيش', 'خبز', 'grocery', 'market'],
    'cat-trans': ['اوبر', 'أوبر', 'كريم', 'بنزين', 'تاكسي', 'مترو', 'مواصلات', 'عربية', 'زيت', 'غسيل', 'uber', 'careem', 'gas', 'metro'],
    'cat-bills': ['فاتورة', 'كهرباء', 'مياه', 'غاز', 'نت', 'انترنت', 'واي فاي', 'شحن', 'رصيد', 'bill', 'electric', 'water', 'gas', 'internet'],
    'cat-shopping': ['شراء', 'هدوم', 'ملابس', 'حذاء', 'شوز', 'شنطة', 'مشتريات', 'امازون', 'نون', 'shopping', 'amazon', 'noon'],
    'cat-health': ['صيدلية', 'دكتور', 'كشف', 'علاج', 'دوا', 'دواء', 'مستشفى', 'تحليل', 'doctor', 'pharmacy', 'medicine'],
    'cat-ent': ['سينما', 'فيلم', 'بلايستيشن', 'فسحة', 'خروجة', 'اشتراك', 'نتفلكس', 'cinema', 'movie', 'netflix'],
    'cat-edu': ['كورس', 'درس', 'كتاب', 'مدرسة', 'جامعة', 'مذكرة', 'course', 'school', 'book'],
    'cat-personal': ['حلاق', 'صالون', 'جيم', 'عطر', 'gym', 'barber'],
  };

  for (const [catId, words] of Object.entries(keywords)) {
    if (words.some(w => t.includes(w))) {
      return catId;
    }
  }

  // If passed an array of objects, check note matches from past expenses or names from categories
  if (Array.isArray(categoriesOrExpenses)) {
    for (const item of categoriesOrExpenses) {
      if ('categoryId' in item && item.note && t.includes(item.note.toLowerCase())) {
        return item.categoryId;
      }
      if ('name' in item && t.includes(item.name.toLowerCase())) {
        return item.id;
      }
    }
  }

  return null;
}

export function detectDuplicateExpense(
  newExp: { amount: number; date: string; categoryId: string; note?: string },
  existing: Expense[]
): Expense | null {
  const match = existing.find(e => {
    if (e.isDeleted) return false;
    const sameAmount = Math.abs(e.amount - newExp.amount) < 0.001;
    const sameDate = e.date === newExp.date;
    const sameCategory = e.categoryId === newExp.categoryId;
    const sameNote = (e.note || '').trim().toLowerCase() === (newExp.note || '').trim().toLowerCase();
    return sameAmount && sameDate && sameCategory && sameNote;
  });
  return match || null;
}

export function validateAccount(account: Account, accounts: Account[], excludeId?: string): { valid: boolean; error?: string } {
  if (!account.name || !account.name.trim()) {
    return { valid: false, error: 'Account name cannot be empty' };
  }
  const dup = accounts.find(a => a.id !== excludeId && a.name.trim().toLowerCase() === account.name.trim().toLowerCase());
  if (dup) {
    return { valid: false, error: 'An account with this name already exists' };
  }
  return { valid: true };
}

export function validateTransfer(
  data: { amount: number; fromAccountId: string; toAccountId: string },
  accounts: Account[]
): { valid: boolean; error?: string } {
  if (!data.amount || data.amount <= 0) {
    return { valid: false, error: 'Transfer amount must be greater than zero' };
  }
  if (!data.fromAccountId || !data.toAccountId) {
    return { valid: false, error: 'Both origin and destination wallets must be selected' };
  }
  if (data.fromAccountId === data.toAccountId) {
    return { valid: false, error: 'Cannot transfer to the same wallet' };
  }
  const fromExists = accounts.some(a => a.id === data.fromAccountId);
  const toExists = accounts.some(a => a.id === data.toAccountId);
  if (!fromExists || !toExists) {
    return { valid: false, error: 'Selected wallet does not exist' };
  }
  return { valid: true };
}

export function calculateNextOccurrence(
  currentDateStr: string,
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
): string {
  const d = new Date(currentDateStr);
  switch (frequency) {
    case 'daily':
      d.setDate(d.getDate() + 1);
      break;
    case 'weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() + 1);
      break;
    case 'yearly':
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  return getLocalDateString(d);
}

export function validateBackupJSON(jsonStr: string): { valid: boolean; error?: string; data?: any } {
  try {
    const data = JSON.parse(jsonStr);
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Invalid JSON format' };
    }
    if (!Array.isArray(data.expenses) || !Array.isArray(data.categories)) {
      return { valid: false, error: 'Missing required tables in backup file' };
    }
    return { valid: true, data };
  } catch (err: any) {
    return { valid: false, error: err.message || 'JSON parsing failed' };
  }
}

export function exportExpensesToCSV(
  expenses: Expense[],
  categories: Category[],
  currency: string,
  accounts: Account[]
): string {
  const catMap = new Map(categories.map(c => [c.id, c.name]));
  const accMap = new Map(accounts.map(a => [a.id, a.name]));

  const headers = ['ID', 'Date', 'Time', 'Type', 'Amount', 'Currency', 'Category', 'Account', 'Merchant', 'Note'];
  const rows = expenses
    .filter(e => !e.isDeleted)
    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))
    .map(e => [
      e.id,
      e.date,
      e.time || '12:00',
      e.type,
      e.amount,
      e.currency || currency,
      `"${(catMap.get(e.categoryId) || 'Other').replace(/"/g, '""')}"`,
      `"${(accMap.get(e.accountId || e.paymentMethodId) || 'Account').replace(/"/g, '""')}"`,
      `"${(e.merchant || '').replace(/"/g, '""')}"`,
      `"${(e.note || '').replace(/"/g, '""')}"`,
    ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

function normalizeDateString(rawDate: string): string {
  if (!rawDate) return getLocalDateString();
  const clean = normalizeArabicNumerals(rawDate.trim());
  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
  // If YYYY/MM/DD
  if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(clean)) {
    const [y, m, d] = clean.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // If DD/MM/YYYY or DD-MM-YYYY
  const parts = clean.split(/[/.-]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
    if (parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    return getLocalDateString(parsed);
  }
  return getLocalDateString();
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseCSVWithAudit(
  csvText: string,
  categories: Category[],
  existingExpenses: Expense[],
  accounts: Account[]
): { items: Partial<Expense>[]; result: ImportResult } {
  // Strip UTF-8 BOM if present
  const cleanedText = csvText.replace(/^\uFEFF/, '');
  const lines = cleanedText.split(/\r?\n/).filter(l => l.trim().length > 0);
  const items: Partial<Expense>[] = [];
  const result: ImportResult = { imported: 0, skipped: 0, errors: 0, details: [] };

  if (lines.length <= 1) {
    result.errors++;
    result.details.push('CSV file is empty');
    return { items, result };
  }

  const catNameMap = new Map(categories.map(c => [c.name.toLowerCase(), c.id]));
  const accNameMap = new Map(accounts.map(a => [a.name.toLowerCase(), a.id]));
  const defaultAccId = accounts[0]?.id || 'acc-cash';
  const defaultCatId = categories[0]?.id || 'cat-other';

  // Identify column indices from header if present
  const headerCols = parseCSVLine(lines[0]).map(c => c.toLowerCase());
  let dateIdx = headerCols.findIndex(h => h.includes('date') || h.includes('تاريخ'));
  let amountIdx = headerCols.findIndex(h => h.includes('amount') || h.includes('مبلغ') || h.includes('قيمة'));
  let catIdx = headerCols.findIndex(h => h.includes('cat') || h.includes('فئة'));
  let accIdx = headerCols.findIndex(h => h.includes('account') || h.includes('محفظة') || h.includes('حساب'));
  let noteIdx = headerCols.findIndex(h => h.includes('note') || h.includes('ملاحظة') || h.includes('وصف'));
  let typeIdx = headerCols.findIndex(h => h.includes('type') || h.includes('نوع'));

  // Fallback default index positions if headers weren't named standardly
  if (dateIdx === -1) dateIdx = 1;
  if (amountIdx === -1) amountIdx = 4;
  if (catIdx === -1) catIdx = 6;
  if (accIdx === -1) accIdx = 7;
  if (noteIdx === -1) noteIdx = 9;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const cols = parseCSVLine(line);
    if (cols.length < 2) continue;

    const rawDate = cols[dateIdx] || cols[0];
    const rawAmount = cols[amountIdx] || cols[1] || '0';
    const rawCat = cols[catIdx] || '';
    const rawAcc = cols[accIdx] || '';
    const rawNote = cols[noteIdx] || (cols.length > 3 ? cols[3] : '');
    const rawType = typeIdx !== -1 && cols[typeIdx] ? cols[typeIdx].toLowerCase() : 'expense';

    const normalizedDate = normalizeDateString(rawDate);
    const amountVal = parseMoneyInput(rawAmount).amount;

    if (amountVal <= 0) {
      result.errors++;
      continue;
    }

    const catId = catNameMap.get(rawCat.toLowerCase()) || defaultCatId;
    const accId = accNameMap.get(rawAcc.toLowerCase()) || defaultAccId;
    const type = (rawType.includes('income') || rawType.includes('دخل')) ? 'income' : (rawType.includes('transfer') || rawType.includes('تحويل')) ? 'transfer' : 'expense';

    // Duplicate check
    const isDup = existingExpenses.some(
      e => !e.isDeleted && e.date === normalizedDate && Math.abs(e.amount - amountVal) < 0.01 && e.categoryId === catId
    );

    if (isDup) {
      result.skipped++;
      continue;
    }

    items.push({
      type,
      amount: amountVal,
      categoryId: catId,
      accountId: accId,
      paymentMethodId: accId,
      date: normalizedDate,
      time: '12:00',
      note: rawNote,
      merchant: rawNote,
    });
    result.imported++;
  }

  return { items, result };
}

export function validateAmount(amount: any): { valid: boolean; error?: string; cleanAmount?: number } {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount));
  if (isNaN(num) || !isFinite(num) || num <= 0) {
    return { valid: false, error: 'Amount must be a positive number' };
  }
  return { valid: true, cleanAmount: Math.round(num * 100) / 100 };
}

export function validateCategory(name: string, categories: Category[], excludeId?: string): { valid: boolean; error?: string; trimmedName: string } {
  const trimmed = (name || '').trim();
  if (!trimmed) {
    return { valid: false, error: 'Category name cannot be empty', trimmedName: '' };
  }
  const exists = categories.some(c => c.id !== excludeId && c.name.trim().toLowerCase() === trimmed.toLowerCase());
  if (exists) {
    return { valid: false, error: 'Category already exists', trimmedName: trimmed };
  }
  return { valid: true, trimmedName: trimmed };
}
