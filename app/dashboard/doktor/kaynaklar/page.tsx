'use client';

/**
 * TR-PROTOKOL-KUTUPHANESI (Kaan, 2026-11-24) — Kaynak kütüphanesi: the official Turkish documents Notya works from, per branş
 * (all 30 medical branşlar + 10 Özel Branşlar), each with its edition exactly as published, the official link and the date it
 * was last checked. An unconfirmed edition is said plainly ("sürüm doğrulanmadı"), never guessed. Data: GET /api/doktor/kaynaklar.
 * Opening a new-edition Fısıltı lands here with ?duyuru=<id>, which marks that announcement seen for this doctor.
 */
export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toolsShell, toolsCard } from '@/lib/doktor/toolsUi';
import { CHROME_RENK as R, CHROME_FONT } from '@/lib/doktor/chromeTheme';
import { doktorFetch } from '@/lib/doktor/oturumFetch';
import type { KutuphaneGorunumu } from '@/lib/kaynaklar/protokolKutuphanesi/kutuphane';

type Duyuru = { id: string; belge_id: string; baslik: string; surum: string | null; yil: number | null; url: string | null; yayin_at: string };
type Veri = KutuphaneGorunumu & { duyurular: Duyuru[] };

const DURUM_ETIKETI: Record<string, { metin: string; renk: string }> = {
  guncel: { metin: 'Güncel', renk: R.pine },
  dogrulanamadi: { metin: 'Sürüm doğrulanmadı', renk: R.warn },
  'yerine-yenisi-geldi': { metin: 'Yerine yenisi geldi', renk: R.muted },
};

const tarih = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });

