'use client';
/**
 * BELGE-NO-01 (Kaan, 2026-11-05) — the DOCUMENT STAMP of every printout of the Türkiye build: document number, revision,
 * date and a QR code to the public verify page (/dogrula), which shows no patient data. CORE: every branch, every report.
 *
 * The content to be printed is hashed IN THE BROWSER (lib/belge/belge.ts → butunlukOzeti); only the hash, the type and
 * the source id leave the page — never the content. The server registers it (POST /api/belgeler/kayit): same content =
 * same revision; changed content = the next revision, which needs the doctor's reason (asked for here, hidden on paper).
 */
import React, { useEffect, useRef, useState } from 'react';
import QrKod from '@/components/belge/QrKod';
import { butunlukOzeti, dogrulamaAdresi, type BelgeKunyesi as Kunye, type BelgeTuru } from '@/lib/belge/belge';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

type Durum = { tur: 'bekliyor' } | { tur: 'tamam'; kunye: Kunye } | { tur: 'gerekce'; kunye: Kunye } | { tur: 'hata' };

export default function BelgeKunyesi({ tur, kaynakId, hastaId, icerik }: { tur: BelgeTuru; kaynakId: string; hastaId?: string | null; icerik: unknown }) {
  const [durum, setDurum] = useState<Durum>({ tur: 'bekliyor' });
  const [gerekce, setGerekce] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const sonOzet = useRef<string | null>(null);

  async function kaydet(ozet: string, neden?: string) {
    const t = await ensureDoctorAccessToken();
    if (!t) { setDurum({ tur: 'hata' }); return; }
    const r = await fetch('/api/belgeler/kayit', {
      method: 'POST',
      headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ tur, kaynakId, hastaId: hastaId || null, ozet, gerekce: neden || null }),
    });
    const j = (await r.json().catch(() => ({}))) as { durum?: string; kunye?: Kunye };
    if (r.ok && j.durum === 'tamam' && j.kunye) setDurum({ tur: 'tamam', kunye: j.kunye });
    else if (r.ok && j.durum === 'gerekce_gerekli' && j.kunye) setDurum({ tur: 'gerekce', kunye: j.kunye });
    else setDurum({ tur: 'hata' });
  }

  useEffect(() => {
    if (icerik == null) return;
    let iptal = false;
    const zaman = setTimeout(async () => {
      try {
        const ozet = await butunlukOzeti({ tur, kaynakId, icerik });
        if (iptal || ozet === sonOzet.current) return;
        sonOzet.current = ozet;
        await kaydet(ozet);
      } catch { if (!iptal) setDurum({ tur: 'hata' }); }
    }, 500);
    return () => { iptal = true; clearTimeout(zaman); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [icerik, tur, kaynakId, hastaId]);

  const kunye = durum.tur === 'tamam' || durum.tur === 'gerekce' ? durum.kunye : null;
  const tarih = kunye ? new Date(kunye.tarih).toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' }) : '';
  const adres = kunye && typeof window !== 'undefined' ? dogrulamaAdresi(window.location.origin, '/dogrula', kunye.dogrulamaKodu) : '';

  return (
    <div data-belge-kunyesi style={{ margin: '10px 0', fontFamily: 'system-ui, sans-serif' }}>
      {durum.tur === 'gerekce' && (
        <div className="yazdirma-gizle no-print" style={{ border: `1px solid ${CHROME_RENK.warn}`, background: '#FFF7ED', borderRadius: 10, padding: 12, marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#7C2D12', marginBottom: 6 }}>Bu belge, kayıtlı Rev. {durum.kunye.rev} sürümünden farklı. Yeni revizyon için gerekçe yazın.</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input value={gerekce} onChange={(e) => setGerekce(e.target.value)} maxLength={500} placeholder="Revizyon gerekçesi (ör. laboratuvar sonucu eklendi)" style={{ flex: 1, minWidth: 220, padding: 8, fontSize: 13, borderRadius: 8, border: `1px solid ${CHROME_RENK.border}` }} />
            <button type="button" disabled={gonderiliyor || gerekce.trim().length < 3} onClick={async () => { setGonderiliyor(true); try { if (sonOzet.current) await kaydet(sonOzet.current, gerekce.trim()); } finally { setGonderiliyor(false); } }} style={{ background: CHROME_RENK.pine, color: '#FAF8F4', border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: gerekce.trim().length < 3 ? 0.5 : 1 }}>Revizyonu kaydet</button>
          </div>
        </div>
      )}
      {durum.tur === 'hata' && <div className="yazdirma-gizle no-print" style={{ fontSize: 12, color: CHROME_RENK.warn }}>Belge numarası alınamadı. Sayfayı yenileyip tekrar deneyin.</div>}
      {kunye && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1px solid #bbb', borderRadius: 6, padding: '6px 10px', fontSize: 11, color: '#222' }}>
          <QrKod metin={adres} boyut={64} etiket="Belge doğrulama kodu" />
          <div style={{ lineHeight: 1.5 }}>
            <div><b>Belge No:</b> {kunye.belgeNo} · <b>Rev.</b> {durum.tur === 'gerekce' ? `${kunye.rev} (yeni revizyon kaydedilmedi)` : kunye.rev} · <b>Tarih:</b> {tarih}</div>
            <div style={{ color: '#555' }}>Doğrulama: karekodu okutun veya notya.io/dogrula adresine {kunye.dogrulamaKodu} kodunu girin.</div>
          </div>
        </div>
      )}
    </div>
  );
}
