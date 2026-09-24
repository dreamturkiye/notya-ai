'use client';
/**
 * PEDI-ARACLAR-01 — Araçlar › Doz hesaplayıcı (mg/kg). YALNIZ HESAP MAKİNESİ (engines/doz.ts).
 * Hekim kiloyu, mg/kg değerini ve konsantrasyonu kendisi girer; araç ilaç adı listesi, varsayılan mg/kg veya öneri sunmaz.
 * Kilo seçili hastanın son onaylı ölçümünden gelebilir; hekim değiştirir. Sonuç canlı güncellenir, nota otomatik yazılmaz.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi';
import { dozHesapla, dozOzetMetni, konsantrasyonCoz, fmt, type DozModu } from '../../engines/doz';
import { kiloCoz, sayiCoz, tarihGoster } from '../../engines/girdi';
import { pediStil, Alan, Segment, Katlanir, TaslakNotu, KopyalaButonu, MuayeneFormunaEkle, PediHastaSecici } from './PediAracKabugu';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

const { kutu, etiket, kucuk, input, uyari, kirmizi } = pediStil;
const SIKLIK: Array<[number, string]> = [[1, '1×'], [2, '2×'], [3, '3×'], [4, '4×'], [6, '6×']];

export default function DozAraci() {
  const [hastaId, setHastaId] = useState('');
  const [kayitKilo, setKayitKilo] = useState<{ kg: number; tarih: string } | null>(null);
  const [kiloHam, setKiloHam] = useState('');
  const [mgKgHam, setMgKgHam] = useState('');
  const [mod, setMod] = useState<DozModu>('gun');
  const [dozSayisi, setDozSayisi] = useState(3);
  const [konsHam, setKonsHam] = useState('');
  const [tavanDozHam, setTavanDozHam] = useState('');
  const [tavanGunHam, setTavanGunHam] = useState('');
  const [mlAdim, setMlAdim] = useState(0.1);
  const [etiketMetin, setEtiketMetin] = useState('');

  // Seçili hastanın son onaylı kilosu (/api/doktor/hastalar/[id]/buyume-egrileri — sahiplik sunucuda).
  useEffect(() => {
    setKayitKilo(null);
    if (!hastaId) return;
    let iptal = false;
    (async () => {
      try {
        const t = await getAccessTokenAsync();
        const r = await fetch(`/api/doktor/hastalar/${encodeURIComponent(hastaId)}/buyume-egrileri`, { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' });
        const j = await r.json().catch(() => ({}));
        const n = (j?.parametreler?.kilo?.noktalar || []) as Array<{ deger: number; tarih: string }>;
        const son = n[n.length - 1];
        if (!iptal && son) { setKayitKilo({ kg: son.deger, tarih: String(son.tarih).slice(0, 10) }); setKiloHam(String(son.deger).replace('.', ',')); }
      } catch { /* kilo elle girilir */ }
    })();
    return () => { iptal = true; };
  }, [hastaId]);

  const kiloKg = kiloCoz(kiloHam);
  const mgKg = sayiCoz(mgKgHam);
  const kons = konsantrasyonCoz(konsHam);
  const girdi = { kiloKg, mgKg, mod, dozSayisi, konsantrasyon: kons, tavanDozMg: sayiCoz(tavanDozHam), tavanGunMg: sayiCoz(tavanGunHam), mlAdim };
  const s = useMemo(() => dozHesapla(girdi), [kiloKg, mgKg, mod, dozSayisi, kons?.mgPerMl, girdi.tavanDozMg, girdi.tavanGunMg, mlAdim]); // eslint-disable-line react-hooks/exhaustive-deps
  const tavanRozet = girdi.tavanDozMg || girdi.tavanGunMg ? 'tavan girildi' : undefined;

  return (
    <>
      <div style={kutu}>
        <div style={etiket}>Hasta (isteğe bağlı — kiloyu kayıttan alır)</div>
        <PediHastaSecici secili={hastaId} sec={(id) => setHastaId(id)} />
      </div>

      <div style={kutu}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
          <Alan etiket="Kilo" ipucu={kayitKilo ? `Son kayıt ${fmt(kayitKilo.kg)} kg · ${tarihGoster(kayitKilo.tarih)} — değiştirebilirsiniz` : kiloHam && kiloKg == null ? 'Okunamadı — ör. 18,5 veya 3500 gr' : kiloKg != null && sayiCoz(kiloHam) !== kiloKg ? `= ${fmt(kiloKg, 3)} kg` : '3,5 · 18 kg · 3500 gr'}>
            <input inputMode="decimal" value={kiloHam} onChange={(e) => setKiloHam(e.target.value)} placeholder="kg" aria-label="Kilo" style={input} />
          </Alan>
          <Alan etiket="Doz (mg/kg) — hekim girer" ipucu={mgKgHam && mgKg == null ? 'Okunamadı — ör. 40 veya 7,5' : undefined}>
            <input inputMode="decimal" value={mgKgHam} onChange={(e) => setMgKgHam(e.target.value)} placeholder="mg/kg" aria-label="mg/kg" style={input} />
            <Segment etiket="mg/kg birimi" deger={mod} set={setMod} secenekler={[['gun', 'mg/kg/gün'], ['doz', 'mg/kg/doz']]} />
          </Alan>
        </div>
        <div style={{ marginTop: 14 }}>
          <Alan etiket={`Günde kaç doz · ${fmt(24 / dozSayisi, 1)} saatte bir`}>
            <Segment etiket="Günde kaç doz" deger={dozSayisi} set={setDozSayisi} secenekler={SIKLIK} />
          </Alan>
        </div>
        <div style={{ marginTop: 14 }}>
          <Alan etiket="Konsantrasyon (isteğe bağlı — mL için)" ipucu={konsHam ? (kons ? `= ${fmt(kons.mgPerMl, 3)} mg/mL` : 'Okunamadı — biçim: 250 mg/5 mL veya 40 mg/mL') : 'Şişe etiketindeki gibi: 250 mg/5 mL · 40 mg/mL · 125/5'}>
            <input value={konsHam} onChange={(e) => setKonsHam(e.target.value)} placeholder="ör. … mg/5 mL" aria-label="Konsantrasyon" style={input} />
          </Alan>
        </div>
        <Katlanir baslik="Tavan, yuvarlama ve etiket" rozet={tavanRozet}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <Alan etiket="Doz başı tavan (mg)"><input inputMode="decimal" value={tavanDozHam} onChange={(e) => setTavanDozHam(e.target.value)} placeholder="boş = yok" aria-label="Doz başı tavan" style={input} /></Alan>
            <Alan etiket="Günlük tavan (mg)"><input inputMode="decimal" value={tavanGunHam} onChange={(e) => setTavanGunHam(e.target.value)} placeholder="boş = yok" aria-label="Günlük tavan" style={input} /></Alan>
          </div>
          <div style={{ marginTop: 12 }}>
            <Alan etiket="mL yuvarlama (ölçek / şırınga)">
              <Segment etiket="mL yuvarlama" deger={mlAdim} set={setMlAdim} secenekler={[[0.1, '0,1 mL'], [0.5, '0,5 mL'], [1, '1 mL']]} />
            </Alan>
          </div>
          <div style={{ marginTop: 12 }}>
            <Alan etiket="Etiket (isteğe bağlı)" ipucu="Kopyalanan metnin başına eklenir. Araç ilaç tanımaz, adı değerlendirmez.">
              <input value={etiketMetin} onChange={(e) => setEtiketMetin(e.target.value)} placeholder="ör. şurup adı" aria-label="Etiket" style={input} />
            </Alan>
          </div>
        </Katlanir>
      </div>

      <div style={{ ...kutu, borderColor: s ? 'rgba(45,212,191,0.35)' : 'rgba(255,255,255,0.1)' }} aria-live="polite">
        <div style={etiket}>Sonuç</div>
        {!s ? (
          <div style={{ ...kucuk, fontSize: 14 }}>Kilo ve mg/kg girin — sonuç yazdıkça hesaplanır.</div>
        ) : (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'baseline' }}>
              {s.dozMlYuvarlak != null ? (
                <div><div style={{ fontSize: 40, fontWeight: 800, color: s.tavanli ? CHROME_RENK.warn : '#5EEAD4', letterSpacing: '-1px', lineHeight: 1.05 }}>{fmt(s.dozMlYuvarlak, 2)} mL</div><div style={kucuk}>doz başına{s.dozMl != null && Math.abs(s.dozMl - s.dozMlYuvarlak) > 1e-9 ? ` (tam: ${fmt(s.dozMl, 2)} mL)` : ''}</div></div>
              ) : null}
              <div><div style={{ fontSize: s.dozMlYuvarlak != null ? 24 : 40, fontWeight: 800, color: CHROME_RENK.ink, lineHeight: 1.1 }}>{fmt(s.dozMg, 1)} mg</div><div style={kucuk}>doz başına</div></div>
              <div><div style={{ fontSize: 18, fontWeight: 700, color: CHROME_RENK.muted }}>günde {dozSayisi} kez</div><div style={kucuk}>{fmt(s.aralikSaat, 1)} saatte bir</div></div>
            </div>
            <div style={{ ...pediStil.metin, marginTop: 10 }}>Günlük toplam <b>{fmt(s.gunlukMg, 1)} mg</b>{s.gunlukMl != null ? <> · <b>{fmt(s.gunlukMl, 2)} mL</b></> : null}</div>
            {s.tavanli && (
              <div style={{ ...kirmizi, marginTop: 12 }}>
                {s.uyarilar.filter((u) => u.kod.startsWith('tavan')).map((u) => <div key={u.kod}>⚠ {u.metin}</div>)}
                <div style={{ marginTop: 6 }}>Tavanla sınırlanırsa: <b>{fmt(s.tavanli.dozMg, 1)} mg/doz</b>{s.tavanli.dozMlYuvarlak != null ? <> = <b>{fmt(s.tavanli.dozMlYuvarlak, 2)} mL</b></> : null} · {fmt(s.tavanli.gunlukMg, 1)} mg/gün. Hangisinin uygulanacağına hekim karar verir.</div>
              </div>
            )}
            {s.uyarilar.filter((u) => !u.kod.startsWith('tavan')).map((u) => <div key={u.kod} style={{ ...uyari, marginTop: 10 }}>{u.metin}</div>)}
            <div style={{ ...kucuk, marginTop: 12, display: 'grid', gap: 2 }}>{s.formul.map((f) => <div key={f}>{f}</div>)}</div>
            <div style={{ ...pediStil.satir, marginTop: 12 }}>
              <KopyalaButonu metin={dozOzetMetni(girdi, s, etiketMetin)} etiket="Hesabı kopyala" />
            </div>
            <MuayeneFormunaEkle hastaId={hastaId} arac="Doz hesabı (mg/kg)" satirlar={dozOzetMetni(girdi, s, etiketMetin).split('\n')} />
          </>
        )}
        <TaslakNotu>Notya ilaç veya doz önermez: mg/kg, konsantrasyon ve tavanı siz girdiniz; araç yalnız aritmetik ve birim çevirisi yapar. Sonucu uygulamadan önce hekim doğrular.</TaslakNotu>
      </div>
    </>
  );
}
