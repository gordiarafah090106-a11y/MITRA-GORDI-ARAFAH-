import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Plus,
  User,
  Eye,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Invoice, Transaction } from '../types';
import { formatRupiah, formatTanggal, terbilangRupiah } from '../utils/formatters';

interface InvoiceViewProps {
  onOpenCreateInvoice?: () => void;
  onPreviewInvoice?: (inv: Invoice) => void;
}

interface SyncedInvoiceItem {
  id: string;
  nomorInvoice: string;
  tanggal: string;
  customer: string;
  whatsapp: string;
  itemsDescription: string;
  itemsCount: number;
  total: number;
  status: 'Belum' | 'Lunas';
  rawInvoice?: Invoice;
  rawTransactions?: Transaction[];
}

export const InvoiceView: React.FC<InvoiceViewProps> = ({
  onOpenCreateInvoice,
  onPreviewInvoice,
}) => {
  const { invoices, transactions, contacts } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Transaksi yang berstatus Belum Bayar (sumber kebenaran dari fitur BELUM BAYAR)
  const unpaidTransactions = useMemo(() => {
    return transactions.filter((t) => t.status === 'Belum Bayar');
  }, [transactions]);

  // Sinkronisasi otomatis semua nama yang berhutang dengan data Belum Bayar
  const syncedInvoices = useMemo(() => {
    const debtorMap = new Map<
      string,
      {
        customer: string;
        transactions: Transaction[];
        total: number;
        latestDate: string;
      }
    >();

    // Kelompokkan semua transaksi belum bayar berdasarkan nama pelanggan
    unpaidTransactions.forEach((tx) => {
      const key = tx.nama.trim().toUpperCase();
      const existing = debtorMap.get(key);
      if (existing) {
        existing.transactions.push(tx);
        existing.total += tx.bayar || 0;
        if (tx.tanggal && tx.tanggal > existing.latestDate) {
          existing.latestDate = tx.tanggal;
        }
      } else {
        debtorMap.set(key, {
          customer: tx.nama.trim().toUpperCase(),
          transactions: [tx],
          total: tx.bayar || 0,
          latestDate: tx.tanggal || new Date().toISOString().split('T')[0],
        });
      }
    });

    const result: SyncedInvoiceItem[] = [];
    let seq = 1;

    // Tambahkan setiap pelanggan yang berhutang sebagai baris invoice
    debtorMap.forEach((debtor) => {
      // Cari invoice yang cocok jika ada di state invoices
      const existingInv = invoices.find(
        (i) => i.customer.trim().toUpperCase() === debtor.customer
      );

      // Cari kontak WA jika tersedia
      const contact = contacts.find(
        (c) => c.nama.trim().toUpperCase() === debtor.customer
      );

      const itemsDesc = Array.from(
        new Set(debtor.transactions.map((t) => t.jenisTransaksi))
      ).join(', ');

      const invNumber =
        existingInv?.nomorInvoice ||
        `INV-092026-${String(seq).padStart(3, '0')}`;

      result.push({
        id: existingInv?.id || `synced_inv_${debtor.customer}`,
        nomorInvoice: invNumber,
        tanggal: debtor.latestDate,
        customer: debtor.customer,
        whatsapp: existingInv?.whatsapp || contact?.whatsapp || '-',
        itemsDescription: itemsDesc || 'Transaksi Mitra',
        itemsCount: debtor.transactions.length,
        total: debtor.total,
        status: 'Belum',
        rawInvoice: existingInv,
        rawTransactions: debtor.transactions,
      });
      seq++;
    });

    // Tambahkan invoice manual berstatus Belum jika belum ada di daftar
    invoices.forEach((inv) => {
      if (inv.status === 'Belum') {
        const alreadyIn = result.some(
          (r) => r.customer.trim().toUpperCase() === inv.customer.trim().toUpperCase()
        );
        if (!alreadyIn) {
          result.push({
            id: inv.id,
            nomorInvoice: inv.nomorInvoice,
            tanggal: inv.tanggal,
            customer: inv.customer,
            whatsapp: inv.whatsapp || '-',
            itemsDescription: inv.items.map((it) => it.jenisTransaksi).join(', ') || 'Tagihan Invoice',
            itemsCount: inv.items.length,
            total: inv.total,
            status: 'Belum',
            rawInvoice: inv,
          });
        }
      }
    });

    // Tambahkan invoice berstatus Lunas untuk kelengkapan riwayat (jika ada)
    invoices.forEach((inv) => {
      if (inv.status === 'Lunas') {
        const alreadyIn = result.some(
          (r) =>
            r.customer.trim().toUpperCase() === inv.customer.trim().toUpperCase() &&
            r.nomorInvoice === inv.nomorInvoice
        );
        if (!alreadyIn) {
          result.push({
            id: inv.id,
            nomorInvoice: inv.nomorInvoice,
            tanggal: inv.tanggal,
            customer: inv.customer,
            whatsapp: inv.whatsapp || '-',
            itemsDescription: inv.items.map((it) => it.jenisTransaksi).join(', '),
            itemsCount: inv.items.length,
            total: inv.total,
            status: 'Lunas',
            rawInvoice: inv,
          });
        }
      }
    });

    return result;
  }, [unpaidTransactions, invoices, contacts]);

  // Total Tagihan dari semua invoice yang belum lunas
  const totalTagihanBelumBayar = useMemo(() => {
    return syncedInvoices
      .filter((inv) => inv.status !== 'Lunas')
      .reduce((sum, inv) => sum + inv.total, 0);
  }, [syncedInvoices]);

  const unpaidCount = useMemo(() => {
    return syncedInvoices.filter((i) => i.status !== 'Lunas').length;
  }, [syncedInvoices]);

  // Filter pencarian dan status
  const filteredInvoices = useMemo(() => {
    return syncedInvoices.filter((inv) => {
      const matchSearch =
        searchQuery.trim() === '' ||
        inv.nomorInvoice.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inv.whatsapp && inv.whatsapp.includes(searchQuery)) ||
        inv.itemsDescription.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus =
        filterStatus === 'all' ||
        (filterStatus === 'Belum' && inv.status !== 'Lunas') ||
        (filterStatus === 'Lunas' && inv.status === 'Lunas');

      return matchSearch && matchStatus;
    });
  }, [syncedInvoices, searchQuery, filterStatus]);

  const handleOpenPreview = (item: SyncedInvoiceItem) => {
    if (!onPreviewInvoice) return;

    // Jika item status lunas dan punya rawInvoice lengkap, gunakan rawInvoice
    if (item.status === 'Lunas' && item.rawInvoice) {
      onPreviewInvoice(item.rawInvoice);
      return;
    }

    // Bangun invoice dari transaksi nyata di Belum Bayar agar 100% tersinkron
    const txItems = (item.rawTransactions || []).map((t, idx) => ({
      id: `it_${t.id || idx}`,
      jenisTransaksi: `${t.jenisTransaksi}`,
      qty: 1,
      harga: t.bayar || 0,
      total: t.bayar || 0,
    }));

    const finalInvoice: Invoice = {
      id: item.rawInvoice?.id || item.id,
      nomorInvoice: item.rawInvoice?.nomorInvoice || item.nomorInvoice,
      tanggal: item.rawInvoice?.tanggal || item.tanggal,
      customer: item.customer,
      whatsapp: item.whatsapp === '-' ? (item.rawInvoice?.whatsapp || '') : item.whatsapp,
      metodePembayaran: item.rawInvoice?.metodePembayaran || 'Tunai / Cash',
      items:
        txItems.length > 0
          ? txItems
          : item.rawInvoice?.items && item.rawInvoice.items.length > 0
          ? item.rawInvoice.items
          : [
              {
                id: '1',
                jenisTransaksi: item.itemsDescription,
                qty: 1,
                harga: item.total,
                total: item.total,
              },
            ],
      subtotal: item.total,
      diskon: 0,
      total: item.total,
      terbilang: terbilangRupiah(item.total),
      catatan: item.rawInvoice?.catatan || '',
      status: item.status,
      createdAt: item.rawInvoice?.createdAt || Date.now(),
    };

    onPreviewInvoice(finalInvoice);
  };

  return (
    <div className="space-y-6 pb-20 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#9EA7FC] uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>DOKUMEN PENAGIHAN</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Invoice Tagihan
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Daftar faktur tagihan tersinkronisasi otomatis dengan seluruh nama yang berhutang di fitur Belum Bayar.
          </p>
        </div>

        {/* Tombol Buat Invoice Baru */}
        {onOpenCreateInvoice && (
          <button
            id="btn-buka-buat-invoice"
            onClick={onOpenCreateInvoice}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#5244E6] hover:bg-[#4336D4] text-white font-bold text-xs shadow-xl shadow-indigo-600/30 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Invoice Baru</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          id="input-search-invoices"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nomor invoice, nama pelanggan, WA, rincian..."
          className="w-full bg-[#0E1526] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#9EA7FC]"
        />
      </div>

      {/* Invoices Table Card */}
      <div
        id="invoices-table-card"
        className="bg-[#0E1526] border border-slate-800 rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-200">
            <thead className="bg-[#090E1A] text-slate-400 font-bold uppercase text-[11px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 text-center w-12">#</th>
                <th className="py-3.5 px-4 whitespace-nowrap">No. Invoice</th>
                <th className="py-3.5 px-4">Tanggal</th>
                <th className="py-3.5 px-4">Nama Pelanggan</th>
                <th className="py-3.5 px-4">Kontak WA</th>
                <th className="py-3.5 px-4">Rincian Tagihan</th>
                <th className="py-3.5 px-4 text-right">Total Tagihan</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center w-28">Lihat Hasil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-2">
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-500">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="font-bold text-white text-sm">Tidak ada tagihan</div>
                      <p className="text-xs text-slate-400">
                        Tidak ada invoice atau pelanggan berhutang yang sesuai dengan kriteria pencarian.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv, idx) => {
                  const isLunas = inv.status === 'Lunas';
                  return (
                    <tr
                      key={inv.id}
                      id={`invoice-row-${inv.id}`}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      onClick={() => handleOpenPreview(inv)}
                    >
                      <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-xs">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-[#9EA7FC] font-mono text-xs tracking-wider group-hover:text-white transition-colors">
                          {inv.nomorInvoice}
                        </span>
                        <div className="text-[11px] text-slate-400">
                          {inv.itemsCount} Transaksi
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-300 font-medium">
                        {formatTanggal(inv.tanggal)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white uppercase tracking-tight">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#9EA7FC] shrink-0" />
                          <span>{inv.customer}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-xs">
                        {inv.whatsapp || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 text-xs max-w-xs truncate">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[#141A2E] text-slate-300 border border-[#434D85]/40">
                          {inv.itemsDescription}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-white font-mono text-sm">
                        {formatRupiah(inv.total)}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isLunas ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            Lunas
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Belum Lunas
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          id={`btn-view-invoice-${inv.id}`}
                          onClick={() => handleOpenPreview(inv)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#181D38] hover:bg-[#222A50] border border-[#434D85] text-[#9EA7FC] hover:text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Hasil</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
