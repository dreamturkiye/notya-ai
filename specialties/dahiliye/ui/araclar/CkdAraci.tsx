'use client';
/**
 * ARACLAR-CILA-01: ortak araç kütüphanesiyle yenilendi — cinsiyet segmenti, manşet evre kartları,
 * katlanır önceki ölçüm bölümü ve taslak rozeti.
 * DAH-EXCEPTIONAL-01 — Araçlar › KDIGO CKD evreleme. Dahiliye-only (BRANS_DOKTOR_ARACLARI).
 * Chapter motoru (engines/ckd.ckdDegerlendir + nefroSevkPaketi) ile birebir aynı kural: eGFR × UACR ısı haritası,
 * kronisite (≥3 ay), izlem sıklığı, sınıf düzeyinde plan ve nefroloji sevk gerekçesi. Doz yazılmaz; karar hekimindir.
 */
import React, { useMemo, useState } from 'react';
import { hastaDosyaHref } from '@/lib/doktor/geriNavigasyon';
import { ckdDegerlendir, nefroSevkPaketi, type Renk } from '../../engines/ckd';
import { dahStil, Segment, Alan, Onay, Sayi, Istatistik, Katlanir, Rozet, TaslakNotu, DahHastaSecici, KopyalaButonu } from './DahiliyeAracKabugu';

const { kutu, etiket, kucuk, metin, satir, btn } = dahStil;

const bugun = () => new Date().toISOString().slice(0, 10);
const sayi = (s: string): number | null => { const t = s.trim().replace(',', '.'); return t === '' || !Number.isFinite(Number(t)) ? null : Number(t); };

const RENK_AD: Record<Renk, string> = { yesil: 'Düşük risk', sari: 'Orta derecede artmış risk', turuncu: 'Yüksek risk', kirmizi: 'Çok yüksek risk' };
const RENK_KOD: Record<Renk, string> = { yesil: '#34D399', sari: '#FBBF24', turuncu: '#FB923C', kirmizi: '#F87171' };
const KRONIK_AD = { evet: 'kronik (≥3 ay doğrulandı)', olasi: 'olası (≥3 ay ikinci ölçüm yok)', bilinmiyor: 'bilinmiyor' } as const;
const CINSIYET: Array<[string, string]> = [['erkek', 'Erkek'], ['kadin', 'Kadın']];

