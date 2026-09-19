'use client';
/**
 * ARACLAR-CILA-01: ortak araç kütüphanesiyle yenilendi — cinsiyet / diyabet tipi / endikasyon segmenti,
 * manşet eksik sayısı, SUT kontrol listesi rozetleri ve taslak rozeti.
 * DAH-EXCEPTIONAL-01 — Araçlar › SGK ilaç raporu. Dahiliye-only (BRANS_DOKTOR_ARACLARI).
 * Chapter motoru (engines/sgkRapor.sgkRaporTaslagi) ile birebir aynı kural: etken madde yalnız girilen ilaç
 * satırlarından, doz yazılmaz, T.C. kimlik no hiç yazılmaz. Rapor taslaktır; Medula girişi hekim + e-imza ile.
 */
import React, { useMemo, useState } from 'react';
import { hastaDosyaHref } from '@/lib/doktor/geriNavigasyon';
import { sgkRaporTaslagi, SGK_SABLONLARI, type SgkSablon } from '../../engines/sgkRapor';
import { dahStil, Secim, Segment, Alan, Onay, Sayi, Istatistik, Rozet, TaslakNotu, DahHastaSecici, KopyalaButonu } from './DahiliyeAracKabugu';

const { kutu, etiket, kucuk, metin, satir, btn } = dahStil;

const bugun = () => new Date().toISOString().slice(0, 10);
const sayi = (s: string): number | null => { const t = s.trim().replace(',', '.'); return t === '' || !Number.isFinite(Number(t)) ? null : Number(t); };

const SABLON: Array<[string, string]> = SGK_SABLONLARI.map((s) => [s.id, s.ad]);
const CINSIYET: Array<[string, string]> = [['erkek', 'Erkek'], ['kadin', 'Kadın']];
const ENDIKASYON: Array<[string, string]> = [['af', 'Atriyal fibrilasyon'], ['dvt', 'Derin ven trombozu'], ['pe', 'Pulmoner emboli']];
const DM_TIP: Array<[string, string]> = [['T2', 'Tip 2'], ['T1', 'Tip 1'], ['diger', 'Diğer']];
const ISARET = (t: boolean | null) => (t === true ? '✓' : t === false ? '✗' : '?');

