export const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export function formatRupiah(amount: number | string | undefined | null): string {
  const num = typeof amount === 'number' ? amount : Number(amount) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatRupiahRp(amount: number | string | undefined | null): string {
  const num = typeof amount === 'number' ? amount : Number(amount) || 0;
  return `Rp${Math.round(num).toLocaleString('id-ID')}`;
}

export function parseNumber(val: string | number): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const cleaned = val.replace(/[^0-9]/g, '');
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
}

export function getHari(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return '';
  const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  return DAYS[date.getDay()] || '';
}

export function formatTanggal(dateStr?: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const monthAbbr = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mei',
    'Jun',
    'Jul',
    'Agu',
    'Sep',
    'Okt',
    'Nov',
    'Des',
  ][monthIdx] || parts[1];
  return `${day} ${monthAbbr} ${year}`;
}

export function formatTanggalLengkap(dateStr?: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const hari = getHari(dateStr);
  const bulan = MONTH_NAMES[monthIdx] || parts[1];
  return `${hari ? hari + ', ' : ''}${day} ${bulan} ${year}`;
}

export function terbilang(n: number): string {
  const angka = Math.floor(Math.abs(n));
  const bilangan = [
    '',
    'satu',
    'dua',
    'tiga',
    'empat',
    'lima',
    'enam',
    'tujuh',
    'delapan',
    'sembilan',
    'sepuluh',
    'sebelas',
  ];

  function convert(val: number): string {
    if (val < 12) return bilangan[val];
    if (val < 20) return convert(val - 10) + ' belas';
    if (val < 100) return convert(Math.floor(val / 10)) + ' puluh ' + convert(val % 10);
    if (val < 200) return 'seratus ' + convert(val - 100);
    if (val < 1000) return convert(Math.floor(val / 100)) + ' ratus ' + convert(val % 100);
    if (val < 2000) return 'seribu ' + convert(val - 1000);
    if (val < 1000000) return convert(Math.floor(val / 1000)) + ' ribu ' + convert(val % 1000);
    if (val < 1000000000) return convert(Math.floor(val / 1000000)) + ' juta ' + convert(val % 1000000);
    if (val < 1000000000000) return convert(Math.floor(val / 1000000000)) + ' milyar ' + convert(val % 1000000000);
    return convert(Math.floor(val / 1000000000000)) + ' triliun ' + convert(val % 1000000000000);
  }

  if (angka === 0) return 'Nol Rupiah';
  const hasil = convert(angka).trim().replace(/\s+/g, ' ');
  return hasil.charAt(0).toUpperCase() + hasil.slice(1) + ' Rupiah';
}

export const terbilangRupiah = terbilang;
