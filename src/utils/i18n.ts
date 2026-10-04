import { toArabicNumerals } from './calculations';

export type Language = 'ar' | 'en';

export interface Translations {
  nav: {
    home: string;
    transactions: string;
    insights: string;
    settings: string;
    addExpense: string;
  };
  home: {
    dailyAllowance: string;
    todaySpending: string;
    remaining: string;
    overDays: string;
    thisMonth: string;
    netWorth: string;
    transfer: string;
    manage: string;
    debt: string;
    available: string;
    recentTransactions: string;
    viewAll: string;
    noTransactionsYet: string;
    noTransactionsDesc: string;
    transactionsLoggedToday_one: string;
    transactionsLoggedToday_other: string;
    setBudget: string;
  };
  insights: {
    title: string;
    subtitle: string;
    previousMonth: string;
    nextMonth: string;
    current: string;
    dayOf: string;
    calendarDays: string;
    noDataForMonth: string;
    noExpensesForMonthDesc: string;
    jumpToCurrentMonth: string;
    addExpense: string;
    totalSpent: string;
    dailyAverage: string;
    transactionsCount: string;
    loggedExpenses: string;
    vsPreviousMonth: string;
    topCategory: string;
    ofTotal: string;
    whereDidMoneyGo: string;
    rankBreakdown: string;
    tapCategoryToView: string;
    txns: string;
    avg: string;
    largestTransaction: string;
    highestDay: string;
    averageTransaction: string;
    perTransaction: string;
    dailyTrendTitle: string;
    dailyActivityAcross: string;
    sixMonthTrend: string;
    historicalMonthlyTotals: string;
    spendingByAccountTitle: string;
    accountDistribution: string;
    singleLargest: string;
    catModalAverage: string;
    catModalDateTime: string;
    catModalEmpty: string;
    catModalLargest: string;
    catModalShare: string;
    catModalTotal: string;
    catModalTxns: string;
  };
  transactions: {
    title: string;
    searchPlaceholder: string;
    filters: string;
    today: string;
    yesterday: string;
    all: string;
    expenses: string;
    income: string;
    transfers: string;
    type: string;
    category: string;
    account: string;
    dateRange: string;
    from: string;
    to: string;
    amountRange: string;
    minAmount: string;
    maxAmount: string;
    noLimit: string;
    sortBy: string;
    newest: string;
    oldest: string;
    highest: string;
    lowest: string;
    applyFilters: string;
    resetFilters: string;
    clearFilters: string;
    clearAll: string;
    filter: string;
    filterTransactions: string;
    noMatchingFilters: string;
    noTransactionsFound: string;
  };
  addExpense: {
    newExpense: string;
    newIncome: string;
    newTransfer: string;
    editExpense: string;
    editIncome: string;
    editTransfer: string;
    amount: string;
    category: string;
    account: string;
    paidFrom: string;
    fromAccount: string;
    toAccount: string;
    typeTransfer: string;
    date: string;
    time: string;
    noteOptional: string;
    merchantOptional: string;
    save: string;
    saveExpense: string;
    saveIncome: string;
    saveTransfer: string;
    update: string;
    cancel: string;
    discard: string;
    discardConfirm: string;
    discardDesc: string;
    keepEditing: string;
    duplicateWarning: string;
  };
  detail: {
    title: string;
    merchant: string;
    notes: string;
    date: string;
    time: string;
    account: string;
    fromAccount: string;
    toAccount: string;
    edit: string;
    editTransfer: string;
    delete: string;
    close: string;
    confirmDelete: string;
    confirmDeleteDesc: string;
  };
  onboarding: {
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
    budget: string;
    start: string;
    next: string;
    skip: string;
  };
  settings: {
    title: string;
    monthlyBudget: string;
    saveBudget: string;
    noBudgetSet: string;
    accounts: string;
    accountName: string;
    accountType: string;
    openingBalance: string;
    addAccount: string;
    addAccountModal: string;
    editAccount: string;
    editAccountModal: string;
    categories: string;
    categoryName: string;
    addCategory: string;
    recurring: string;
    addRecurring: string;
    frequency: string;
    daily: string;
    weekly: string;
    monthly: string;
    yearly: string;
    theme: string;
    themeColor: string;
    lightMode: string;
    darkMode: string;
    language: string;
    security: string;
    biometricLock: string;
    budgetAlert: string;
    notifications: string;
    dataStorage: string;
    exportCsv: string;
    importCsv: string;
    backupJson: string;
    restoreJson: string;
    resetData: string;
    resetNow: string;
    confirmReset: string;
    confirmResetDesc: string;
    restoreConfirmTitle: string;
    restoreConfirmDesc: string;
    restoreConfirmAction: string;
    archive: string;
    archived: string;
    unarchive: string;
    cancel: string;
    change: string;
    color: string;
  };
  toasts: {
    settingsSaved: string;
  };
}

