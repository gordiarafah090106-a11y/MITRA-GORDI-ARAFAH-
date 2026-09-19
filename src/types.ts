export interface Transaction {
  id: string;
  tanggal: string; // YYYY-MM-DD
  hari: string;
  nama: string;
  akun: string;
  jenisTransaksi: string;
  bayar: number;
  laba: number;
  status: 'Lunas' | 'Belum Bayar';
  tanggalBayar?: string;
  createdAt?: number;
}

export interface InvoiceItem {
  id: string;
  jenisTransaksi: string;
  qty: number;
  harga: number;
  total: number;
}

export interface Invoice {
  id: string;
  nomorInvoice: string;
  tanggal: string; // YYYY-MM-DD
  customer: string;
  whatsapp?: string;
  metodePembayaran: string;
  items: InvoiceItem[];
  subtotal: number;
  diskon: number;
  total: number;
  terbilang: string;
  catatan?: string;
  status: 'Lunas' | 'Belum';
  createdAt?: number;
}

export interface MitraProfile {
  id: string;
  username: string;
  namaMitra: string;
  inisialLogo: string;
  logoUrl?: string;
  alamat: string;
  jenisUsaha: string;
  tagline: string;
  noWhatsapp: string;
  metodeTransfer: string;
  tandaTanganUrl?: string;
  strukHeader: string;
  strukFooter: string;
}

export interface Contact {
  id: string;
  nama: string;
  whatsapp: string;
  totalTransaksi?: number;
}

export type ActiveTab = 'dashboard' | 'belum_bayar' | 'invoice' | 'pengaturan';

export interface UserAccount {
  id: string;
  username: string;
  password: string;
  namaMitra: string;
  whatsapp?: string;
  createdAt: number;
}
