'use client';
/**
 * NOTYA-ILAC-SONLANDIR-01 (Kaan / Dr. Gökhan, 2026-09-25) — onaydan sonra tek sakin satır:
 * "Klacid süspansiyon ve Calpol şurup ilaç listesinden sonlandırıldı.  Geri al"
 * Geri al tam olarak o satırları yeniden aktif eder (sunucuda loglanır). Telefonda da ekranın altında durur.
 */
import { useState } from 'react';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';

export type IlacSonlandirmaBilgisi = { noteId: string; mesaj: string; ilacIds: string[] };

/** Onay yanıtından satır bilgisi; hiçbir ilaç sonlanmadıysa null. */
export function ilacSonlandirmaBilgisi(noteId: string, yanit: unknown): IlacSonlandirmaBilgisi | null {
  const s = (yanit as { ilacSonlandirma?: { mesaj?: unknown; sonlandirilan?: { id?: unknown }[] } } | null)?.ilacSonlandirma;
  const ids = Array.isArray(s?.sonlandirilan) ? s!.sonlandirilan.map((x) => String(x?.id || '')).filter(Boolean) : [];
  const mesaj = typeof s?.mesaj === 'string' ? s.mesaj : '';
  return ids.length && mesaj ? { noteId, mesaj, ilacIds: ids } : null;
}

export default function IlacSonlandirmaSatiri({ bilgi, onKapat, devamHref }: {
  bilgi: IlacSonlandirmaBilgisi;
  onKapat?: () => void;
  /** Onaydan sonra gidilecek sayfa (not sayfası beklemez; hekim satırı okuyup devam eder). */
  devamHref?: string;
}) {
  const [durum, setDurum] = useState<'hazir' | 'bekliyor' | 'geriAlindi' | 'hata'>('hazir');

  const geriAl = async () => {
    setDurum('bekliyor');
    try {
      const t = await ensureDoctorAccessToken();
      const r = await fetch(`/api/notes/${bilgi.noteId}/ilac-sonlandir-geri-al`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify({ ilacIds: bilgi.ilacIds }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j.success === false) throw new Error();
      setDurum('geriAlindi');
    } catch {
      setDurum('hata');
    }
  };

  const bag: React.CSSProperties = { border: 'none', background: 'transparent', color: CHROME_RENK.pine, fontSize: 14, fontWeight: 700, cursor: 'pointer', padding: '8px 10px', minHeight: 40, fontFamily: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' };

  return (
    <div role="status" data-testid="ilac-sonlandirma-satiri" style={{ position: 'fixed', left: 12, right: 12, bottom: 'calc(12px + env(safe-area-inset-bottom, 0px))', zIndex: 40, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <div style={{ pointerEvents: 'auto', maxWidth: 640, width: '100%', background: CHROME_RENK.paper, border: '1px solid rgba(47,67,52,0.3)', borderRadius: 12, boxShadow: '0 8px 28px rgba(0,0,0,0.14)', padding: '6px 8px 6px 16px', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', color: CHROME_RENK.ink, fontFamily: 'system-ui', fontSize: 14, lineHeight: 1.45 }}>
        <span style={{ flex: '1 1 220px', padding: '6px 0' }}>
          {durum === 'geriAlindi' ? 'Geri alındı — ilaçlar yeniden aktif.' : durum === 'hata' ? 'Geri alınamadı. Kullandığı İlaçlar listesinden yeniden aktif edebilirsiniz.' : bilgi.mesaj}
        </span>
        {durum === 'hazir' || durum === 'bekliyor' ? (
          <button type="button" data-testid="ilac-sonlandirma-geri-al" disabled={durum === 'bekliyor'} onClick={() => { void geriAl(); }} style={{ ...bag, opacity: durum === 'bekliyor' ? 0.6 : 1 }}>
            {durum === 'bekliyor' ? 'Geri alınıyor…' : 'Geri al'}
          </button>
        ) : null}
        {devamHref ? (
          <a href={devamHref} style={{ ...bag, color: CHROME_RENK.muted, fontWeight: 600 }}>Devam →</a>
        ) : onKapat ? (
          <button type="button" aria-label="Kapat" onClick={onKapat} style={{ ...bag, color: CHROME_RENK.muted, fontWeight: 600 }}>Tamam</button>
        ) : null}
      </div>
    </div>
  );
}
