'use client';
/**
 * KBB-EXCEPTIONAL-01 — Araçlar › KBB kohort paneli. KBB-only.
 * /api/doktor/kulak-burun-bogaz/kohort GET: hekimin kbb_* kaydı olan hastaları, bayraklarıyla.
 * POST: seçilen hastalara hasta-güvenli hatırlatma (tanı / dB / bant / ilaç adı içermez).
 * Açık kırmızı bayrağı olan hastaya "sizi arayacağız" mesajı gider — acil durum portal mesajıyla
 * yönetilmez, hekim arar.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi';
import { kbbStil, Istatistik, TaslakNotu, Rozet } from './KbbAracKabugu';
import { KBB_BAYRAK_AD, kbbKohortFiltre, type KbbKohortBayrak, type KbbKohortSatir } from '../../engines/kohort';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

const S = kbbStil;
const BAYRAKLAR = Object.keys(KBB_BAYRAK_AD) as KbbKohortBayrak[];

export default function KbbKohortAraci() {
  const [satirlar, setSatirlar] = useState<KbbKohortSatir[] | null>(null);
  const [toplam, setToplam] = useState(0);
  const [suzgec, setSuzgec] = useState<KbbKohortBayrak[]>([]);
  const [secili, setSecili] = useState<string[]>([]);
  const [durum, setDurum] = useState('');
  const [hata, setHata] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);

  const yukle = useCallback(async () => {
    setHata('');
    try {
      const t = await getAccessTokenAsync();
      const r = await fetch('/api/doktor/kulak-burun-bogaz/kohort', { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setHata(j.error || 'Kohort yüklenemedi'); setSatirlar([]); return; }
      setSatirlar(j.satirlar || []);
      setToplam(j.toplamHasta || 0);
    } catch { setHata('Kohort yüklenemedi'); setSatirlar([]); }
  }, []);

  useEffect(() => { yukle(); }, [yukle]);

  const gorunen = kbbKohortFiltre(satirlar || [], suzgec);

  const gonder = async () => {
    setDurum(''); setHata(''); setGonderiliyor(true);
    try {
      const t = await getAccessTokenAsync();
      const r = await fetch('/api/doktor/kulak-burun-bogaz/kohort', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientIds: secili }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setHata(j.error || 'Gönderilemedi'); return; }
      setDurum(`${j.gonderilen} hatırlatma gönderildi${j.atlanan ? `, ${j.atlanan} atlandı (son 7 gün içinde gönderilmiş veya bayrağı kapanmış)` : ''}.`);
      setSecili([]);
      await yukle();
    } catch { setHata('Gönderilemedi'); }
    finally { setGonderiliyor(false); }
  };

  return (
    <>
      <div style={S.kutu}>
        <div style={S.etiket}>Süzgeç</div>
        <div style={S.satir}>
          {BAYRAKLAR.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setSuzgec((p) => (p.includes(b) ? p.filter((x) => x !== b) : [...p, b]))}
              style={{ ...S.ghost, background: suzgec.includes(b) ? 'rgba(79,70,229,0.25)' : 'transparent', color: suzgec.includes(b) ? '#C7D2FE' : CHROME_RENK.muted }}
            >{KBB_BAYRAK_AD[b]}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
          <Istatistik deger={satirlar == null ? '…' : gorunen.length} etiket="Bayraklı hasta" ton={gorunen.length ? 'uyari' : 'iyi'} />
          <Istatistik deger={satirlar == null ? '…' : gorunen.filter((s) => s.bayraklar.includes('risk_acik')).length} etiket="Açık kırmızı bayrak" ton={gorunen.some((s) => s.bayraklar.includes('risk_acik')) ? 'kirmizi' : 'notr'} />
          <Istatistik deger={satirlar == null ? '…' : toplam} etiket="Kohortta hasta" />
        </div>
        {hata && <div style={{ ...S.hata, marginTop: 8 }}>{hata}</div>}
      </div>

      <div style={S.kutu}>
        {satirlar != null && !gorunen.length && <div style={S.metin}>Bayraklı hasta yok.</div>}
        {gorunen.map((s) => (
          <label key={s.patientId} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={secili.includes(s.patientId)}
              onChange={(e) => setSecili((p) => (e.target.checked ? [...p, s.patientId] : p.filter((x) => x !== s.patientId)))}
              style={{ width: 20, height: 20, marginTop: 3 }}
            />
            <span style={{ flex: 1 }}>
              <span style={S.metin}>{s.ad}</span>
              <span style={{ ...S.kucuk, display: 'block' }}>
                {s.bayraklar.map((b) => KBB_BAYRAK_AD[b]).join(' · ')}
                {s.gecikmisSayi ? ` · ${s.gecikmisSayi} gecikmiş görev` : ''}
                {s.sonVizit ? ` · son vizit ${s.sonVizit}` : ' · vizit kaydı yok'}
                {s.portalVar ? '' : ' · portal daveti yok'}
              </span>
            </span>
            {s.bayraklar.includes('risk_acik') && <Rozet ton="kirmizi">⚑ kırmızı bayrak</Rozet>}
          </label>
        ))}
        <div style={S.satir}>
          <button type="button" style={S.btn} onClick={gonder} disabled={!secili.length || gonderiliyor}>
            {gonderiliyor ? 'Gönderiliyor…' : `Hatırlatma gönder (${secili.length})`}
          </button>
          <button type="button" style={S.ghost} onClick={() => setSecili(gorunen.map((s) => s.patientId))} disabled={!gorunen.length}>Tümünü seç</button>
        </div>
        {durum && <div style={{ ...S.iyi, marginTop: 8 }}>{durum}</div>}
        <TaslakNotu>
          Hatırlatma metni klinik bağlam taşımaz: tanı, dB değeri, işitme bandı ve ilaç adı yazılmaz. Açık kırmızı
          bayrağı olan hastaya “sizinle iletişime geçeceğiz” mesajı gider — acil durum portal mesajıyla yönetilmez.
        </TaslakNotu>
      </div>
    </>
  );
}
