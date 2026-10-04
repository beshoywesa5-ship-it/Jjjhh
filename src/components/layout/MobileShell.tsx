import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { HomeScreen } from '../home/HomeScreen';
import { TransactionsScreen } from '../transactions/TransactionsScreen';
import { InsightsScreen } from '../insights/InsightsScreen';
import { SettingsScreen } from '../settings/SettingsScreen';
import { BottomNavigation } from './BottomNavigation';
import { AddExpenseModal } from '../expense/AddExpenseModal';
import { TransactionDetailModal } from '../transactions/TransactionDetailModal';
import { OnboardingModal } from '../onboarding/OnboardingModal';
import { LockScreen } from '../security/LockScreen';
import { shouldIgnoreNextPop, popTopBackHandler } from '../../hooks/useBackHandler';

import { Toast } from '../common/Toast';

export const MobileShell: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab,
    isAddExpenseOpen, 
    closeAddExpense, 
    editingExpense, 
    setEditingExpense, 
    viewingExpense, 
    setViewingExpense,
    openAddExpense,
    settings,
    isLoading,
    language,
    showToast,
    t
  } = useApp();

  const [showOnboarding, setShowOnboarding] = useState(!settings.hasCompletedOnboarding);
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    return Boolean(settings.biometricLock);
  });

  const lastBackPressTimeRef = React.useRef<number>(0);

  useEffect(() => {
    if (settings.biometricLock) {
      const handleVisibilityChange = () => {
        if (document.hidden) {
          setIsLocked(true);
        }
      };
      const handleLockNow = () => {
        setIsLocked(true);
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('masrofy_lock_now', handleLockNow);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('masrofy_lock_now', handleLockNow);
      };
    } else {
      setIsLocked(false);
    }
  }, [settings.biometricLock]);

  // Push history state whenever switching to a non-home tab
  useEffect(() => {
    if (activeTab !== 'home') {
      window.history.pushState({ masrofyTab: activeTab }, '');
    }
  }, [activeTab]);

  // Mobile Hardware / Gesture Back Button & Escape handling
  useEffect(() => {
    const handleBackAction = () => {
      // 1. If any sub-modal, sheet, or card is active on the stack, close it first and stay on current screen
      if (popTopBackHandler()) {
        return true;
      }

      // 2. If Add / Edit Expense modal is open, close it
      if (isAddExpenseOpen || editingExpense) {
        closeAddExpense();
        setEditingExpense(null);
        return true;
      }

      // 3. If Viewing Expense modal is open, close it
      if (viewingExpense) {
        setViewingExpense(null);
        return true;
      }

      // 4. If Onboarding is open, close it
      if (showOnboarding) {
        setShowOnboarding(false);
        return true;
      }

      // 5. If on another tab/screen (Settings, Transactions, Insights), return to Home screen
      if (activeTab !== 'home') {
        setActiveTab('home');
        return true;
      }

      // 6. If already on Home screen, double-back to exit
      const now = Date.now();
      if (now - lastBackPressTimeRef.current < 2000) {
        // User confirmed exit
        return false;
      }
      lastBackPressTimeRef.current = now;
      // Re-push a state to keep user inside the app until second press
      window.history.pushState({ masrofyHome: true }, '');
      showToast(language === 'ar' ? 'اضغط مرة أخرى للخروج' : 'Press back again to exit');
      return true;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleBackAction();
      }
    };

    const handlePopState = () => {
      // If this popstate was triggered programmatically (e.g. user clicked X, Cancel, or code state changes), ignore it!
      if (shouldIgnoreNextPop()) {
        return;
      }
      handleBackAction();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [
    isAddExpenseOpen,
    editingExpense,
    closeAddExpense,
    setEditingExpense,
    viewingExpense,
    setViewingExpense,
    showOnboarding,
    activeTab,
    setActiveTab,
    language,
    showToast,
  ]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-start font-sans text-slate-900 dark:text-slate-100 transition-colors">
      {/* Mobile-first viewport container (Natural responsive width, no fake bezels or fake status bar) */}
      <main className="w-full max-w-md min-h-screen flex flex-col relative bg-slate-50 dark:bg-slate-950 sm:shadow-sm sm:border-x sm:border-slate-200/80 dark:sm:border-slate-800">
        {/* Scrollable Screen Body with safe area padding */}
        <div className="flex-1 overflow-y-auto px-4 pt-3 pb-36 no-scrollbar">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>{settings.language === 'ar' ? 'جارٍ التحميل...' : 'Loading...'}</span>
            </div>
          ) : (
            <>
              <div className={activeTab === 'home' ? 'block' : 'hidden'}>
                <HomeScreen />
              </div>
              <div className={activeTab === 'transactions' ? 'block' : 'hidden'}>
                <TransactionsScreen />
              </div>
              <div className={activeTab === 'insights' ? 'block' : 'hidden'}>
                <InsightsScreen />
              </div>
              <div className={activeTab === 'settings' ? 'block' : 'hidden'}>
                <SettingsScreen />
              </div>
            </>
          )}
        </div>

        {/* Bottom Navigation with Center Elevated + Button */}
        <BottomNavigation />
      </main>

      {/* Fast Add / Edit Expense Modal */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen || !!editingExpense}
        onClose={() => {
          closeAddExpense();
          setEditingExpense(null);
        }}
        editExpense={editingExpense}
      />

      {/* Transaction Details Modal */}
      <TransactionDetailModal
        expense={viewingExpense}
        onClose={() => setViewingExpense(null)}
        onEdit={(exp) => {
          setViewingExpense(null);
          setEditingExpense(exp);
        }}
      />

      {/* Onboarding Dialog */}
      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={() => setShowOnboarding(false)}
      />

      {/* Biometric & Passcode Lock Screen */}
      {settings.biometricLock && isLocked && (
        <LockScreen
          onUnlock={() => setIsLocked(false)}
          savedPasscode={settings.passcode}
          language={language === 'en' ? 'en' : 'ar'}
        />
      )}

      {/* Floating System Toast */}
      <Toast />
    </div>
  );
};
