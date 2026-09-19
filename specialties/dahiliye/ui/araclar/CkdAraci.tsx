'use client';
/**
 * ARACLAR-CILA-01: ortak araç kütüphanesiyle yenilendi — cinsiyet segmenti, manşet evre kartları,
 * katlanır önceki ölçüm bölümü ve taslak rozeti.
 * Faz 3 (kalıcılık): hasta seçiliyse eGFR / UACR ve ilaç bağlamı dahiliye chapter'ın KENDİ
 * kayıtlarından (lab serisi + dahiliye_ckd, /api/doktor/dahiliye) ön doldurulur; "Girdileri hastaya
 * kaydet" aynı tabloya mevcut `adim: 'ckd'` yoluyla yazar. Yeni tablo açılmadı.
 * DAH-EXCEPTIONAL-01 — Araçlar › KDIGO CKD evreleme. Dahiliye-only (BRANS_DOKTOR_ARACLARI).
 * Chapter motoru (engines/ckd.ckdDegerlendir + nefroSevkPaketi) ile birebir aynı kural: eGFR × UACR ısı haritası,
 * kronisite (≥3 ay), izlem sıklığı, sınıf düzeyinde plan ve nefroloji sevk gerekçesi. Doz yazılmaz; karar hekimindir.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { hastaDosyaHref } from '@/lib/doktor/geriNavigasyon';
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi';
import { ckdDegerlendir, nefroSevkPaketi, type Renk } from '../../engines/ckd';
import { dahStil, Segment, Alan, Onay, Sayi, Istatistik, Katlanir, KayitButonu, MuayeneFormunaEkle, OncekiVizit, Rozet, TaslakNotu, DahHastaSecici, KopyalaButonu } from './DahiliyeAracKabugu';

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
  const [kayitliTarih, setKayitliTarih] = useState<string | null>(null);
  const [kayitHata, setKayitHata] = useState('');

  /** Kayıtlı KBH girdileri + lab serisinin son eGFR / UACR değeri (sahiplik sunucuda doğrulanır). */
  const yukle = useCallback(async (id: string) => {
    setKayitHata(''); setKayitliTarih(null);
    if (!id) return;
    try {
      const t = await getAccessTokenAsync();
      const r = await fetch(`/api/doktor/dahiliye?patientId=${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setKayitHata(j.error || 'Hasta kaydı okunamadı.'); return; }
      const c = j.wow?.ckd as { egfr?: number | null; uacr?: number | null; uacr_tarih?: string | null; ras_blokeri?: boolean; sglt2?: boolean; nsaii?: boolean } | undefined;
      // ÖN DOLDUR — hekim hepsini değiştirebilir.
      if (j.hasta?.yas != null) setYas((p) => p || String(j.hasta.yas));
      if (j.hasta?.kadin != null) setCinsiyet(j.hasta.kadin ? 'kadin' : 'erkek');
      if (c) {
        if (c.egfr != null) setEGFR((p) => p || String(c.egfr));
        if (c.uacr != null) setUacr((p) => p || String(c.uacr));
        setRas(!!c.ras_blokeri); setSglt2(!!c.sglt2); setNsaii(!!c.nsaii);
        setKayitliTarih(c.uacr_tarih || 'kayıtlı');
      }
      const ilaclar = (j.ilaclar || []) as Array<{ ilac_adi?: string; aktif?: boolean | null }>;
      const aktif = ilaclar.filter((x) => x.aktif !== false).map((x) => String(x.ilac_adi || '').trim()).filter(Boolean);
      if (aktif.length) setIlacMetni((p) => p || aktif.join('\n'));
    } catch { setKayitHata('Hasta kaydı okunamadı — bağlantıyı kontrol edin.'); }
  }, []);
  useEffect(() => { yukle(hasta.id); }, [hasta.id, yukle]);

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

  const notSatirlari = sonuc.g ? [
    `KDIGO evre: ${sonuc.g} ${sonuc.a || '(UACR yok)'}${sonuc.renk ? ` — ${RENK_AD[sonuc.renk]}` : ''}`,
    `Kronisite: ${KRONIK_AD[sonuc.kronikMi]}`,
    sonuc.hizliDusus ? '1 yılda eGFR >%25 düşüş' : '',
    sonuc.izlemAy != null ? `Önerilen izlem: her ${sonuc.izlemAy} ayda eGFR + UACR` : '',
    ...sonuc.uyarilar.map((u) => `Uyarı: ${u}`),
    ...sonuc.sevk.map((x) => `Nefroloji sevk ölçütü: ${x}`),
  ].filter(Boolean) : [];

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
        <MuayeneFormunaEkle hastaId={hasta.id} arac="KDIGO CKD evrelemesi" satirlar={notSatirlari} />
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
        <div style={kucuk}>Hesap için hasta seçmek gerekmez. Hasta seçerseniz kayıtlı eGFR / UACR ve ilaç bağlamı ön doldurulur; bu vizitin girdileri dosyaya kaydedilebilir.</div>
        <DahHastaSecici secili={hasta.id} sec={(id, ad) => setHasta({ id, ad })} />
        {kayitHata && <div style={{ ...dahStil.hata, marginTop: 6 }}>{kayitHata}</div>}
        <OncekiVizit tarih={kayitliTarih}>eGFR / UACR ve ilaç bağlamı hastanın dahiliye kaydından okundu — üzerine yazabilirsiniz.</OncekiVizit>
        <KayitButonu
          etiket="Girdileri hastaya kaydet"
          hastaId={hasta.id}
          kapali={sayi(uacr) == null && !ras && !sglt2 && !nsaii}
          kapaliNedeni="UACR ya da ilaç bağlamı girin — kaydedilecek değer yok."
          ipucu="UACR (hekim girişi) ve RAS blokeri / SGLT2 / NSAİİ bağlamı hastanın dahiliye kaydına yazılır."
          kaydet={async () => {
            const t = await getAccessTokenAsync();
            const r = await fetch('/api/doktor/dahiliye', {
              method: 'POST',
              headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ adim: 'ckd', patientId: hasta.id, rasBlokeri: ras, sglt2, nsaii, ...(sayi(uacr) != null ? { uacr: sayi(uacr), uacrTarih: bugunTarih } : {}) }),
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
