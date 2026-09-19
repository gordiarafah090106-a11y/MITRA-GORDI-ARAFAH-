import React, { useState, useRef } from 'react';
import {
  Settings,
  Save,
  Building,
  CreditCard,
  Layers,
  Users,
  RotateCcw,
  Upload,
  CheckCircle2,
  Trash2,
  Plus,
  Phone,
  MapPin,
  FileSignature,
  Receipt,
  FileText,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const SettingsView: React.FC = () => {
  const {
    profile,
    updateProfile,
    accounts,
    addAccount,
    deleteAccount,
    transactionTypes,
    addTransactionType,
    deleteTransactionType,
    contacts,
    addOrUpdateContact,
    deleteContact,
    resetToDefaultData,
  } = useApp();

  // Profile Form state
  const [namaMitra, setNamaMitra] = useState(profile.namaMitra);
  const [inisialLogo, setInisialLogo] = useState(profile.inisialLogo);
  const [alamat, setAlamat] = useState(profile.alamat);
  const [jenisUsaha, setJenisUsaha] = useState(profile.jenisUsaha);
  const [tagline, setTagline] = useState(profile.tagline);
  const [noWhatsapp, setNoWhatsapp] = useState(profile.noWhatsapp);
  const [metodeTransfer, setMetodeTransfer] = useState(profile.metodeTransfer);
  const [strukHeader, setStrukHeader] = useState(profile.strukHeader);
  const [strukFooter, setStrukFooter] = useState(profile.strukFooter);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const ttdInputRef = useRef<HTMLInputElement>(null);

  // New account & tx type inputs
  const [newAccountName, setNewAccountName] = useState('');
  const [newTxTypeName, setNewTxTypeName] = useState('');

  // New Contact inputs
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        updateProfile({ logoUrl: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTtdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        updateProfile({ tandaTanganUrl: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      namaMitra: namaMitra.trim(),
      inisialLogo: inisialLogo.trim().toUpperCase() || namaMitra.slice(0, 2).toUpperCase(),
      alamat: alamat.trim(),
      jenisUsaha: jenisUsaha.trim(),
      tagline: tagline.trim(),
      noWhatsapp: noWhatsapp.trim(),
      metodeTransfer: metodeTransfer.trim(),
      strukHeader: strukHeader.trim(),
      strukFooter: strukFooter.trim(),
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAccountName.trim()) {
      addAccount(newAccountName.trim());
      setNewAccountName('');
    }
  };

  const handleAddTxType = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTxTypeName.trim()) {
      addTransactionType(newTxTypeName.trim());
      setNewTxTypeName('');
    }
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (newContactName.trim()) {
      addOrUpdateContact({
        nama: newContactName.trim().toUpperCase(),
        whatsapp: newContactPhone.trim(),
        totalTransaksi: 0,
      });
      setNewContactName('');
      setNewContactPhone('');
    }
  };

  return (
    <div className="space-y-8 pb-24 max-w-5xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">
          <Settings className="w-4 h-4" />
          <span>KONFIGURASI SISTEM</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Pengaturan Aplikasi
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Sesuaikan profil mitra usaha, rekening transfer, struk cetak, akun bank, dan kategori transaksi.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2 shadow-xl animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Pengaturan profil mitra berhasil disimpan!</span>
        </div>
      )}

      {/* Section 1: Profil Mitra Usaha */}
      <div className="bg-[#141A28] border border-slate-800/90 rounded-2xl p-5 sm:p-7 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Profil Mitra & Identitas Usaha</h2>
              <p className="text-xs text-slate-400">Data ini digunakan pada Struk, Invoice, dan Laporan Excel</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-5">
          {/* Logo & Signature Image Uploads */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Logo Mitra */}
            <div className="p-4 rounded-xl bg-[#0E1320] border border-slate-800/90 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center font-black text-white text-xl overflow-hidden border border-indigo-400/30 shadow-lg shrink-0">
                {profile.logoUrl ? (
                  <img src={profile.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span>{profile.inisialLogo || 'GA'}</span>
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="text-xs font-bold text-white">Logo Mitra</div>
                <p className="text-[11px] text-slate-400">PNG / JPG (Maks 2MB)</p>
                <input
                  type="file"
                  ref={logoInputRef}
                  onChange={handleLogoUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/80 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Pilih File Logo</span>
                </button>
              </div>
            </div>

            {/* Tanda Tangan Digital */}
            <div className="p-4 rounded-xl bg-[#0E1320] border border-slate-800/90 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center overflow-hidden shrink-0">
                {profile.tandaTanganUrl ? (
                  <img src={profile.tandaTanganUrl} alt="TTD" className="w-full h-full object-contain p-1" />
                ) : (
                  <FileSignature className="w-7 h-7 text-slate-500" />
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="text-xs font-bold text-white">Tanda Tangan Digital</div>
                <p className="text-[11px] text-slate-400">Tampil otomatis pada faktur invoice</p>
                <input
                  type="file"
                  ref={ttdInputRef}
                  onChange={handleTtdUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => ttdInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/80 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload TTD</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Nama Mitra Usaha
              </label>
              <input
                type="text"
                value={namaMitra}
                onChange={(e) => setNamaMitra(e.target.value)}
                className="w-full bg-[#0E1320] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Inisial Logo (2 Huruf)
              </label>
              <input
                type="text"
                maxLength={3}
                value={inisialLogo}
                onChange={(e) => setInisialLogo(e.target.value)}
                className="w-full bg-[#0E1320] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white uppercase focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Jenis Usaha
              </label>
              <input
                type="text"
                value={jenisUsaha}
                onChange={(e) => setJenisUsaha(e.target.value)}
                className="w-full bg-[#0E1320] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Nomor WhatsApp
              </label>
              <input
                type="text"
                value={noWhatsapp}
                onChange={(e) => setNoWhatsapp(e.target.value)}
                className="w-full bg-[#0E1320] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Alamat Usaha
              </label>
              <input
                type="text"
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                className="w-full bg-[#0E1320] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Tagline / Motto Usaha
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full bg-[#0E1320] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Rekening & Metode Pembayaran (Ditampilkan pada Dokumen Invoice)
              </label>
              <textarea
                rows={4}
                value={metodeTransfer}
                onChange={(e) => setMetodeTransfer(e.target.value)}
                className="w-full bg-[#0E1320] border border-slate-700/80 rounded-xl p-3 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Struk Thermal Header
              </label>
              <textarea
                rows={3}
                value={strukHeader}
                onChange={(e) => setStrukHeader(e.target.value)}
                className="w-full bg-[#0E1320] border border-slate-700/80 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Struk Thermal Footer
              </label>
              <textarea
                rows={3}
                value={strukFooter}
                onChange={(e) => setStrukFooter(e.target.value)}
                className="w-full bg-[#0E1320] border border-slate-700/80 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              id="btn-save-profile"
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan Profil</span>
            </button>
          </div>
        </form>
      </div>

      {/* Section 2: Akun Pembayaran (Banks & Wallets) */}
      <div className="bg-[#141A28] border border-slate-800/90 rounded-2xl p-5 sm:p-7 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Kelola Akun Bank & E-Wallet</h2>
            <p className="text-xs text-slate-400">Sumber dana / rekening yang digunakan untuk pencatatan transaksi</p>
          </div>
        </div>

        <form onSubmit={handleAddAccount} className="flex gap-2 max-w-md">
          <input
            type="text"
            placeholder="Contoh: BCA, OVO, Bank Jago..."
            value={newAccountName}
            onChange={(e) => setNewAccountName(e.target.value)}
            className="flex-1 bg-[#0E1320] border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah</span>
          </button>
        </form>

        <div className="flex flex-wrap gap-2 pt-2">
          {accounts.map((acc) => (
            <div
              key={acc}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0E1320] border border-slate-700/80 text-slate-200 text-xs font-semibold"
            >
              <span>{acc}</span>
              <button
                type="button"
                onClick={() => deleteAccount(acc)}
                className="text-slate-400 hover:text-rose-400 p-0.5 transition-colors"
                title={`Hapus akun ${acc}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Kategori Jenis Transaksi */}
      <div className="bg-[#141A28] border border-slate-800/90 rounded-2xl p-5 sm:p-7 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Kelola Jenis Transaksi</h2>
            <p className="text-xs text-slate-400">Pilihan kategori layanan jasa untuk agen</p>
          </div>
        </div>

        <form onSubmit={handleAddTxType} className="flex gap-2 max-w-md">
          <input
            type="text"
            placeholder="Contoh: Top Up Shopee, PDAM, Tiket..."
            value={newTxTypeName}
            onChange={(e) => setNewTxTypeName(e.target.value)}
            className="flex-1 bg-[#0E1320] border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah</span>
          </button>
        </form>

        <div className="flex flex-wrap gap-2 pt-2">
          {transactionTypes.map((type) => (
            <div
              key={type}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0E1320] border border-slate-700/80 text-slate-200 text-xs font-semibold"
            >
              <span>{type}</span>
              <button
                type="button"
                onClick={() => deleteTransactionType(type)}
                className="text-slate-400 hover:text-rose-400 p-0.5 transition-colors"
                title={`Hapus jenis ${type}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Section 4: Kontak Pelanggan */}
      <div className="bg-[#141A28] border border-slate-800/90 rounded-2xl p-5 sm:p-7 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Buku Kontak Pelanggan</h2>
            <p className="text-xs text-slate-400">Database pelanggan untuk pengiriman invoice WhatsApp otomatis</p>
          </div>
        </div>

        <form onSubmit={handleAddContact} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-xl">
          <input
            type="text"
            placeholder="Nama Pelanggan"
            value={newContactName}
            onChange={(e) => setNewContactName(e.target.value)}
            className="bg-[#0E1320] border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
            required
          />
          <input
            type="text"
            placeholder="No WhatsApp (08...)"
            value={newContactPhone}
            onChange={(e) => setNewContactPhone(e.target.value)}
            className="bg-[#0E1320] border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
          />
          <button
            type="submit"
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kontak</span>
          </button>
        </form>

        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left text-xs sm:text-sm text-slate-200">
            <thead className="text-[11px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Nama</th>
                <th className="py-2.5 px-3">WhatsApp</th>
                <th className="py-2.5 px-3 text-center">Total Transaksi</th>
                <th className="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {contacts.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/20">
                  <td className="py-2.5 px-3 font-bold text-white">{c.nama}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-300 text-xs">{c.whatsapp || '-'}</td>
                  <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{c.totalTransaksi || 0}</td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => deleteContact(c.id)}
                      className="text-rose-400 hover:text-rose-300 p-1"
                      title="Hapus kontak"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 5: Reset Data / Danger Zone */}
      <div className="bg-[#141A28] border border-rose-500/20 rounded-2xl p-5 sm:p-7 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Reset ke Data Default</h2>
            <p className="text-xs text-slate-400">Kembalikan seluruh data transaksi, akun, dan profil ke pengaturan awal</p>
          </div>
        </div>

        <div>
          <button
            id="btn-reset-data-prompt"
            type="button"
            onClick={() => setResetConfirmOpen(true)}
            className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white font-bold text-xs border border-rose-500/30 transition-all cursor-pointer"
          >
            Reset Seluruh Data
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#141A28] border border-rose-500/40 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Reset Seluruh Data?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Tindakan ini akan mengembalikan seluruh transaksi, faktur invoice, dan pengaturan profil mitra ke data awal (GORDI ARAFAH).
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setResetConfirmOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                id="btn-confirm-reset-data"
                onClick={() => {
                  resetToDefaultData();
                  setResetConfirmOpen(false);
                  setSavedSuccess(true);
                  setTimeout(() => setSavedSuccess(false), 3000);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-lg"
              >
                Ya, Reset Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
