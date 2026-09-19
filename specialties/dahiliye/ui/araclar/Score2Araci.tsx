'use client';
/**
 * ARACLAR-CILA-01: ortak araç kütüphanesiyle yenilendi — cinsiyet/statin segmenti, manşet risk sayısı,
 * katlanır lipid bölümü ve taslak rozeti.
 * Faz 3 (kalıcılık): hasta seçiliyse KVR girdileri dahiliye chapter'ın KENDİ tablosundan
 * (dahiliye_kvr, /api/doktor/dahiliye) ön doldurulur ve "Girdileri hastaya kaydet" aynı tabloya
 * mevcut `adim: 'kvr'` yoluyla yazar. Yeni tablo açılmadı; kayıt hekimin açık eylemidir.
 * DAH-EXCEPTIONAL-01 — Araçlar › SCORE2 / KVR. Dahiliye-only (BRANS_DOKTOR_ARACLARI).
 * Chapter motoru (engines/score2.kvrDegerlendir) ile birebir aynı kural: kural kovası → SCORE2 / SCORE2-Diabetes /
 * SCORE2-OP → LDL hedefi ve statin yoğunluk açığı. Çıktı taslaktır; kategori ve hedef hekim kilidiyle kesinleşir.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { hastaDosyaHref } from '@/lib/doktor/geriNavigasyon';
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi';
import { kvrDegerlendir, type Bolge, type Cinsiyet, type KvrKova } from '../../engines/score2';
import { dahStil, Secim, Segment, Alan, Onay, Sayi, Istatistik, Katlanir, KayitButonu, MuayeneFormunaEkle, OncekiVizit, Rozet, TaslakNotu, DahHastaSecici, KopyalaButonu } from './DahiliyeAracKabugu';

const { kutu, etiket, kucuk, metin, satir, btn } = dahStil;

const CINSIYET: Array<[string, string]> = [['erkek', 'Erkek'], ['kadin', 'Kadın']];
const BOLGE: Array<[string, string]> = [
  ['high', 'Yüksek risk bölgesi (Türkiye)'],
  ['low', 'Düşük risk bölgesi'],
  ['moderate', 'Orta risk bölgesi'],
  ['very_high', 'Çok yüksek risk bölgesi'],
];
const STATIN: Array<[string, string]> = [
  ['yok', 'Statin yok'],
  ['dusuk', 'Düşük yoğunluk'],
  ['orta', 'Orta yoğunluk'],
  ['yuksek', 'Yüksek yoğunluk'],
];
const KOVA_AD: Record<KvrKova, string> = { dusuk_orta: 'Düşük–orta risk', yuksek: 'Yüksek risk', cok_yuksek: 'Çok yüksek risk' };

const sayi = (s: string): number | null => { const t = s.trim().replace(',', '.'); return t === '' || !Number.isFinite(Number(t)) ? null : Number(t); };

export default function Score2Araci() {
  const [yas, setYas] = useState('');
  const [cinsiyet, setCinsiyet] = useState<Cinsiyet>('erkek');
  const [sigara, setSigara] = useState(false);
  const [sbp, setSbp] = useState('');
  const [tchol, setTchol] = useState('');
  const [hdl, setHdl] = useState('');
  const [bolge, setBolge] = useState<Bolge>('high');
  const [dm, setDm] = useState(false);
  const [dmTod, setDmTod] = useState(false);
  const [hba1c, setHba1c] = useState('');
  const [dmTaniYasi, setDmTaniYasi] = useState('');
  const [askvh, setAskvh] = useState(false);
  const [eGFR, setEGFR] = useState('');
  const [uacr, setUacr] = useState('');
  const [ldl, setLdl] = useState('');
  const [statin, setStatin] = useState<'yok' | 'dusuk' | 'orta' | 'yuksek'>('yok');
  const [ezetimib, setEzetimib] = useState(false);
  const [hasta, setHasta] = useState<{ id: string; ad: string }>({ id: '', ad: '' });
  const [kayitliTarih, setKayitliTarih] = useState<string | null>(null);
  const [kayitHata, setKayitHata] = useState('');

  /** Kayıtlı KVR girdileri — hastanın kendi dahiliye kaydından (sahiplik sunucuda doğrulanır). */
  const yukle = useCallback(async (id: string) => {
    setKayitHata(''); setKayitliTarih(null);
    if (!id) return;
    try {
      const t = await getAccessTokenAsync();
      const r = await fetch(`/api/doktor/dahiliye?patientId=${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setKayitHata(j.error || 'Hasta kaydı okunamadı.'); return; }
      const k = j.wow?.kvr as { sigara?: boolean; askvh?: boolean; dm_tod?: boolean; statin_yogunluk?: string; ezetimib?: boolean; dm_tani_yasi?: number | null } | undefined;
      // ÖN DOLDUR — hekim hepsini değiştirebilir.
      if (j.hasta?.yas != null) setYas((p) => p || String(j.hasta.yas));
      if (j.hasta?.kadin != null) setCinsiyet(j.hasta.kadin ? 'kadin' : 'erkek');
      const kb = (j.ht || [])[0] as { sbp?: number | null } | undefined;
      if (kb?.sbp != null) setSbp((p) => p || String(kb.sbp));
      const ckd = j.wow?.ckd as { egfr?: number | null; uacr?: number | null } | undefined;
      if (ckd?.egfr != null) setEGFR((p) => p || String(ckd.egfr));
      if (ckd?.uacr != null) setUacr((p) => p || String(ckd.uacr));
      if (k) {
        setSigara(!!k.sigara); setAskvh(!!k.askvh); setDmTod(!!k.dm_tod); setEzetimib(!!k.ezetimib);
        if (k.statin_yogunluk) setStatin(k.statin_yogunluk as typeof statin);
        if (k.dm_tani_yasi != null) setDmTaniYasi((p) => p || String(k.dm_tani_yasi));
        setKayitliTarih('kayıtlı');
      }
    } catch { setKayitHata('Hasta kaydı okunamadı — bağlantıyı kontrol edin.'); }
  }, []);
  useEffect(() => { yukle(hasta.id); }, [hasta.id, yukle]);

  const sonuc = useMemo(() => kvrDegerlendir({
    yas: sayi(yas), cinsiyet, sigara, sbp: sayi(sbp) ?? undefined, tcholMgdl: sayi(tchol) ?? undefined, hdlMgdl: sayi(hdl) ?? undefined, bolge,
    askvh, dm, dmTod: dm && dmTod,
    eGFR: sayi(eGFR), uacr: sayi(uacr),
    ldlMgdl: sayi(ldl), statinYogunluk: statin, ezetimib,
    hba1cYuzde: sayi(hba1c), dmTaniYasi: sayi(dmTaniYasi),
  }), [yas, cinsiyet, sigara, sbp, tchol, hdl, bolge, askvh, dm, dmTod, eGFR, uacr, ldl, statin, ezetimib, hba1c, dmTaniYasi]);

  const risk = sonuc.score2 ?? sonuc.score2Diabetes ?? sonuc.score2Op;
  const riskAd = sonuc.score2 != null ? 'SCORE2' : sonuc.score2Diabetes != null ? 'SCORE2-Diabetes' : sonuc.score2Op != null ? 'SCORE2-OP' : null;

  const kopyaMetni = [
    'KVR taslağı (dahiliye) — hekim kilidi olmadan kesinleşmez',
    riskAd ? `${riskAd}: %${risk}` : 'Sayısal risk hesaplanmadı',
    sonuc.kova ? `Kova (taslak): ${KOVA_AD[sonuc.kova]} — ${sonuc.kovaNedeni}` : 'Kova: belirlenemedi',
    sonuc.hedefNotu,
    ...sonuc.statinAcigi.map((x) => `Statin: ${x}`),
    sonuc.score2Notu ? `Not: ${sonuc.score2Notu}` : null,
    new Date().toISOString().slice(0, 10),
  ].filter(Boolean).join('\n');

  const notSatirlari = [
    riskAd ? `${riskAd}: %${risk} — 10 yıllık kardiyovasküler risk` : '',
    sonuc.kova ? `Risk kovası (taslak, hekim kilitler): ${KOVA_AD[sonuc.kova]} — ${sonuc.kovaNedeni}` : '',
    sonuc.hedefNotu,
    ...sonuc.statinAcigi.map((x) => `Statin: ${x}`),
    sonuc.score2Notu || '',
  ].filter(Boolean);

  return (
    <>
      <div style={kutu}>
        <div style={etiket}>SCORE2 girdileri</div>
        <div style={{ maxWidth: 280, marginBottom: 10 }}>
          <Alan etiket="Cinsiyet">
            <Segment etiket="Cinsiyet" deger={cinsiyet} set={(x) => setCinsiyet(x as Cinsiyet)} secenekler={CINSIYET as Array<[string, string]>} />
          </Alan>
        </div>
        <div style={satir}>
          <Sayi ad="Yaş" deger={yas} set={setYas} genislik={90} />
          <Sayi ad="SBP" deger={sbp} set={setSbp} birim="mmHg" />
          <Sayi ad="Total kolesterol" deger={tchol} set={setTchol} birim="mg/dL" />
          <Sayi ad="HDL" deger={hdl} set={setHdl} birim="mg/dL" />
        </div>
        <div style={satir}>
          <Onay ad="Aktif sigara" deger={sigara} set={setSigara} />
          <Secim etiket="Risk bölgesi" deger={bolge} set={(x) => setBolge(x as Bolge)} secenekler={BOLGE} />
        </div>
        <div style={{ ...kucuk, marginTop: 8 }}>SCORE2 40–69 yaş ve diyabetsiz kişide tanımlıdır; ≥70 yaşta SCORE2-OP, tip 2 diyabette SCORE2-Diabetes kullanılır. Türkiye ESC haritasında yüksek risk bölgesidir.</div>
      </div>

      <div style={kutu}>
        <div style={etiket}>Kural kovası girdileri</div>
        <div style={satir}>
          <Onay ad="Aterosklerotik KVH öyküsü" deger={askvh} set={setAskvh} aciklama="Belgeli ASKVH tek başına çok yüksek risk — skor gerekmez" />
          <Onay ad="Diyabet" deger={dm} set={setDm} />
          {dm && <Onay ad="Diyabet + hedef organ hasarı" deger={dmTod} set={setDmTod} />}
        </div>
        {dm && (
          <div style={satir}>
            <Sayi ad="HbA1c" deger={hba1c} set={setHba1c} birim="%" adim="0.1" genislik={90} />
            <Sayi ad="Diyabet tanı yaşı" deger={dmTaniYasi} set={setDmTaniYasi} genislik={90} />
          </div>
        )}
        <div style={satir}>
          <Sayi ad="eGFR" deger={eGFR} set={setEGFR} birim="mL/dk/1,73 m²" />
          <Sayi ad="UACR" deger={uacr} set={setUacr} birim="mg/g" />
        </div>
      </div>

      <div style={kutu}>
        <Katlanir baslik="Lipid durumu (isteğe bağlı)" acik={!!ldl || statin !== 'yok' || ezetimib} rozet={ldl ? `LDL ${ldl}` : statin !== 'yok' ? 'statin altında' : undefined}>
          <div style={satir}>
            <Sayi ad="LDL" deger={ldl} set={setLdl} birim="mg/dL" />
            <Onay ad="Ezetimib altında" deger={ezetimib} set={setEzetimib} />
          </div>
          <div style={{ maxWidth: 420, marginTop: 10 }}>
            <Alan etiket="Statin yoğunluğu">
              <Segment etiket="Statin yoğunluğu" deger={statin} set={(x) => setStatin(x as typeof statin)} secenekler={STATIN as Array<[string, string]>} />
            </Alan>
          </div>
        </Katlanir>
      </div>

      <div style={{ ...kutu, borderColor: 'rgba(20,184,166,0.35)' }} aria-live="polite">
        <div style={etiket}>Sonuç</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '4px 0 8px' }}>
          <Istatistik deger={riskAd ? `%${risk}` : '—'} etiket={riskAd ? `${riskAd} — 10 yıllık KV risk` : 'sayısal risk hesaplanmadı'} ton={riskAd ? 'iyi' : 'notr'} />
          <Istatistik deger={sonuc.kova ? KOVA_AD[sonuc.kova] : 'belirlenemedi'} etiket="risk kovası (taslak)" ton={sonuc.kova === 'cok_yuksek' ? 'kirmizi' : sonuc.kova === 'yuksek' ? 'uyari' : 'notr'} />
          <Istatistik deger={sonuc.statinAcigi.length} etiket="statin açığı uyarısı" ton={sonuc.statinAcigi.length ? 'uyari' : 'notr'} />
        </div>
        {sonuc.kovaNedeni && <div style={{ ...kucuk, marginTop: 4 }}>{sonuc.kovaNedeni}</div>}
        {sonuc.score2Notu && <div style={{ ...kucuk, marginTop: 8, color: '#FBBF24' }}>{sonuc.score2Notu}</div>}
        <div style={{ ...metin, marginTop: 10 }}>{sonuc.hedefNotu}</div>
        {sonuc.statinAcigi.map((x) => <div key={x} style={{ ...kucuk, marginTop: 6, color: '#C9D4E3' }}>• {x}</div>)}
        {!riskAd && <div style={satir}><Rozet ton="uyari">yaş, SBP, kolesterol ve HDL girilince sayısal risk hesaplanır</Rozet></div>}
        <div style={satir}><KopyalaButonu metin={kopyaMetni} /></div>
        <MuayeneFormunaEkle hastaId={hasta.id} arac="SCORE2 / KVR değerlendirmesi" satirlar={notSatirlari} />
        <TaslakNotu>Risk kovası ve LDL hedefi karar desteğidir; hekim kilidi olmadan kesinleşmez ve nota otomatik yazılmaz. Hesap kaydedilmez.</TaslakNotu>
      </div>

      <div style={kutu}>
        <div style={etiket}>Hastada kaydet (isteğe bağlı)</div>
        <div style={kucuk}>Hesap için hasta seçmek gerekmez. Hasta seçerseniz kayıtlı KVR girdileri ön doldurulur ve bu vizitin girdileri dosyaya kaydedilebilir.</div>
        <DahHastaSecici secili={hasta.id} sec={(id, ad) => setHasta({ id, ad })} />
        {kayitHata && <div style={{ ...dahStil.hata, marginTop: 6 }}>{kayitHata}</div>}
        <OncekiVizit tarih={kayitliTarih}>Sigara, ASKVH, diyabet ve statin girdileri hastanın dahiliye kaydından okundu — üzerine yazabilirsiniz.</OncekiVizit>
        <KayitButonu
          etiket="Girdileri hastaya kaydet"
          hastaId={hasta.id}
          ipucu="Sigara · ASKVH · diyabet hedef organ hasarı · statin yoğunluğu · ezetimib · diyabet tanı yaşı hastanın dahiliye kaydına yazılır."
          kaydet={async () => {
            const t = await getAccessTokenAsync();
            const r = await fetch('/api/doktor/dahiliye', {
              method: 'POST',
              headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ adim: 'kvr', patientId: hasta.id, sigara, askvh, dmTod: dm && dmTod, statinYogunluk: statin, ezetimib, ...(dmTaniYasi.trim() ? { dmTaniYasi: dmTaniYasi.trim() } : {}) }),
            });
            const j = await r.json().catch(() => ({}));
            if (!r.ok) return j.error || 'Kaydedilemedi.';
            await yukle(hasta.id);
            return null;
          }}
        />
        {hasta.id && <div style={satir}><a href={hastaDosyaHref(hasta.id, 'dahiliye')} style={{ ...btn, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Hastada aç (Dahiliye) →</a></div>}
      </div>
    </>
  );
}
