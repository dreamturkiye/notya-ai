'use client';
/**
 * KARDIO-EXCEPTIONAL-01 — Araçlar › Kardiyoloji kohort paneli.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi';
import { kardioStil, Istatistik, TaslakNotu, Rozet } from './KardioAracKabugu';
import { KARDIO_BAYRAK_AD, kardioKohortFiltre, type KardioKohortBayrak, type KardioKohortSatir } from '../../engines/kohort';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

const S = kardioStil;
const BAYRAKLAR = Object.keys(KARDIO_BAYRAK_AD) as KardioKohortBayrak[];

export default function KardioKohortAraci() {
  const [satirlar, setSatirlar] = useState<KardioKohortSatir[] | null>(null);
  const [toplam, setToplam] = useState(0);
  const [suzgec, setSuzgec] = useState<KardioKohortBayrak[]>([]);
  const [secili, setSecili] = useState<string[]>([]);
  const [durum, setDurum] = useState('');
  const [hata, setHata] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);

  const yukle = useCallback(async () => {
    setHata('');
    try {
      const t = await getAccessTokenAsync();
      const r = await fetch('/api/doktor/kardiyoloji/kohort', { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setHata(j.error || 'Kohort yüklenemedi'); setSatirlar([]); return; }
      setSatirlar(j.satirlar || []);
      setToplam(j.toplamHasta || 0);
    } catch { setHata('Kohort yüklenemedi'); setSatirlar([]); }
  }, []);

  useEffect(() => { yukle(); }, [yukle]);

  const gorunen = kardioKohortFiltre(satirlar || [], suzgec);

  const gonder = async () => {
    setDurum(''); setHata(''); setGonderiliyor(true);
    try {
      const t = await getAccessTokenAsync();
      const r = await fetch('/api/doktor/kardiyoloji/kohort', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientIds: secili }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setHata(j.error || 'Gönderilemedi'); return; }
      setDurum(`${j.gonderilen} hatırlatma gönderildi${j.atlanan ? `, ${j.atlanan} atlandı` : ''}.`);
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
              style={{ ...S.ghost, background: suzgec.includes(b) ? 'rgba(220,38,38,0.25)' : 'transparent', color: suzgec.includes(b) ? '#FECACA' : CHROME_RENK.muted }}
            >{KARDIO_BAYRAK_AD[b]}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
          <Istatistik deger={satirlar == null ? '…' : gorunen.length} etiket="Bayraklı hasta" ton={gorunen.length ? 'uyari' : 'iyi'} />
          <Istatistik deger={satirlar == null ? '…' : gorunen.filter((s) => s.bayraklar.includes('risk_acik')).length} etiket="Açık kırmızı bayrak" ton={gorunen.some((s) => s.bayraklar.includes('risk_acik')) ? 'kirmizi' : 'notr'} />
          <Istatistik deger={satirlar == null ? '…' : toplam} etiket="Kohortta hasta" />
        </div>
        {hata && <div style={{ ...S.hata, marginTop: 8 }}>{hata}</div>}
        <div style={{ ...S.kucuk, marginTop: 8 }}>Hatırlatma metninde tanı, SCORE2 değeri, risk bandı ve ilaç adı yazılmaz.</div>
        <TaslakNotu />
      </div>

      <div style={S.kutu}>
        {(gorunen || []).map((s) => (
          <label key={s.patientId} style={{ ...S.metin, display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <input type="checkbox" checked={secili.includes(s.patientId)} onChange={(e) => setSecili((p) => e.target.checked ? [...p, s.patientId] : p.filter((x) => x !== s.patientId))} />
            <span style={{ flex: 1 }}>
              <strong>{s.ad}</strong>
              <div style={{ marginTop: 4, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {s.bayraklar.map((b) => <Rozet key={b} ton="uyari">{KARDIO_BAYRAK_AD[b]}</Rozet>)}
              </div>
            </span>
          </label>
        ))}
        {satirlar && !gorunen.length && <div style={S.kucuk}>Bayraklı hasta yok.</div>}
        <button type="button" disabled={!secili.length || gonderiliyor} onClick={gonder} style={{ ...S.btn, marginTop: 12, opacity: secili.length ? 1 : 0.5 }}>
          {gonderiliyor ? 'Gönderiliyor…' : `Seçilenlere hatırlat (${secili.length})`}
        </button>
        {durum && <div style={{ ...S.kucuk, color: '#34D399', marginTop: 8 }}>{durum}</div>}
      </div>
    </>
  );
}
