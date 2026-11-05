'use client';
/**
 * AMELIYAT-NOTU-01 — the caesarean's STRUCTURED operation note inside the KD delivery spine. It replaces the old
 * free-text "Intraop" box (key: value lines in dogum_olaylari.intraop). Nothing recorded there is lost: an existing
 * intraop record is shown read-only above the form and stays in the delivery row; the new note is linked to the
 * delivery (ameliyat_notlari.dogum_id) and starts from the KD "sezaryen" template.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';
import type { AmeliyatSablonu } from '@/lib/doktor/ameliyatNotu';
import { AmeliyatNotuFormu, AmeliyatNotuOzeti, type AmeliyatNotuSatiri } from '@/components/doktor/HastaAmeliyatNotlari';

/** The legacy free-text record as readable lines ("kesi: Pfannenstiel"), or null when there is none. */
export function eskiIntraopMetni(intraop: Record<string, unknown> | null | undefined): string | null {
  if (!intraop || typeof intraop !== 'object') return null
  const satirlar = Object.entries(intraop).filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '').map(([k, v]) => `${k}: ${String(v)}`)
  return satirlar.length ? satirlar.join('\n') : null
}

export function SezaryenAmeliyatNotu({ patientId, dogumId, intraop }: { patientId: string; dogumId: string; intraop: Record<string, unknown> | null }) {
  const [notlar, setNotlar] = useState<AmeliyatNotuSatiri[] | null>(null);
  const [sablonlar, setSablonlar] = useState<AmeliyatSablonu[]>([]);
  const [acik, setAcik] = useState<string | 'yeni' | null>(null);
  const yukle = useCallback(async () => {
    const t = await getAccessTokenAsync();
    const r = await fetch(`/api/doktor/ameliyat-notlari?patientId=${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' });
    const j = await r.json().catch(() => ({}));
    setNotlar(((j.notlar || []) as AmeliyatNotuSatiri[]).filter((n) => n.dogum_id === dogumId));
    setSablonlar(j.sablonlar || []);
  }, [patientId, dogumId]);
  useEffect(() => { yukle(); }, [yukle]);
  const eski = eskiIntraopMetni(intraop);
  if (!notlar) return <div style={{ fontSize: 11, color: CHROME_RENK.muted }}>Ameliyat notu yükleniyor…</div>;
  const duzenlenen = acik && acik !== 'yeni' ? notlar.find((n) => n.id === acik) || null : null;
  return (
    <div data-kd="sezaryen-ameliyat-notu" style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 12, color: CHROME_RENK.ink, marginBottom: 4 }}>Intraop: yapılandırılmış sezaryen ameliyat notu</div>
      {notlar.map((n) => <AmeliyatNotuOzeti key={n.id} n={n} patientId={patientId} onDuzenle={() => setAcik(n.id)} />)}
      {!notlar.length && eski && !acik && <div style={{ fontSize: 12, whiteSpace: 'pre-wrap', color: CHROME_RENK.muted, background: '#F6F0E4', borderRadius: 8, padding: 8, marginBottom: 6 }}>Önceki serbest metin kaydı:{'\n'}{eski}</div>}
      {!acik && <button type="button" onClick={() => setAcik('yeni')} style={{ background: '#0F9B8E', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{notlar.length ? '+ Ek ameliyat notu' : 'Sezaryen ameliyat notu yaz'}</button>}
      {acik && (
        <AmeliyatNotuFormu key={acik} patientId={patientId} mevcut={duzenlenen} sablonlar={sablonlar} sabitSablon="sezaryen" dogumId={dogumId}
          eskiKayit={!duzenlenen ? eski : null} onKaydedildi={() => { setAcik(null); yukle(); }} onVazgec={() => setAcik(null)} />
      )}
    </div>
  );
}
