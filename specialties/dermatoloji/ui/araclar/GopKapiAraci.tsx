'use client';
/**
 * ARACLAR-CILA-01: ortak araç kütüphanesiyle yenilendi — ortak onay kutusu, manşet engel sayısı, katlanır asitretin notu, taslak rozeti.
 * DERM-EXCEPTIONAL-01 — Araçlar › GÖP izotretinoin kapı. Dermatoloji-only (BRANS_DOKTOR_ARACLARI).
 * Chapter motoru (engines/gop-isotretinoin.gopIsotretinoin) ile birebir aynı kural: çift kontrasepsiyon,
 * β-hCG tarihi ve sonucu, siklus günü, reçete süresi. Doz ve endikasyon yoktur; karar hekimindir.
 */
import React, { useMemo, useState } from 'react';
import { hastaDosyaHref } from '@/lib/doktor/geriNavigasyon';
import { gopIsotretinoin, acitretinPregnancyBanYears, type GopSex } from '../../engines/gop-isotretinoin';
import { dermStil, Secim, Onay, Istatistik, Katlanir, Rozet, TaslakNotu, DermHastaSecici, KopyalaButonu } from './DermAracKabugu';

const { kutu, etiket, kucuk, metin, satir, btn } = dermStil;
const bugun = () => new Date().toISOString().slice(0, 10);

const CINSIYET: Array<[string, string]> = [
  ['female', 'Kadın (gebelik kapıları uygulanır)'],
  ['male', 'Erkek'],
  ['unknown', 'Belirtilmedi (gebelik kapıları uygulanır)'],
];