export default function SgkRaporAraci() {
  const [sablon, setSablon] = useState<SgkSablon>('ht');
  const [yas, setYas] = useState('');
  const [cinsiyet, setCinsiyet] = useState('erkek');
  const [sureAy, setSureAy] = useState('12');
  const [ilacMetni, setIlacMetni] = useState('');
  const [sbp, setSbp] = useState('');
  const [dbp, setDbp] = useState('');
  const [htEvre, setHtEvre] = useState('');
  const [kvrKategori, setKvrKategori] = useState('');
  const [askvh, setAskvh] = useState(false);
  const [dmTip, setDmTip] = useState('T2');
  const [endikasyon, setEndikasyon] = useState('af');
  const [cha, setCha] = useState({ kky: false, ht: false, dm: false, inmeTia: false, vaskuler: false });
  const [mekanikKapak, setMekanikKapak] = useState(false);
  const [hasta, setHasta] = useState<{ id: string; ad: string }>({ id: '', ad: '' });

  const ilaclar = useMemo(() => ilacMetni.split('\n').map((x) => x.trim()).filter(Boolean).map((ad) => ({ ad, aktif: true })), [ilacMetni]);
  const kadin = cinsiyet === 'kadin';

  const sonuc = useMemo(() => sgkRaporTaslagi({
    sablon,
    hasta: { adSoyad: '', yas: sayi(yas), kadin },
    ilaclar,
    labs: {},
    kbSerisi: sayi(sbp) != null && sayi(dbp) != null ? [{ sbp: sayi(sbp)!, dbp: sayi(dbp)!, tarih: bugun() }] : [],
    htEvreHekim: htEvre.trim() || null,
    kvrKategoriHekim: kvrKategori.trim() || null,
    askvh,
    dmTip: dmTip as 'T2' | 'T1' | 'diger',
    doakEndikasyon: endikasyon as 'af' | 'dvt' | 'pe',
    chaVasc: cha,
    mekanikKapak,
    sureAy: sayi(sureAy) ?? 12,
    bugun: bugun(),
  }), [sablon, yas, kadin, ilaclar, sbp, dbp, htEvre, kvrKategori, askvh, dmTip, endikasyon, cha, mekanikKapak, sureAy]);

  const d = sonuc.draft;
  const kopyaMetni = [
    `${d.raporBasligi} — taslak (${bugun()})`,
    `Tanı: ${d.tani.icd10} ${d.tani.aciklama}`,
    `Süre: ${d.onerilen_sure_ay} ay`,
    `Etken madde: ${(d.etkenMaddeler || []).join(', ') || '—'}`,
    d.mevcutDurum ? `Klinik: ${d.mevcutDurum}` : null,
    (d.zorunluTetkikler || []).length ? `Tetkik: ${(d.zorunluTetkikler || []).join('; ')}` : null,
    d.hekim_degerlendirmesi || null,
    '',
    'SUT kontrol listesi:',
    ...sonuc.sutKontrol.map((s) => `  ${ISARET(s.tamam)} ${s.madde}`),
    sonuc.eksikler.length ? `\nEksikler:\n${sonuc.eksikler.map((e) => `  • ${e}`).join('\n')}` : null,
  ].filter(Boolean).join('\n');

  return (
    <>
      <div style={kutu}>
        <div style={etiket}>Şablon</div>
        <div style={satir}>
          <Secim etiket="Rapor şablonu" deger={sablon} set={(x) => setSablon(x as SgkSablon)} secenekler={SABLON} />
          <Sayi ad="Süre" deger={sureAy} set={setSureAy} birim="ay (en fazla 24)" genislik={90} />
        </div>
        <div style={satir}>
          <Sayi ad="Yaş" deger={yas} set={setYas} genislik={90} />
        </div>
        <div style={{ maxWidth: 280, marginTop: 10 }}>
          <Alan etiket="Cinsiyet">
            <Segment etiket="Cinsiyet" deger={cinsiyet} set={setCinsiyet} secenekler={CINSIYET} />
          </Alan>
        </div>
        <div style={{ ...kucuk, marginTop: 8 }}>Hasta adı ve T.C. kimlik no taslağa yazılmaz — Medula girişinde hekim doldurur.</div>
      </div>

      <div style={kutu}>
        <div style={etiket}>Aktif ilaçlar (her satıra bir)</div>
        <textarea aria-label="Aktif ilaçlar" value={ilacMetni} onChange={(e) => setIlacMetni(e.target.value)} rows={4} placeholder={'ramipril\namlodipin'} style={{ ...dahStil.input, resize: 'vertical' }} />
        <div style={{ ...kucuk, marginTop: 6 }}>Etken madde yalnız bu satırlardan alınır; şablona uymayan satırlar taslağa girmez. Doz yazılmaz.</div>
      </div>

      {sablon === 'ht' && (
        <div style={kutu}>
          <div style={etiket}>Hipertansiyon alanları</div>
          <div style={satir}>
            <Sayi ad="Ofis SBP" deger={sbp} set={setSbp} birim="mmHg" />
            <Sayi ad="Ofis DBP" deger={dbp} set={setDbp} birim="mmHg" />
          </div>
          <label style={{ ...metin, display: 'flex', gap: 6, alignItems: 'center', marginTop: 8 }}>Hekim evresi
            <input value={htEvre} onChange={(e) => setHtEvre(e.target.value)} aria-label="Hekim HT evresi" placeholder="ör. Evre 2" style={{ ...dahStil.input, width: 200, minHeight: 44 }} />
          </label>
        </div>
      )}

      {sablon === 'dm' && (
        <div style={kutu}>
          <div style={etiket}>Diyabet alanları</div>
          <div style={{ maxWidth: 360 }}>
            <Alan etiket="Diyabet tipi">
              <Segment etiket="Diyabet tipi" deger={dmTip} set={setDmTip} secenekler={DM_TIP} />
            </Alan>
          </div>
        </div>
      )}

      {sablon === 'statin' && (
        <div style={kutu}>
          <div style={etiket}>Dislipidemi alanları</div>
          <label style={{ ...metin, display: 'flex', gap: 6, alignItems: 'center' }}>KVR kategorisi (hekim kilidi)
            <input value={kvrKategori} onChange={(e) => setKvrKategori(e.target.value)} aria-label="KVR kategorisi" placeholder="ör. çok yüksek risk" style={{ ...dahStil.input, width: 220, minHeight: 44 }} />
          </label>
          <div style={satir}><Onay ad="Aterosklerotik KVH öyküsü" deger={askvh} set={setAskvh} /></div>
        </div>
      )}

      {sablon === 'doak' && (
        <div style={kutu}>
          <div style={etiket}>Antikoagülan alanları</div>
          <div style={{ maxWidth: 480 }}>
            <Alan etiket="Endikasyon">
              <Segment etiket="Endikasyon" deger={endikasyon} set={setEndikasyon} secenekler={ENDIKASYON} />
            </Alan>
          </div>
          <div style={satir}>
            <Onay ad="Mekanik kapak" deger={mekanikKapak} set={setMekanikKapak} aciklama="DOAK kontrendike" />
          </div>
          {endikasyon === 'af' && (
            <>
              <div style={{ ...kucuk, marginTop: 8 }}>CHA₂DS₂-VASc bileşenleri (hekim işaretler; yaş ve cinsiyet yukarıdan alınır):</div>
              <div style={satir}>
                <Onay ad="Kalp yetersizliği" deger={cha.kky} set={(b) => setCha((p) => ({ ...p, kky: b }))} />
                <Onay ad="Hipertansiyon" deger={cha.ht} set={(b) => setCha((p) => ({ ...p, ht: b }))} />
                <Onay ad="Diyabet" deger={cha.dm} set={(b) => setCha((p) => ({ ...p, dm: b }))} />
                <Onay ad="İnme / TİA" deger={cha.inmeTia} set={(b) => setCha((p) => ({ ...p, inmeTia: b }))} />
                <Onay ad="Vasküler hastalık" deger={cha.vaskuler} set={(b) => setCha((p) => ({ ...p, vaskuler: b }))} />
              </div>
            </>
          )}
        </div>
      )}

      <div style={{ ...kutu, borderColor: 'rgba(20,184,166,0.35)' }} aria-live="polite">
        <div style={etiket}>Taslak</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '4px 0 8px' }}>
          <Istatistik deger={sonuc.eksikler.length} etiket="eksik" ton={sonuc.eksikler.length ? 'kirmizi' : 'iyi'} />
          <Istatistik deger={`${sonuc.sutKontrol.filter((x) => x.tamam === true).length}/${sonuc.sutKontrol.length}`} etiket="SUT maddesi tamam" />
          <Istatistik deger={`${d.onerilen_sure_ay} ay`} etiket="önerilen rapor süresi" />
        </div>
        <div style={{ ...metin, fontWeight: 700 }}>{d.tani.icd10} — {d.tani.aciklama}</div>
        <div style={{ ...metin, marginTop: 6 }}>Süre: {d.onerilen_sure_ay} ay</div>
        <div style={{ ...metin, marginTop: 6 }}>Etken madde: {(d.etkenMaddeler || []).join(', ') || '—'}</div>
        {d.mevcutDurum && <div style={{ ...kucuk, marginTop: 6, whiteSpace: 'pre-wrap' }}>{d.mevcutDurum}</div>}
        {sonuc.chaVascSkor != null && <div style={{ ...metin, marginTop: 6 }}>CHA₂DS₂-VASc (işaretli bileşenler): {sonuc.chaVascSkor}</div>}
        <div style={satir}><KopyalaButonu metin={kopyaMetni} etiket="Taslağı kopyala" /></div>
        <TaslakNotu>Rapor hekim kilitleyene kadar taslaktır; Medula girişi e-imza ile yapılır. Hasta adı, T.C. kimlik no ve doz yazılmaz; nota otomatik yazılmaz.</TaslakNotu>
      </div>

      {!!sonuc.eksikler.length && (
        <div style={kutu}>
          <div style={etiket}>Eksikler</div>
          {sonuc.eksikler.map((e) => <div key={e} style={{ ...metin, marginTop: 6, color: '#FBBF24' }}>• {e}</div>)}
        </div>
      )}

      <div style={kutu}>
        <div style={etiket}>SUT kontrol listesi</div>
        {sonuc.sutKontrol.map((s) => (
          <div key={s.madde} style={{ ...metin, marginTop: 6, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <Rozet ton={s.tamam === true ? 'iyi' : s.tamam === false ? 'kirmizi' : 'uyari'}>{ISARET(s.tamam)}</Rozet>
            <span>{s.madde}</span>
          </div>
        ))}
        <div style={{ ...kucuk, marginTop: 10 }}>Güncel SUT madde metnini hekim doğrular. Rapor hekim kilitleyene kadar taslaktır; Medula girişi e-imza ile yapılır.</div>
      </div>

      <div style={kutu}>
        <div style={etiket}>Hastada kaydet (isteğe bağlı)</div>
        <div style={kucuk}>Taslak için hasta seçmek gerekmez. Raporu dosyaya işlemek isterseniz hastayı seçip Dahiliye sekmesini açın.</div>
        <DahHastaSecici secili={hasta.id} sec={(id, ad) => setHasta({ id, ad })} />
        {hasta.id && <div style={satir}><a href={hastaDosyaHref(hasta.id, 'dahiliye')} style={{ ...btn, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Hastada aç (Dahiliye) →</a></div>}
      </div>
    </>
  );
}
