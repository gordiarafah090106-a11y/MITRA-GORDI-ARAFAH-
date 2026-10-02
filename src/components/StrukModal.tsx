import React, { useRef, useState, useEffect } from 'react';
import {
  X,
  Printer,
  Copy,
  Download,
  Share2,
  Phone,
  Check,
  Loader2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Transaction } from '../types';
import { formatRupiahRp, formatTanggal } from '../utils/formatters';
import {
  shareImageToWhatsApp,
  captureElementAsPngDataUrl,
} from '../utils/whatsappShare';

interface StrukModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export const StrukModal: React.FC<StrukModalProps> = ({
  isOpen,
  onClose,
  transaction,
}) => {
  const { profile, contacts } = useApp();
  const strukRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharingWA, setIsSharingWA] = useState(false);
  const [shareStatusMsg, setShareStatusMsg] = useState<string | null>(null);
  const [showAdminFee, setShowAdminFee] = useState(false);
  const [phoneTarget, setPhoneTarget] = useState('');
  const [copied, setCopied] = useState(false);

  // Auto-fill WhatsApp dari kontak jika nama customer cocok
  useEffect(() => {
    if (transaction?.nama) {
      const match = contacts.find(
        (c) => c.nama.trim().toUpperCase() === transaction.nama.trim().toUpperCase()
      );
      if (match?.whatsapp) {
        setPhoneTarget(match.whatsapp);
      }
    }
  }, [transaction, contacts]);

  if (!isOpen || !transaction) return null;

  // Format date display like "16 Sep 2026 10.19"
  const formattedDateWithTime = (() => {
    const tgl = formatTanggal(transaction.tanggal);
    // If there's an hour/minute or use default friendly time
    return `${tgl} 10.19`;
  })();

  const adminFee = transaction.laba || 2500;
  const totalAmount = showAdminFee ? transaction.bayar + adminFee : transaction.bayar;
  const strukNumber = `STR-${transaction.id}`;

  const handleDownload = async () => {
    if (!strukRef.current) return;
    setIsDownloading(true);
    try {
      const dataUrl = await captureElementAsPngDataUrl(strukRef.current, {
        backgroundColor: '#ffffff',
        targetWidth: 380,
      });
      const link = document.createElement('a');
      link.download = `Struk_${strukNumber}_${transaction.nama}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStrukPlainText = () => {
    return [
      `================================`,
      `        ${profile.namaMitra.toUpperCase()}        `,
      `   ${profile.alamat || 'Lubuk Landai Sungai Lilin'}   `,
      `        WA: ${profile.noWhatsapp || '085189186944'}        `,
      `   "${profile.tagline || 'Murah - Mudah - Cepat - Praktis'}"   `,
      `--------------------------------`,
      `No. Struk: ${strukNumber}`,
      `Tanggal  : ${formattedDateWithTime}`,
      `Pelanggan: ${transaction.nama.toUpperCase()}`,
      `Akun/Metode: ${transaction.akun}`,
      `--------------------------------`,
      `TRANSAKSI                 TOTAL `,
      `${transaction.jenisTransaksi}`,
      `1 x ${formatRupiahRp(transaction.bayar)}        ${formatRupiahRp(transaction.bayar)}`,
      showAdminFee ? `Biaya Admin             ${formatRupiahRp(adminFee)}` : '',
      `--------------------------------`,
      `TOTAL BAYAR:            ${formatRupiahRp(totalAmount)}`,
      `STATUS:                 ${transaction.status.toUpperCase()}`,
      transaction.tanggalBayar ? `Tgl Lunas:              ${formatTanggal(transaction.tanggalBayar)}` : '',
      `--------------------------------`,
      `Terima kasih telah bertransaksi di Mitra Kami`,
      `Simpan struk ini sebagai bukti pembayaran yang sah.`,
      `================================`,
    ].filter(Boolean).join('\n');
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(getStrukPlainText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleKirimWA = async () => {
    if (!strukRef.current || isSharingWA) return;
    setIsSharingWA(true);
    setShareStatusMsg('Menyiapkan gambar struk...');

    try {
      await shareImageToWhatsApp({
        element: strukRef.current,
        filename: `Struk_${strukNumber}_${transaction.nama}`,
        phone: phoneTarget,
        backgroundColor: '#ffffff',
        targetWidth: 380,
        onProgress: (status) => setShareStatusMsg(status),
      });
    } catch (err) {
      console.error('Error saat kirim WA:', err);
    } finally {
      setTimeout(() => {
        setIsSharingWA(false);
        setShareStatusMsg(null);
      }, 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-[#0B101B] border border-slate-800 rounded-3xl w-full max-w-[420px] shadow-2xl overflow-hidden my-auto flex flex-col">
        {/* Header toolbar */}
        <div className="p-4 sm:p-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="font-bold text-white text-base tracking-tight">
              Struk Transaksi Kasir
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-[#10B981] bg-[#064E3B]/40 border border-[#059669]/40">
              Thermal 58mm
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-bar: Checkbox & status text */}
        <div className="px-5 py-2.5 bg-[#080D17] border-y border-slate-800/80 flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-slate-200 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showAdminFee}
              onChange={(e) => setShowAdminFee(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 cursor-pointer"
            />
            <span className="font-medium">Tampilkan Biaya Admin di Struk</span>
          </label>
          <span className="text-slate-400 text-[11px]">Siap Cetak / Bagikan</span>
        </div>

        {/* Thermal Struk Card Canvas */}
        <div className="p-4 sm:p-6 bg-[#0B101B] flex justify-center">
          <div
            ref={strukRef}
            id="printable-thermal-struk"
            className="w-full bg-white text-slate-900 p-5 rounded-2xl shadow-xl font-mono text-xs select-text border border-slate-200 space-y-3"
          >
            {/* Store Branding Header */}
            <div className="text-center space-y-0.5">
              <div className="font-black text-sm uppercase tracking-wider text-slate-900">
                {profile.namaMitra || 'GORDI  ARAFAH'}
              </div>
              <div className="text-[11px] text-slate-700">
                {profile.alamat || 'Lubuk Landai Sungai Lilin'}
              </div>
              <div className="text-[11px] text-slate-700">
                WA: {profile.noWhatsapp || '085189186944'}
              </div>
              <div className="text-[11px] italic text-slate-600 pt-0.5">
                "{profile.tagline || 'Murah - Mudah - Cepat - Praktis'}"
              </div>
            </div>

            {/* Separator */}
            <div className="border-t border-dashed border-slate-400 my-2" />

            {/* Meta Details */}
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-700">No. Struk:</span>
                <span className="font-black text-slate-900">{strukNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-700">Tanggal:</span>
                <span className="text-slate-800">{formattedDateWithTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-700">Pelanggan:</span>
                <span className="font-black text-slate-900 uppercase">
                  {transaction.nama}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-700">Akun/Metode:</span>
                <span className="text-slate-800">{transaction.akun}</span>
              </div>
            </div>

            {/* Separator */}
            <div className="border-t border-dashed border-slate-400 my-2" />

            {/* Transaction Items */}
            <div>
              <div className="flex justify-between font-black text-[11px] text-slate-900 pb-1">
                <span>TRANSAKSI</span>
                <span>TOTAL</span>
              </div>
              <div className="flex justify-between gap-2 font-bold text-slate-900 text-xs">
                <span className="break-words">{transaction.jenisTransaksi}</span>
                <span className="whitespace-nowrap shrink-0">{formatRupiahRp(transaction.bayar)}</span>
              </div>
              <div className="text-[10px] text-slate-500">
                1 x {formatRupiahRp(transaction.bayar)}
              </div>

              {showAdminFee && (
                <div className="flex justify-between gap-2 text-[11px] text-slate-700 pt-1">
                  <span>Biaya Admin</span>
                  <span className="whitespace-nowrap shrink-0">{formatRupiahRp(adminFee)}</span>
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="border-t border-dashed border-slate-400 my-2" />

            {/* Total and Status */}
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between items-center gap-2">
                <span className="font-black text-slate-900 shrink-0">TOTAL BAYAR:</span>
                <span className="font-black text-sm text-slate-900 whitespace-nowrap shrink-0">
                  {formatRupiahRp(totalAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-black text-slate-800">STATUS:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                    transaction.status === 'Lunas'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {transaction.status === 'Lunas' ? 'LUNAS' : 'BELUM BAYAR'}
                </span>
              </div>
              {transaction.tanggalBayar && (
                <div className="flex justify-between items-center text-slate-700">
                  <span>Tgl Lunas:</span>
                  <span>{formatTanggal(transaction.tanggalBayar)}</span>
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="border-t border-dashed border-slate-400 my-2" />

            {/* Receipt Footer Message */}
            <div className="text-center pt-1 space-y-1.5">
              <div className="text-[10px] text-slate-800 leading-tight">
                Terima kasih telah bertransaksi di Mitra Kami
                <br />
                Simpan struk ini sebagai bukti pembayaran yang sah.
              </div>
              <div className="text-[9px] text-slate-400">
                Simpan struk ini sebagai bukti pembayaran yang sah.
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Target WA input & Action buttons */}
        <div className="p-4 sm:p-5 pt-2 bg-[#0B101B] border-t border-slate-800 space-y-3">
          {/* Target Phone Input */}
          <div className="relative">
            <Phone className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={phoneTarget}
              onChange={(e) => setPhoneTarget(e.target.value)}
              placeholder="Nomor WA Tujuan (opsional, cth: 08123456789)"
              className="w-full bg-[#080D17] border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Row 1: Cetak & Salin Teks */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              id="btn-struk-print-action"
              type="button"
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#141C2E] hover:bg-[#1C263D] border border-slate-700/70 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span>Cetak</span>
            </button>
            <button
              id="btn-struk-copy-action"
              type="button"
              onClick={handleCopyText}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#141C2E] hover:bg-[#1C263D] border border-slate-700/70 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-300" />
                  <span>Salin Teks</span>
                </>
              )}
            </button>
          </div>

          {/* Status Message */}
          {shareStatusMsg && (
            <div className="px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-[11px] text-emerald-300 font-semibold text-center flex items-center justify-center gap-1.5 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{shareStatusMsg}</span>
            </div>
          )}

          {/* Row 2: Unduh Gambar & Kirim Gambar ke WA */}
          <div className="flex gap-2.5">
            <button
              id="btn-struk-download-action"
              type="button"
              onClick={handleDownload}
              disabled={isDownloading || isSharingWA}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-[#141C2E] hover:bg-[#1C263D] border border-slate-700/70 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>{isDownloading ? 'Memproses...' : 'Unduh Gambar'}</span>
            </button>
            <button
              id="btn-struk-send-wa-action"
              type="button"
              onClick={handleKirimWA}
              disabled={isSharingWA}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-black text-xs shadow-lg shadow-emerald-950/40 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSharingWA ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Membuka WA...</span>
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
