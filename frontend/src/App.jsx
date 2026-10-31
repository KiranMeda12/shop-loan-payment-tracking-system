import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import AddRecordModal from './components/AddRecordModal';
import PartialPaymentModal from './components/PartialPaymentModal';
import SlipModal from './components/SlipModal';
import CustomerDetailModal from './components/CustomerDetailModal';

import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import RecordsView from './views/RecordsView';
import CustomersView from './views/CustomersView';
import ReportsView from './views/ReportsView';
import SettingsView from './views/SettingsView';

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('shop_user');
      const token = localStorage.getItem('shop_token');
      return token && savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [currentView, setCurrentView] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [paymentModalRecord, setPaymentModalRecord] = useState(null);
  const [slipModalRecord, setSlipModalRecord] = useState(null);
  const [customerDetailId, setCustomerDetailId] = useState(null);

  // Trigger refresh on any data change
  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleLogout = () => {
    localStorage.removeItem('shop_token');
    localStorage.removeItem('shop_user');
    setUser(null);
  };

  useEffect(() => {
    const handleAuthLogout = () => handleLogout();
    window.addEventListener('auth-logout', handleAuthLogout);
    return () => window.removeEventListener('auth-logout', handleAuthLogout);
  }, []);

  if (!user) {
    return <LoginView onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        user={user}
        onLogout={handleLogout}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          currentView={currentView}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onToggleMobile={() => setIsMobileOpen(true)}
          user={user}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentView === 'dashboard' && (
            <DashboardView
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onOpenCustomerDetail={(id) => setCustomerDetailId(id)}
              onOpenPaymentModal={(rec) => setPaymentModalRecord(rec)}
              onOpenSlipModal={(rec) => setSlipModalRecord(rec)}
              refreshTrigger={refreshTrigger}
            />
          )}

          {currentView === 'records' && (
            <RecordsView
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onOpenCustomerDetail={(id) => setCustomerDetailId(id)}
              onOpenPaymentModal={(rec) => setPaymentModalRecord(rec)}
              onOpenSlipModal={(rec) => setSlipModalRecord(rec)}
              refreshTrigger={refreshTrigger}
              onRecordChanged={triggerRefresh}
            />
          )}

          {currentView === 'customers' && (
            <CustomersView
              onOpenCustomerDetail={(id) => setCustomerDetailId(id)}
              refreshTrigger={refreshTrigger}
            />
          )}

          {currentView === 'reports' && (
            <ReportsView />
          )}

          {currentView === 'settings' && (
            <SettingsView
              user={user}
              onProfileUpdated={(updated) => {
                setUser(updated);
                localStorage.setItem('shop_user', JSON.stringify(updated));
              }}
              onDataSeeded={triggerRefresh}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <AddRecordModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={triggerRefresh}
      />

      <PartialPaymentModal
        isOpen={Boolean(paymentModalRecord)}
        record={paymentModalRecord}
        onClose={() => setPaymentModalRecord(null)}
        onSuccess={triggerRefresh}
      />

      <SlipModal
        isOpen={Boolean(slipModalRecord)}
        record={slipModalRecord}
        onClose={() => setSlipModalRecord(null)}
        onUpdated={triggerRefresh}
      />

      <CustomerDetailModal
        isOpen={Boolean(customerDetailId)}
        customerId={customerDetailId}
        onClose={() => setCustomerDetailId(null)}
        onRefreshRequired={triggerRefresh}
      />
    </div>
  );
}
