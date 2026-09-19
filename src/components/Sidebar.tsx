import React from 'react';
import {
  LayoutGrid,
  AlertCircle,
  FileText,
  Settings,
  Lock,
  Cloud,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ActiveTab } from '../types';

interface SidebarProps {
  onOpenAuth: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenAuth }) => {
  const { profile, activeTab, setActiveTab, transactions, isFirestoreConnected, isSyncing } = useApp();

  const belumBayarCount = transactions.filter((t) => t.status === 'Belum Bayar').length;

  const navItems: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'belum_bayar', label: 'Belum Bayar', icon: AlertCircle },
    { id: 'invoice', label: 'Invoice', icon: FileText },
    { id: 'pengaturan', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <aside
      id="app-sidebar"
      className="hidden md:flex md:w-64 flex-col fixed inset-y-0 left-0 bg-[#0E1320] border-r border-slate-800/80 z-30 select-none shadow-2xl"
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 border border-indigo-400/30 flex items-center justify-center font-black text-white text-base shadow-lg shadow-indigo-600/30 overflow-hidden shrink-0">
          {profile.logoUrl ? (
            <img src={profile.logoUrl} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <span>{profile.inisialLogo || 'GA'}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-white uppercase tracking-tight truncate leading-tight">
            {profile.namaMitra || 'GORDI ARAFAH'}
          </h2>
          <p className="text-[11px] text-slate-400 truncate mt-0.5 font-medium">
            {profile.username || '@gordiarafah'}
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3.5 space-y-2 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Menu Utama
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-link-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#181D38] border border-[#434D85] text-[#9EA7FC] font-bold shadow-[0_0_20px_rgba(67,77,133,0.3)]'
                  : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#9EA7FC]' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.id === 'belum_bayar' && belumBayarCount > 0 && (
                <span
                  id="sidebar-badge-belum-bayar"
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-[#434D85]/60 text-[#C7D2FE] border border-[#434D85]'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                  }`}
                >
                  {belumBayarCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Cloud Status & Footer */}
      <div className="p-4 border-t border-slate-800/80 space-y-3 bg-[#0A0E17]/60">
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800/80 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isFirestoreConnected ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isFirestoreConnected ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              ></span>
            </span>
            <span className="font-medium text-slate-300">
              {isSyncing ? 'Menyinkronkan...' : 'Cloud Real-Time'}
            </span>
          </div>
          <span
            className={`text-[10px] font-bold flex items-center gap-1 ${
              isFirestoreConnected ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            {isFirestoreConnected ? 'Aktif (HP/PC)' : 'Pending'}
          </span>
        </div>

        <button
          id="btn-sidebar-lock"
          onClick={onOpenAuth}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-all cursor-pointer"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Kunci / Keluar</span>
        </button>
      </div>
    </aside>
  );
};
