import React, { useState, useEffect } from 'react';
import { X, Save, DollarSign, Loader2, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Transaction } from '../types';
import { getHari, formatRupiah } from '../utils/formatters';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editTx: Transaction | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  editTx,
}) => {
  const {
    accounts,
    transactionTypes,
    addTransaction,
    updateTransaction,
  } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];

  const [tanggal, setTanggal] = useState(todayStr);
  const [nama, setNama] = useState('');
  const [akun, setAkun] = useState('');
  const [jenisTransaksi, setJenisTransaksi] = useState('');
  const [bayar, setBayar] = useState<number | ''>('');
  const [laba, setLaba] = useState<number | ''>('');
  const [status, setStatus] = useState<'Lunas' | 'Belum Bayar'>('Lunas');
  const [tanggalBayar, setTanggalBayar] = useState(todayStr);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (editTx) {
      setTanggal(editTx.tanggal);
      setNama(editTx.nama);
      setAkun(editTx.akun);
      setJenisTransaksi(editTx.jenisTransaksi);
      setBayar(editTx.bayar);
      setLaba(editTx.laba);
      setStatus(editTx.status);
      setTanggalBayar(editTx.tanggalBayar || editTx.tanggal || todayStr);
    } else {
      // Kosongkan semua pilihan dan input awal saat tambah transaksi baru
      setTanggal(todayStr);
      setNama('');
      setAkun('');
      setJenisTransaksi('');
      setBayar('');
      setLaba('');
      setStatus('Lunas');
      setTanggalBayar(todayStr);
    }
    setSaveError(null);
    setIsSaving(false);
  }, [editTx, isOpen, todayStr]);

  const handleTanggalChange = (newTanggal: string) => {
    setTanggal(newTanggal);
    if (status === 'Lunas' && !editTx) {
      setTanggalBayar(newTanggal);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || !akun || !jenisTransaksi || bayar === '' || laba === '') {
      return;
    }

    const cleanBayar = typeof bayar === 'number' ? bayar : parseInt(bayar, 10) || 0;
    const cleanLaba = typeof laba === 'number' ? laba : parseInt(laba, 10) || 0;
    const calculatedHari = getHari(tanggal);

    setIsSaving(true);
    setSaveError(null);

    try {
      const txPayload: Omit<Transaction, 'id' | 'createdAt'> = {
        tanggal,
        hari: calculatedHari,
        nama: nama.trim().toUpperCase(),
        akun,
        jenisTransaksi,
        bayar: cleanBayar,
        laba: cleanLaba,
        status,
      };
      if (status === 'Lunas') {
        txPayload.tanggalBayar = tanggalBayar || tanggal;
      }

      if (editTx) {
        const updatePayload: Partial<Transaction> = {
          tanggal,
          hari: calculatedHari,
          nama: nama.trim().toUpperCase(),
          akun,
          jenisTransaksi,
          bayar: cleanBayar,
          laba: cleanLaba,
          status,
        };
        if (status === 'Lunas') {
          updatePayload.tanggalBayar = tanggalBayar || tanggal;
        }
        await updateTransaction(editTx.id, updatePayload);
      } else {
        await addTransaction(txPayload);
      }

      // Kode formulir menyertakan perintah untuk menutup jendela popup TAMBAH TRANSAKSI secara otomatis setelah proses simpan ke Firebase berhasil
      onClose();
    } catch (err: unknown) {
      console.error('Error saving transaction to Firestore:', err);
      setSaveError('Gagal menyimpan transaksi ke database Firebase. Silakan coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-[#141A28] border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {editTx ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}
              </h2>
              <p className="text-[11px] text-slate-400">Pencatatan kas & piutang tersinkron Firebase Firestore</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {saveError && (
          <div className="mx-5 mt-4 p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{saveError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Tanggal */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Tanggal
              </label>
              <input
                id="input-tx-tanggal"
                type="date"
                value={tanggal}
                onChange={(e) => handleTanggalChange(e.target.value)}
                disabled={isSaving}
                className="w-full bg-[#0E1320] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                required
              />
            </div>

            {/* Nama Pelanggan */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Nama Pelanggan
              </label>
              <input
                id="input-tx-nama"
                type="text"
                autoComplete="off"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Masukkan nama pelanggan..."
                disabled={isSaving}
                className="w-full bg-[#0E1320] border border-slate-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-white uppercase focus:outline-none focus:border-indigo-500 font-semibold disabled:opacity-60"
                required
              />
            </div>

            {/* Akun / Sumber */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Akun / Sumber
              </label>
              <select
                id="select-tx-akun"
                value={akun}
                onChange={(e) => setAkun(e.target.value)}
                disabled={isSaving}
                className="w-full bg-[#0E1320] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-60"
                required
              >
                <option value="" disabled>
                  -- Pilih Akun / Sumber --
                </option>
                {accounts.map((acc) => (
                  <option key={acc} value={acc}>
                    {acc}
                  </option>
                ))}
              </select>
            </div>

            {/* Jenis Transaksi */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Jenis Transaksi
              </label>
              <select
                id="select-tx-jenis"
                value={jenisTransaksi}
                onChange={(e) => setJenisTransaksi(e.target.value)}
                disabled={isSaving}
                className="w-full bg-[#0E1320] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-60"
                required
              >
                <option value="" disabled>
                  -- Pilih Jenis Transaksi --
                </option>
                {transactionTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Bayar / Total */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Bayar / Total (Rp)
              </label>
              <input
                id="input-tx-bayar"
                type="number"
                min="0"
                step="500"
                value={bayar}
                onChange={(e) => setBayar(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                disabled={isSaving}
                className="w-full bg-[#0E1320] border border-slate-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                required
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block min-h-[16px]">
                {typeof bayar === 'number' && bayar > 0 ? formatRupiah(bayar) : ''}
              </span>
            </div>

            {/* Laba */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Laba / Keuntungan (Rp)
              </label>
              <input
                id="input-tx-laba"
                type="number"
                min="0"
                step="500"
                value={laba}
                onChange={(e) => setLaba(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                disabled={isSaving}
                className="w-full bg-[#0E1320] border border-slate-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-emerald-400 font-mono font-bold focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                required
              />
              <span className="text-[10px] text-emerald-400/80 mt-0.5 block font-medium min-h-[16px]">
                {typeof laba === 'number' && laba > 0 ? formatRupiah(laba) : ''}
              </span>
            </div>

            {/* Status Pembayaran */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Status Pembayaran
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setStatus('Lunas')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-60 ${
                    status === 'Lunas'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                      : 'bg-[#0E1320] text-slate-400 border border-slate-700/80'
                  }`}
                >
                  Lunas
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setStatus('Belum Bayar')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-60 ${
                    status === 'Belum Bayar'
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-950/40'
                      : 'bg-[#0E1320] text-slate-400 border border-slate-700/80'
                  }`}
                >
                  Belum Bayar
                </button>
              </div>
            </div>

            {/* Tanggal Bayar (jika Lunas) */}
            {status === 'Lunas' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Tanggal Lunas
                </label>
                <input
                  id="input-tx-tanggal-bayar"
                  type="date"
                  value={tanggalBayar}
                  onChange={(e) => setTanggalBayar(e.target.value)}
                  disabled={isSaving}
                  className="w-full bg-[#0E1320] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              id="btn-save-transaction"
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/60 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 cursor-pointer transition-all"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan ke Firebase...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{editTx ? 'Simpan Perubahan' : 'Simpan Transaksi'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
