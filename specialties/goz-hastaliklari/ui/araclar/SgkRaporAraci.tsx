'use client';
/**
 * GOZ-EXCEPTIONAL-01 — Araçlar › SGK rapor taslağı. Chapter motoru engines/sgkRapor.gozSgkTaslak (anti-VEGF başlangıç / idame /
 * implant + GİL bilgi notu). T.C. ve doz yazılmaz; hasta adı taslakta boş (Medula'da hekim). Hasta seçilirse son VA, görüntü
 * tarihleri, enjeksiyon geçmişi ve katarakt kartı (biyometri, GİL tipi, EK-3/G, kontrol listesi) hekimin kendi kaydından dolar.
 */
import React, { useMemo, useState } from 'react';
import { gozSgkTaslak, gozSgkMetni, GOZ_SGK_SABLONLARI, type GozSgkSablon } from '../../engines/sgkRapor';
import type { Biyometri } from '../../engines/katarakt';
import { AJAN_ADI, ENDIKASYON_ADI, type Ajan, type Endikasyon, type Enjeksiyon } from '../../engines/antiVegf';
import { GIL_EK3G_KALEMLERI } from '../../engines/klinik';
import { GOZ_KAYNAKLAR } from '../../protocols/sources';
import { hastaDosyaHref } from '@/lib/doktor/geriNavigasyon';
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi';
import { gozStil, Secim, GozHastaSecici } from './GozAracKabugu';

const { kutu, etiket, kucuk, metin, satir, input, btn, ghost } = gozStil;
const bugun = () => new Date().toISOString().slice(0, 10);
type Katarakt = { goz: string; gil_tipi_hekim: string | null; ek3g_kod?: string | null; planlanan_tarih: string | null; biyometri?: Biyometri | null; hazirlik: { eksikZorunlu: string[] } };