export default function CkdAraci() {
  const [eGFR, setEGFR] = useState('');
  const [uacr, setUacr] = useState('');
  const [oncekiEGFR, setOncekiEGFR] = useState('');
  const [oncekiTarih, setOncekiTarih] = useState('');
  const [k, setK] = useState('');
  const [hb, setHb] = useState('');
  const [yas, setYas] = useState('');
  const [cinsiyet, setCinsiyet] = useState('erkek');
  const [dm, setDm] = useState(false);
  const [ht, setHt] = useState(false);
  const [ras, setRas] = useState(false);
  const [sglt2, setSglt2] = useState(false);
  const [nsaii, setNsaii] = useState(false);
  const [ilacMetni, setIlacMetni] = useState('');
  const [hasta, setHasta] = useState<{ id: string; ad: string }>({ id: '', ad: '' });

  const bugunTarih = bugun();
  const onceki = useMemo(() => {
    const d = sayi(oncekiEGFR);
    return d != null && oncekiTarih ? [{ deger: d, tarih: oncekiTarih }] : [];
  }, [oncekiEGFR, oncekiTarih]);

  const sonuc = useMemo(() => ckdDegerlendir({
    eGFR: sayi(eGFR), eGFRTarih: bugunTarih, oncekiEGFR: onceki,
    uacr: sayi(uacr), uacrTarih: sayi(uacr) == null ? null : bugunTarih,
    dm, ht, rasBlokeri: ras, sglt2, nsaii,
    k: sayi(k), hb: sayi(hb), bugun: bugunTarih,
  }), [eGFR, uacr, onceki, dm, ht, ras, sglt2, nsaii, k, hb, bugunTarih]);

  const ilaclar = ilacMetni.split('\n').map((x) => x.trim()).filter(Boolean);
  const panel = [
    sayi(eGFR) != null ? { ad: 'eGFR', deger: String(sayi(eGFR)), tarih: bugunTarih } : null,
    sayi(uacr) != null ? { ad: 'UACR', deger: `${sayi(uacr)} mg/g`, tarih: bugunTarih } : null,
    sayi(k) != null ? { ad: 'K', deger: String(sayi(k)), tarih: bugunTarih } : null,
    sayi(hb) != null ? { ad: 'Hb', deger: String(sayi(hb)), tarih: bugunTarih } : null,
    ...onceki.map((o) => ({ ad: 'Önceki eGFR', deger: String(o.deger), tarih: o.tarih })),
  ].filter((x): x is { ad: string; deger: string; tarih: string } => !!x);

  const sevkMetni = nefroSevkPaketi(sonuc, panel, { yas: sayi(yas), kadin: cinsiyet === 'kadin' }, ilaclar);

  return (
    <>
      <div style={kutu}>
        <div style={etiket}>Onaylı lab</div>
        <div style={satir}>
          <Sayi ad="eGFR" deger={eGFR} set={setEGFR} birim="mL/dk/1,73 m²" />
          <Sayi ad="UACR" deger={uacr} set={setUacr} birim="mg/g" />
          <Sayi ad="K" deger={k} set={setK} birim="mmol/L" adim="0.1" genislik={90} />
          <Sayi ad="Hb" deger={hb} set={setHb} birim="g/dL" adim="0.1" genislik={90} />
        </div>
        <Katlanir baslik="Önceki eGFR (kronisite için)" acik={!!oncekiEGFR} rozet={oncekiEGFR && oncekiTarih ? 'girildi' : undefined}>
          <div style={satir}>
            <Sayi ad="Önceki eGFR" deger={oncekiEGFR} set={setOncekiEGFR} />
            <label style={{ ...metin, display: 'flex', gap: 6, alignItems: 'center' }}>Ölçüm tarihi
              <input type="date" aria-label="Önceki eGFR tarihi" value={oncekiTarih} onChange={(e) => setOncekiTarih(e.target.value)} style={{ ...dahStil.input, width: 170 }} />
            </label>
          </div>
          <div style={{ ...kucuk, marginTop: 8 }}>Kronisite için ≥3 ay arayla iki ölçüm gerekir; tek ölçümde evre &quot;olası&quot; işaretlenir. Kreatinin/eGFR girilmezse evre verilmez.</div>
        </Katlanir>
      </div>

      <div style={kutu}>
        <div style={etiket}>Klinik bağlam</div>
        <div style={satir}>
          <Onay ad="Diyabet" deger={dm} set={setDm} />
          <Onay ad="Hipertansiyon" deger={ht} set={setHt} />
          <Onay ad="RAS blokeri (ACEİ/ARB) altında" deger={ras} set={setRas} />
          <Onay ad="SGLT2 inhibitörü altında" deger={sglt2} set={setSglt2} />
          <Onay ad="Aktif NSAİİ" deger={nsaii} set={setNsaii} />
        </div>
      </div>

      <div style={{ ...kutu, borderColor: 'rgba(20,184,166,0.35)' }} aria-live="polite">
        <div style={etiket}>KDIGO değerlendirme</div>
        {sonuc.g ? (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '4px 0 8px' }}>
              <Istatistik deger={`${sonuc.g} ${sonuc.a || '(UACR yok)'}`} etiket={sonuc.renk ? RENK_AD[sonuc.renk] : 'evre'} ton={sonuc.renk === 'kirmizi' ? 'kirmizi' : sonuc.renk === 'turuncu' || sonuc.renk === 'sari' ? 'uyari' : 'iyi'} />
              <Istatistik deger={sonuc.izlemAy != null ? `${sonuc.izlemAy} ay` : '—'} etiket="önerilen izlem aralığı (eGFR + UACR)" />
            </div>
            <div style={satir}>
              <Rozet ton={sonuc.kronikMi === 'evet' ? 'iyi' : 'uyari'}>kronisite: {KRONIK_AD[sonuc.kronikMi]}</Rozet>
              {sonuc.hizliDusus && <Rozet ton="kirmizi">1 yılda eGFR &gt;%25 düşüş</Rozet>}
            </div>
          </>
        ) : (
          <div style={{ ...metin, fontWeight: 700 }}>eGFR girilmedi — evre verilmez</div>
        )}
        {sonuc.uyarilar.map((u) => <div key={u} style={{ ...metin, marginTop: 8, color: '#FBBF24' }}>⚠ {u}</div>)}
        <TaslakNotu>KDIGO evresi ve izlem aralığı karar desteğidir; kronisite doğrulaması ve tedavi kararı hekimindir. Nota otomatik yazılmaz.</TaslakNotu>
      </div>

      {!!sonuc.plan.length && (
        <div style={kutu}>
          <div style={etiket}>Plan (sınıf düzeyinde — hekim dozu yazar)</div>
          {sonuc.plan.map((p) => <div key={p} style={{ ...metin, marginTop: 6 }}>• {p}</div>)}
        </div>
      )}

      <div style={kutu}>
        <div style={etiket}>Nefroloji sevk</div>
        {sonuc.sevk.length
          ? sonuc.sevk.map((s) => <div key={s} style={{ ...metin, marginTop: 6 }}>• {s}</div>)
          : <div style={kucuk}>Bu girdilerle sevk ölçütü oluşmadı.</div>}
        <div style={satir}>
          <Sayi ad="Yaş" deger={yas} set={setYas} genislik={90} />
        </div>
        <div style={{ maxWidth: 280, marginTop: 10 }}>
          <Alan etiket="Cinsiyet">
            <Segment etiket="Cinsiyet" deger={cinsiyet} set={setCinsiyet} secenekler={CINSIYET} />
          </Alan>
        </div>
        <label style={{ ...metin, display: 'block', marginTop: 8 }}>Aktif ilaçlar (her satıra bir)
          <textarea aria-label="Aktif ilaçlar" value={ilacMetni} onChange={(e) => setIlacMetni(e.target.value)} rows={3} placeholder={'ramipril\nempagliflozin'} style={{ ...dahStil.input, marginTop: 6, resize: 'vertical' }} />
        </label>
        <div style={satir}><KopyalaButonu metin={sevkMetni} etiket="Sevk paketini kopyala" /></div>
        <TaslakNotu>Sevk paketi taslaktır; hasta adı ve kimlik bilgisi yazılmaz. Gönderim ve içerik hekim onayıyla; nota otomatik yazılmaz.</TaslakNotu>
      </div>

      <div style={kutu}>
        <div style={etiket}>Hastada kaydet (isteğe bağlı)</div>
        <div style={kucuk}>Hesap için hasta seçmek gerekmez. Evreyi dosyaya işlemek isterseniz hastayı seçip Dahiliye sekmesini açın.</div>
        <DahHastaSecici secili={hasta.id} sec={(id, ad) => setHasta({ id, ad })} />
        {hasta.id && <div style={satir}><a href={hastaDosyaHref(hasta.id, 'dahiliye')} style={{ ...btn, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Hastada aç (Dahiliye) →</a></div>}
      </div>
    </>
  );
}
