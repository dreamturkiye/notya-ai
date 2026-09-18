'use client';
/**
 * DAH-EXCEPTIONAL-01 — Araçlar › CHA₂DS₂-VASc / HAS-BLED. Dahiliye-only (BRANS_DOKTOR_ARACLARI).
 * CHA₂DS₂-VASc hekimin işaretlediği bileşenlerden toplanır (engines/sgkRapor.chaVascSkoru).
 * HAS-BLED maddeleri KONTROL LİSTESİDİR — skor iddiası yoktur; kanamanın değiştirilebilir nedenlerini gösterir
 * ve antikoagülan kesme gerekçesi değildir (engines/antikoagulan.antikoagulanDegerlendir).
 */
import React, { useMemo, useState } from 'react';
import { hastaDosyaHref } from '@/lib/doktor/geriNavigasyon';
import { antikoagulanDegerlendir, type Ajan } from '../../engines/antikoagulan';
import { chaVascSkoru } from '../../engines/sgkRapor';
import { dahStil, Secim, Onay, Sayi, DahHastaSecici, KopyalaButonu } from './DahiliyeAracKabugu';

const { kutu, etiket, kucuk, metin, satir, btn } = dahStil;

const bugun = () => new Date().toISOString().slice(0, 10);
const sayi = (s: string): number | null => { const t = s.trim().replace(',', '.'); return t === '' || !Number.isFinite(Number(t)) ? null : Number(t); };

const CINSIYET: Array<[string, string]> = [['erkek', 'Erkek'], ['kadin', 'Kadın']];
const AJAN: Array<[string, string]> = [
  ['', 'Aktif antikoagülan yok'],
  ['warfarin', 'Warfarin'],
  ['apiksaban', 'Apiksaban'],
  ['rivaroksaban', 'Rivaroksaban'],
  ['dabigatran', 'Dabigatran'],
  ['edoksaban', 'Edoksaban'],
];
const ENDIKASYON: Array<[string, string]> = [
  ['af', 'Atriyal fibrilasyon'],
  ['vte', 'Venöz tromboembolizm'],
  ['mekanik_kapak', 'Mekanik kapak'],
  ['diger', 'Diğer'],
];
const VAR_AD = (v: boolean | null) => (v === true ? 'var' : v === false ? 'yok' : 'bilinmiyor');
const VAR_RENK = (v: boolean | null) => (v === true ? '#F87171' : v === false ? '#34D399' : '#FBBF24');