function Sayfa() {
  const arama = useSearchParams();
  const [brans, setBrans] = useState<string>(arama.get('brans') || '');
  const [veri, setVeri] = useState<Veri | null>(null);
  const [hata, setHata] = useState(false);

  useEffect(() => {
    const duyuru = arama.get('duyuru');
    if (duyuru) void doktorFetch('/api/doktor/kaynaklar', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ duyuruId: duyuru }) }).catch(() => null);
  }, [arama]);

  useEffect(() => {
    let iptal = false;
    setHata(false);
    void doktorFetch(`/api/doktor/kaynaklar${brans ? `?brans=${encodeURIComponent(brans)}` : ''}`, { cache: 'no-store' })
      .then(async (r) => { if (!r.ok) throw new Error(); const j = (await r.json()) as Veri; if (!iptal) { setVeri(j); if (!brans) setBrans(j.secili); } })
      .catch(() => { if (!iptal) setHata(true); });
    return () => { iptal = true; };
  }, [brans]);

  return (
    <div style={toolsShell}>
      <div style={{ maxWidth: 960 }}>
        <div style={{ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 15, color: '#6d6055', marginBottom: 4 }}>Doktor</div>
        <h1 style={{ fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 30, margin: 0, color: '#2e251d', letterSpacing: '-0.02em' }}>Kaynak kütüphanesi</h1>
        <p style={{ color: R.muted, fontSize: 14, margin: '6px 0 18px', lineHeight: 1.5 }}>
          Ayşe&apos;nin ve not önerilerinin dayandığı resmî Türk kaynakları: Sağlık Bakanlığı protokol ve rehberleri, SGK kuralları ve dernek kılavuzları.
          Sürüm yalnız resmî kaynaktan doğrulandığında yazılır; kaynaklar her ay yeniden kontrol edilir.
        </p>

        <div style={{ ...toolsCard, marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <label htmlFor="kaynak-brans" style={{ fontSize: 14, color: R.ink, fontWeight: 600 }}>Branş</label>
          <select id="kaynak-brans" value={brans} onChange={(e) => setBrans(e.target.value)} style={{ minWidth: 240, padding: '8px 10px', borderRadius: 10, border: `1px solid ${R.border}`, background: '#fff', color: R.ink, fontSize: 14 }}>
            {(['Tıp branşları', 'Özel Branşlar'] as const).map((g) => (
              <optgroup key={g} label={g}>
                {(veri?.branslar || []).filter((b) => b.grup === g).map((b) => <option key={b.kod} value={b.kod}>{b.ad}{b.kod === veri?.doktorBransi ? ' (branşınız)' : ''}</option>)}
              </optgroup>
            ))}
          </select>
          {veri && (
            <span style={{ fontSize: 13, color: R.muted }}>
              {veri.kapsam.toplam} belge · {veri.kapsam.surumDogrulanmis} sürümü doğrulanmış · {veri.kapsam.dogrulanamadi} doğrulanamadı
            </span>
          )}
        </div>

        {hata && <div style={{ ...toolsCard, color: R.warn }}>Kütüphane yüklenemedi — biraz sonra tekrar deneyin.</div>}
        {!veri && !hata && <p style={{ color: R.muted }}>Yükleniyor…</p>}

        {veri && veri.duyurular.length > 0 && (
          <div style={{ ...toolsCard, marginBottom: 16, borderColor: 'rgba(47,67,52,0.25)' }}>
            <div style={{ fontFamily: CHROME_FONT.serif, fontSize: 18, color: R.pine, marginBottom: 6 }}>Yeni sürümler</div>
            {veri.duyurular.map((d) => (
              <div key={d.id} style={{ fontSize: 14, color: R.ink, padding: '4px 0' }}>
                {d.baslik}{d.surum ? ` · ${d.surum}` : ''} <span style={{ color: R.muted }}>({tarih(d.yayin_at)})</span>
                {d.url && <> · <a href={d.url} target="_blank" rel="noopener noreferrer" style={{ color: R.pine }}>Resmî belge</a></>}
              </div>
            ))}
          </div>
        )}

        {veri && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {veri.belgeler.map((b) => {
              const d = DURUM_ETIKETI[b.durum];
              return (
                <div key={b.id} style={{ ...toolsCard, padding: 16, opacity: b.durum === 'yerine-yenisi-geldi' ? 0.7 : 1 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: R.ink, overflowWrap: 'anywhere' }}>{b.baslik}</div>
                    <span style={{ fontSize: 12, color: d.renk, border: `1px solid ${d.renk}`, borderRadius: 999, padding: '1px 8px', whiteSpace: 'nowrap' }}>{d.metin}</span>
                  </div>
                  <div style={{ fontSize: 13, color: R.muted, marginTop: 4, lineHeight: 1.5 }}>
                    {b.yayinci}
                    {b.surum ? <> · <strong style={{ color: R.ink, fontWeight: 600 }}>{b.surum}</strong></> : b.durum === 'dogrulanamadi' ? ' · sürüm doğrulanmadı' : null}
                    {b.yayinNo ? <> · SB Yayın No. {b.yayinNo}</> : null}
                    {' · '}son kontrol {tarih(b.sonDogrulama)}
                  </div>
                  {b.not && <div style={{ fontSize: 13, color: R.muted, marginTop: 6, lineHeight: 1.45 }}>{b.not}</div>}
                  {b.bolumler.length > 0 && (
                    <details style={{ marginTop: 8 }}>
                      <summary style={{ fontSize: 13, color: R.pine, cursor: 'pointer' }}>Bölümler ({b.bolumler.length})</summary>
                      <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 13, color: R.ink, lineHeight: 1.6 }}>
                        {b.bolumler.map((x) => <li key={x.baslik}>{x.baslik}{x.sayfa ? ` — s. ${x.sayfa}` : ''}</li>)}
                      </ul>
                    </details>
                  )}
                  <div style={{ marginTop: 8, fontSize: 13 }}>
                    {b.url
                      ? <a href={b.url} target="_blank" rel="noopener noreferrer" style={{ color: R.pine }}>Resmî kaynağı aç ↗</a>
                      : <span style={{ color: R.muted }}>Resmî bağlantı bulunamadı</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function KaynakKutuphanesiSayfasi() {
  return (
    <React.Suspense fallback={null}>
      <Sayfa />
    </React.Suspense>
  );
}
