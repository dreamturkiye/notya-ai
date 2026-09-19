'use client';
/**
 * ARACLAR-CILA-01: ortak araç kütüphanesiyle yenilendi — manşet sayı kartları, şiddet rozeti ve taslak rozeti.
 * DAH-EXCEPTIONAL-01 — Araçlar › Polifarmasi STOPP/START. Dahiliye-only (BRANS_DOKTOR_ARACLARI).
 * Chapter motoru (engines/polifarmasi.polifarmasiDegerlendir) ile birebir aynı kural: ≥65 yaş taraması,
 * sınıf düzeyinde öneri, doz yok. Hiçbir ilaç otomatik kesilmez/başlanmaz; karar hekimindir.
 */
import React, { useMemo, useState } from 'react';
import { hastaDosyaHref } from '@/lib/doktor/geriNavigasyon';
import { polifarmasiDegerlendir, OVERRIDE_MIN, type PoliSiddet } from '../../engines/polifarmasi';
import { dahStil, Onay, Sayi, Istatistik, Rozet, TaslakNotu, DahHastaSecici, KopyalaButonu } from './DahiliyeAracKabugu';

const { kutu, etiket, kucuk, metin, satir, btn } = dahStil;

const bugun = () => new Date().toISOString().slice(0, 10);
const sayi = (s: string): number | null => { const t = s.trim().replace(',', '.'); return t === '' || !Number.isFinite(Number(t)) ? null : Number(t); };

const SIDDET_AD: Record<PoliSiddet, string> = { durdur: 'Durdurmayı değerlendir', gozden_gecir: 'Gözden geçir', baslat: 'Başlatmayı değerlendir' };
const SIDDET_RENK: Record<PoliSiddet, string> = { durdur: '#F87171', gozden_gecir: '#FBBF24', baslat: '#5EEAD4' };

const TANI_ALANLARI = [
  ['askvh', 'Aterosklerotik KVH'],
  ['af', 'Atriyal fibrilasyon'],
  ['hf', 'Kalp yetersizliği'],
  ['dm', 'Diyabet'],
  ['koah', 'KOAH'],
  ['osteoporoz', 'Osteoporoz'],
  ['ckdAlbuminuri', 'Albüminürik KBH'],
] as const;

type TaniAnahtar = (typeof TANI_ALANLARI)[number][0];

