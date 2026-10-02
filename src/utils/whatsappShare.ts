import { toBlob, toPng } from 'html-to-image';

export interface ShareImageOptions {
  element: HTMLElement;
  filename: string;
  phone?: string;
  backgroundColor?: string;
  targetWidth?: number;
  onProgress?: (msg: string) => void;
}

export interface ShareResult {
  success: boolean;
  method: 'web-share' | 'app-scheme' | 'download';
  message?: string;
}

/**
 * Format nomor telepon Indonesia ke format internasional (62xxx)
 */
export function formatWhatsAppPhone(phone?: string): string {
  if (!phone) return '';
  let clean = phone.replace(/[^0-9]/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  } else if (clean.startsWith('+62')) {
    clean = '62' + clean.slice(3);
  } else if (!clean.startsWith('62') && clean.length > 8) {
    clean = '62' + clean;
  }
  return clean;
}

/**
 * Buat klon elemen pada kontainer offscreen dengan lebar tetap (desktop width)
 * agar saat di-render menjadi gambar di HP (layar sempit), tabel & harga di sisi kanan
 * tidak pernah terpotong (kepotong).
 */
async function withStagedElement<T>(
  element: HTMLElement,
  targetWidth: number,
  backgroundColor: string,
  callback: (stagedEl: HTMLElement, width: number, height: number) => Promise<T>
): Promise<T> {
  const stageContainer = document.createElement('div');
  stageContainer.style.position = 'fixed';
  stageContainer.style.top = '0';
  stageContainer.style.left = '-9999px';
  stageContainer.style.width = `${targetWidth}px`;
  stageContainer.style.backgroundColor = backgroundColor;
  stageContainer.style.zIndex = '-9999';
  stageContainer.style.pointerEvents = 'none';
  stageContainer.style.overflow = 'visible';

  const cloned = element.cloneNode(true) as HTMLElement;
  cloned.style.width = `${targetWidth}px`;
  cloned.style.minWidth = `${targetWidth}px`;
  cloned.style.maxWidth = `${targetWidth}px`;
  cloned.style.margin = '0';
  cloned.style.boxSizing = 'border-box';
  cloned.style.overflow = 'visible';

  // Pastikan untuk invoice punya padding yang cukup di semua sisi agar harga kanan tidak mepet/terpotong
  if (element.id === 'printable-invoice-canvas') {
    cloned.style.padding = '28px';
  }

  // Pastikan semua elemen di dalam klon tidak memotong konten secara horizontal (overflow-x)
  const scrollableNodes = cloned.querySelectorAll<HTMLElement>('.overflow-x-auto, .overflow-hidden, table');
  scrollableNodes.forEach((node) => {
    // Jangan ubah overflow-hidden milik bingkai logo bulat/kotak kecil
    if (node.classList.contains('w-14') && node.classList.contains('h-14')) {
      return;
    }
    node.style.overflow = 'visible';
    node.style.overflowX = 'visible';
  });

  // Pastikan seluruh sel tabel yang berisi harga tidak terpotong
  const cells = cloned.querySelectorAll<HTMLElement>('th, td');
  cells.forEach((cell) => {
    if (cell.classList.contains('text-right')) {
      cell.style.whiteSpace = 'nowrap';
      cell.style.paddingRight = '6px';
    }
  });

  stageContainer.appendChild(cloned);
  document.body.appendChild(stageContainer);

  try {
    // Tunggu browser menghitung ulang layout pada ukuran targetWidth penuh
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    );

    const width = Math.ceil(cloned.scrollWidth || cloned.offsetWidth || targetWidth);
    const height = Math.ceil(cloned.scrollHeight || cloned.offsetHeight);

    return await callback(cloned, width, height);
  } finally {
    if (stageContainer.parentNode) {
      stageContainer.parentNode.removeChild(stageContainer);
    }
  }
}

/**
 * Menghasilkan PNG Data URL dengan ukuran utuh (anti-kepotong di HP)
 */