export default function AntikoagAraci() {
  const [yas, setYas] = useState('');
  const [cinsiyet, setCinsiyet] = useState('erkek');
  const [cha, setCha] = useState({ kky: false, ht: false, dm: false, inmeTia: false, vaskuler: false });
  const [ajan, setAjan] = useState('');
  const [endikasyon, setEndikasyon] = useState('af');
  const [kilo, setKilo] = useState('');
  const [kre, setKre] = useState('');
  const [hb, setHb] = useState('');
  const [plt, setPlt] = useState('');
  const [sbp, setSbp] = useState('');
  const [hasBled, setHasBled] = useState({ karaciger: false, inme: false, kanama: false, alkol: false });
  const [ilacMetni, setIlacMetni] = useState('');
  const [hasta, setHasta] = useState<{ id: string; ad: string }>({ id: '', ad: '' });

  const kadin = cinsiyet === 'kadin';
  const yasSayi = sayi(yas);
  const chaSkor = chaVascSkoru(cha, yasSayi, kadin);
  const ilacMetinleri = useMemo(() => ilacMetni.split('\n').map((x) => x.trim()).filter(Boolean), [ilacMetni]);

  const sonuc = useMemo(() => antikoagulanDegerlendir({
    ajan: (ajan || null) as Ajan,
    endikasyon: endikasyon as 'af' | 'vte' | 'mekanik_kapak' | 'diger',
    hedefInr: null,
    yas: yasSayi, kadin, kiloKg: sayi(kilo), kre: sayi(kre), hb: sayi(hb), plt: sayi(plt),
    inr: [], ilacMetinleri, sbp: sayi(sbp),
    hasBled, bugun: bugun(),
  }), [ajan, endikasyon, yasSayi, kadin, kilo, kre, hb, plt, ilacMetinleri, sbp, hasBled]);

  const yasPuan = yasSayi == null ? 0 : yasSayi >= 75 ? 2 : yasSayi >= 65 ? 1 : 0;
  const chaSatirlari = [
    ['Kalp yetersizliği (K)', cha.kky ? 1 : 0],
    ['Hipertansiyon (H)', cha.ht ? 1 : 0],
    ['Yaş ≥75 (A₂) / 65–74 (A)', yasPuan],
    ['Diyabet (D)', cha.dm ? 1 : 0],
    ['İnme / TİA / tromboemboli (S₂)', cha.inmeTia ? 2 : 0],
    ['Vasküler hastalık (V)', cha.vaskuler ? 1 : 0],
    ['Kadın cinsiyet (Sc)', kadin ? 1 : 0],
  ] as const;

  const kopyaMetni = [
    `Antikoagülan değerlendirme (dahiliye) — ${bugun()}`,
    `CHA₂DS₂-VASc (hekim işaretli bileşenler): ${chaSkor}`,
    ...chaSatirlari.map(([ad, p]) => `  ${ad}: ${p}`),
    '',
    'HAS-BLED maddeleri — kontrol listesi (skor iddiası yok):',
    ...sonuc.hasBledMaddeleri.map((m) => `  ${m.madde}: ${VAR_AD(m.var)}${m.degistirilebilir ? ' (değiştirilebilir)' : ''}`),
    sonuc.krkl != null ? `\nKrKl (Cockcroft-Gault): ${sonuc.krkl} mL/dk` : null,
    ...sonuc.kirmizi.map((x) => `KIRMIZI: ${x}`),
    ...sonuc.uygunluk.map((x) => `Uygunluk: ${x}`),
    ...sonuc.uyarilar.map((x) => `Uyarı: ${x}`),
    ...sonuc.plan.map((x) => `Plan: ${x}`),
    '',
    'HAS-BLED maddeleri antikoagülan kesme gerekçesi değildir; karar hekimindir.',
  ].filter(Boolean).join('\n');

  return (
    <>
      <div style={kutu}>
        <div style={etiket}>Hasta</div>
        <div style={satir}>
          <Sayi ad="Yaş" deger={yas} set={setYas} genislik={90} />
          <Secim etiket="Cinsiyet" deger={cinsiyet} set={setCinsiyet} secenekler={CINSIYET} />
          <Sayi ad="Kilo" deger={kilo} set={setKilo} birim="kg" genislik={90} />
          <Sayi ad="Kreatinin" deger={kre} set={setKre} birim="mg/dL" adim="0.1" genislik={90} />
        </div>
        <div style={satir}>
          <Sayi ad="Ofis SBP" deger={sbp} set={setSbp} birim="mmHg" />
          <Sayi ad="Hb" deger={hb} set={setHb} birim="g/dL" adim="0.1" genislik={90} />
          <Sayi ad="Trombosit" deger={plt} set={setPlt} birim="10³/µL" />
        </div>
      </div>

      <div style={kutu}>
        <div style={etiket}>CHA₂DS₂-VASc bileşenleri</div>
        <div style={satir}>
          <Onay ad="Kalp yetersizliği" deger={cha.kky} set={(b) => setCha((p) => ({ ...p, kky: b }))} />
          <Onay ad="Hipertansiyon" deger={cha.ht} set={(b) => setCha((p) => ({ ...p, ht: b }))} />
          <Onay ad="Diyabet" deger={cha.dm} set={(b) => setCha((p) => ({ ...p, dm: b }))} />
          <Onay ad="İnme / TİA / tromboemboli" deger={cha.inmeTia} set={(b) => setCha((p) => ({ ...p, inmeTia: b }))} />
          <Onay ad="Vasküler hastalık" deger={cha.vaskuler} set={(b) => setCha((p) => ({ ...p, vaskuler: b }))} />
        </div>
        <div style={{ ...kucuk, marginTop: 6 }}>Yaş ve cinsiyet puanı yukarıdaki alanlardan gelir.</div>
      </div>

      <div style={{ ...kutu, borderColor: 'rgba(20,184,166,0.35)' }} aria-live="polite">
        <div style={etiket}>CHA₂DS₂-VASc</div>
        <div style={{ fontSize: 34, fontWeight: 800, color: '#5EEAD4', lineHeight: 1.1 }}>{chaSkor}</div>
        {chaSatirlari.map(([ad, p]) => (
          <div key={ad} style={{ ...metin, marginTop: 4, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ color: p ? '#EDF1F7' : '#8FA0B5' }}>{ad}</span>
            <span style={{ fontWeight: 700, color: p ? '#5EEAD4' : '#8FA0B5' }}>{p}</span>
          </div>
        ))}
        <div style={{ ...kucuk, marginTop: 10 }}>Toplam yalnız işaretlenen bileşenlerden hesaplanır; antikoagülan endikasyonu hekim kararıdır.</div>
      </div>

      <div style={kutu}>
        <div style={etiket}>Antikoagülan ve kanama bağlamı</div>
        <div style={satir}>
          <Secim etiket="Ajan" deger={ajan} set={setAjan} secenekler={AJAN} />
          <Secim etiket="Endikasyon" deger={endikasyon} set={setEndikasyon} secenekler={ENDIKASYON} />
        </div>
        <div style={satir}>
          <Onay ad="Karaciğer hastalığı" deger={hasBled.karaciger} set={(b) => setHasBled((p) => ({ ...p, karaciger: b }))} />
          <Onay ad="İnme öyküsü" deger={hasBled.inme} set={(b) => setHasBled((p) => ({ ...p, inme: b }))} />
          <Onay ad="Kanama öyküsü / yatkınlık" deger={hasBled.kanama} set={(b) => setHasBled((p) => ({ ...p, kanama: b }))} />
          <Onay ad="Alkol (haftada ≥8 kadeh)" deger={hasBled.alkol} set={(b) => setHasBled((p) => ({ ...p, alkol: b }))} />
        </div>
        <label style={{ ...metin, display: 'block', marginTop: 8 }}>Eş zamanlı ilaçlar (her satıra bir)
          <textarea aria-label="Eş zamanlı ilaçlar" value={ilacMetni} onChange={(e) => setIlacMetni(e.target.value)} rows={3} placeholder={'asetilsalisilik asit\nibuprofen'} style={{ ...dahStil.input, marginTop: 6, resize: 'vertical' }} />
        </label>
        <div style={{ ...kucuk, marginTop: 6 }}>Warfarinde labil INR maddesi INR serisi hasta dosyasında (Dahiliye › Antikoagülan) hesaplanır; burada "bilinmiyor" kalır.</div>
      </div>

      <div style={kutu}>
        <div style={{ ...etiket, display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <span>HAS-BLED maddeleri — kontrol listesi</span>
          <span style={{ ...kucuk, color: '#FBBF24', fontWeight: 700 }}>SKOR İDDİASI YOK</span>
        </div>
        {sonuc.hasBledMaddeleri.map((m) => (
          <div key={m.madde} style={{ ...metin, marginTop: 6, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <span>{m.madde}{m.degistirilebilir && <span style={{ ...kucuk, display: 'block' }}>değiştirilebilir faktör</span>}</span>
            <span style={{ fontWeight: 700, color: VAR_RENK(m.var) }}>{VAR_AD(m.var)}</span>
          </div>
        ))}
        <div style={{ ...kucuk, marginTop: 10 }}>Maddeler toplanmaz: kanama riskinin değiştirilebilir nedenlerini göstermek içindir ve antikoagülan kesme gerekçesi değildir.</div>
      </div>

      <div style={kutu}>
        <div style={etiket}>DOAK uygunluk</div>
        {sonuc.krkl != null && <div style={{ ...metin, marginTop: 4 }}>KrKl (Cockcroft-Gault): {sonuc.krkl} mL/dk</div>}
        {sonuc.kirmizi.map((x) => <div key={x} style={{ ...metin, marginTop: 6, color: '#F87171', fontWeight: 700 }}>⛔ {x}</div>)}
        {sonuc.uygunluk.map((x) => <div key={x} style={{ ...metin, marginTop: 6 }}>• {x}</div>)}
        {sonuc.uyarilar.map((x) => <div key={x} style={{ ...metin, marginTop: 6, color: '#FBBF24' }}>⚠ {x}</div>)}
        {sonuc.plan.map((x) => <div key={x} style={{ ...kucuk, marginTop: 6 }}>{x}</div>)}
        <KopyalaButonu metin={kopyaMetni} etiket="Değerlendirmeyi kopyala" />
        <div style={{ ...kucuk, marginTop: 10 }}>Azaltılmış doz ölçütleri bayrak olarak gösterilir; mg yazılmaz — dozu hekim belirler. Hesap kaydedilmez.</div>
      </div>

      <div style={kutu}>
        <div style={etiket}>Hastada kaydet (isteğe bağlı)</div>
        <div style={kucuk}>Hesap için hasta seçmek gerekmez. Kararı dosyaya işlemek isterseniz hastayı seçip Dahiliye sekmesini açın.</div>
        <DahHastaSecici secili={hasta.id} sec={(id, ad) => setHasta({ id, ad })} />
        {hasta.id && <div style={satir}><a href={hastaDosyaHref(hasta.id, 'dahiliye')} style={{ ...btn, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Hastada aç (Dahiliye) →</a></div>}
      </div>
    </>
  );
}