export default function GopKapiAraci() {
  const [sex, setSex] = useState<GopSex>('female');
  const [kontrasepsiyon1, setK1] = useState(false);
  const [kontrasepsiyon2, setK2] = useState(false);
  const [hcgTarih, setHcgTarih] = useState('');
  const [hcgNegatif, setHcgNegatif] = useState(false);
  const [siklusGunu, setSiklusGunu] = useState('');
  const [receteGun, setReceteGun] = useState('30');
  const [baslangic, setBaslangic] = useState(bugun());
  const [hasta, setHasta] = useState<{ id: string; ad: string }>({ id: '', ad: '' });

  const gebelikKapisi = sex !== 'male';
  const sonuc = useMemo(() => gopIsotretinoin({
    two_contraception: kontrasepsiyon1 && kontrasepsiyon2,
    hcg_iso: hcgTarih || null,
    hcg_negative: hcgNegatif,
    cycle_day: siklusGunu === '' ? null : Number(siklusGunu),
    rx_days: Number(receteGun) || 0,
    start_iso: baslangic || bugun(),
    today_iso: bugun(),
    sex,
  }), [kontrasepsiyon1, kontrasepsiyon2, hcgTarih, hcgNegatif, siklusGunu, receteGun, baslangic, sex]);

  const engeller = 'blocks' in sonuc ? sonuc.blocks : [];
  const kopyaMetni = [
    `GÖP izotretinoin kapı — ${sonuc.allowed ? 'engel yok' : 'engel var'} (${bugun()})`,
    `Cinsiyet: ${CINSIYET.find(([k]) => k === sex)?.[1]}`,
    gebelikKapisi ? `Çift kontrasepsiyon: ${kontrasepsiyon1 && kontrasepsiyon2 ? 'iki yöntem işaretli' : 'eksik'}` : null,
    gebelikKapisi ? `β-hCG: ${hcgTarih || 'tarih yok'}${hcgNegatif ? ' · negatif' : ' · negatif işaretlenmedi'}` : null,
    gebelikKapisi ? `Siklus günü: ${siklusGunu || '—'}` : null,
    `Reçete süresi: ${receteGun || '—'} gün`,
    ...engeller.map((b) => `Engel: ${b}`),
    ...(sonuc.notApplicable || []).map((n) => `Uygulanmaz: ${n}`),
  ].filter(Boolean).join('\n');

  return (
    <>
      <div style={kutu}>
        <div style={etiket}>Hasta</div>
        <div style={satir}>
          <Secim etiket="Cinsiyet" deger={sex} set={(x) => setSex(x as GopSex)} secenekler={CINSIYET} />
          <label style={{ ...metin, display: 'flex', gap: 6, alignItems: 'center' }}>Planlanan başlangıç
            <input type="date" aria-label="Planlanan başlangıç" value={baslangic} onChange={(e) => setBaslangic(e.target.value || bugun())} style={{ ...dermStil.input, width: 180 }} />
          </label>
        </div>
        <div style={kucuk}>Cinsiyet belirtilmezse gebelik kapıları uygulanır (güvenli taraf).</div>
      </div>

      {gebelikKapisi && (
        <div style={kutu}>
          <div style={etiket}>Gebelikten korunma</div>
          <Onay ad="1. yöntem onaylandı" deger={kontrasepsiyon1} set={setK1} aciklama="Yöntem ve başlangıç tarihi dosyaya yazılır." />
          <Onay ad="2. yöntem onaylandı" deger={kontrasepsiyon2} set={setK2} aciklama="İki bağımsız yöntem şarttır; tek yöntem kapıyı açmaz." />
          <div style={{ ...kucuk, marginTop: 6 }}>Cinsel perhiz beyanı yöntemlerin yerine geçmez — hekim kararını ve hastanın beyanını dosyaya not edin.</div>
        </div>
      )}

      {gebelikKapisi && (
        <div style={kutu}>
          <div style={etiket}>β-hCG ve siklus</div>
          <div style={satir}>
            <label style={{ ...metin, display: 'flex', gap: 6, alignItems: 'center' }}>β-hCG tarihi
              <input type="date" aria-label="β-hCG tarihi" value={hcgTarih} onChange={(e) => setHcgTarih(e.target.value)} style={{ ...dermStil.input, width: 180 }} />
            </label>
            <label style={{ ...metin, display: 'flex', gap: 6, alignItems: 'center' }}>Siklus günü
              <input type="number" min={1} max={35} inputMode="numeric" aria-label="Siklus günü" value={siklusGunu} onChange={(e) => setSiklusGunu(e.target.value)} style={{ ...dermStil.input, width: 110 }} />
            </label>
          </div>
          <Onay ad="β-hCG negatif" deger={hcgNegatif} set={setHcgNegatif} aciklama="Sonuç 14 günden eski olmamalı; başlangıç siklusun 2–3. gününde planlanır." />
        </div>
      )}

      <div style={kutu}>
        <div style={etiket}>Reçete</div>
        <div style={satir}>
          <label style={{ ...metin, display: 'flex', gap: 6, alignItems: 'center' }}>Reçete süresi (gün)
            <input type="number" min={1} max={90} inputMode="numeric" aria-label="Reçete süresi" value={receteGun} onChange={(e) => setReceteGun(e.target.value)} style={{ ...dermStil.input, width: 110 }} />
          </label>
        </div>
        <div style={kucuk}>Reçete süresi kapısı cinsiyetten bağımsızdır.</div>
      </div>

      <div style={{ ...kutu, borderColor: sonuc.allowed ? 'rgba(45,212,191,0.4)' : 'rgba(248,113,113,0.45)' }} aria-live="polite">
        <div style={etiket}>GÖP kapı sonucu</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '4px 0 8px' }}>
          <Istatistik deger={engeller.length} etiket="açık kapı engeli" ton={engeller.length ? 'kirmizi' : 'iyi'} />
          <Istatistik deger={(sonuc.notApplicable || []).length} etiket="uygulanmayan kapı" />
        </div>
        <div style={{ ...metin, fontWeight: 800, fontSize: 18, color: sonuc.allowed ? '#2DD4BF' : '#F87171' }}>
          {sonuc.allowed ? 'Kapılarda engel yok — başlatma kararı hekimindir' : `${engeller.length} engel var — başlatılamaz`}
        </div>
        {engeller.map((b) => <div key={b} style={{ ...metin, color: '#F87171' }}>✕ {b}</div>)}
        {(sonuc.notApplicable || []).map((n) => <div key={n} style={{ ...metin, color: '#8FA0B5' }}>— {n}: uygulanmaz</div>)}
        <div style={satir}><KopyalaButonu metin={kopyaMetni} /></div>
        <Katlanir baslik="Asitretin farkı">
          <div style={kucuk}>Asitretin için gebelik yasağı tedavi bitiminden sonra {acitretinPregnancyBanYears()} yıl sürer — izotretinoin kapıları asitretin için yeterli değildir.</div>
        </Katlanir>
        <div style={satir}><Rozet ton="notr">doz ve endikasyon Notya tarafından önerilmez</Rozet></div>
        <TaslakNotu>Kapı kontrolüdür; endikasyon, doz ve izlem planı hekimindir. Nota otomatik yazılmaz.</TaslakNotu>
      </div>

      <div style={kutu}>
        <div style={etiket}>Hastada kaydet (isteğe bağlı)</div>
        <div style={kucuk}>Kapı sonucunu ilaç güvenlik kaydına işlemek için hastayı seçip Deri sekmesini açın.</div>
        <DermHastaSecici secili={hasta.id} sec={(id, ad) => setHasta({ id, ad })} />
        {hasta.id && <div style={satir}><a href={hastaDosyaHref(hasta.id, 'deri')} style={{ ...btn, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Hastada aç (Deri) →</a></div>}
      </div>
    </>
  );
}
