'use client';
/**
 * NOTYA-RECETE-04 (Kaan, 2026-09-25) — Plan metni ile İlaçlar listesi ayrıştığında onaydan önce açılan kart.
 *
 * Canlı vaka (Umutcan): hekim revizyonda yalnız Plan metnini "Augmentin ES 10 gün + Calpol" yaptı; reçeteye ve
 * hasta dosyasına giden TEK kaynak olan İlaçlar listesi "Amoksisilin 7 gün + Parasetamol" kaldı. Hekim Plan'ı
 * okur ve orayı düzenler — ikinci bir alanı elle yeniden yazmasını beklemek sadelik ilkesine aykırı.
 *
 * Karar (Kaan): native window.confirm yerine sayfa içi kart. Ayşe Plan'dan listeyi çıkarır, iki liste yan
 * yana görünür, öneri düzenlenebilir. Hiçbir şey otomatik yazılmaz — "not onayı = ilaç onayı" hekimde kalır.
 * Ayşe çıkaramazsa kart düz uyarıya düşer (mevcut listeyle onayla / vazgeç).
 */
import { useEffect, useState } from 'react';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';
import { ILAC_UYUM_ISTEK, ilacDetayMetni, ilacOnerisiCoz, type IlacSatiri } from '@/lib/doktor/receteAktarim';

export type IlacUyumDurumu =
  | { tur: 'kontrol' }
  | { tur: 'oneri'; mevcut: IlacSatiri[]; oneri: IlacSatiri[] }
  | { tur: 'uyari'; mevcut: IlacSatiri[] };

/** Formdaki İlaçlar alanının satır biçimi ("Ad — doz — kullanım — süre"); boş alanlar yer tutar. */
export function ilacSatiriMetni(i: IlacSatiri): string {
  return [i.ad, i.doz, i.kullanim, i.sure].map((x) => (x || '').trim()).join(' — ').replace(/( — )+$/, '');
}

/** Ayşe'den (not-konsult) yalnız Plan'a göre İlaçlar listesini ister. Başarısız/boş → null. */
export async function planaGoreIlacOnerisi(token: string, noteId: string, taslak: Record<string, unknown>): Promise<IlacSatiri[] | null> {
  const kontrolor = new AbortController();
  const zamanAsimi = setTimeout(() => kontrolor.abort(), 25000);
  try {
    const r = await fetch('/api/doktor/not-konsult', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      signal: kontrolor.signal,
      body: JSON.stringify({ noteId, taslak, mesajlar: [{ rol: 'doktor', icerik: ILAC_UYUM_ISTEK }] }),
    });
    if (!r.ok) return null;
    const d = await r.json();
    return ilacOnerisiCoz(d?.duzenlemeler?.ilaclar);
  } catch {
    return null;
  } finally {
    clearTimeout(zamanAsimi);
  }
}

/**
 * NOTYA-RECETE-05 (Kaan, 2026-09-25): aynı Plan metni için Ayşe'ye ikinci kez gidilmez. Sayfa Plan
 * düzenlenince arka planda önceden okur; Onayla'da hazır sonuç kullanılır (bekleme olmaz).
 * Başarısız okuma önbellekte tutulmaz, Onayla'da yeniden denenir.
 */
const oneriOnbellegi = new Map<string, Promise<IlacSatiri[] | null>>();
export function planaGoreIlacOnerisiOnbellekli(token: string, noteId: string, plan: string, taslak: Record<string, unknown>): Promise<IlacSatiri[] | null> {
  const anahtar = noteId + '|' + plan.trim();
  const hazir = oneriOnbellegi.get(anahtar);
  if (hazir) return hazir;
  const p = planaGoreIlacOnerisi(token, noteId, taslak);
  oneriOnbellegi.set(anahtar, p);
  void p.then((r) => { if (!r) oneriOnbellegi.delete(anahtar); });
  if (oneriOnbellegi.size > 20) {
    const ilk = oneriOnbellegi.keys().next().value;
    if (ilk !== undefined) oneriOnbellegi.delete(ilk);
  }
  return p;
}

const dugme = (ana: boolean): React.CSSProperties => ({
  background: ana ? CHROME_RENK.pine : '#FFFFFF',
  color: ana ? '#FFFFFF' : CHROME_RENK.ink,
  border: ana ? 'none' : '1px solid rgba(58,44,34,0.18)',
  borderRadius: 10, padding: '10px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
});

/** Okunur ilaç satırları: ad kalın, ayrıntı gri tek satır (boş alanlar atlanır). */
function IlacSatirlari({ ilaclar, vurgu }: { ilaclar: IlacSatiri[]; vurgu?: boolean }) {
  return (
    <div style={{ background: '#FFFFFF', border: vurgu ? '1px solid rgba(47,67,52,0.35)' : '1px solid rgba(58,44,34,0.12)', borderRadius: 8, padding: '2px 12px', color: CHROME_RENK.ink }}>
      {ilaclar.length ? ilaclar.map((i, k) => {
        const detay = ilacDetayMetni(i);
        return (
          <div key={k} style={{ padding: '8px 0', borderTop: k ? '1px solid rgba(58,44,34,0.08)' : 'none' }}>
            <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>{i.ad}</div>
            {detay ? <div style={{ fontSize: 12.5, color: CHROME_RENK.muted, lineHeight: 1.4, marginTop: 2 }}>{detay}</div> : null}
          </div>
        );
      }) : <div style={{ color: CHROME_RENK.muted, padding: '8px 0', fontSize: 13.5 }}>(boş)</div>}
    </div>
  );
}

