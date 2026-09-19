import ExcelJS from 'exceljs';
import { Transaction } from '../types';
import { formatTanggal, formatRupiah } from './formatters';

export async function exportTransactionsToExcel(
  transactions: Transaction[],
  bulan: string,
  tahun: number,
  namaMitra: string
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Pembukuan Mitra';
  workbook.lastModifiedBy = namaMitra || 'Mitra Usaha';
  workbook.created = new Date();
  workbook.modified = new Date();

  const sheetName = `${bulan} ${tahun}`.slice(0, 31);
  const worksheet = workbook.addWorksheet(sheetName, {
    views: [{ showGridLines: true }],
  });

  // Title Row
  worksheet.mergeCells('A1:J1');
  const cellA1 = worksheet.getCell('A1');
  cellA1.value = 'LAPORAN REKAPITULASI TRANSAKSI KEUANGAN';
  cellA1.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF1E293B' } };
  cellA1.alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getRow(1).height = 24;

  // Subtitle Mitra Row
  worksheet.mergeCells('A2:J2');
  const cellA2 = worksheet.getCell('A2');
  cellA2.value = `MITRA USAHA: ${(namaMitra || 'PEMBUKUAN MITRA').toUpperCase()}`;
  cellA2.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF334155' } };
  cellA2.alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getRow(2).height = 18;

  // Meta info row
  worksheet.mergeCells('A3:J3');
  const cellA3 = worksheet.getCell('A3');
  const now = new Date();
  const timeStr = `${now.getDate()} ${bulan} ${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;
  cellA3.value = `Periode: ${bulan} ${tahun}  |  Total Data: ${transactions.length} Transaksi  |  Waktu Ekspor: ${timeStr}`;
  cellA3.font = { name: 'Calibri', size: 9.5, italic: true, color: { argb: 'FF64748B' } };
  cellA3.alignment = { horizontal: 'left', vertical: 'middle' };
  worksheet.getRow(3).height = 18;
  worksheet.getRow(4).height = 8; // spacing

  // Headers
  const headers = [
    'NO',
    'TANGGAL',
    'HARI',
    'NAMA PELANGGAN',
    'AKUN / SUMBER',
    'JENIS TRANSAKSI',
    'BAYAR (RP)',
    'LABA (RP)',
    'STATUS',
    'TGL BAYAR',
  ];

  const headerRowIndex = 5;
  const headerRow = worksheet.getRow(headerRowIndex);
  headerRow.values = headers;
  headerRow.height = 28;

  headerRow.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }, // Dark slate
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FF334155' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      right: { style: 'thin', color: { argb: 'FF334155' } },
    };
  });

  let totalBayar = 0;
  let totalLaba = 0;

  // Populate data
  transactions.forEach((tx, idx) => {
    const rowNum = headerRowIndex + 1 + idx;
    const row = worksheet.getRow(rowNum);
    totalBayar += tx.bayar || 0;
    totalLaba += tx.laba || 0;

    row.values = [
      idx + 1,
      formatTanggal(tx.tanggal),
      tx.hari || '-',
      tx.nama,
      tx.akun,
      tx.jenisTransaksi,
      tx.bayar || 0,
      tx.laba || 0,
      tx.status,
      tx.tanggalBayar ? formatTanggal(tx.tanggalBayar) : '-',
    ];

    row.height = 20;

    const isEven = idx % 2 === 1;
    const bgColor = isEven ? 'FFF8FAFC' : 'FFFFFFFF';

    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Calibri', size: 10 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgColor },
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };

      if (colNumber === 1 || colNumber === 2 || colNumber === 3 || colNumber === 9 || colNumber === 10) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (colNumber === 7 || colNumber === 8) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '#,##0';
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }

      if (colNumber === 9) {
        if (tx.status === 'Lunas') {
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF059669' } };
        } else {
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFD97706' } };
        }
      }
    });
  });

  // Summary Row
  const summaryRowIndex = headerRowIndex + 1 + transactions.length;
  const summaryRow = worksheet.getRow(summaryRowIndex);
  summaryRow.height = 24;

  worksheet.mergeCells(`A${summaryRowIndex}:F${summaryRowIndex}`);
  const summaryLabel = worksheet.getCell(`A${summaryRowIndex}`);
  summaryLabel.value = 'TOTAL KESELURUHAN:';
  summaryLabel.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
  summaryLabel.alignment = { horizontal: 'right', vertical: 'middle' };

  const totalBayarCell = worksheet.getCell(`G${summaryRowIndex}`);
  totalBayarCell.value = totalBayar;
  totalBayarCell.numFmt = '#,##0';
  totalBayarCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1D4ED8' } };
  totalBayarCell.alignment = { horizontal: 'right', vertical: 'middle' };

  const totalLabaCell = worksheet.getCell(`H${summaryRowIndex}`);
  totalLabaCell.value = totalLaba;
  totalLabaCell.numFmt = '#,##0';
  totalLabaCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF059669' } };
  totalLabaCell.alignment = { horizontal: 'right', vertical: 'middle' };

  worksheet.mergeCells(`I${summaryRowIndex}:J${summaryRowIndex}`);
  const emptyCell = worksheet.getCell(`I${summaryRowIndex}`);
  emptyCell.value = '';

  for (let c = 1; c <= 10; c++) {
    const cell = summaryRow.getCell(c);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' },
    };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF94A3B8' } },
      bottom: { style: 'medium', color: { argb: 'FF94A3B8' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    };
  }

  // Column Widths
  worksheet.columns = [
    { key: 'no', width: 6 },
    { key: 'tanggal', width: 14 },
    { key: 'hari', width: 11 },
    { key: 'nama', width: 22 },
    { key: 'akun', width: 18 },
    { key: 'jenis', width: 18 },
    { key: 'bayar', width: 16 },
    { key: 'laba', width: 15 },
    { key: 'status', width: 14 },
    { key: 'tglBayar', width: 14 },
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const safeMitra = (namaMitra || 'Mitra').replace(/[^a-zA-Z0-9_-]/g, '_');
  anchor.href = url;
  anchor.download = `Rekap_Transaksi_${safeMitra}_${bulan}_${tahun}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}
