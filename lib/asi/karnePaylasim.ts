/**
 * ASI-KARNESI-01 — karne PDF'ini KULLANICININ KENDİ cihazından paylaşma / yazdırma (istemci). Sunucu e-posta göndermez.
 *
 * Kaan (2026-09-19): "ya PDF yapıp saklasın … ya da direkt istediği adrese e-mail etsin [kendi cihazından]. Son olarak bu
 * kartı yazdırabilmeli de." — Web Share API destek yoksa paylaş düğmesi gösterilmez (sessizce çalışmayan düğme yok);
 * mailto: ile dosya eklenemez, denenmez.
 */

/** Web Share API dosya paylaşımını destekliyor mu (masaüstü Safari / eski tarayıcı: hayır). */
export function dosyaPaylasimiVar(dosyaAdi: string): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function' || typeof File === 'undefined') return false
  try {
    return navigator.canShare({ files: [new File(['%PDF-1.4'], dosyaAdi, { type: 'application/pdf' })] })
  } catch {
    return false
  }
}

/** PDF'i gizli çerçevede açıp yazdırma diyaloğunu tetikler; tarayıcı izin vermezse PDF'i yeni sekmede açar. */
export function pdfYazdir(pdfBlobUrl: string): void {
  const cerceve = document.createElement('iframe')
  cerceve.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden'
  cerceve.src = pdfBlobUrl
  cerceve.onload = () => {
    try {
      cerceve.contentWindow?.focus()
      cerceve.contentWindow?.print()
    } catch {
      window.open(pdfBlobUrl, '_blank', 'noopener')
    }
    setTimeout(() => cerceve.remove(), 60_000)
  }
  document.body.appendChild(cerceve)
}