export default function PolifarmasiAraci() {
  const [yas, setYas] = useState('');
  const [ilacMetni, setIlacMetni] = useState('');
  const [eGFR, setEGFR] = useState('');
  const [k, setK] = useState('');
  const [na, setNa] = useState('');
  const [dusme, setDusme] = useState(false);
  const [tanilar, setTanilar] = useState<Record<TaniAnahtar, boolean>>({ askvh: false, af: false, hf: false, dm: false, koah: false, osteoporoz: false, ckdAlbuminuri: false });
  const [hasta, setHasta] = useState<{ id: string; ad: string }>({ id: '', ad: '' });

  const ilaclar = useMemo(() => ilacMetni.split('\n').map((x) => x.trim()).filter(Boolean).map((ad) => ({ ad })), [ilacMetni]);

  const sonuc = useMemo(() => polifarmasiDegerlendir({
    yas: sayi(yas), ilaclar, eGFR: sayi(eGFR), k: sayi(k), na: sayi(na),
    tanilar, dusmePozitif: dusme, bugun: bugun(),
  }), [yas, ilaclar, eGFR, k, na, tanilar, dusme]);

  const kopyaMetni = [
    `Polifarmasi taraması (STOPP/START) — ${bugun()}`,
    sonuc.not,
    '',
    ...sonuc.oneriler.map((o) => `[${o.tip} · ${SIDDET_AD[o.siddet]}] ${o.baslik}${o.ilaclar.length ? ` (${o.ilaclar.join(', ')})` : ''}\n  Gerekçe: ${o.gerekce}\n  Öneri: ${o.oneri}`),
    '',
    'Öneriler sınıf düzeyindedir; doz ve tedavi kararı hekimindir.',
  ].join('\n');

  return (
    <>
      <div style={kutu}>
        <div style={etiket}>Hasta ve ilaç listesi</div>
        <div style={satir}>
          <Sayi ad="Yaş" deger={yas} set={setYas} genislik={90} />
          <Sayi ad="eGFR" deger={eGFR} set={setEGFR} birim="mL/dk/1,73 m²" />
          <Sayi ad="K" deger={k} set={setK} birim="mmol/L" adim="0.1" genislik={90} />
          <Sayi ad="Na" deger={na} set={setNa} birim="mmol/L" genislik={90} />
        </div>
        <label style={{ ...metin, display: 'block', marginTop: 10 }}>Aktif ilaçlar (her satıra bir)
          <textarea aria-label="Aktif ilaçlar" value={ilacMetni} onChange={(e) => setIlacMetni(e.target.value)} rows={6} placeholder={'ramipril\nibuprofen\nalprazolam'} style={{ ...dahStil.input, marginTop: 6, resize: 'vertical' }} />
        </label>
        <div style={{ ...kucuk, marginTop: 6 }}>Tarama ≥65 yaş için uygulanır. ≥5 eş zamanlı ilaç polifarmasi kabul edilir.</div>
      </div>

      <div style={kutu}>
        <div style={etiket}>Tanılar ve düşme</div>
        <div style={satir}>
          {TANI_ALANLARI.map(([anahtar, ad]) => (
            <Onay key={anahtar} ad={ad} deger={tanilar[anahtar]} set={(b) => setTanilar((p) => ({ ...p, [anahtar]: b }))} />
          ))}
          <Onay ad="Düşme öyküsü / taraması pozitif" deger={dusme} set={setDusme} />
        </div>
      </div>

      <div style={{ ...kutu, borderColor: 'rgba(20,184,166,0.35)' }} aria-live="polite">
        <div style={etiket}>Tarama sonucu</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '4px 0 8px' }}>
          <Istatistik deger={ilaclar.length} etiket="aktif ilaç satırı" ton={ilaclar.length >= 5 ? 'uyari' : 'notr'} />
          <Istatistik deger={sonuc.oneriler.filter((o) => o.siddet === 'durdur').length} etiket="durdurmayı değerlendir" ton={sonuc.oneriler.some((o) => o.siddet === 'durdur') ? 'kirmizi' : 'notr'} />
          <Istatistik deger={sonuc.oneriler.filter((o) => o.siddet === 'baslat').length} etiket="başlatmayı değerlendir" ton={sonuc.oneriler.some((o) => o.siddet === 'baslat') ? 'iyi' : 'notr'} />
        </div>
        <div style={{ ...metin, fontWeight: 700 }}>{sonuc.not}</div>
        {!sonuc.uygulanabilir && <div style={satir}><Rozet ton="uyari">Öneri üretilmedi — tarama ≥65 yaş için uygulanır</Rozet></div>}
        {sonuc.uygulanabilir && !sonuc.oneriler.length && <div style={{ ...kucuk, marginTop: 6 }}>Bu girdilerle STOPP/START önerisi oluşmadı.</div>}
        {!!sonuc.oneriler.length && <div style={satir}><KopyalaButonu metin={kopyaMetni} etiket="Önerileri kopyala" /></div>}
        <TaslakNotu>Öneriler sınıf düzeyindedir; hiçbir ilaç otomatik kesilmez veya başlanmaz, doz yazılmaz. Karar hekimindir; nota otomatik yazılmaz.</TaslakNotu>
      </div>

      {sonuc.oneriler.map((o) => (
        <div key={o.kod} style={{ ...kutu, borderLeft: `3px solid ${SIDDET_RENK[o.siddet]}` }}>
          <div style={{ ...etiket, color: SIDDET_RENK[o.siddet], display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <span>{o.baslik}</span>
            <span style={{ ...kucuk, color: SIDDET_RENK[o.siddet], fontWeight: 700 }}>{o.tip} · {SIDDET_AD[o.siddet]}</span>
          </div>
          {!!o.ilaclar.length && <div style={{ ...metin, fontWeight: 700 }}>{o.ilaclar.join(', ')}</div>}
          <div style={{ ...metin, marginTop: 6 }}>{o.gerekce}</div>
          <div style={{ ...metin, marginTop: 6 }}>→ {o.oneri}</div>
          {o.engelleyici && <div style={satir}><Rozet ton="uyari">engelleyici öneri — atlamak için ≥{OVERRIDE_MIN} karakterlik klinik gerekçe (hasta dosyasında)</Rozet></div>}
        </div>
      ))}

      <div style={kutu}>
        <div style={etiket}>Hastada kaydet (isteğe bağlı)</div>
        <div style={kucuk}>Tarama için hasta seçmek gerekmez. Kararları kaydetmek isterseniz hastayı seçip Dahiliye sekmesini açın.</div>
        <DahHastaSecici secili={hasta.id} sec={(id, ad) => setHasta({ id, ad })} />
        {hasta.id && <div style={satir}><a href={hastaDosyaHref(hasta.id, 'dahiliye')} style={{ ...btn, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Hastada aç (Dahiliye) →</a></div>}
      </div>
    </>
  );
}
