'use client';
/**
 * ARACLAR-CILA-01 Faz 4 — Araçlar › Muayene sonu paketi (evrensel, her branş).
 *
 * Vizitin kapanış ritüeli tek yerde: reçete, rapor, kontrol randevusu, portal özeti ve SGK provizyon
 * adımı beş ayrı ekran yerine tek akışta. MEVCUT rotalar ve bileşenler BAĞLANIR — hiçbiri yeniden
 * yazılmaz (/doktor-tools/erecete, /doktor-tools/sgk-rapor, /dashboard/doktor/randevular,
 * /doktor-tools/hasta-portali, /doktor-tools/sgk-medula).
 *
 * Her adım İSTEĞE BAĞLIDIR: hekim hangisini isterse onu yapar, istemediğini işaretlemez. Kapanış
 * özeti bugünkü muayene formuna yalnız hekim basarsa eklenir (ortak MuayeneFormunaEkle yolu).
 */
import React, { useState } from 'react';
import { hastaDosyaHref } from '@/lib/doktor/geriNavigasyon';
import {
  aracStil, Alan, HastaSecici, Istatistik, Katlanir, KopyalaButonu, Kutu,
  MuayeneFormunaEkle, TaslakNotu, VURGU_TEAL,
} from '@/lib/doktor/aracUi';

const stil = aracStil(VURGU_TEAL);
const { kutu, etiket, kucuk, metin, satir, ghost, input } = stil;

type AdimKod = 'recete' | 'rapor' | 'randevu' | 'portal' | 'provizyon';

const ADIMLAR: Array<{ kod: AdimKod; ad: string; ne: string; yol: string; baglantiAd: string }> = [
  { kod: 'recete', ad: 'Reçete', ne: 'e-Reçete asistanını açar; ilaç ve dozu hekim yazar.', yol: '/doktor-tools/erecete', baglantiAd: 'e-Reçete Asistanını aç' },
  { kod: 'rapor', ad: 'Rapor', ne: 'SGK e-İstirahat / e-Rapor ve muayenehane belgesi taslağı.', yol: '/doktor-tools/sgk-rapor', baglantiAd: 'Hasta Raporlarını aç' },
  { kod: 'randevu', ad: 'Kontrol randevusu', ne: 'Kontrol tarihini takvime yazar.', yol: '/dashboard/doktor/randevular', baglantiAd: 'Randevuları aç' },
  { kod: 'portal', ad: 'Portal özeti', ne: 'Hastaya Sağlığım portal erişimi ve özet paylaşımı.', yol: '/doktor-tools/hasta-portali', baglantiAd: 'Hasta Portalını aç' },
  { kod: 'provizyon', ad: 'SGK provizyon', ne: 'Medula provizyon / e-reçete sorgulaması (varsa).', yol: '/doktor-tools/sgk-medula', baglantiAd: 'SGK Medula’yı aç' },
];

