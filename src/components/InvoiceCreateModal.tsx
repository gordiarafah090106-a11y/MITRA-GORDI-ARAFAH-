import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  FileText,
  Calendar,
  CreditCard,
  User,
  Phone,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { InvoiceItem, Invoice } from '../types';
import { terbilangRupiah, formatRupiah } from '../utils/formatters';

interface InvoiceItemWithManual extends InvoiceItem {
  isManual?: boolean;
}

interface InvoiceCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillCustomerName?: string;
  onInvoiceCreated: (inv: Invoice) => void;
}

export const InvoiceCreateModal: React.FC<InvoiceCreateModalProps> = ({
  isOpen,
  onClose,
  prefillCustomerName,
  onInvoiceCreated,
}) => {
  const {
    contacts,
    transactions,
    transactionTypes,
    accounts,
    generateInvoiceNumber,
    addInvoice,
  } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];

  const [nomorInvoice, setNomorInvoice] = useState('');
  const [tanggal, setTanggal] = useState(todayStr);
  const [metodePembayaran, setMetodePembayaran] = useState('Tunai / Cash');
  const [customer, setCustomer] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [diskon, setDiskon] = useState<number>(0);
  const [catatan, setCatatan] = useState('');
  const [status, setStatus] = useState<'Belum' | 'Lunas'>('Belum');

  const [items, setItems] = useState<InvoiceItemWithManual[]>([
    {
      id: `item_${Date.now()}`,
      jenisTransaksi: 'Briva',
      qty: 1,
      harga: 0,
      total: 0,
    },
  ]);

  // Pelanggan yang memiliki hutang (Belum Bayar) dari fitur BELUM BAYAR
  const debtorsList = useMemo(() => {
    const map = new Map<
      string,
      {
        nama: string;
        transactions: typeof transactions;
        total: number;
      }
    >();

    transactions
      .filter((t) => t.status === 'Belum Bayar')
      .forEach((tx) => {
        const key = tx.nama.trim().toUpperCase();
        const existing = map.get(key);
        if (existing) {
          existing.transactions.push(tx);
          existing.total += tx.bayar || 0;
        } else {
          map.set(key, {
            nama: tx.nama.trim().toUpperCase(),
            transactions: [tx],
            total: tx.bayar || 0,
          });
        }
      });

    return Array.from(map.values()).sort((a, b) => a.nama.localeCompare(b.nama));
  }, [transactions]);

  // Opsi Jenis Transaksi gabungan
  const allServiceTypes = useMemo(() => {
    const defaults = [
      'Briva',
      'Pulsa',
      'Dana',
      'Transfer',
      'Gopay',
      'Ovo',
      'Shopeepay',
      'Token Listrik',
      'Cicilan Mobil',
      'Tarik Tunai',
      'Minjam Dana',
    ];
    return Array.from(new Set([...defaults, ...transactionTypes]));
  }, [transactionTypes]);

  // Opsi Metode Pembayaran gabungan
  const allPaymentMethods = useMemo(() => {
    const defaults = [
      'Tunai / Cash',
      'Transfer',
      'Bri Mo',
      'Shopeepay',
      'Dana Payz',
      'Briva',
      'Gopay',
      'Ovo',
    ];
    return Array.from(new Set([...defaults, ...(accounts || [])]));
  }, [accounts]);

  useEffect(() => {
    if (isOpen) {
      setNomorInvoice(generateInvoiceNumber(todayStr));
      setTanggal(todayStr);
      setMetodePembayaran('Tunai / Cash');
      setCatatan('');
      setStatus('Belum');
      setDiskon(0);

      const targetCustomer = prefillCustomerName || '';
      setCustomer(targetCustomer);

      if (targetCustomer) {
        const contact = contacts.find(
          (c) => c.nama.trim().toUpperCase() === targetCustomer.trim().toUpperCase()
        );
        if (contact?.whatsapp) {
          setWhatsapp(contact.whatsapp);
        }

        const debtor = debtorsList.find(
          (d) => d.nama === targetCustomer.trim().toUpperCase()
        );
        if (debtor && debtor.transactions.length > 0) {
          setItems(
            debtor.transactions.map((tx, idx) => ({
              id: `item_${idx}_${Date.now()}`,
              jenisTransaksi: `${tx.jenisTransaksi} (${tx.tanggal || todayStr})`,
              qty: 1,
              harga: tx.bayar,
              total: tx.bayar,
            }))
          );
          return;
        }
      }

      setItems([
        {
          id: `item_${Date.now()}`,
          jenisTransaksi: 'Briva',
          qty: 1,
          harga: 0,
          total: 0,
        },
      ]);
    }
  }, [isOpen, prefillCustomerName, contacts, debtorsList, todayStr]);

  // Auto-fill dari kontak tersimpan
  const handleSelectSavedContact = (contactName: string) => {
    if (!contactName) return;
    setCustomer(contactName.toUpperCase());
    const found = contacts.find(
      (c) => c.nama.trim().toUpperCase() === contactName.trim().toUpperCase()
    );
    if (found?.whatsapp) {
      setWhatsapp(found.whatsapp);
    }
  };

  // Auto-fill dari daftar yang berhutang
  const handleSelectDebtor = (debtorName: string) => {
    if (!debtorName) return;
    const debtor = debtorsList.find((d) => d.nama === debtorName);
    if (!debtor) return;

    setCustomer(debtor.nama);

    const contact = contacts.find(
      (c) => c.nama.trim().toUpperCase() === debtor.nama
    );
    if (contact?.whatsapp) {
      setWhatsapp(contact.whatsapp);
    }

    // Masukkan seluruh rincian transaksi belum lunas ke tabel item invoice
    if (debtor.transactions.length > 0) {
      setItems(
        debtor.transactions.map((tx, idx) => ({
          id: `item_${idx}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          jenisTransaksi: `${tx.jenisTransaksi} (${tx.tanggal || todayStr})`,
          qty: 1,
          harga: tx.bayar || 0,
          total: tx.bayar || 0,
        }))
      );
    }
  };

  const handleItemChange = (
    index: number,
    field: 'jenisTransaksi' | 'qty' | 'harga',
    val: any
  ) => {
    setItems((prev) => {
      const updated = [...prev];
      const target = { ...updated[index] };

      if (field === 'jenisTransaksi') {
        target.jenisTransaksi = val;
      } else if (field === 'qty') {
        const qtyNum = parseInt(val, 10) || 1;
        target.qty = Math.max(1, qtyNum);
        target.total = target.qty * target.harga;
      } else if (field === 'harga') {
        const hargaNum = parseInt(val, 10) || 0;
        target.harga = Math.max(0, hargaNum);
        target.total = target.qty * target.harga;
      }

      updated[index] = target;
      return updated;
    });
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        jenisTransaksi: 'Briva',
        qty: 1,
        harga: 0,
        total: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, it) => sum + (it.total || 0), 0);
  const total = Math.max(0, subtotal - (diskon || 0));
  const terbilang = terbilangRupiah(total);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.trim()) return;

    const newInvoice = await addInvoice({
      nomorInvoice: nomorInvoice || generateInvoiceNumber(tanggal),
      tanggal,
      customer: customer.trim().toUpperCase(),
      whatsapp: whatsapp.trim(),
      metodePembayaran,
      items: items.map((it) => ({
        ...it,
        total: (it.qty || 1) * (it.harga || 0),
      })),
      subtotal,
      diskon: diskon || 0,
      total,
      terbilang,
      catatan: catatan.trim(),
      status,
    });

    onInvoiceCreated(newInvoice);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div
        id="modal-buat-invoice"
        className="bg-[#0D1322] border border-[#222E48] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-6 text-slate-100 font-sans"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#1D2740] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-[#818CF8]" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Buat Invoice Baru
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs">
          {/* PILIH KONTAK TERSIMPAN (OPSIONAL) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              PILIH KONTAK TERSIMPAN (OPSIONAL)
            </label>
            <div className="relative">
              <select
                id="select-saved-contact"
                defaultValue=""
                onChange={(e) => handleSelectSavedContact(e.target.value)}
                className="w-full bg-[#0A0E1A] border border-[#222D47] rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-[#6366F1] cursor-pointer appearance-none"
              >
                <option value="">— Pilih kontak untuk isi otomatis —</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.nama}>
                    {c.nama} {c.whatsapp ? `(${c.whatsapp})` : ''}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                ▾
              </div>
            </div>
          </div>

          {/* PILIH NAMA YANG BERHUTANG (AUTO-FILL PIUTANG) */}
          <div className="p-3.5 bg-[#0A1020] border border-[#283556] rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#9EA7FC] uppercase tracking-wider">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>PILIH NAMA YANG BERHUTANG (AUTO-FILL PIUTANG)</span>
            </div>

            <div className="relative">
              <select
                id="select-unpaid-debtor"
                defaultValue=""
                onChange={(e) => handleSelectDebtor(e.target.value)}
                className="w-full bg-[#070B16] border border-[#2A375A] rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#6366F1] cursor-pointer appearance-none"
              >
                <option value="">
                  — Pilih nama yang punya hutang ({debtorsList.length} orang) —
                </option>
                {debtorsList.map((d) => (
                  <option key={d.nama} value={d.nama}>
                    {d.nama} ({d.transactions.length} transaksi - {formatRupiah(d.total)})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                ▾
              </div>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed italic">
              *Memilih nama ini akan otomatis mengisi customer, no WA, dan memasukkan seluruh rincian transaksi belum lunas ke tabel item invoice.
            </p>
          </div>

          {/* Row: TANGGAL & METODE PEMBAYARAN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#818CF8]" />
                <span>TANGGAL</span>
              </label>
              <input
                id="input-invoice-date"
                type="date"
                value={tanggal}
                onChange={(e) => {
                  setTanggal(e.target.value);
                  setNomorInvoice(generateInvoiceNumber(e.target.value));
                }}
                className="w-full bg-[#0A0E1A] border border-[#222D47] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#6366F1]"
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                <CreditCard className="w-3.5 h-3.5 text-[#818CF8]" />
                <span>METODE PEMBAYARAN</span>
              </label>
              <div className="relative">
                <select
                  id="select-payment-method"
                  value={metodePembayaran}
                  onChange={(e) => setMetodePembayaran(e.target.value)}
                  className="w-full bg-[#0A0E1A] border border-[#222D47] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#6366F1] cursor-pointer appearance-none"
                >
                  {allPaymentMethods.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  ▾
                </div>
              </div>
            </div>
          </div>

          {/* Row: NAMA CUSTOMER & NO WHATSAPP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                <User className="w-3.5 h-3.5 text-[#818CF8]" />
                <span>NAMA CUSTOMER</span>
              </label>
              <input
                id="input-customer-name"
                type="text"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder="Nama customer"
                className="w-full bg-[#0A0E1A] border border-[#222D47] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 uppercase font-semibold focus:outline-none focus:border-[#6366F1]"
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                <Phone className="w-3.5 h-3.5 text-[#818CF8]" />
                <span>NO WHATSAPP</span>
              </label>
              <input
                id="input-customer-whatsapp"
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="08xxxxxxxxxx"
                className="w-full bg-[#0A0E1A] border border-[#222D47] rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#6366F1]"
              />
            </div>
          </div>

          {/* ITEM TRANSAKSI */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-slate-300 tracking-wider">
                ITEM TRANSAKSI
              </span>
              <button
                type="button"
                id="btn-add-item-row"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#A5B4FC] bg-[#1E2548] hover:bg-[#283262] border border-[#384478] px-3 py-1 rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Tambah Baris</span>
              </button>
            </div>

            {/* Item Rows */}
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-2">
                  <div className="flex-1">
                    {item.isManual ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          autoFocus
                          value={item.jenisTransaksi}
                          onChange={(e) => handleItemChange(idx, 'jenisTransaksi', e.target.value)}
                          placeholder="Ketik jenis transaksi..."
                          className="w-full bg-[#0A0E1A] border border-[#6366F1] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366F1] font-semibold"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setItems((prev) => {
                              const updated = [...prev];
                              updated[idx] = { ...updated[idx], isManual: false, jenisTransaksi: allServiceTypes[0] || 'Briva' };
                              return updated;
                            });
                          }}
                          className="px-2 py-2 rounded-xl bg-[#1E2548] hover:bg-[#283262] text-[#A5B4FC] text-[11px] font-bold shrink-0 cursor-pointer"
                          title="Pilih dari daftar"
                        >
                          List
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <select
                          value={allServiceTypes.includes(item.jenisTransaksi) ? item.jenisTransaksi : '__manual__'}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '__manual__') {
                              setItems((prev) => {
                                const updated = [...prev];
                                updated[idx] = { ...updated[idx], isManual: true, jenisTransaksi: '' };
                                return updated;
                              });
                            } else {
                              handleItemChange(idx, 'jenisTransaksi', val);
                            }
                          }}
                          className="w-full bg-[#0A0E1A] border border-[#222D47] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366F1] appearance-none cursor-pointer"
                        >
                          <option value="" disabled>
                            -- Pilih Jenis Transaksi --
                          </option>
                          <option value="__manual__">✍️ Ketik Manual...</option>
                          {allServiceTypes.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                          ▾
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="w-16">
                    <input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                      placeholder="1"
                      className="w-full bg-[#0A0E1A] border border-[#222D47] rounded-xl px-2 py-2 text-xs text-center text-white focus:outline-none focus:border-[#6366F1]"
                      required
                    />
                  </div>

                  <div className="w-32">
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={item.harga === 0 ? '' : item.harga}
                      onChange={(e) => handleItemChange(idx, 'harga', e.target.value)}
                      placeholder="Harga"
                      className="w-full bg-[#0A0E1A] border border-[#222D47] rounded-xl px-3 py-2 text-xs text-right font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#6366F1]"
                      required
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    disabled={items.length <= 1}
                    className="p-2 text-slate-500 hover:text-rose-400 disabled:opacity-20 transition-colors cursor-pointer"
                    title="Hapus baris"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* DISKON & TOTAL */}
          <div className="flex items-center justify-between gap-4 pt-1">
            <div className="flex-1 max-w-[200px]">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                DISKON (RP)
              </label>
              <input
                id="input-invoice-discount"
                type="number"
                min="0"
                value={diskon === 0 ? '' : diskon}
                onChange={(e) => setDiskon(parseInt(e.target.value, 10) || 0)}
                placeholder="0"
                className="w-full bg-[#0A0E1A] border border-[#222D47] rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#6366F1]"
              />
            </div>

            <div className="text-right">
              <div className="text-[11px] text-slate-400">
                Subtotal: {formatRupiah(subtotal)}
              </div>
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mt-0.5">
                TOTAL
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-[#00E599] tracking-tight">
                {formatRupiah(total)}
              </div>
            </div>
          </div>

          {/* CATATAN */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              CATATAN
            </label>
            <textarea
              id="textarea-invoice-notes"
              rows={2}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Catatan tambahan (opsional)..."
              className="w-full bg-[#0A0E1A] border border-[#222D47] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#6366F1] resize-none"
            />
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#1D2740]">
            <button
              type="button"
              id="btn-batal-invoice"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-[#11172A] hover:bg-[#16203A] border border-slate-700/80 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              id="btn-simpan-invoice"
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#5244E6] hover:bg-[#4336D4] text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              Simpan Invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
