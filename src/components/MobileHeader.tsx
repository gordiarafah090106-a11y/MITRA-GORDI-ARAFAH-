import React from 'react';
import {
  LayoutGrid,
  AlertCircle,
  FileText,
  Settings,
  Lock,
  Cloud,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ActiveTab } from '../types';

interface MobileHeaderProps {
  onOpenAuth: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ onOpenAuth }) => {
  const { profile, activeTab, setActiveTab, transactions, isFirestoreConnected, isSyncing } = useApp();

  const belumBayarCount = transactions.filter((t) => t.status === 'Belum Bayar').length;

  const titles: Record<ActiveTab, string> = {
    dashboard: 'Dashboard',
    belum_bayar: 'Rekapan Belum Bayar',
    invoice: 'Invoice Tagihan',
    pengaturan: 'Pengaturan',
  };

  const navItems: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'belum_bayar', label: 'Belum Bayar', icon: AlertCircle },
    { id: 'invoice', label: 'Invoice', icon: FileText },
    { id: 'pengaturan', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <>
      {/* Top Mobile Bar */}
      <header
        id="app-mobile-header"
        className="md:hidden flex items-center justify-between px-4 py-3.5 bg-[#0E1320] border-b border-slate-800/80 sticky top-0 z-20"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center font-black text-white text-xs shadow-md">
            {profile.logoUrl ? (
              <img src={profile.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-lg" />
            ) : (
              <span>{profile.inisialLogo || 'GA'}</span>
            )}
          </div>
          <div>
            <h1 className="text-xs font-bold text-white uppercase tracking-tight">
              {titles[activeTab]}
            </h1>
            <p className="text-[10px] text-slate-400">
              {profile.namaMitra || 'GORDI ARAFAH'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-[10px] text-slate-300"
            title={isFirestoreConnected ? 'Database Cloud Terhubung Real-Time' : 'Menghubungkan Database Cloud'}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isFirestoreConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <Cloud
              className={`w-3.5 h-3.5 ${
                isSyncing ? 'text-indigo-400 animate-spin' : isFirestoreConnected ? 'text-emerald-400' : 'text-amber-400'
              }`}
            />
          </div>

          <button
            id="btn-mobile-auth"
            onClick={onOpenAuth}
            className="p-2 rounded-lg bg-slate-800/80 text-slate-300 hover:text-rose-400 border border-slate-700/60"
            title="Kunci Aplikasi"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Bottom Mobile Navigation Bar */}
      <div
        id="app-mobile-bottom-nav"
        className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0E1320]/95 backdrop-blur-md border-t border-slate-800/90 z-30 px-2 py-1.5 flex items-center justify-around shadow-2xl"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`mobile-nav-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 py-1.5 flex flex-col items-center justify-center relative rounded-xl transition-all ${
                isActive ? 'text-[#9EA7FC] font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#9EA7FC]' : 'text-slate-400'}`} />
                {item.id === 'belum_bayar' && belumBayarCount > 0 && (
                  <span className="absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] leading-tight">
                    {belumBayarCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
};