export async function captureElementAsPngDataUrl(
  element: HTMLElement,
  options: { backgroundColor?: string; targetWidth?: number } = {}
): Promise<string> {
  const defaultWidth = element.id === 'printable-thermal-struk' ? 380 : 560;
  const targetWidth = options.targetWidth || defaultWidth;
  const backgroundColor = options.backgroundColor || '#090E1A';

  return withStagedElement(element, targetWidth, backgroundColor, async (stagedEl, width, height) => {
    return await toPng(stagedEl, {
      cacheBust: true,
      quality: 0.98,
      pixelRatio: 2,
      width,
      height,
      canvasWidth: width,
      canvasHeight: height,
      backgroundColor,
    });
  });
}

/**
 * Menghasilkan PNG Blob dengan ukuran utuh (anti-kepotong di HP)
 */
export async function captureElementAsBlob(
  element: HTMLElement,
  options: { backgroundColor?: string; targetWidth?: number } = {}
): Promise<Blob> {
  const defaultWidth = element.id === 'printable-thermal-struk' ? 380 : 560;
  const targetWidth = options.targetWidth || defaultWidth;
  const backgroundColor = options.backgroundColor || '#090E1A';

  return withStagedElement(element, targetWidth, backgroundColor, async (stagedEl, width, height) => {
    const blob = await toBlob(stagedEl, {
      cacheBust: true,
      quality: 0.98,
      pixelRatio: 2,
      width,
      height,
      canvasWidth: width,
      canvasHeight: height,
      backgroundColor,
    });
    if (!blob) {
      throw new Error('Gagal menghasilkan gambar dari tampilan');
    }
    return blob;
  });
}

/**
 * Bagikan HANYA GAMBAR hasil cetak/struk/invoice ke WhatsApp (tanpa teks chat tambahan)
 */
export async function shareImageToWhatsApp(
  options: ShareImageOptions
): Promise<ShareResult> {
  const {
    element,
    filename,
    phone,
    backgroundColor = '#0A101E',
    targetWidth,
    onProgress,
  } = options;

  const cleanPhone = formatWhatsAppPhone(phone);
  const safeFilename = filename.toLowerCase().endsWith('.png')
    ? filename
    : `${filename}.png`;

  onProgress?.('Memproses gambar...');

  try {
    // 1. Render element menjadi PNG Blob dengan lebar penuh agar harga tidak terpotong di HP
    const blob = await captureElementAsBlob(element, {
      backgroundColor,
      targetWidth,
    });

    const imageFile = new File([blob], safeFilename, { type: 'image/png' });

    // 2. Gunakan Web Share API HANYA dengan files: [imageFile] (TANPA title & TANPA text/caption)
    // sehingga yang terkirim di WhatsApp murni hanya gambar struk/invoice saja tanpa chat tambahan.
    const canShareFiles =
      typeof navigator !== 'undefined' &&
      typeof navigator.canShare === 'function' &&
      typeof navigator.share === 'function' &&
      navigator.canShare({ files: [imageFile] });

    if (canShareFiles) {
      onProgress?.('Membuka WhatsApp...');
      try {
        await navigator.share({
          files: [imageFile],
        });

        return {
          success: true,
          method: 'web-share',
          message: 'Gambar berhasil dibagikan',
        };
      } catch (shareErr: any) {
        if (shareErr?.name === 'AbortError') {
          return { success: false, method: 'web-share', message: 'Dibatalkan' };
        }
        console.warn('Web Share gagal, beralih ke metode unduh gambar:', shareErr);
      }
    }

    // 3. Fallback jika perangkat tidak mendukung Web Share file (misal browser PC):
    // Salin gambar ke clipboard & unduh gambar, lalu buka WhatsApp tanpa teks chat
    onProgress?.('Menyimpan gambar...');

    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
      } catch (clipErr) {
        console.log('Clipboard write skip:', clipErr);
      }
    }

    const objectUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = objectUrl;
    downloadLink.download = safeFilename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);

    if (cleanPhone) {
      onProgress?.('Membuka WhatsApp...');
      window.location.href = `whatsapp://send?phone=${cleanPhone}`;
    }

    return {
      success: true,
      method: 'download',
      message: 'Gambar tersimpan (siap dikirim)',
    };
  } catch (error: any) {
    console.error('Error saat share gambar ke WhatsApp:', error);
    return {
      success: false,
      method: 'download',
      message: error?.message || 'Gagal membuat gambar',
    };
  }
}