export default function MuayeneSonuPaketi() {
  const [hasta, setHasta] = useState<{ id: string; ad: string }>({ id: '', ad: '' });
  const [secili, setSecili] = useState<AdimKod[]>([]);
  const [kontrolAraligi, setKontrolAraligi] = useState('');
  const [kapanisNotu, setKapanisNotu] = useState('');

  const cevir = (k: AdimKod) => setSecili((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));
  const secildi = (k: AdimKod) => secili.includes(k);

  const notSatirlari = [
    secili.length ? `Vizit kapanışı — yapılanlar: ${ADIMLAR.filter((a) => secildi(a.kod)).map((a) => a.ad).join(', ')}` : '',
    kontrolAraligi.trim() ? `Kontrol aralığı (hekim): ${kontrolAraligi.trim()}` : '',
    kapanisNotu.trim() ? `Kapanış notu: ${kapanisNotu.trim()}` : '',
  ].filter(Boolean);

  const kopyaMetni = ['Vizit kapanışı', ...notSatirlari].join('\n');

  return (
    <>
      <div style={kutu}>
        <div style={etiket}>Hasta</div>
        <div style={kucuk}>Hastayı seçerseniz dosya bağlantısı açılır ve kapanış özeti bugünkü muayene formuna eklenebilir.</div>
        <HastaSecici secili={hasta.id} sec={(id, ad) => setHasta({ id, ad })} />
        {hasta.id && (
          <div style={satir}>
            <a href={hastaDosyaHref(hasta.id)} style={ghost}>Hasta dosyasını aç →</a>
          </div>
        )}
      </div>

      <div style={kutu} aria-live="polite">
        <div style={etiket}>Kapanış adımları — her biri isteğe bağlı</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '4px 0 12px' }}>
          <Istatistik deger={`${secili.length}/${ADIMLAR.length}`} etiket="işaretlenen adım" ton={secili.length ? 'iyi' : 'notr'} />
          <Istatistik deger={kontrolAraligi.trim() || '—'} etiket="kontrol aralığı (hekim yazar)" />
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          {ADIMLAR.map((a) => (
            <div key={a.kod} style={{ border: `1px solid ${secildi(a.kod) ? 'rgba(45,212,191,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 14, padding: '10px 12px', background: 'rgba(0,0,0,0.14)' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <Kutu on={secildi(a.kod)} set={() => cevir(a.kod)}>{a.ad}</Kutu>
                <a href={a.yol} style={ghost}>{a.baglantiAd} →</a>
              </div>
              <div style={{ ...kucuk, marginTop: 2 }}>{a.ne}</div>
            </div>
          ))}
        </div>
        <div style={{ ...kucuk, marginTop: 10 }}>Bağlantılar mevcut araçları açar; o araçlar hastayı kendi ekranlarında sorar. İşaretlemek bir işlem yapmaz — yalnız kapanış özetine yazılır.</div>
      </div>

      <div style={kutu}>
        <div style={etiket}>Kapanış özeti</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          <Alan etiket="Kontrol aralığı" ipucu="Hekimin kendi yazdığı metin — ör. “3 hafta sonra”.">
            <input value={kontrolAraligi} onChange={(e) => setKontrolAraligi(e.target.value)} placeholder="3 hafta sonra" aria-label="Kontrol aralığı" maxLength={120} style={input} />
          </Alan>
        </div>
        <div style={{ marginTop: 12 }}>
          <Alan etiket="Kapanış notu (isteğe bağlı)">
            <textarea value={kapanisNotu} onChange={(e) => setKapanisNotu(e.target.value)} rows={3} placeholder="Hastaya söylenenler, dikkat edilecekler…" aria-label="Kapanış notu" maxLength={600} style={{ ...input, resize: 'vertical', fontFamily: 'inherit' }} />
          </Alan>
        </div>
        {!notSatirlari.length && <div style={{ ...kucuk, marginTop: 10 }}>Adım işaretleyin ya da kontrol aralığını yazın — özet burada oluşur.</div>}
        {!!notSatirlari.length && (
          <div style={{ ...metin, marginTop: 12, background: 'rgba(0,0,0,0.18)', borderRadius: 12, padding: 12, whiteSpace: 'pre-wrap' }}>{notSatirlari.join('\n')}</div>
        )}
        <div style={satir}><KopyalaButonu metin={kopyaMetni} etiket="Kapanış özetini kopyala" /></div>
        <MuayeneFormunaEkle hastaId={hasta.id} arac="Vizit kapanışı" satirlar={notSatirlari} />
        <Katlanir baslik="Bu araç ne yapmaz">
          <div style={kucuk}>Reçete yazmaz, rapor kilitlemez, randevu oluşturmaz, provizyon sorgulamaz — bunların her biri kendi aracında, hekimin onayıyla yapılır. Burada yalnız vizitin kapanışı toplanır ve istenirse tek blok olarak muayene formuna eklenir.</div>
        </Katlanir>
        <TaslakNotu>Kapanış listesi karar desteğidir; hangi adımın yapılacağına hekim karar verir. Nota yalnız “Bugünkü muayene formuna ekle”ye bastığınızda yazılır.</TaslakNotu>
      </div>
    </>
  );
}