export default function SgkRaporAraci() {
  const [f, setF] = useState<Record<string, string>>({ sablon: 'anti_vegf_baslangic', goz: 'sag', ajan: 'bevacizumab', endikasyon: 'ybmd', gilTipi: '', ek3g: '' });
  const [ffaKontrendike, setFfaKontrendike] = useState(false);
  const [hekimYanit, setHekimYanit] = useState(false);
  const [hasta, setHasta] = useState<{ id: string; ad: string }>({ id: '', ad: '' });
  const [gecmis, setGecmis] = useState<Enjeksiyon[]>([]);
  const [katarakt, setKatarakt] = useState<Katarakt[]>([]);
  const [mesaj, setMesaj] = useState('');
  const [kopyalandi, setKopyalandi] = useState(false);
  const set = (k: string, v: string) => { setF((p) => ({ ...p, [k]: v })); setKopyalandi(false); };
  const s = (k: string) => f[k] || '';
  const num = (k: string) => (s(k).trim() === '' || !Number.isFinite(Number(s(k).replace(',', '.'))) ? null : Number(s(k).replace(',', '.')));
  const gil = f.sablon === 'katarakt_gil';
  const kat = katarakt.find((k) => k.goz === f.goz) || null;

  const hastadanDoldur = async (id: string, ad: string) => {
    setHasta({ id, ad }); setMesaj('');
    if (!id) { setGecmis([]); setKatarakt([]); return; }
    try {
      const t = await getAccessTokenAsync();
      const r = await fetch(`/api/doktor/goz?patientId=${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Hasta verisi yüklenemedi');
      setGecmis(j.enjeksiyonlar || []);
      setKatarakt(j.katarakt || []);
      const son = (j.muayeneler || [])[0];
      const goruntu = (j.goruntuler || []) as Array<{ modalite: string; tarih: string; goz: string | null }>;
      const sonMod = (m: string) => goruntu.find((g) => g.modalite === m && (!g.goz || g.goz === f.goz || g.goz === 'iki'))?.tarih || '';
      setF((p) => ({ ...p, vaSimdi: p.vaSimdi || (son?.gosterim?.[p.goz] && son.gosterim[p.goz] !== '—' ? son.gosterim[p.goz] : ''), okt: p.okt || sonMod('oct'), renkliResim: p.renkliResim || sonMod('fundus') }));
      setMesaj('Hastanın kayıtlı verisiyle dolduruldu — kontrol edin.');
    } catch (e) { setMesaj(e instanceof Error ? e.message : 'Hata'); }
  };

  const sonuc = useMemo(() => gozSgkTaslak({
    sablon: f.sablon as GozSgkSablon, hasta: { adSoyad: '' }, goz: f.goz === 'sol' ? 'sol' : 'sag',
    ajan: gil ? null : (f.ajan as Ajan), endikasyon: gil ? null : (f.endikasyon as Endikasyon),
    anamnez: s('anamnez') || null, vaBaslangic: s('vaBaslangic') || null, vaOnceki: s('vaOnceki') || null, vaSimdi: s('vaSimdi') || null,
    mfkBaslangic: num('mfkBaslangic'), mfkOnceki: num('mfkOnceki'), mfkSimdi: num('mfkSimdi'),
    renkliResim: s('renkliResim') || null, ffa: s('ffa') || null, ffaKontrendike, okt: s('okt') || null,
    gecmis, hekimYanitVarBeyani: hekimYanit, bugun: bugun(),
    gil: gil ? { tip: f.gilTipi || kat?.gil_tipi_hekim || null, ek3gKod: f.ek3g || kat?.ek3g_kod || null, biyometri: kat?.biyometri || null, kontrolEksik: kat ? kat.hazirlik.eksikZorunlu : null, planlananTarih: kat?.planlanan_tarih || null } : null,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [f, ffaKontrendike, hekimYanit, gecmis, katarakt]);

  const kopyala = async () => { try { await navigator.clipboard.writeText(gozSgkMetni(sonuc)); setKopyalandi(true); } catch { setMesaj('Pano erişimi yok — metni elle seçin.'); } };
  const alan = (k: string, ph: string, tip = 'text', w: number | string = 150) => <input type={tip} aria-label={ph} value={s(k)} onChange={(e) => set(k, e.target.value)} placeholder={ph} style={{ ...input, width: w }} />;

  return (
    <>
      <div style={kutu}>
        <div style={etiket}>Hasta (isteğe bağlı)</div>
        <GozHastaSecici secili={hasta.id} sec={hastadanDoldur} />
        {mesaj && <div style={{ ...kucuk, marginTop: 6, color: '#2DD4BF' }}>{mesaj}</div>}
        {hasta.id && <div style={{ marginTop: 6 }}><a href={hastaDosyaHref(hasta.id, 'goz')} style={{ color: '#2DD4BF', fontSize: 13, fontWeight: 700 }}>Hastada aç (Göz › SGK rapor) — taslağı kaydedip kilitleyin →</a></div>}
      </div>

      <div style={kutu}>
        <div style={etiket}>Şablon</div>
        <div style={satir}>
          <Secim etiket="Şablon" deger={f.sablon} set={(x) => set('sablon', x)} secenekler={GOZ_SGK_SABLONLARI.map((x) => [x.id, x.ad])} />
          <Secim etiket="Göz" deger={f.goz} set={(x) => set('goz', x)} secenekler={[['sag', 'OD (sağ)'], ['sol', 'OS (sol)']]} />
          {!gil && <><Secim etiket="Ajan" deger={f.ajan} set={(x) => set('ajan', x)} secenekler={Object.entries(AJAN_ADI)} /><Secim etiket="Endikasyon" deger={f.endikasyon} set={(x) => set('endikasyon', x)} secenekler={Object.entries(ENDIKASYON_ADI)} /></>}
        </div>
        <div style={satir}><textarea aria-label="Anamnez" value={s('anamnez')} onChange={(e) => set('anamnez', e.target.value)} placeholder="Anamnez (hekim)" rows={3} style={{ ...input, width: '100%', fontFamily: 'inherit' }} /></div>
        {!gil ? (
          <>
            <div style={satir}>{alan('vaBaslangic', 'VA başlangıç', 'text', 130)}{alan('vaOnceki', 'VA önceki', 'text', 120)}{alan('vaSimdi', 'VA şimdi', 'text', 120)}</div>
            <div style={satir}>{alan('mfkBaslangic', 'MFK başlangıç µm', 'text', 150)}{alan('mfkOnceki', 'MFK önceki µm', 'text', 140)}{alan('mfkSimdi', 'MFK şimdi µm', 'text', 140)}</div>
            <div style={satir}><span style={kucuk}>Renkli resim</span>{alan('renkliResim', 'renkli resim tarihi', 'date', 170)}<span style={kucuk}>FFA</span>{alan('ffa', 'FFA tarihi', 'date', 170)}<span style={kucuk}>OKT</span>{alan('okt', 'OKT tarihi', 'date', 170)}</div>
            <div style={satir}>
              <label style={{ ...metin, display: 'flex', gap: 8, alignItems: 'center', minHeight: 44 }}><input type="checkbox" checked={ffaKontrendike} onChange={(e) => setFfaKontrendike(e.target.checked)} style={{ width: 20, height: 20 }} />FFA kontrendike</label>
              <label style={{ ...metin, display: 'flex', gap: 8, alignItems: 'center', minHeight: 44 }}><input type="checkbox" checked={hekimYanit} onChange={(e) => setHekimYanit(e.target.checked)} style={{ width: 20, height: 20 }} />Hekim beyanı: tedaviye yanıt var (MFK ≥250 µm, 4.2.33(5))</label>
            </div>
          </>
        ) : (
          <>
            <div style={satir}>{alan('vaSimdi', 'Düzeltilmiş VA', 'text', 150)}
              <Secim etiket="GİL tipi" deger={f.gilTipi || kat?.gil_tipi_hekim || ''} set={(x) => set('gilTipi', x)} secenekler={[['monofokal', 'Monofokal'], ['torik', 'Torik'], ['multifokal', 'Multifokal'], ['edof', 'EDOF'], ['diger', 'Diğer']]} bos="GİL tipi (hekim)" />
              <Secim etiket="EK-3/G kodu" deger={f.ek3g || kat?.ek3g_kod || ''} set={(x) => set('ek3g', x)} secenekler={GIL_EK3G_KALEMLERI.map((k) => [k.kod, `${k.kod} — ${k.ad}`])} bos="EK-3/G kodu" />
            </div>
            <div style={{ ...kucuk, marginTop: 6 }}>{kat ? 'Biyometri ve ön-op kontrol listesi Katarakt kartından okunuyor.' : 'Biyometri ve ön-op kontrol listesi hastanın Katarakt kartından gelir — hasta seçin veya kartı doldurun. GİL gücü Notya tarafından hesaplanmaz.'}</div>
          </>
        )}
      </div>

      <div style={kutu} aria-live="polite">
        <div style={etiket}>{sonuc.draft.raporBasligi}</div>
        <div style={kucuk}>{sonuc.raporTipi}</div>
        <div style={{ ...metin, marginTop: 6 }}>Tanı önerisi: {sonuc.draft.tani.icd10} {sonuc.draft.tani.aciklama} <span style={kucuk}>(hekim doğrular)</span></div>
        <pre style={{ ...metin, whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: '6px 0' }}>{sonuc.draft.mevcutDurum || ''}</pre>
        {!!sonuc.draft.zorunluTetkikler?.length && <div style={kucuk}>Tetkikler: {sonuc.draft.zorunluTetkikler.join(' · ')}</div>}
        <div style={{ ...metin, marginTop: 4 }}>{sonuc.draft.hekim_degerlendirmesi}</div>
        <div style={{ marginTop: 8 }}>{sonuc.sutKontrol.map((x) => <div key={x.madde} style={{ ...metin, color: x.tamam === true ? '#2DD4BF' : x.tamam === false ? '#F87171' : '#8FA0B5' }}>{x.tamam === true ? '✓' : x.tamam === false ? '✕' : '?'} {x.madde}</div>)}</div>
        {sonuc.eksikler.length > 0 ? <div style={{ marginTop: 8 }}>{sonuc.eksikler.map((x) => <div key={x} style={{ ...metin, color: '#FBBF24' }}>Eksik: {x}</div>)}</div> : <div style={{ ...metin, color: '#2DD4BF', marginTop: 8 }}>Zorunlu maddelerde eksik yok.</div>}
        <div style={satir}>
          <button type="button" onClick={kopyala} style={btn}>{kopyalandi ? 'Kopyalandı' : 'Taslağı kopyala'}</button>
          <span style={{ ...ghost, display: 'inline-flex', alignItems: 'center', cursor: 'default' }} title="Notya Medula'ya canlı gönderim yapmaz">Medula'da hekim e-imza ile girilir</span>
        </div>
        <div style={{ ...kucuk, marginTop: 10, borderLeft: '2px solid rgba(15,155,142,0.5)', paddingLeft: 8 }}>{sonuc.dipnotlar.map((d, i) => <div key={i}><b>{d.ref}</b> — {d.not} <span style={{ opacity: 0.7 }}>({GOZ_KAYNAKLAR[d.ref]?.ad})</span></div>)}</div>
        <div style={{ ...kucuk, marginTop: 6 }}>T.C. kimlik no ve doz yazılmaz; hasta adı Medula'da doldurulur.</div>
      </div>
    </>
  );
}
