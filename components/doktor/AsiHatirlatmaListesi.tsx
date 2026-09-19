'use client';
/**
 * ASI-KARNESI-01 (D) — "Yaklaşan aşılar — hekim onaylı hatırlatma".
 *
 * Kaan'ın kararı (2026-09-19): hatırlatma HEKİM ONAYIYLA gider — yaklaşan aşılar hekime listelenir, hekim satırı açıp
 * gidecek metni görür, onaylayıp gönderir. Otomatik gönderim yok. Mükerrer gönderim sunucuda engellidir (409).
 *
 * YENİ ARAÇ DEĞİLDİR: mevcut kohort paneline (Araçlar › Pediatri kohort, Aile hekimliği kohort) ve hasta dosyası › Aşılar
 * sekmesine (patientId ile) takılır. Veri: GET /api/doktor/asilar/hatirlatma — önizleme metni sunucudan gelir, gönderilen
 * metinle AYNI (lib/asi/hatirlatma.ts asiHatirlatmaMesaji). Gönder: POST { asiId, hekimOnayi: true }.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi';
import { useAracStil, Rozet } from '@/lib/doktor/aracUi';
import { trTarih } from '@/lib/asi/karneOkuma';
import type { AsiHatirlatmaSatiri } from '@/lib/asi/hatirlatma';

export const asiDosyaYolu = (patientId: string) => `/dashboard/doktor/hastalar/${encodeURIComponent(patientId)}?tab=asilar`;

/** Sunumsal liste (SSR testi için ayrı). */
export function AsiHatirlatmaListesiGorunum({
  satirlar, acik, setAcik, gonder, gonderilen, hata, hastaModu,
}: {
  satirlar: AsiHatirlatmaSatiri[] | null
  acik: string | null
  setAcik: (id: string | null) => void
  gonder: (asiId: string) => void
  gonderilen: string | null
  hata: string
  hastaModu: boolean
}) {
  const stil = useAracStil();
  const bekleyen = (satirlar || []).filter((s) => !s.gonderildi).length;
  return (
    <div style={stil.kutu} data-asi-hatirlatma="">
      <div style={{ ...stil.etiket, marginBottom: 0 }}>
        {hastaModu ? 'Aşı hatırlatması — hekim onaylı' : 'Yaklaşan aşılar — hekim onaylı hatırlatma'}{satirlar ? ` (${bekleyen} bekliyor)` : ''}
      </div>
      <div style={{ ...stil.kucuk, marginTop: 4 }}>
        Hekimin girdiği sonraki doz tarihi 30 gün içinde olan ya da geçen aşılar. Hiçbir hatırlatma otomatik gitmez: metni görün, onaylayın, Sağlığım mesajı olarak gönderilsin.
      </div>
      {satirlar == null ? <div style={{ ...stil.kucuk, marginTop: 8 }}>Yükleniyor…</div>
        : !satirlar.length ? <div style={{ ...stil.kucuk, marginTop: 8 }}>Yaklaşan ya da tarihi geçen aşı yok.</div>
          : (
            <div style={{ display: 'grid', gap: 6, marginTop: 10 }}>
              {satirlar.map((s) => (
                <div key={s.asiId} data-asi-hatirlatma-satir={s.asiId} style={{ padding: '8px 10px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.12)', display: 'grid', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', minHeight: 44 }}>
                    <Rozet ton={s.durum === 'gecikti' ? 'kirmizi' : 'uyari'}>{s.durumEtiketi}</Rozet>
                    {!hastaModu && <a href={asiDosyaYolu(s.patientId)} style={{ fontWeight: 700, fontSize: 14, color: '#EDF1F7', textDecoration: 'none', overflowWrap: 'anywhere' }}>{s.hastaAdi}</a>}
                    <span style={stil.kucuk}>{s.asiAdi}{s.dozNo ? ` · ${s.dozNo}. doz` : ''} → sonraki: {trTarih(s.sonrakiDozTarihi)}</span>
                    <span style={{ marginLeft: 'auto' }}>
                      {s.gonderildi
                        ? <Rozet ton="iyi">Hatırlatma gönderildi</Rozet>
                        : acik !== s.asiId && <button type="button" onClick={() => setAcik(s.asiId)} style={{ ...stil.ghost, minHeight: 40 }}>Metni gör ve gönder</button>}
                    </span>
                  </div>
                  {acik === s.asiId && !s.gonderildi && (
                    <div data-onizleme="" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8, display: 'grid', gap: 8 }}>
                      <div style={stil.kucuk}>Gidecek mesaj (Sağlığım › Mesajlar, konu: “{s.onizleme.konu}”):</div>
                      <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.5, color: '#EDF1F7', background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '8px 10px' }}>{s.onizleme.metin}</div>
                      {!s.portalVar && <div style={stil.kucuk}>Hastanın geçerli Sağlığım bağlantısı yok — mesaj, bağlantı açıldığında görünür; e-posta kayıtlıysa içeriksiz bir bildirim gider.</div>}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button type="button" disabled={gonderilen === s.asiId} onClick={() => gonder(s.asiId)} style={{ ...stil.btn, minHeight: 44 }}>{gonderilen === s.asiId ? 'Gönderiliyor…' : 'Onayla ve gönder'}</button>
                        <button type="button" onClick={() => setAcik(null)} style={{ ...stil.ghost, minHeight: 44 }}>Vazgeç</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
      {hata && <div role="alert" style={{ ...stil.hata, marginTop: 8 }}>{hata}</div>}
    </div>
  );
}

export default function AsiHatirlatmaListesi({ patientId, yenile = 0 }: { patientId?: string; yenile?: number }) {
  const [satirlar, setSatirlar] = useState<AsiHatirlatmaSatiri[] | null>(null);
  const [acik, setAcik] = useState<string | null>(null);
  const [gonderilen, setGonderilen] = useState<string | null>(null);
  const [hata, setHata] = useState('');

  const yukle = useCallback(async () => {
    try {
      const t = await getAccessTokenAsync();
      const r = await fetch(`/api/doktor/asilar/hatirlatma${patientId ? `?patientId=${encodeURIComponent(patientId)}` : ''}`, { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' });
      const j = (await r.json().catch(() => ({}))) as { satirlar?: AsiHatirlatmaSatiri[] };
      setSatirlar(Array.isArray(j.satirlar) ? j.satirlar : []);
    } catch { setSatirlar([]); }
  }, [patientId]);
  useEffect(() => { yukle(); }, [yukle, yenile]);

  async function gonder(asiId: string) {
    setHata(''); setGonderilen(asiId);
    try {
      const t = await getAccessTokenAsync();
      const r = await fetch('/api/doktor/asilar/hatirlatma', { method: 'POST', headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ asiId, hekimOnayi: true }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok && r.status !== 409) { setHata(j.error || 'Hatırlatma gönderilemedi.'); return; }
      setAcik(null);
      setSatirlar((xs) => (xs || []).map((s) => (s.asiId === asiId ? { ...s, gonderildi: true } : s)));
    } catch {
      setHata('Hatırlatma gönderilemedi.');
    } finally {
      setGonderilen(null);
    }
  }

  // Hasta dosyasında: listelenecek bir şey yoksa bölüm hiç görünmez.
  if (patientId && satirlar && satirlar.length === 0) return null;
  return <AsiHatirlatmaListesiGorunum satirlar={satirlar} acik={acik} setAcik={setAcik} gonder={gonder} gonderilen={gonderilen} hata={hata} hastaModu={!!patientId} />;
}