export const translations: Record<Language, Translations> = {
  ar: {
    nav: {
      home: 'الرئيسية',
      transactions: 'المعاملات',
      insights: 'التحليلات',
      settings: 'الإعدادات',
      addExpense: 'مصروف',
    },
    home: {
      dailyAllowance: 'المتاح يومياً',
      todaySpending: 'مصاريف اليوم',
      remaining: 'المتبقي من الميزانية',
      overDays: 'على مدار {days} يوماً',
      thisMonth: 'هذا الشهر',
      netWorth: 'إجمالي الثروة',
      transfer: 'تحويل',
      manage: 'إدارة',
      debt: 'مديونية',
      available: 'متاح',
      recentTransactions: 'أحدث المعاملات',
      viewAll: 'عرض الكل',
      noTransactionsYet: 'لا توجد معاملات مسجلة',
      noTransactionsDesc: '',
      transactionsLoggedToday_one: 'معاملة واحدة مسجلة اليوم',
      transactionsLoggedToday_other: '{count} معاملات اليوم',
      setBudget: 'تحديد الميزانية',
    },
    insights: {
      title: 'تحليلات الإنفاق',
      subtitle: '',
      previousMonth: 'الشهر السابق',
      nextMonth: 'الشهر القادم',
      current: 'الحالي',
      dayOf: 'اليوم {day} من {total}',
      calendarDays: '{days} يوماً في الشهر',
      noDataForMonth: 'لا توجد معاملات لشهر {month}',
      noExpensesForMonthDesc: '',
      jumpToCurrentMonth: 'الانتقال للشهر الحالي',
      addExpense: 'مصروف',
      totalSpent: 'إجمالي المصروفات',
      dailyAverage: 'المعدل اليومي',
      transactionsCount: 'عدد المعاملات',
      loggedExpenses: 'مصروفات مسجلة',
      vsPreviousMonth: 'مقارنة بالشهر السابق',
      topCategory: 'الأعلى إنفاقاً',
      ofTotal: 'من إجمالي الشهر',
      whereDidMoneyGo: 'أين ذهبت أموالك؟',
      rankBreakdown: 'ترتيب فئات الإنفاق لشهر',
      tapCategoryToView: 'اضغط على أي فئة للتفاصيل',
      txns: 'معاملات',
      avg: 'متوسط',
      largestTransaction: 'أكبر معاملة فردية',
      highestDay: 'أعلى يوم إنفاقاً',
      averageTransaction: 'متوسط المعاملة',
      perTransaction: 'لكل عملية دفع',
      dailyTrendTitle: 'النشاط اليومي',
      dailyActivityAcross: 'توزيع المصروفات عبر {days} يوماً في {month}',
      sixMonthTrend: 'سجل آخر 6 أشهر',
      historicalMonthlyTotals: 'مقارنة إجمالي المصروفات الشهرية',
      spendingByAccountTitle: 'الإنفاق حسب المحفظة',
      accountDistribution: 'توزيع المدفوعات على الحسابات ووسائل الدفع',
      singleLargest: 'أعلى عملية دفع',
      catModalAverage: 'متوسط المعاملة',
      catModalDateTime: 'التاريخ والوقت',
      catModalEmpty: 'لا توجد معاملات في هذه الفئة',
      catModalLargest: 'أكبر عملية',
      catModalShare: 'الحصة من الإنفاق',
      catModalTotal: 'إجمالي الفئة',
      catModalTxns: 'عدد المعاملات',
    },
    transactions: {
      title: 'سجل المعاملات',
      searchPlaceholder: 'بحث في الملاحظات، الفئات، المحافظ...',
      filters: 'تصفية',
      today: 'اليوم',
      yesterday: 'أمس',
      all: 'الكل',
      expenses: 'مصروفات',
      income: 'دخل',
      transfers: 'تحويلات',
      type: 'النوع',
      category: 'الفئة',
      account: 'المحفظة / الحساب',
      dateRange: 'الفترة الزمنية',
      from: 'من',
      to: 'إلى',
      amountRange: 'نطاق المبلغ',
      minAmount: 'الحد الأدنى',
      maxAmount: 'الحد الأقصى',
      noLimit: 'بلا حد',
      sortBy: 'الترتيب حسب',
      newest: 'الأحدث أولاً',
      oldest: 'الأقدم أولاً',
      highest: 'الأعلى مبلغاً',
      lowest: 'الأقل مبلغاً',
      applyFilters: 'تطبيق التصفية',
      resetFilters: 'إعادة ضبط',
      clearFilters: 'مسح الفلاتر',
      clearAll: 'إلغاء الكل',
      filter: 'تصفية',
      filterTransactions: 'تصفية المعاملات',
      noMatchingFilters: 'لا توجد نتائج مطابقة لشروط البحث',
      noTransactionsFound: 'لم يتم العثور على أي معاملات مسجلة',
    },
    addExpense: {
      newExpense: 'مصروف',
      newIncome: 'دخل',
      newTransfer: 'تحويل',
      editExpense: 'تعديل المصروف',
      editIncome: 'تعديل الدخل',
      editTransfer: 'تعديل التحويل',
      amount: 'المبلغ',
      category: 'الفئة',
      account: 'المحفظة',
      paidFrom: 'طريقة الدفع',
      fromAccount: 'من محفظة',
      toAccount: 'إلى محفظة',
      typeTransfer: 'تحويل مالي',
      date: 'التاريخ',
      time: 'الوقت',
      noteOptional: 'ملاحظة (اختياري)',
      merchantOptional: 'التاجر / الوجهة (اختياري)',
      save: 'حفظ',
      saveExpense: 'تسجيل المصروف',
      saveIncome: 'تسجيل الدخل',
      saveTransfer: 'إتمام التحويل',
      update: 'تحديث المعاملة',
      cancel: 'إلغاء',
      discard: 'تراجع',
      discardConfirm: 'تأكيد الإلغاء',
      discardDesc: 'هل أنت متأكد من إلغاء العملية؟ ستفقد البيانات المدخلة.',
      keepEditing: 'متابعة الإدخال',
      duplicateWarning: 'تنبيه: تم تسجيل معاملة مماثلة بنفس المبلغ والتاريخ مسبقاً!',
    },
    detail: {
      title: 'تفاصيل المعاملة',
      merchant: 'المتجر / المستفيد',
      notes: 'الملاحظات',
      date: 'التاريخ',
      time: 'الوقت',
      account: 'المحفظة',
      fromAccount: 'من حساب',
      toAccount: 'إلى حساب',
      edit: 'تعديل',
      editTransfer: 'تعديل التحويل',
      delete: 'حذف المعاملة',
      close: 'إغلاق',
      confirmDelete: 'تأكيد الحذف',
      confirmDeleteDesc: 'هل أنت متأكد من حذف هذه المعاملة؟ يمكنك التراجع لاحقاً.',
    },
    onboarding: {
      step1Title: 'سرعة وسهولة فائقة',
      step1Desc: 'سجّل كل مصروف في ثوانٍ معدودة بدون تعقيد وببيانات محلية آمنة 100٪ على جهازك.',
      step2Title: 'ذكاء الميزانية والمعدل اليومي',
      step2Desc: 'اعرف ميزانيتك المتاحة كل يوم بدقة لتبقى دائماً مسيطراً على مصاريفك.',
      step3Title: 'أمان وخصوصية كاملة',
      step3Desc: 'بياناتك المالية ملكك وحدك، مخزنة محلياً بالكامل مع إمكانية القفل بالبصمة والنسخ الاحتياطي.',
      budget: 'الميزانية الشهرية المستهدفة',
      start: 'ابدأ الآن',
      next: 'التالي',
      skip: 'تخطي',
    },
    settings: {
      title: 'الإعدادات والبيانات',
      monthlyBudget: 'الميزانية الشهرية',
      saveBudget: 'حفظ الميزانية',
      noBudgetSet: 'لم يتم تعيين ميزانية',
      accounts: 'المحافظ والحسابات',
      accountName: 'اسم المحفظة',
      accountType: 'نوع الحساب',
      openingBalance: 'الرصيد الافتتاحي',
      addAccount: 'محفظة',
      addAccountModal: 'إضافة محفظة جديدة',
      editAccount: 'تعديل المحفظة',
      editAccountModal: 'تعديل بيانات المحفظة',
      categories: 'إدارة الفئات',
      categoryName: 'اسم الفئة',
      addCategory: 'فئة',
      recurring: 'المصروفات الدورية',
      addRecurring: 'مصروف',
      frequency: 'التكرار',
      daily: 'يومي',
      weekly: 'أسبوعي',
      monthly: 'شهري',
      yearly: 'سنوي',
      theme: 'المظهر',
      themeColor: 'سمة التطبيق',
      lightMode: 'الوضع الفاتح',
      darkMode: 'الوضع الليلي',
      language: 'اللغة',
      security: 'الأمان والخصوصية',
      biometricLock: 'قفل التطبيق (رمز مرور أو بصمة)',
      budgetAlert: 'تنبيه الاقتراب من سقف الميزانية',
      notifications: 'الإشعارات والتذكير المسائي',
      dataStorage: 'إدارة البيانات والنسخ الاحتياطي',
      exportCsv: 'تصدير المعاملات (ملف CSV)',
      importCsv: 'استيراد معاملات (CSV)',
      backupJson: 'نسخ احتياطي شامل (JSON)',
      restoreJson: 'استعادة نسخة احتياطية',
      resetData: 'مسح جميع المعاملات',
      resetNow: 'مسح الآن',
      confirmReset: 'تأكيد مسح البيانات',
      confirmResetDesc: 'تحذير: سيتم حذف جميع المعاملات نهائياً. لا يمكن التراجع عن هذا الإجراء.',
      restoreConfirmTitle: 'تأكيد الاستعادة',
      restoreConfirmDesc: 'سيتم استبدال البيانات الحالية بالكامل بمحتويات ملف النسخة الاحتياطية.',
      restoreConfirmAction: 'استعادة الآن',
      archive: 'أرشفة',
      archived: 'مؤرشف',
      unarchive: 'إلغاء الأرشفة',
      cancel: 'إلغاء',
      change: 'تغيير',
      color: 'اللون',
    },
    toasts: {
      settingsSaved: 'تم حفظ الإعدادات بنجاح',
    },
  },
  en: {
    nav: {
      home: 'Home',
      transactions: 'Transactions',
      insights: 'Insights',
      settings: 'Settings',
      addExpense: 'Add',
    },
    home: {
      dailyAllowance: 'Daily Allowance',
      todaySpending: "Today's Spend",
      remaining: 'Budget Remaining',
      overDays: 'Over {days} days',
      thisMonth: 'This Month',
      netWorth: 'Total Net Worth',
      transfer: 'Transfer',
      manage: 'Manage',
      debt: 'Debt',
      available: 'Available',
      recentTransactions: 'Recent Transactions',
      viewAll: 'View All',
      noTransactionsYet: 'No transactions logged yet',
      noTransactionsDesc: '',
      transactionsLoggedToday_one: '1 transaction logged today',
      transactionsLoggedToday_other: '{count} transactions today',
      setBudget: 'Set Budget',
    },
    insights: {
      title: 'Spending Intelligence',
      subtitle: '',
      previousMonth: 'Previous Month',
      nextMonth: 'Next Month',
      current: 'Current',
      dayOf: 'Day {day} of {total}',
      calendarDays: '{days} calendar days',
      noDataForMonth: 'No data for {month}',
      noExpensesForMonthDesc: '',
      jumpToCurrentMonth: 'Jump to current month',
      addExpense: 'Add Expense',
      totalSpent: 'Total Spent',
      dailyAverage: 'Daily Average',
      transactionsCount: 'Transactions',
      loggedExpenses: 'Logged expenses',
      vsPreviousMonth: 'vs Previous Month',
      topCategory: 'Top Category',
      ofTotal: 'of monthly spend',
      whereDidMoneyGo: 'Where Did My Money Go?',
      rankBreakdown: 'Ranked category breakdown for',
      tapCategoryToView: 'Tap any category for details',
      txns: 'txns',
      avg: 'avg',
      largestTransaction: 'Largest Transaction',
      highestDay: 'Peak Spending Day',
      averageTransaction: 'Average Transaction',
      perTransaction: 'Per transaction',
      dailyTrendTitle: 'Daily Activity Trend',
      dailyActivityAcross: 'Spending activity across {days} days of {month}',
      sixMonthTrend: '6-Month Trend',
      historicalMonthlyTotals: 'Monthly spending history comparison',
      spendingByAccountTitle: 'Spending by Account',
      accountDistribution: 'Payment method and wallet distribution',
      singleLargest: 'Single largest payment',
      catModalAverage: 'Average Transaction',
      catModalDateTime: 'Date & Time',
      catModalEmpty: 'No transactions in this category',
      catModalLargest: 'Largest Payment',
      catModalShare: 'Share of Spend',
      catModalTotal: 'Category Total',
      catModalTxns: 'Transactions',
    },
    transactions: {
      title: 'Transaction Ledger',
      searchPlaceholder: 'Search notes, categories, wallets...',
      filters: 'Filters',
      today: 'Today',
      yesterday: 'Yesterday',
      all: 'All',
      expenses: 'Expenses',
      income: 'Income',
      transfers: 'Transfers',
      type: 'Type',
      category: 'Category',
      account: 'Wallet / Account',
      dateRange: 'Date Range',
      from: 'From',
      to: 'To',
      amountRange: 'Amount Range',
      minAmount: 'Min Amount',
      maxAmount: 'Max Amount',
      noLimit: 'No limit',
      sortBy: 'Sort By',
      newest: 'Newest First',
      oldest: 'Oldest First',
      highest: 'Highest Amount',
      lowest: 'Lowest Amount',
      applyFilters: 'Apply Filters',
      resetFilters: 'Reset Filters',
      clearFilters: 'Clear Filters',
      clearAll: 'Clear All',
      filter: 'Filter',
      filterTransactions: 'Filter Transactions',
      noMatchingFilters: 'No transactions match the selected filters',
      noTransactionsFound: 'No transactions recorded yet',
    },
    addExpense: {
      newExpense: 'Record Expense',
      newIncome: 'Record Income',
      newTransfer: 'Transfer Funds',
      editExpense: 'Edit Expense',
      editIncome: 'Edit Income',
      editTransfer: 'Edit Transfer',
      amount: 'Amount',
      category: 'Category',
      account: 'Wallet',
      paidFrom: 'Payment Method',
      fromAccount: 'From Account',
      toAccount: 'To Account',
      typeTransfer: 'Fund Transfer',
      date: 'Date',
      time: 'Time',
      noteOptional: 'Note (optional)',
      merchantOptional: 'Merchant / Recipient (optional)',
      save: 'Save',
      saveExpense: 'Record Expense',
      saveIncome: 'Record Income',
      saveTransfer: 'Complete Transfer',
      update: 'Update Transaction',
      cancel: 'Cancel',
      discard: 'Discard',
      discardConfirm: 'Discard changes?',
      discardDesc: 'Are you sure you want to discard this transaction? Input data will be lost.',
      keepEditing: 'Keep Editing',
      duplicateWarning: 'Notice: A similar transaction with the same amount and date was already recorded!',
    },
    detail: {
      title: 'Transaction Details',
      merchant: 'Merchant / Payee',
      notes: 'Notes',
      date: 'Date',
      time: 'Time',
      account: 'Account',
      fromAccount: 'From Account',
      toAccount: 'To Account',
      edit: 'Edit',
      editTransfer: 'Edit Transfer',
      delete: 'Delete Transaction',
      close: 'Close',
      confirmDelete: 'Delete Transaction',
      confirmDeleteDesc: 'Are you sure you want to delete this transaction? You can undo immediately after.',
    },
    onboarding: {
      step1Title: 'Lightning Fast Logging',
      step1Desc: 'Log any expense in seconds with instant local storage directly on your device.',
      step2Title: 'Daily Budget Pace',
      step2Desc: 'Always know your exact daily available allowance to stay consistently within budget.',
      step3Title: '100% Private & Secure',
      step3Desc: 'Zero cloud tracking. Your financial data stays strictly on your phone with optional biometric lock.',
      budget: 'Target Monthly Budget',
      start: 'Get Started',
      next: 'Next',
      skip: 'Skip',
    },
    settings: {
      title: 'Settings & Data',
      monthlyBudget: 'Monthly Budget',
      saveBudget: 'Save Budget',
      noBudgetSet: 'No budget set',
      accounts: 'Wallets & Accounts',
      accountName: 'Wallet Name',
      accountType: 'Account Type',
      openingBalance: 'Opening Balance',
      addAccount: 'Wallet',
      addAccountModal: 'Add New Wallet',
      editAccount: 'Edit Wallet',
      editAccountModal: 'Edit Wallet Details',
      categories: 'Category Management',
      categoryName: 'Category Name',
      addCategory: 'Category',
      recurring: 'Recurring Expenses',
      addRecurring: 'Add Expense',
      frequency: 'Frequency',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      yearly: 'Yearly',
      theme: 'Appearance',
      themeColor: 'App Theme',
      lightMode: 'Light Mode',
      darkMode: 'Dark Mode',
      language: 'Language',
      security: 'Security & Privacy',
      biometricLock: 'Lock App (Passcode & Biometrics)',
      budgetAlert: 'Budget Alert at 80%',
      notifications: 'Notifications & Evening Reminder',
      dataStorage: 'Data Management & Backup',
      exportCsv: 'Export to CSV',
      importCsv: 'Import from CSV',
      backupJson: 'Full Backup (JSON)',
      restoreJson: 'Restore Backup',
      resetData: 'Clear All Transactions',
      resetNow: 'Clear Now',
      confirmReset: 'Confirm Data Reset',
      confirmResetDesc: 'Warning: This will permanently wipe all transactions. This action cannot be undone.',
      restoreConfirmTitle: 'Confirm Restore',
      restoreConfirmDesc: 'Current data will be completely replaced with the backup file.',
      restoreConfirmAction: 'Restore Now',
      archive: 'Archive',
      archived: 'Archived',
      unarchive: 'Unarchive',
      cancel: 'Cancel',
      change: 'Change',
      color: 'Color',
    },
    toasts: {
      settingsSaved: 'Settings saved successfully',
    },
  },
};

