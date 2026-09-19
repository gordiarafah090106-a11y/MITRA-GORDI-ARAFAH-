import React, { useState, useMemo } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Receipt,
  User,
  ChevronDown,
  CheckCheck,
  FileText,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Transaction } from '../types';
import { formatRupiah, formatTanggal } from '../utils/formatters';

interface BelumBayarViewProps {
  onOpenStruk: (tx: Transaction) => void;
  onCreateInvoiceForCustomer?: (customerName: string) => void;
}

export const BelumBayarView: React.FC<BelumBayarViewProps> = ({
  onOpenStruk,
  onCreateInvoiceForCustomer,
}) => {
  const { transactions, markTransactionLunas, markCustomerTransactionsLunas } = useApp();

  const [filterCustomer, setFilterCustomer] = useState('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [bulkLunasTarget, setBulkLunasTarget] = useState<{
    customerName: string;
    txList: Transaction[];
  } | null>(null);

  // Filter only unpaid transactions
  const unpaidTransactions = useMemo(() => {
    return transactions.filter((t) => t.status === 'Belum Bayar');
  }, [transactions]);

  // Group by customer
  const customerSummary = useMemo(() => {
    const map = new Map<
      string,
      { totalBayar: number; count: number; transactions: Transaction[] }
    >();

    unpaidTransactions.forEach((tx) => {
      const current = map.get(tx.nama) || {
        totalBayar: 0,
        count: 0,
        transactions: [],
      };
      current.totalBayar += tx.bayar || 0;
      current.count += 1;
      current.transactions.push(tx);
      map.set(tx.nama, current);
    });

    return Array.from(map.entries())
      .map(([nama, data]) => ({
        nama,
        totalBayar: data.totalBayar,
        count: data.count,
        transactions: data.transactions,
      }))
      .sort((a, b) => b.totalBayar - a.totalBayar);
  }, [unpaidTransactions]);

  const totalPiutang = useMemo(() => {
    return unpaidTransactions.reduce((sum, tx) => sum + (tx.bayar || 0), 0);
  }, [unpaidTransactions]);

  const selectedCustomerData = useMemo(() => {
    if (filterCustomer === 'all') return null;
    return customerSummary.find((c) => c.nama === filterCustomer) || null;
  }, [customerSummary, filterCustomer]);

  const displayedTransactions = useMemo(() => {
    if (filterCustomer === 'all') return unpaidTransactions;
    return unpaidTransactions.filter((tx) => tx.nama === filterCustomer);
  }, [unpaidTransactions, filterCustomer]);

  const handleSingleLunas = async (tx: Transaction) => {
    try {
      await markTransactionLunas(tx.id);
      setToastMessage(
        `Transaksi ${tx.nama} (${formatRupiah(tx.bayar)}) berhasil dilunasi & tersinkron ke Dashboard!`
      );
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmBulkLunas = async () => {
    if (!bulkLunasTarget) return;
    const { customerName, txList } = bulkLunasTarget;
    setBulkLunasTarget(null);

    try {
      if (markCustomerTransactionsLunas) {
        await markCustomerTransactionsLunas(customerName);
      } else {
        for (const tx of txList) {
          await markTransactionLunas(tx.id);
        }
      }
      setToastMessage(
        `Semua ${txList.length} transaksi ${customerName} berhasil dilunasi & tersinkron ke Dashboard dan Invoice!`
      );
      setTimeout(() => setToastMessage(null), 4000);
      setFilterCustomer('all');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-5 pb-20">
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#9EA7FC] uppercase tracking-wider mb-1">
            <AlertCircle className="w-4 h-4" />
            <span>PIUTANG & TAGIHAN</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Rekapan Belum Bayar
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Data terintegrasi otomatis dengan Dashboard dan modul Invoice.
          </p>
        </div>

        {/* Global Summary Box: TOTAL PIUTANG */}
        <div
          id="piutang-summary-box"
          className="bg-[#0E1526] border border-[#434D85]/60 rounded-2xl p-4 sm:p-5 shadow-xl min-w-[240px]"
        >
          <div className="text-xs font-bold text-[#9EA7FC] uppercase tracking-wider">
            TOTAL PIUTANG
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            {formatRupiah(totalPiutang)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {customerSummary.length} Pelanggan • {unpaidTransactions.length} Transaksi Belum Lunas
          </div>
        </div>
      </div>

      {/* Pilihan Fitur / Filter Dropdown List Pelanggan (Menggantikan Ringkasan Per Pelanggan) */}
      <div
        id="pelanggan-dropdown-card"
        className="bg-[#0E1526] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3.5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label
            htmlFor="dropdown-select-pelanggan"
            className="text-xs font-bold text-slate-300 uppercase tracking-wider"
          >
            PILIH PELANGGAN
          </label>
          {filterCustomer !== 'all' && (
            <button
              onClick={() => setFilterCustomer('all')}
              className="text-xs text-[#9EA7FC] hover:text-white font-semibold self-start sm:self-auto cursor-pointer"
            >
              ← Tampilkan Semua Pelanggan
            </button>
          )}
        </div>

        {/* Dropdown Select with 'agak memudar tapi terang' palette */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9EA7FC]">
            <User className="w-4 h-4" />
          </div>
          <select
            id="dropdown-select-pelanggan"
            value={filterCustomer}
            onChange={(e) => setFilterCustomer(e.target.value)}
            className="appearance-none w-full bg-[#181D38] text-[#C7D2FE] text-xs sm:text-sm font-bold pl-10 pr-10 py-3 rounded-xl border border-[#434D85] focus:outline-none focus:border-[#9EA7FC] focus:ring-1 focus:ring-[#9EA7FC] shadow-[0_0_20px_rgba(67,77,133,0.25)] cursor-pointer transition-all"
          >
            <option value="all" className="bg-[#0E1526] text-white">
              Semua Pelanggan ({customerSummary.length} Pelanggan • {unpaidTransactions.length} Transaksi — Total: {formatRupiah(totalPiutang)})
            </option>
            {customerSummary.map((c) => (
              <option key={c.nama} value={c.nama} className="bg-[#0E1526] text-white">
                {c.nama} — {c.count} Transaksi ({formatRupiah(c.totalBayar)})
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#9EA7FC]">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Header Rincian Transaksi */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Rincian Transaksi Belum Bayar ({displayedTransactions.length})
        </div>
      </div>

      {/* Detailed Table */}
      <div
        id="piutang-table-card"
        className="bg-[#0E1526] border border-slate-800 rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-200">
            <thead className="bg-[#090E1A] text-slate-400 font-bold uppercase text-[11px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 text-center w-12">#</th>
                <th className="py-3.5 px-4">Tanggal</th>
                <th className="py-3.5 px-4">Nama Pelanggan</th>
                <th className="py-3.5 px-4">Jenis Transaksi</th>
                <th className="py-3.5 px-4">Akun</th>
                <th className="py-3.5 px-4 text-right">Nominal (Rp)</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi Pelunasan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {displayedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-2">
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div className="font-bold text-white text-sm">Semua Transaksi Lunas!</div>
                      <p className="text-xs text-slate-400">
                        Tidak ada piutang atau tagihan yang tertunggak saat ini.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedTransactions.map((tx, idx) => (
                  <tr
                    key={tx.id}
                    id={`piutang-row-${tx.id}`}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-xs">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-white">
                        {formatTanggal(tx.tanggal)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {tx.hari || '-'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white uppercase tracking-tight">
                      {tx.nama}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-300">
                      {tx.jenisTransaksi}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-xs">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[#090E1A] text-slate-300 font-medium text-xs border border-slate-700/60">
                        {tx.akun}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-white font-mono text-sm">
                      {formatRupiah(tx.bayar)}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Belum
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2.5">
                        <button
                          id={`btn-piutang-struk-${tx.id}`}
                          onClick={() => onOpenStruk(tx)}
                          className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
                          title="Lihat Struk"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                        <button
                          id={`btn-piutang-lunas-${tx.id}`}
                          onClick={() => handleSingleLunas(tx)}
                          className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950/40 transition-all cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Tandai Lunas</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Lunas Confirm Modal */}
      {bulkLunasTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0E1526] border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Lunaskan Semua Transaksi?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Apakah Anda yakin ingin menandai{' '}
                <strong className="text-white">{bulkLunasTarget.txList.length} transaksi</strong> atas nama{' '}
                <strong className="text-white">{bulkLunasTarget.customerName}</strong> sebagai{' '}
                <span className="text-emerald-400 font-bold">LUNAS</span>? Status transaksi di Dashboard dan modul Invoice akan otomatis diperbarui.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setBulkLunasTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                id="btn-confirm-bulk-lunas"
                onClick={handleConfirmBulkLunas}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg shadow-emerald-950/40 cursor-pointer"
              >
                Ya, Lunaskan Semua
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
