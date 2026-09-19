'use client';
/**
 * PSIK-EXCEPTIONAL-01 — Araçlar › Psikiyatri kohort paneli. Psikiyatri-only.
 * /api/doktor/psikiyatri/kohort GET: hekimin psik_* kaydı olan hastaları, bayraklarıyla.
 * POST: seçilen hastalara hasta-güvenli hatırlatma (tanı / ölçek adı / skor / ilaç adı içermez).
 * Açık güvenlik bayrağı olan hastaya "sizi arayacağız" mesajı gider — risk portal mesajıyla yönetilmez.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi';
import { psikStil } from './PsikAracKabugu';
import { PSIK_BAYRAK_AD, psikKohortFiltre, type PsikKohortBayrak, type PsikKohortSatir } from '../../engines/kohort';

const BAYRAKLAR = Object.keys(PSIK_BAYRAK_AD) as PsikKohortBayrak[];

export default function PsikKohortAraci() {
  const [satirlar, setSatirlar] = useState<PsikKohortSatir[] | null>(null);
  const [toplam, setToplam] = useState(0);
  const [suzgec, setSuzgec] = useState<PsikKohortBayrak[]>([]);
  const [secili, setSecili] = useState<string[]>([]);
  const [durum, setDurum] = useState('');
  const [hata, setHata] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);

  const yukle = useCallback(async () => {
    setHata('');
    try {
      const t = await getAccessTokenAsync();
      const r = await fetch('/api/doktor/psikiyatri/kohort', { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setHata(j.error || 'Kohort yüklenemedi'); setSatirlar([]); return; }
      setSatirlar(j.satirlar || []);
      setToplam(j.toplamHasta || 0);
    } catch { setHata('Kohort yüklenemedi'); setSatirlar([]); }
  }, []);

  useEffect(() => { yukle(); }, [yukle]);

  const gorunen = psikKohortFiltre(satirlar || [], suzgec);

  const gonder = async () => {
    setDurum(''); setHata(''); setGonderiliyor(true);
    try {
      const t = await getAccessTokenAsync();
      const r = await fetch('/api/doktor/psikiyatri/kohort', {
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
      <div style={psikStil.kutu}>
        <div style={psikStil.etiket}>Süzgeç</div>
        <div style={psikStil.satir}>
          {BAYRAKLAR.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setSuzgec((p) => (p.includes(b) ? p.filter((x) => x !== b) : [...p, b]))}
              style={{ ...psikStil.ghost, background: suzgec.includes(b) ? 'rgba(99,102,241,0.25)' : 'transparent', color: suzgec.includes(b) ? '#C7D2FE' : '#C9D4E3' }}
            >{PSIK_BAYRAK_AD[b]}</button>
          ))}
        </div>
        <div style={{ ...psikStil.kucuk, marginTop: 8 }}>
          {satirlar == null ? 'Yükleniyor…' : `${gorunen.length} bayraklı hasta · kohortta ${toplam} hasta`}
        </div>
        {hata && <div style={{ ...psikStil.hata, marginTop: 8 }}>{hata}</div>}
      </div>

      <div style={psikStil.kutu}>
        {satirlar != null && !gorunen.length && <div style={psikStil.metin}>Bayraklı hasta yok.</div>}
        {gorunen.map((s) => (
          <label key={s.patientId} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={secili.includes(s.patientId)}
              onChange={(e) => setSecili((p) => (e.target.checked ? [...p, s.patientId] : p.filter((x) => x !== s.patientId)))}
              style={{ width: 20, height: 20, marginTop: 3 }}
            />
            <span style={{ flex: 1 }}>
              <span style={psikStil.metin}>{s.ad}</span>
              <span style={{ ...psikStil.kucuk, display: 'block' }}>
                {s.bayraklar.map((b) => PSIK_BAYRAK_AD[b]).join(' · ')}
                {s.gecikmisSayi ? ` · ${s.gecikmisSayi} gecikmiş görev` : ''}
                {s.sonVizit ? ` · son vizit ${s.sonVizit}` : ' · vizit kaydı yok'}
                {s.portalVar ? '' : ' · portal daveti yok'}
              </span>
            </span>
            {s.bayraklar.includes('risk_acik') && <span style={{ ...psikStil.hata, whiteSpace: 'nowrap' }}>⚑ güvenlik</span>}
          </label>
        ))}
        <div style={psikStil.satir}>
          <button type="button" style={psikStil.btn} onClick={gonder} disabled={!secili.length || gonderiliyor}>
            {gonderiliyor ? 'Gönderiliyor…' : `Hatırlatma gönder (${secili.length})`}
          </button>
          <button type="button" style={psikStil.ghost} onClick={() => setSecili(gorunen.map((s) => s.patientId))} disabled={!gorunen.length}>Tümünü seç</button>
        </div>
        {durum && <div style={{ ...psikStil.iyi, marginTop: 8 }}>{durum}</div>}
        <div style={{ ...psikStil.kucuk, marginTop: 10 }}>
          Hatırlatma metni ruh sağlığı bağlamı taşımaz: tanı, ölçek adı, skor ve ilaç adı yazılmaz. Açık güvenlik
          bayrağı olan hastaya “sizinle iletişime geçeceğiz” mesajı gider — risk portal mesajıyla yönetilmez, hekim arar.
        </div>
      </div>
    </>
  );
}