const AR_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const EN_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const EN_MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export function formatMonthLabel(yearMonth: string, lang = 'ar'): string {
  if (!yearMonth) return '';
  const [yStr, mStr] = yearMonth.split('-');
  const monthIdx = (parseInt(mStr, 10) || 1) - 1;
  const year = yStr || '';
  if (lang === 'ar') {
    return `${AR_MONTHS[monthIdx] || ''} ${toArabicNumerals(year)}`;
  }
  return `${EN_MONTHS[monthIdx] || ''} ${year}`;
}

export function formatMonthShortLabel(yearMonth: string, lang = 'ar'): string {
  if (!yearMonth) return '';
  const [, mStr] = yearMonth.split('-');
  const monthIdx = (parseInt(mStr, 10) || 1) - 1;
  if (lang === 'ar') {
    return AR_MONTHS[monthIdx] || '';
  }
  return EN_MONTHS_SHORT[monthIdx] || '';
}

export const AR_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
export const EN_DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function formatDateLabel(dateStr: string, lang = 'ar'): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const pYear = parseInt(parts[0], 10);
    const pMonth = parseInt(parts[1], 10) - 1;
    const pDay = parseInt(parts[2], 10);
    const dateObj = new Date(pYear, pMonth, pDay);
    const dayOfWeek = isNaN(dateObj.getTime()) ? 0 : dateObj.getDay();

    if (lang === 'ar') {
      const dayName = AR_DAYS[dayOfWeek] || '';
      const monthName = AR_MONTHS[pMonth] || '';
      const currentYear = new Date().getFullYear();
      const formattedDay = toArabicNumerals(pDay);
      const formattedYear = toArabicNumerals(pYear);
      if (pYear === currentYear) {
        return `${dayName} ${formattedDay} ${monthName}`;
      }
      return `${dayName} ${formattedDay} ${monthName} ${formattedYear}`;
    } else {
      const dayName = EN_DAYS_SHORT[dayOfWeek] || '';
      const monthName = EN_MONTHS_SHORT[pMonth] || '';
      const currentYear = new Date().getFullYear();
      if (pYear === currentYear) {
        return `${dayName}, ${monthName} ${pDay}`;
      }
      return `${dayName}, ${monthName} ${pDay}, ${pYear}`;
    }
  }
  return dateStr;
}

