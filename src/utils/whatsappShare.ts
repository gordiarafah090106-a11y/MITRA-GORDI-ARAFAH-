import { toBlob } from 'html-to-image';

export interface ShareImageOptions {
  element: HTMLElement;
  filename: string;
  phone?: string;
  caption: string;
  title: string;
  backgroundColor?: string;
  onProgress?: (msg: string) => void;
}

export interface ShareResult {
  success: boolean;
  method: 'web-share' | 'app-scheme' | 'web-link';
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
 * Bagikan gambar hasil cetak/struk/invoice ke WhatsApp
 * 1. Menghasilkan PNG beresolusi tinggi dari DOM element
 * 2. Menggunakan Web Share API (jika didukung) untuk melampirkan file gambar langsung ke aplikasi WhatsApp
 * 3. Fallback: Mengunduh gambar ke perangkat / menyalin ke clipboard dan membuka aplikasi WhatsApp (whatsapp://) langsung ke chat tujuan
 */
export async function shareImageToWhatsApp(
  options: ShareImageOptions
): Promise<ShareResult> {
  const {
    element,
    filename,
    phone,
    caption,
    title,
    backgroundColor = '#0A101E',
    onProgress,
  } = options;

  const cleanPhone = formatWhatsAppPhone(phone);
  const safeFilename = filename.toLowerCase().endsWith('.png')
    ? filename
    : `${filename}.png`;

  onProgress?.('Memproses gambar...');

  try {
    // 1. Render element menjadi PNG Blob
    const blob = await toBlob(element, {
      cacheBust: true,
      quality: 0.96,
      pixelRatio: 2, // Kualitas tajam untuk kirim gambar
      backgroundColor,
    });

    if (!blob) {
      throw new Error('Gagal menghasilkan gambar dari tampilan');
    }

    const imageFile = new File([blob], safeFilename, { type: 'image/png' });

    // 2. Cek apakah perangkat mendukung Web Share API dengan File
    // Didukung di Android Chrome, iOS Safari, dll. Ini akan membuka WhatsApp dengan GAMBAR terlampir!
    const canShareFiles =
      typeof navigator !== 'undefined' &&
      typeof navigator.canShare === 'function' &&
      typeof navigator.share === 'function' &&
      navigator.canShare({ files: [imageFile] });

    if (canShareFiles) {
      onProgress?.('Membuka aplikasi WhatsApp...');
      try {
        await navigator.share({
          files: [imageFile],
          title: title || 'Faktur / Struk Mitra',
          text: caption,
        });

        return {
          success: true,
          method: 'web-share',
          message: 'Berhasil dibagikan ke WhatsApp',
        };
      } catch (shareErr: any) {
        // Jika user membatalkan sheet bawaan OS, keluar dengan aman
        if (shareErr?.name === 'AbortError') {
          return { success: false, method: 'web-share', message: 'Dibatalkan' };
        }
        console.warn('Web Share dibatalkan atau gagal, beralih ke deep link:', shareErr);
      }
    }

    // 3. Fallback: Jika Web Share file tidak didukung (misal browser desktop)
    onProgress?.('Menyimpan gambar ke perangkat...');

    // a) Salin gambar ke clipboard jika browser mengizinkan
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
      } catch (clipErr) {
        console.log('Clipboard write skip:', clipErr);
      }
    }

    // b) Unduh file gambar otomatis ke galeri/unduhan
    const objectUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = objectUrl;
    downloadLink.download = safeFilename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);

    // c) Buka aplikasi WhatsApp yang sedang terpasang di perangkat melalui protokol whatsapp://
    onProgress?.('Membuka aplikasi WhatsApp...');
    const encodedText = encodeURIComponent(caption);
    const waDeepLink = cleanPhone
      ? `whatsapp://send?phone=${cleanPhone}&text=${encodedText}`
      : `whatsapp://send?text=${encodedText}`;

    const waWebFallback = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;

    // Jalankan deep link langsung ke APK WhatsApp
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = waDeepLink;
      // Fallback ke web jika aplikasi tidak merespon dalam 1.5 detik
      setTimeout(() => {
        window.open(waWebFallback, '_blank');
      }, 1500);
    } else {
      // Desktop: Buka deep link whatsapp:// (untuk WA Desktop) dengan fallback WA Web
      window.open(waDeepLink, '_self');
      setTimeout(() => {
        window.open(waWebFallback, '_blank');
      }, 1500);
    }

    return {
      success: true,
      method: 'app-scheme',
      message: 'Gambar tersimpan & aplikasi WhatsApp dibuka',
    };
  } catch (error: any) {
    console.error('Error saat share ke WhatsApp:', error);
    // Fallback paling dasar jika render gambar error
    const encodedText = encodeURIComponent(caption);
    const cleanPhone = formatWhatsAppPhone(phone);
    const fallbackUrl = cleanPhone
      ? `whatsapp://send?phone=${cleanPhone}&text=${encodedText}`
      : `whatsapp://send?text=${encodedText}`;
    window.location.href = fallbackUrl;

    return {
      success: false,
      method: 'web-link',
      message: error?.message || 'Gagal membuat gambar',
    };
  }
}
