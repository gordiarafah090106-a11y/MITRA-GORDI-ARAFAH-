import React, { useRef, useState } from 'react';
import {
  X,
  Printer,
  Download,
  Share2,
  Loader2,
  Phone,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Invoice } from '../types';
import { formatRupiah, formatTanggal } from '../utils/formatters';
import {
  shareImageToWhatsApp,
  captureElementAsPngDataUrl,
} from '../utils/whatsappShare';

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
}

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  isOpen,
  onClose,
  invoice,
}) => {
  const { profile, deleteInvoice } = useApp();
  const printRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareStatusMsg, setShareStatusMsg] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<'Belum' | 'Lunas'>(invoice?.status || 'Belum');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteRelatedTx, setDeleteRelatedTx] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  React.useEffect(() => {
    if (invoice) {
      setCurrentStatus(invoice.status);
      setShowDeleteConfirm(false);
    }
  }, [invoice]);

  if (!isOpen || !invoice) return null;

  const isLunas = currentStatus === 'Lunas';

  const handleDeleteInvoice = async () => {
    setIsDeleting(true);
    try {
      await deleteInvoice(invoice.id, {
        nomorInvoice: invoice.nomorInvoice,
        customerName: invoice.customer,
        deleteRelatedTransactions: deleteRelatedTx,
      });
      setShowDeleteConfirm(false);
      onClose();
    } catch (err) {
      console.error('Error deleting invoice from modal:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!printRef.current || isDownloading) return;
    setIsDownloading(true);
    try {
      const dataUrl = await captureElementAsPngDataUrl(printRef.current, {
        backgroundColor: '#090E1A',
        targetWidth: 560,
      });
      const link = document.createElement('a');
      link.download = `${invoice.nomorInvoice}_${invoice.customer}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = async () => {
    if (!printRef.current || isSharing) return;
    setIsSharing(true);
    setShareStatusMsg('Menyiapkan gambar invoice...');

    try {
      await shareImageToWhatsApp({
        element: printRef.current,
        filename: `${invoice.nomorInvoice}_${invoice.customer}`,
        phone: invoice.whatsapp,
        backgroundColor: '#090E1A',
        targetWidth: 560,
        onProgress: (status) => setShareStatusMsg(status),
      });
    } catch (err) {
      console.error('Error saat share WhatsApp:', err);
    } finally {
      setTimeout(() => {
        setIsSharing(false);
        setShareStatusMsg(null);
      }, 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-[#090E1A] border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-4 flex flex-col max-h-[95vh]">
        {/* Top Control Bar */}
        <div className="p-3 sm:p-4 bg-[#0B1120] border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-xs sm:text-sm">
              Hasil Invoice
            </span>
            <span className="text-[11px] font-mono font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-lg">
              {invoice.nomorInvoice}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              id="btn-preview-print"
              onClick={handlePrint}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak</span>
            </button>

            <button
              id="btn-preview-delete-modal"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-bold text-xs border border-rose-500/30 cursor-pointer"
              title="Hapus Invoice"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hapus</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Konfirmasi Hapus Invoice di dalam Modal */}
        {showDeleteConfirm && (
          <div className="p-3.5 bg-rose-950/40 border-b border-rose-500/30 space-y-2.5 animate-fade-in text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-300 font-bold">
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Konfirmasi Hapus Invoice {invoice.nomorInvoice}?</span>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Batal
              </button>
            </div>
            <label className="flex items-start gap-2 text-[11px] text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={deleteRelatedTx}
                onChange={(e) => setDeleteRelatedTx(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-rose-500 bg-slate-900 cursor-pointer"
              />
              <span>Hapus juga transaksi tagihan pelanggan ini di menu Belum Bayar</span>
            </label>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteInvoice}
                disabled={isDeleting}
                className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold disabled:opacity-50 flex items-center gap-1 shadow"
              >
                <Trash2 className="w-3 h-3" />
                <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Invoice Printable Viewport (Dark Theme matching Image 2) */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 bg-[#050811]">
          <div
            ref={printRef}
            id="printable-invoice-canvas"
            className="bg-[#0A101E] text-slate-100 rounded-2xl p-5 sm:p-7 border border-[#1E293B] shadow-2xl max-w-lg mx-auto space-y-4 select-text font-sans text-xs relative"
          >
            {/* Top Pill Badge (Centered) */}
            <div className="flex justify-center -mt-2">
              <div className="bg-[#2563EB] text-white font-black text-[11px] uppercase px-5 py-1 rounded-full tracking-wider shadow-lg">
                JASA TRANSFER DAN PULSA
              </div>
            </div>

            {/* Header Section */}
            <div className="flex items-center gap-3.5 pt-2">
              <div className="w-14 h-14 rounded-2xl bg-[#2563EB] flex items-center justify-center font-black text-white text-xl shadow-lg shrink-0 overflow-hidden">
                {profile.logoUrl ? (
                  <img
                    src={profile.logoUrl}
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{profile.inisialLogo || 'GA'}</span>
                )}
              </div>

              <div>
                <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  PEMBUKUAN MITRA
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
                  {profile.namaMitra || 'GORDI ARAFAH'}
                </h1>
                <p className="text-[11px] sm:text-xs font-semibold italic text-[#60A5FA] mt-0.5">
                  Murah - Mudah - Cepat - Praktis
                </p>
              </div>
            </div>

            {/* Divider Line */}
            <div className="border-b border-slate-800" />

            {/* Section: INVOICE TRANSACTION */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm sm:text-base font-black text-white tracking-wider uppercase leading-tight">
                    INVOICE
                  </div>
                  <div className="text-sm sm:text-base font-black text-white tracking-wider uppercase leading-tight">
                    TRANSACTION
                  </div>
                </div>

                <div>
                  {isLunas ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/50 bg-emerald-500/15 text-emerald-400 uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span>LUNAS</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/50 bg-amber-500/15 text-amber-400 uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      <span>BELUM LUNAS</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Info Grid (No. Invoice, Nama Customer, Tanggal, No WhatsApp) */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                <div className="flex items-start">
                  <span className="w-24 text-slate-400 shrink-0">No. Invoice</span>
                  <span className="text-slate-400 mr-1.5">:</span>
                  <span className="font-bold text-white font-mono">
                    {invoice.nomorInvoice}
                  </span>
                </div>

                <div className="flex items-start">
                  <span className="w-20 text-slate-400 shrink-0">Tanggal</span>
                  <span className="text-slate-400 mr-1.5">:</span>
                  <span className="text-slate-200">
                    {formatTanggal(invoice.tanggal)}
                  </span>
                </div>

                <div className="flex items-start">
                  <span className="w-24 text-slate-400 shrink-0">Nama Customer</span>
                  <span className="text-slate-400 mr-1.5">:</span>
                  <span className="font-bold text-white uppercase break-all">
                    {invoice.customer}
                  </span>
                </div>

                <div className="flex items-start">
                  <span className="w-20 text-slate-400 shrink-0">No WhatsApp</span>
                  <span className="text-slate-400 mr-1.5">:</span>
                  <span className="text-slate-200 font-mono">
                    {invoice.whatsapp || '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="border-t border-slate-800 pt-2">
              <div className="w-full overflow-visible">
                <table className="w-full text-left text-[11px] sm:text-xs">
                  <thead className="text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 pb-1.5">
                    <tr>
                      <th className="py-1.5 px-1 text-center w-7">NO</th>
                      <th className="py-1.5 px-1.5">TRANSAKSI</th>
                      <th className="py-1.5 px-1 text-center w-10">QTY</th>
                      <th className="py-1.5 px-1.5 text-right whitespace-nowrap">HARGA SATUAN</th>
                      <th className="py-1.5 px-1.5 text-right whitespace-nowrap">JUMLAH</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {invoice.items.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td className="py-2.5 px-1 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-1.5 font-semibold text-white break-words">
                          {item.jenisTransaksi}
                        </td>
                        <td className="py-2.5 px-1 text-center font-mono text-slate-300 whitespace-nowrap">
                          {item.qty}
                        </td>
                        <td className="py-2.5 px-1.5 text-right font-mono text-slate-300 whitespace-nowrap">
                          {formatRupiah(item.harga)}
                        </td>
                        <td className="py-2.5 px-1.5 text-right font-mono font-bold text-white whitespace-nowrap">
                          {formatRupiah(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Subtotal line */}
            <div className="border-t border-slate-800 pt-2 flex items-center justify-between gap-2 text-xs">
              <span className="font-bold uppercase tracking-wider text-slate-300 shrink-0">
                SUBTOTAL
              </span>
              <span className="font-mono font-bold text-white whitespace-nowrap">
                {formatRupiah(invoice.subtotal)}
              </span>
            </div>

            {invoice.diskon > 0 && (
              <div className="flex items-center justify-between gap-2 text-xs text-rose-400">
                <span className="font-bold uppercase tracking-wider shrink-0">
                  DISKON
                </span>
                <span className="font-mono font-bold whitespace-nowrap">
                  -{formatRupiah(invoice.diskon)}
                </span>
              </div>
            )}

            {/* TOTAL line */}
            <div className="flex items-center justify-between gap-2 text-base pt-1">
              <span className="font-black uppercase tracking-wider text-white text-base sm:text-lg shrink-0">
                TOTAL
              </span>
              <span className="font-mono font-black text-xl sm:text-3xl text-[#00E599] whitespace-nowrap">
                {formatRupiah(invoice.total)}
              </span>
            </div>

            {/* Terbilang Box */}
            <div className="p-3 bg-[#070B16] border border-slate-800/80 rounded-xl">
              <div className="text-xs">
                <span className="italic text-slate-400">Terbilang:</span>{' '}
                <span className="font-bold text-white">{invoice.terbilang}</span>
              </div>
            </div>

            {/* METODE PEMBAYARAN */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white uppercase text-[11px] tracking-wider">
                  METODE PEMBAYARAN:
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                  SILAKAN TRANSFER SESUAI TOTAL
                </span>
              </div>

              <div className="p-3.5 bg-[#070B16] border border-slate-800/80 rounded-xl text-xs font-mono text-slate-200 leading-relaxed whitespace-pre-line">
                {profile.metodeTransfer ||
                  `1. Via Tunai / Cash\n2. Via Transfer:\n   A. 553801037985532 (BRI) An Gordi Arafah\n   B. 085189186944 (DANA) An Gordi Arafah`}
              </div>
            </div>

            {invoice.catatan && (
              <div className="p-2.5 bg-[#070B16] border border-slate-800/80 rounded-xl text-[11px] text-slate-300">
                <span className="font-bold text-[#818CF8] block mb-0.5">Catatan:</span>
                {invoice.catatan}
              </div>
            )}

            {/* Footer */}
            <div className="pt-4 border-t border-slate-800 text-center space-y-0.5">
              <div className="font-bold text-white text-xs sm:text-sm">
                Terima kasih atas kepercayaan Anda
              </div>
              <div className="text-[11px] text-slate-400">
                Bersama Mitra Kami
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Action Bar */}
        <div className="p-3 sm:p-4 bg-[#0B1120] border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              Target WA:{' '}
              <strong className="text-white font-mono">
                {invoice.whatsapp || 'Pilih kontak saat share'}
              </strong>
            </span>
            {shareStatusMsg && (
              <span className="text-[#25D366] font-semibold text-[11px] flex items-center gap-1 ml-2 animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" />
                {shareStatusMsg}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              id="btn-bottom-download-png"
              type="button"
              onClick={handleDownloadImage}
              disabled={isDownloading || isSharing}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#141C2E] hover:bg-[#1C263D] border border-slate-700/70 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isDownloading ? 'Menyimpan...' : 'Unduh Gambar'}</span>
            </button>

            <button
              id="btn-bottom-share-wa"
              type="button"
              onClick={handleShareWhatsApp}
              disabled={isSharing}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-black text-xs shadow-lg shadow-emerald-950/40 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSharing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>{shareStatusMsg || 'Membuka WA...'}</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-slate-950" />
                  <span>Kirim Via Whatshapp</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