const CATEGORY_NAMES_AR: Record<string, string> = {
  'Food': 'طعام ومشروبات',
  'Groceries': 'بقالة وسوبرماركت',
  'Transportation': 'مواصلات وتنقل',
  'Bills': 'فواتير والتزامات',
  'Shopping': 'تسوق ومشتريات',
  'Health': 'صحة وأدوية',
  'Entertainment': 'ترفيه وخروجات',
  'Education': 'تعليم وتطوير',
  'Personal': 'عناية شخصية',
  'Other': 'أخرى / عام',
};

const ACCOUNT_NAMES_AR: Record<string, string> = {
  'Cash': 'كاش',
  'Debit Card': 'بطاقة خصم مباشر',
  'Credit Card': 'بطاقة ائتمان (فيزا)',
  'Bank Account': 'حساب بنكي',
  'Mobile Wallet': 'محفظة إلكترونية (فودافون كاش/إنستاباي)',
  'Savings': 'حساب توفير',
};

export function getCategoryDisplayName(name: string, lang = 'ar'): string {
  if (lang === 'en') return name;
  return CATEGORY_NAMES_AR[name] || name;
}

export function getAccountDisplayName(name: string, lang = 'ar'): string {
  if (lang === 'en') return name;
  return ACCOUNT_NAMES_AR[name] || name;
}

export function getAccountTypeDisplayName(type: string, lang = 'ar'): string {
  if (lang === 'en') {
    switch (type) {
      case 'cash': return 'Cash';
      case 'debit_card': return 'Debit Card';
      case 'credit_card': return 'Credit Card';
      case 'bank': return 'Bank';
      case 'mobile_wallet': return 'Mobile Wallet';
      default: return 'Wallet';
    }
  }
  switch (type) {
    case 'cash': return 'كاش';
    case 'debit_card': return 'بطاقة خصم';
    case 'credit_card': return 'بطاقة ائتمان';
    case 'bank': return 'حساب بنكي';
    case 'mobile_wallet': return 'محفظة إلكترونية';
    default: return 'محفظة';
  }
}

export function getFrequencyDisplayName(freq: string, lang = 'ar'): string {
  if (lang === 'en') {
    switch (freq) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'yearly': return 'Yearly';
      default: return freq;
    }
  }
  switch (freq) {
    case 'daily': return 'يومي';
    case 'weekly': return 'أسبوعي';
    case 'monthly': return 'شهري';
    case 'yearly': return 'سنوي';
    default: return freq;
  }
}
