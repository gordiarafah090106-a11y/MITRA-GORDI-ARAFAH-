import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { MobileHeader } from './components/MobileHeader';
import { DashboardView } from './components/DashboardView';
import { BelumBayarView } from './components/BelumBayarView';
import { InvoiceView } from './components/InvoiceView';
import { SettingsView } from './components/SettingsView';
import { TransactionModal } from './components/TransactionModal';
import { InvoiceCreateModal } from './components/InvoiceCreateModal';
import { InvoicePreviewModal } from './components/InvoicePreviewModal';
import { StrukModal } from './components/StrukModal';
import { AuthModal } from './components/AuthModal';
import { AuthScreen } from './components/AuthScreen';
import { Transaction, Invoice } from './types';
import { Lock } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { activeTab, isAuthenticated, profile, setActiveTab } = useApp();

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);

  const [isInvoiceCreateOpen, setIsInvoiceCreateOpen] = useState(false);
  const [prefillCustomer, setPrefillCustomer] = useState<string | undefined>(undefined);

  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [strukTx, setStrukTx] = useState<Transaction | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Handlers
  const handleOpenAddTransaction = () => {
    setEditTx(null);
    setIsTxModalOpen(true);
  };

  const handleOpenEditTransaction = (tx: Transaction) => {
    setEditTx(tx);
    setIsTxModalOpen(true);
  };

  const handleOpenStruk = (tx: Transaction) => {
    setStrukTx(tx);
  };

  const handleCreateInvoiceForCustomer = (customerName: string) => {
    setPrefillCustomer(customerName);
    setIsInvoiceCreateOpen(true);
  };

  const handleOpenNewInvoice = () => {
    setPrefillCustomer(undefined);
    setIsInvoiceCreateOpen(true);
  };

  const handleInvoiceCreated = (newInv: Invoice) => {
    setPreviewInvoice(newInv);
  };

  // If user is not authenticated, show modern full AuthScreen (Login & Register)
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-[#0A0E17] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Sidebar for Desktop */}
      <Sidebar onOpenAuth={() => setIsAuthModalOpen(true)} />

      {/* Top and Bottom Nav for Mobile */}
      <MobileHeader onOpenAuth={() => setIsAuthModalOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 md:pl-64 flex flex-col transition-all">
        <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex-1">
          {activeTab === 'dashboard' && (
            <DashboardView
              onOpenAddTransaction={handleOpenAddTransaction}
              onOpenEditTransaction={handleOpenEditTransaction}
              onOpenStruk={handleOpenStruk}
            />
          )}

          {activeTab === 'belum_bayar' && (
            <BelumBayarView
              onOpenStruk={handleOpenStruk}
              onCreateInvoiceForCustomer={handleCreateInvoiceForCustomer}
            />
          )}

          {activeTab === 'invoice' && (
            <InvoiceView
              onOpenCreateInvoice={handleOpenNewInvoice}
              onPreviewInvoice={(inv) => setPreviewInvoice(inv)}
            />
          )}

          {activeTab === 'pengaturan' && <SettingsView />}
        </div>
      </main>

      {/* Global Modals */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditTx(null);
        }}
        editTx={editTx}
      />

      <InvoiceCreateModal
        isOpen={isInvoiceCreateOpen}
        onClose={() => {
          setIsInvoiceCreateOpen(false);
          setPrefillCustomer(undefined);
        }}
        prefillCustomerName={prefillCustomer}
        onInvoiceCreated={handleInvoiceCreated}
      />

      <InvoicePreviewModal
        isOpen={!!previewInvoice}
        onClose={() => setPreviewInvoice(null)}
        invoice={previewInvoice}
      />

      <StrukModal
        isOpen={!!strukTx}
        onClose={() => setStrukTx(null)}
        transaction={strukTx}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