function Liste({ baslik, ilaclar }: { baslik: string; ilaclar: IlacSatiri[] }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: CHROME_RENK.muted, marginBottom: 4 }}>{baslik}</div>
      <IlacSatirlari ilaclar={ilaclar} />
    </div>
  );
}

export default function IlacUyumKarti({ durum, onGuncelleOnayla, onMevcutlaOnayla, onVazgec }: {
  durum: IlacUyumDurumu;
  onGuncelleOnayla: (ilacMetni: string) => void;
  onMevcutlaOnayla: () => void;
  onVazgec: () => void;
}) {
  const [metin, setMetin] = useState('');
  const [duzenle, setDuzenle] = useState(false);
  useEffect(() => {
    if (durum.tur === 'oneri') setMetin(durum.oneri.map(ilacSatiriMetni).join('\n'));
    setDuzenle(false);
  }, [durum]);

  return (
    <div data-testid="ilac-uyum-karti" role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(44,51,38,0.38)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', background: CHROME_RENK.paper, borderRadius: 14, padding: 20, boxShadow: '0 12px 40px rgba(0,0,0,0.18)', color: CHROME_RENK.ink, fontFamily: 'system-ui' }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: CHROME_RENK.warn }}>Plan ile İlaçlar listesi farklı</div>
        <div style={{ fontSize: 13, color: CHROME_RENK.muted, margin: '4px 0 14px', lineHeight: 1.5 }}>
          Reçeteye ve hasta dosyasına yalnızca İlaçlar listesi yazılır.
        </div>

        {durum.tur === 'kontrol' ? (
          <div data-testid="ilac-uyum-kontrol" style={{ fontSize: 14, padding: '18px 0' }}>Ayşe Plan'daki ilaçları listeyle karşılaştırıyor…</div>
        ) : null}

        {durum.tur === 'oneri' ? (
          <div style={{ display: 'grid', gap: 12 }}>
            <Liste baslik="Şu anki İlaçlar listesi" ilaclar={durum.mevcut} />
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: CHROME_RENK.pine }}>Plan'a göre</div>
                {duzenle ? null : (
                  <button type='button' data-testid='ilac-uyum-duzenle' onClick={() => setDuzenle(true)} style={{ border: 'none', background: 'transparent', color: CHROME_RENK.pine, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>Düzenle</button>
                )}
              </div>
              {duzenle ? (
                <>
                  <textarea
                    data-testid='ilac-uyum-oneri'
                    value={metin}
                    autoFocus
                    onChange={(e) => setMetin(e.target.value)}
                    rows={Math.max(3, durum.oneri.length + 1)}
                    style={{ width: '100%', background: '#FFFFFF', border: '1px solid rgba(47,67,52,0.35)', borderRadius: 8, color: CHROME_RENK.ink, fontSize: 13.5, lineHeight: 1.6, padding: '8px 12px', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' }}
                  />
                  <div style={{ fontSize: 11.5, color: CHROME_RENK.muted, marginTop: 2 }}>Her satır bir ilaç: Ad — doz — kullanım — süre. Bilinmeyen alanı boş bırakabilirsiniz.</div>
                </>
              ) : (
                <IlacSatirlari ilaclar={durum.oneri} vurgu />
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              <button type="button" data-testid="ilac-uyum-guncelle" disabled={!metin.trim()} onClick={() => onGuncelleOnayla(metin)} style={{ ...dugme(true), opacity: metin.trim() ? 1 : 0.5 }}>Plan'a göre güncelle ve onayla</button>
              <button type="button" data-testid="ilac-uyum-mevcut" onClick={onMevcutlaOnayla} style={dugme(false)}>Mevcut listeyle onayla</button>
              <button type="button" data-testid="ilac-uyum-vazgec" onClick={onVazgec} style={{ ...dugme(false), border: 'none', background: 'transparent', color: CHROME_RENK.muted }}>Vazgeç</button>
            </div>
          </div>
        ) : null}

        {durum.tur === 'uyari' ? (
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>Ayşe şu an Plan'dan bir liste çıkaramadı. Plan'daki tedavi aşağıdaki listeyle uyuşmuyorsa önce İlaçlar listesini düzeltin.</div>
            <Liste baslik="Şu anki İlaçlar listesi" ilaclar={durum.mevcut} />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              <button type="button" data-testid="ilac-uyum-vazgec" onClick={onVazgec} style={dugme(true)}>Vazgeç, listeyi düzelteyim</button>
              <button type="button" data-testid="ilac-uyum-mevcut" onClick={onMevcutlaOnayla} style={dugme(false)}>Mevcut listeyle onayla</button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
