import React, { useState, useMemo } from 'react';
import {
  TrendingDown,
  TrendingUp,
  Layers,
  AlertTriangle,
  Plus,
  FileSpreadsheet,
  Search,
  ChevronDown,
  MapPin,
  Store,
  Pencil,
  Trash2,
  CheckCircle2,
  Receipt,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Transaction } from '../types';
import { formatRupiah, formatRupiahRp, formatTanggal, MONTH_NAMES } from '../utils/formatters';
import { exportTransactionsToExcel } from '../utils/excelExport';

interface DashboardViewProps {
  onOpenAddTransaction: () => void;
  onOpenEditTransaction: (tx: Transaction) => void;
  onOpenStruk: (tx: Transaction) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenAddTransaction,
  onOpenEditTransaction,
  onOpenStruk,
}) => {
  const {
    profile,
    transactions,
    accounts,
    deleteTransaction,
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    setActiveTab,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('Semua Akun');
  const [selectedStatus, setSelectedStatus] = useState('Semua Status');
  const [deleteConfirmTx, setDeleteConfirmTx] = useState<Transaction | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Available Years
  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = 2024; y <= 2030; y++) {
      list.push(y);
    }
    return list;
  }, []);

  // Filter by Month and Year
  const monthlyTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (!tx.tanggal) return false;
      const parts = tx.tanggal.split('-');
      if (parts.length !== 3) return false;
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      return y === selectedYear && m === selectedMonth;
    });
  }, [transactions, selectedYear, selectedMonth]);

  // Statistics KPI
  const stats = useMemo(() => {
    let totalBayar = 0;
    let totalLaba = 0;
    let belumBayarCount = 0;
    let belumBayarTotal = 0;

    monthlyTransactions.forEach((tx) => {
      totalBayar += tx.bayar || 0;
      totalLaba += tx.laba || 0;
      if (tx.status === 'Belum Bayar') {
        belumBayarCount += 1;
        belumBayarTotal += tx.bayar || 0;
      }
    });

    return {
      totalTx: monthlyTransactions.length,
      totalBayar,
      totalLaba,
      belumBayarCount,
      belumBayarTotal,
    };
  }, [monthlyTransactions]);

  // Filtered by Search, Account, Status
  const filteredTransactions = useMemo(() => {
    return monthlyTransactions.filter((tx) => {
      const matchSearch =
        searchQuery.trim() === '' ||
        tx.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.jenisTransaksi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.akun.toLowerCase().includes(searchQuery.toLowerCase());

      const matchAccount =
        selectedAccount === 'Semua Akun' || tx.akun === selectedAccount;

      const matchStatus =
        selectedStatus === 'Semua Status' || tx.status === selectedStatus;

      return matchSearch && matchAccount && matchStatus;
    });
  }, [monthlyTransactions, searchQuery, selectedAccount, selectedStatus]);

  const handleExportExcel = () => {
    exportTransactionsToExcel(
      filteredTransactions,
      MONTH_NAMES[selectedMonth],
      selectedYear,
      profile.namaMitra
    );
  };

  const handleDelete = async () => {
    if (!deleteConfirmTx) return;
    const target = deleteConfirmTx;
    setDeleteConfirmTx(null);
    try {
      await deleteTransaction(target.id);
      setToastMessage(`Transaksi ${target.jenisTransaksi} untuk ${target.nama} berhasil dihapus.`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-xl animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-400 hover:text-white text-xs ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. TOP HEADER BRAND CARD */}
      <div
        id="top-header-brand-card"
        className="bg-[#0E1526] border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        {/* Left Side: Avatar & Mitra Details */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center font-black text-white text-xl sm:text-2xl shadow-lg shadow-indigo-600/30 overflow-hidden shrink-0 border border-indigo-400/20">
            {profile.logoUrl ? (
              <img src={profile.logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span>{profile.inisialLogo || 'GA'}</span>
            )}
          </div>
          <div>
            <div className="text-[10px] sm:text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
              PEMBUKUAN TRANSAKSI MITRA
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight uppercase mt-0.5">
              {profile.namaMitra || 'GORDI ARAFAH'}
            </h1>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-400 mt-1 font-medium">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{profile.alamat || 'Lubuk Landai Sungai Lilin'}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{profile.jenisUsaha || 'Jasa Transfer dan Pulsa'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Year Dropdown & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 self-start lg:self-center">
          {/* Year Dropdown */}
          <div className="relative">
            <select
              id="select-year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="appearance-none bg-[#090E1A] text-white text-xs sm:text-sm font-bold pl-4 pr-8 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-md"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Unduh Excel Button */}
          <button
            id="btn-export-excel"
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl bg-[#090E1A] hover:bg-[#141E33] text-white font-bold text-xs sm:text-sm border border-slate-800 shadow-md transition-all cursor-pointer"
            title="Download Laporan Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Unduh Excel</span>
          </button>

          {/* + Tambah Transaksi Button */}
          <button
            id="btn-add-transaction"
            onClick={onOpenAddTransaction}
            className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Transaksi</span>
          </button>
        </div>
      </div>

      {/* 2. MONTH SELECTOR TABS */}
      <div className="w-full overflow-x-auto pb-1 no-scrollbar">
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 sm:gap-2 min-w-[720px] sm:min-w-0">
          {MONTH_NAMES.map((name, idx) => {
            const isActive = selectedMonth === idx;
            return (
              <button
                key={name}
                id={`month-tab-${idx}`}
                onClick={() => setSelectedMonth(idx)}
                className={`py-2 sm:py-2.5 px-2 rounded-xl text-xs sm:text-sm font-semibold transition-all text-center cursor-pointer ${
                  isActive
                    ? 'bg-[#4F46E5] text-white font-bold shadow-[0_0_20px_rgba(79,70,229,0.55)] border border-indigo-400/50'
                    : 'bg-[#0E1526] hover:bg-[#141E33] border border-slate-800 text-slate-300'
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. FOUR METRIC SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: UANG KELUAR */}
        <div
          id="stat-card-uang-keluar"
          className="bg-[#0E1526] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">
              UANG KELUAR
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-950/40 border border-rose-800/40 flex items-center justify-center text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3.5">
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {formatRupiahRp(stats.totalBayar)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Total nominal bayar keluar
            </p>
          </div>
        </div>

        {/* Card 2: LABA JUAL */}
        <div
          id="stat-card-laba-jual"
          className="bg-[#0E1526] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">
              LABA JUAL
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3.5">
            <div className="text-2xl sm:text-3xl font-black text-[#10B981] tracking-tight">
              {formatRupiahRp(stats.totalLaba)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Keuntungan bersih mitra
            </p>
          </div>
        </div>

        {/* Card 3: JUMLAH TRANSAKSI */}
        <div
          id="stat-card-jumlah-transaksi"
          className="bg-[#0E1526] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">
              JUMLAH TRANSAKSI
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-950/40 border border-indigo-800/40 flex items-center justify-center text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3.5">
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {stats.totalTx}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Total transaksi {MONTH_NAMES[selectedMonth]} {selectedYear}
            </p>
          </div>
        </div>

        {/* Card 4: BELUM BAYAR */}
        <div
          id="stat-card-belum-bayar"
          onClick={() => setActiveTab('belum_bayar')}
          className="bg-[#0E1526] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between cursor-pointer hover:border-amber-500/40 transition-all"
          title="Buka rincian di halaman Belum Bayar"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">
              BELUM BAYAR
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-950/40 border border-amber-800/40 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3.5">
            <div className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight flex items-center gap-2">
              <span>{stats.belumBayarCount}</span>
              <span className="text-slate-600 text-lg">•</span>
              <span>{formatRupiahRp(stats.belumBayarTotal)}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {stats.belumBayarCount} transaksi tertunda
            </p>
          </div>
        </div>
      </div>

      {/* 4. INTEGRATED SEARCH & FILTER BAR */}
      <div
        id="dashboard-search-filter-bar"
        className="bg-[#0E1526] border border-slate-800 rounded-2xl p-2.5 flex flex-col md:flex-row items-stretch md:items-center gap-2.5 shadow-xl"
      >
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="input-search-transactions"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama pelanggan..."
            className="w-full bg-[#0A0E1A] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Filter Akun */}
        <div className="relative">
          <select
            id="filter-select-account"
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="appearance-none w-full md:w-auto bg-[#0A0E1A] border border-slate-800 text-slate-200 text-xs sm:text-sm font-semibold pl-4 pr-9 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="Semua Akun">Semua Akun</option>
            {accounts.map((acc) => (
              <option key={acc} value={acc}>
                {acc}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Filter Status */}
        <div className="relative">
          <select
            id="filter-select-status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="appearance-none w-full md:w-auto bg-[#0A0E1A] border border-slate-800 text-slate-200 text-xs sm:text-sm font-semibold pl-4 pr-9 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="Semua Status">Semua Status</option>
            <option value="Lunas">Lunas</option>
            <option value="Belum Bayar">Belum Bayar</option>
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* 5. TRANSACTIONS DATA TABLE */}
      <div
        id="transactions-table-card"
        className="bg-[#0E1526] border border-slate-800 rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-200">
            <thead className="bg-[#090E1A] text-slate-400 font-bold uppercase text-[11px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 text-center w-12">#</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Tanggal</th>
                <th className="py-3.5 px-4">Nama Pelanggan</th>
                <th className="py-3.5 px-4">Akun / Sumber</th>
                <th className="py-3.5 px-4">Jenis Transaksi</th>
                <th className="py-3.5 px-4 text-right">Bayar (Rp)</th>
                <th className="py-3.5 px-4 text-right">Laba (Rp)</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">Tgl Bayar</th>
                <th className="py-3.5 px-4 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-2">
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-500">
                        <Receipt className="w-6 h-6" />
                      </div>
                      <div className="font-bold text-white text-sm">Tidak ada transaksi</div>
                      <p className="text-xs text-slate-400">
                        Belum ada data transaksi di periode atau filter yang dipilih.
                      </p>
                      <button
                        onClick={onOpenAddTransaction}
                        className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold text-xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Tambah Transaksi
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx, idx) => {
                  const isLunas = tx.status === 'Lunas';
                  return (
                    <tr
                      key={tx.id}
                      id={`tx-row-${tx.id}`}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-xs">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-white">
                          {formatTanggal(tx.tanggal)}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {tx.hari || '-'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white uppercase tracking-tight">
                        {tx.nama}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[#090E1A] text-slate-300 font-medium text-xs border border-slate-700/60">
                          {tx.akun}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-300">
                        {tx.jenisTransaksi}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-white font-mono">
                        {formatRupiah(tx.bayar)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-400 font-mono">
                        {formatRupiah(tx.laba)}
                      </td>
                      {/* STATUS: Tampilan murni, fungsi pelunasan hanya ada di menu BELUM BAYAR */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap select-none">
                        {isLunas ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            Lunas
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Belum
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-400 whitespace-nowrap text-xs font-mono">
                        {tx.tanggalBayar ? formatTanggal(tx.tanggalBayar) : '-'}
                      </td>
                      {/* AKSI: Warna icon seragam sesuai gambar referensi */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            id={`btn-struk-${tx.id}`}
                            onClick={() => onOpenStruk(tx)}
                            className="text-slate-400 hover:text-white transition-colors cursor-pointer p-0.5"
                            title="Struk Kasir"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                          <button
                            id={`btn-edit-${tx.id}`}
                            onClick={() => onOpenEditTransaction(tx)}
                            className="text-slate-400 hover:text-white transition-colors cursor-pointer p-0.5"
                            title="Edit Transaksi"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            id={`btn-delete-${tx.id}`}
                            onClick={() => setDeleteConfirmTx(tx)}
                            className="text-slate-400 hover:text-white transition-colors cursor-pointer p-0.5"
                            title="Hapus Transaksi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0E1526] border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Hapus Transaksi Ini?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Data transaksi{' '}
                <strong className="text-white">{deleteConfirmTx.jenisTransaksi}</strong> untuk{' '}
                <strong className="text-white">{deleteConfirmTx.nama}</strong> ({formatRupiah(deleteConfirmTx.bayar)}) akan dihapus secara permanen.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDeleteConfirmTx(null)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                id="btn-confirm-delete-tx"
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-lg shadow-rose-950/40 cursor-pointer"
              >
                Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
