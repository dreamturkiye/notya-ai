'use client';
/**
 * Araçlar › Obstetrik Risk & Sezaryen Endikasyon Notu. Preeklampsi risk faktörleri → aspirin başlama penceresi (12–28 hf, en iyisi
 * 16 hf öncesi; ACOG / SMFM, çift sütun), GDM risk (öneri — hekim kilitler), önceki sezaryen → SSVD tartışma alanları,
 * Robson grubu ve HEKİM KİLİTLİ sezaryen endikasyon notu. Endikasyon / tanı ASLA otomatik seçilmez. Doz yazılmaz. Nota yazmaz.
 */
import React, { useMemo, useState } from 'react';
import {
  PE_YUKSEK, PE_ORTA, GDM_RISK, aspirinProfilaksisi, gdmDegerlendir, vbacTartisma, robsonGrubu, csNotEksikleri, csNotMetni,
  CS_ENDIKASYONLARI, tarihOku, haftaOku, sayiOku, trTarih, type RiskFaktoru, type VbacGirdi, type RobsonGirdi,
} from '../../engines/araclar';
import { hastaDosyaHref } from '@/lib/doktor/geriNavigasyon';
import { diffDays } from '../../engines/dates';
import { kdStil, Segment, Kutu, Etiketli, CiftSutun, KdHastaSecici, kdHastaOzeti, panoya } from './KdAracKabugu';

const { kutu, etiket, kucuk, metin, satir, input, btn, ghost, hata } = kdStil;
const bugunIso = () => new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10);

function Cipler({ liste, secili, degis, renk }: { liste: RiskFaktoru[]; secili: string[]; degis: (k: string) => void; renk: string }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {liste.map((f) => { const on = secili.includes(f.kod); return (
        <button key={f.kod} type="button" aria-pressed={on} onClick={() => degis(f.kod)} style={{ minHeight: 44, borderRadius: 999, padding: '9px 14px', fontSize: 14, fontWeight: 600, cursor: 'pointer', border: `1px solid ${on ? renk : 'rgba(255,255,255,0.14)'}`, background: on ? `${renk}26` : 'rgba(255,255,255,0.03)', color: on ? '#FFFFFF' : '#C9D4E3' }}>{on ? '✓ ' : ''}{f.ad}</button>
      ); })}
    </div>
  );
}

export default function RiskAraci() {
  const [f, setF] = useState({ tdt: '', yas: '', vki: '', hafta: '', bulgular: '', diger: '', karar: '' });
  const [parite, setParite] = useState<'nullipar' | 'multipar' | ''>('');
  const [cogul, setCogul] = useState(false);
  const [pe, setPe] = useState<string[]>([]);
  const [gdm, setGdm] = useState<string[]>([]);
  const [v, setV] = useState<VbacGirdi>({ oncekiSezaryen: 0, kesiTipi: '', sonSezaryenAy: null, oncekiVajinal: false, oncekiRuptur: false, kaviteMyomektomi: false, previaAkreta: false, prezentasyon: '', tercih: '' });
  const [rb, setRb] = useState<Omit<RobsonGirdi, 'parite' | 'oncekiCs' | 'fetus' | 'hafta'>>({ prezentasyon: '', eylem: '' });
  const [endikasyon, setEndikasyon] = useState<string[]>([]);
  const [aciliyet, setAciliyet] = useState<'elektif' | 'acil' | ''>('');
  const [onay, setOnay] = useState({ alternatif: false, onam: false, anneIstegi: false });
  const [kilitli, setKilitli] = useState(false);
  const [hasta, setHasta] = useState({ id: '', ad: '' });
  const [mesaj, setMesaj] = useState('');
  const [kopya, setKopya] = useState('');
  const [csAcik, setCsAcik] = useState(false);
  const set = (k: keyof typeof f, x: string) => { setF((p) => ({ ...p, [k]: x })); setKilitli(false); };
  const degis = (liste: string[], ayarla: (x: string[]) => void) => (k: string) => ayarla(liste.includes(k) ? liste.filter((x) => x !== k) : [...liste, k]);

  const tdt = tarihOku(f.tdt);
  const bugun = bugunIso();
  const yas = sayiOku(f.yas), vki = sayiOku(f.vki);
  // Girilen alanlardan türeyen faktörler kutuları işaretler; hekim kaldırabilir (kendi seçimi korunur).
  const turemis = [
    ...(cogul ? ['cogul'] : []), ...(parite === 'nullipar' ? ['nullipar'] : []), ...(yas != null && yas >= 35 ? ['yas35'] : []), ...(vki != null && vki > 30 ? ['obezite'] : []),
  ];
  const [kaldirilan, setKaldirilan] = useState<string[]>([]);
  const peSecili = Array.from(new Set([...pe, ...turemis.filter((x) => !kaldirilan.includes(x))]));
  const peDegis = (k: string) => {
    if (peSecili.includes(k)) { setPe(pe.filter((x) => x !== k)); if (turemis.includes(k)) setKaldirilan([...kaldirilan, k]); }
    else { setPe([...pe, k]); setKaldirilan(kaldirilan.filter((x) => x !== k)); }
  };
  const asp = useMemo(() => aspirinProfilaksisi({ secili: peSecili, edd: tdt, bugun }), [peSecili.join(','), tdt, bugun]); // eslint-disable-line react-hooks/exhaustive-deps
  const gd = gdmDegerlendir({ secili: gdm, edd: tdt, bugun });
  const vb = vbacTartisma(v);
  const gaHafta = haftaOku(f.hafta) || (tdt ? (() => { const d = 280 - diffDays(tdt, bugun); return d >= 0 ? { weeks: Math.floor(d / 7), days: d % 7, totalDays: d } : null })() : null);
  const robson = robsonGrubu({ ...rb, parite, oncekiCs: v.oncekiSezaryen > 0, fetus: cogul ? 'cogul' : 'tekil', hafta: gaHafta ? gaHafta.totalDays / 7 : null });
  const vbacOzet = v.oncekiSezaryen > 0 ? [`${v.oncekiSezaryen} önceki sezaryen`, v.kesiTipi ? { alt_transvers: 'alt segment transvers', alt_vertikal: 'alt segment vertikal', klasik_t: 'klasik / T kesi', bilinmiyor: 'kesi tipi bilinmiyor' }[v.kesiTipi] : '', v.tercih ? { ssvd: 'hasta SSVD denemek istiyor', elektif_cs: 'hasta tekrar sezaryen istiyor', kararsiz: 'hasta kararsız' }[v.tercih] : ''].filter(Boolean).join(', ') : undefined;
  const csGirdi = { endikasyonlar: endikasyon, digerAciklama: f.diger, aciliyet, kararZamani: f.karar, bulgular: f.bulgular, hafta: gaHafta ? `${gaHafta.weeks}+${gaHafta.days}` : '', alternatiflerKonusuldu: onay.alternatif, onamAlindi: onay.onam, anneIstegiBelgelendi: onay.anneIstegi, robson, vbacOzet };
  const eksik = csNotEksikleri(csGirdi);
  const not = csNotMetni(csGirdi);

  const hastadanDoldur = async (id: string, ad: string) => {
    setHasta({ id, ad }); setMesaj(''); setKilitli(false);
    if (!id) return;
    try {
      const o = await kdHastaOzeti(id);
      if (o.tdt) set('tdt', trTarih(o.tdt));
      if (o.hastaDogum) set('yas', String(Math.floor(diffDays(bugun, o.hastaDogum) / 365.25)));
      if (o.vki) set('vki', String(o.vki).replace('.', ','));
      if (o.para != null) setParite(o.para > 0 ? 'multipar' : 'nullipar');
      setCogul(o.cogul);
      if (o.oncekiSezaryen) setV((p) => ({ ...p, oncekiSezaryen: o.oncekiSezaryen!, kesiTipi: /transvers/i.test(o.kesiTipi || '') ? 'alt_transvers' : /klasik|(^|\s)t(\s|-|$)/i.test(o.kesiTipi || '') ? 'klasik_t' : p.kesiTipi }));
      setMesaj(o.gebelikVar ? 'Gebelik kaydından dolduruldu — risk faktörlerini siz işaretleyin.' : 'Aktif gebelik kaydı yok — alanları elle girin.');
    } catch (e) { setMesaj(e instanceof Error ? e.message : 'Hasta verisi yüklenemedi'); }
  };

  const alan = (k: keyof typeof f, ph: string, ad: string, w: number | string = 150, mod: 'numeric' | 'decimal' | 'text' = 'numeric') => <Etiketli ad={ad} genislik={w}><input inputMode={mod} value={f[k]} onChange={(e) => set(k, e.target.value)} placeholder={ph} aria-label={ad} style={{ ...input, width: w, maxWidth: '100%' }} /></Etiketli>;
  const pencereRenk = asp.pencere === 'ideal_kapaniyor' ? '#FB923C' : asp.pencere === 'ideal' ? '#6EE7B7' : asp.pencere === 'gec' ? '#FCD34D' : asp.pencere === 'kapandi' ? '#FCA5A5' : '#93C5FD';

  return (
    <>
      <div style={kutu}>
        <div style={etiket}>Gebelik</div>
        <div style={satir}>{alan('tdt', 'TDT — 20.11.2026', 'Tahmini doğum tarihi', 200)}{alan('yas', 'Yaş', 'Anne yaşı', 90)}{alan('vki', 'VKİ — 31,5', 'Vücut kitle indeksi', 130, 'decimal')}</div>
        {f.tdt.trim() && !tdt && <div style={{ ...hata, marginTop: 4 }}>TDT okunamadı — 20.11.2026 biçiminde yazın.</div>}
        <div style={satir}>
          <Segment etiket="Parite" deger={parite || ('' as 'nullipar')} set={(x) => { setParite(x); setKilitli(false); }} secenekler={[['nullipar', 'Nullipar'], ['multipar', 'Multipar']]} />
          <Segment etiket="Fetüs sayısı" deger={cogul ? 'cogul' : 'tekil'} set={(x) => { setCogul(x === 'cogul'); setKilitli(false); }} secenekler={[['tekil', 'Tekil'], ['cogul', 'Çoğul']]} />
        </div>
        <div style={{ marginTop: 10 }}><div style={kucuk}>Hasta (isteğe bağlı)</div><KdHastaSecici secili={hasta.id} sec={hastadanDoldur} /></div>
        {mesaj && <div style={{ ...kucuk, marginTop: 6, color: '#F9A8D4' }}>{mesaj}</div>}
      </div>

      <div style={kutu} aria-live="polite">
        <div style={etiket}>Preeklampsi risk faktörleri → aspirin profilaksisi</div>
        <div style={{ ...kucuk, marginBottom: 6 }}>Yüksek risk</div>
        <Cipler liste={PE_YUKSEK} secili={peSecili} degis={peDegis} renk="#F87171" />
        <div style={{ ...kucuk, margin: '10px 0 6px' }}>Orta risk</div>
        <Cipler liste={PE_ORTA} secili={peSecili} degis={peDegis} renk="#FBBF24" />
        <div style={{ marginTop: 14, padding: 14, borderRadius: 14, background: asp.karar === 'onerilir' ? 'rgba(219,39,119,0.14)' : 'rgba(0,0,0,0.18)', border: `1px solid ${asp.karar === 'onerilir' ? 'rgba(244,114,182,0.5)' : 'rgba(255,255,255,0.08)'}` }}>
          <div style={{ ...metin, fontWeight: 700, fontSize: 16 }}>{asp.kararMetni}</div>
          {asp.karar !== 'yok' && <div style={{ fontSize: asp.pencere === 'ideal_kapaniyor' ? 17 : 14, fontWeight: asp.pencere === 'ideal_kapaniyor' ? 800 : 600, color: pencereRenk, marginTop: 6 }}>{asp.pencereMetni}</div>}
          {asp.karar !== 'yok' && asp.baslangic && <div style={{ ...kucuk, marginTop: 4 }}>Pencere: {trTarih(asp.baslangic)} (12+0) → ideal son {trTarih(asp.idealSon)} (15+6) → son {trTarih(asp.son)} (28+0)</div>}
          <div style={{ ...kucuk, marginTop: 6 }}>Başlama kararı, ürün ve doz hekimindir; araç doz yazmaz.</div>
        </div>
        <CiftSutun baslik={asp.cift.baslik} sb={asp.cift.sb} klinik={asp.cift.klinik} />
      </div>

      <div style={kutu}>
        <div style={etiket}>GDM riski <span style={{ ...kucuk, fontWeight: 600 }}>· öneri — hekim kilitler</span></div>
        <Cipler liste={GDM_RISK} secili={gdm} degis={degis(gdm, setGdm)} renk="#60A5FA" />
        <div style={{ ...metin, marginTop: 10 }}>{gd.metin}</div>
        {gd.pencere && <div style={kucuk}>24–28. hafta OGTT penceresi: {gd.pencere}</div>}
      </div>

      <div style={kutu}>
        <div style={etiket}>Önceki sezaryen → SSVD tartışması</div>
        <div style={satir}>
          <span style={kucuk}>Önceki sezaryen</span>
          <Segment<string> etiket="Önceki sezaryen sayısı" deger={String(Math.min(v.oncekiSezaryen, 3))} set={(x) => { setV({ ...v, oncekiSezaryen: Number(x) }); setKilitli(false); }} secenekler={[['0', 'Yok'], ['1', '1'], ['2', '2'], ['3', '3+']]} />
        </div>
        {v.oncekiSezaryen > 0 && (
          <>
            <div style={satir}><span style={kucuk}>Kesi tipi</span><Segment etiket="Kesi tipi" deger={(v.kesiTipi || '') as 'alt_transvers'} set={(x) => setV({ ...v, kesiTipi: x })} secenekler={[['alt_transvers', 'Alt transvers'], ['alt_vertikal', 'Alt vertikal'], ['klasik_t', 'Klasik / T'], ['bilinmiyor', 'Bilinmiyor']]} /></div>
            <div style={satir}><span style={kucuk}>Son sezaryenden bu yana</span><input inputMode="numeric" value={v.sonSezaryenAy ?? ''} onChange={(e) => setV({ ...v, sonSezaryenAy: sayiOku(e.target.value) })} placeholder="ay" aria-label="Son sezaryenden bu yana ay" style={{ ...input, width: 90 }} /><span style={kucuk}>ay</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', columnGap: 12 }}>
              <Kutu on={v.oncekiVajinal} set={(x) => setV({ ...v, oncekiVajinal: x })}>Önceki vajinal doğum var</Kutu>
              <Kutu on={v.oncekiRuptur} set={(x) => setV({ ...v, oncekiRuptur: x })}>Önceki uterus rüptürü</Kutu>
              <Kutu on={v.kaviteMyomektomi} set={(x) => setV({ ...v, kaviteMyomektomi: x })}>Kaviteye ulaşan myomektomi / fundal cerrahi</Kutu>
              <Kutu on={v.previaAkreta} set={(x) => setV({ ...v, previaAkreta: x })}>Plasenta previa / akreta şüphesi</Kutu>
            </div>
            <div style={satir}><span style={kucuk}>Hasta tercihi</span><Segment etiket="Hasta tercihi" deger={(v.tercih || '') as 'ssvd'} set={(x) => setV({ ...v, tercih: x })} secenekler={[['ssvd', 'SSVD denemek'], ['elektif_cs', 'Tekrar sezaryen'], ['kararsiz', 'Kararsız']]} /></div>
            <div style={{ marginTop: 10 }}>
              {vb.engel.map((x) => <div key={x} style={{ ...metin, color: '#FCA5A5' }}>✕ {x}</div>)}
              {vb.dikkat.map((x) => <div key={x} style={{ ...metin, color: '#FCD34D' }}>⚠ {x}</div>)}
              {vb.lehte.map((x) => <div key={x} style={{ ...metin, color: '#6EE7B7' }}>✓ {x}</div>)}
              {vb.eksik.map((x) => <div key={x} style={{ ...kucuk }}>Eksik: {x}</div>)}
            </div>
            <div style={{ ...kucuk, marginTop: 6 }}>Tartışma notlarıdır, karar değildir. Klinik derinlik: ACOG PB 205. Bu konuda doğrulanmış Türk rehberi araçta yer almıyor — karar hekim ve hastanındır; SSVD onamı Doğum sekmesinde.</div>
          </>
        )}
      </div>

      <div style={{ ...kutu, borderColor: 'rgba(244,114,182,0.35)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={etiket}>Sezaryen endikasyon notu — hekim kilitli</div>
          <button type="button" onClick={() => setCsAcik(!csAcik)} style={ghost} aria-expanded={csAcik}>{csAcik ? 'Gizle' : 'Not hazırla'}</button>
        </div>
        <div style={kucuk}>Tıbbi endikasyon kaydı, sezaryen kararının gerekçesini ve zamanını gösterir; kayıt incelemelerinde hekimin dayanağıdır. Endikasyonu siz seçer ve kilitlersiniz — araç öneri yapmaz.</div>
        {csAcik && (kilitli ? (
          <>
            <pre style={{ ...metin, whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: '12px 0 0', padding: 12, borderRadius: 12, background: 'rgba(0,0,0,0.2)' }}>{not}</pre>
            <div style={satir}>
              <button type="button" style={btn} onClick={async () => setKopya((await panoya(not)) ? 'Kopyalandı — dosyaya siz ekleyin.' : 'Pano erişimi yok — metni elle seçin.')}>Notu kopyala</button>
              <button type="button" style={ghost} onClick={() => { setKilitli(false); setKopya(''); }}>Kilidi aç, düzenle</button>
              {hasta.id && <a href={hastaDosyaHref(hasta.id, 'gebelik')} style={{ ...ghost, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Hastada aç (Doğum) →</a>}
              {kopya && <span style={{ ...kucuk, color: '#F9A8D4' }}>{kopya}</span>}
            </div>
          </>
        ) : (
          <>
            <div style={{ ...kucuk, margin: '12px 0 6px' }}>Endikasyon (birden fazla seçilebilir)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CS_ENDIKASYONLARI.map((e) => { const on = endikasyon.includes(e); return <button key={e} type="button" aria-pressed={on} onClick={() => setEndikasyon(on ? endikasyon.filter((x) => x !== e) : [...endikasyon, e])} style={{ minHeight: 44, borderRadius: 12, padding: '9px 12px', fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'left', border: `1px solid ${on ? '#F472B6' : 'rgba(255,255,255,0.14)'}`, background: on ? 'rgba(219,39,119,0.18)' : 'rgba(255,255,255,0.03)', color: on ? '#FFFFFF' : '#C9D4E3' }}>{on ? '✓ ' : ''}{e}</button>; })}
            </div>
            {endikasyon.some((x) => x.startsWith('Diğer')) && <div style={satir}>{alan('diger', 'Diğer endikasyonu açıklayın', 'Diğer endikasyon açıklaması', '100%', 'text')}</div>}
            <div style={satir}>
              <Segment etiket="Aciliyet" deger={(aciliyet || '') as 'elektif'} set={setAciliyet} secenekler={[['elektif', 'Planlı'], ['acil', 'Acil']]} />
              <input type="datetime-local" value={f.karar} onChange={(e) => set('karar', e.target.value)} aria-label="Karar zamanı" style={{ ...input, width: 230, maxWidth: '100%' }} />
              <button type="button" style={ghost} onClick={() => { const d = new Date(Date.now() + 3 * 3600e3); set('karar', d.toISOString().slice(0, 16)); }}>Şimdi</button>
            </div>
            <div style={satir}><textarea value={f.bulgular} onChange={(e) => set('bulgular', e.target.value)} placeholder="Destekleyici bulgular — ör. KTG kategori III 14:20'den beri, serviks 6 cm 4 saattir ilerleme yok" aria-label="Destekleyici bulgular" rows={3} style={{ ...input, width: '100%', fontFamily: 'inherit' }} /></div>
            <div style={{ ...kucuk, marginTop: 10 }}>Robson grubu {gaHafta ? `(gebelik ${gaHafta.weeks}+${gaHafta.days})` : ''}</div>
            <div style={satir}>
              <Segment etiket="Prezentasyon" deger={(rb.prezentasyon || '') as 'bas'} set={(x) => setRb({ ...rb, prezentasyon: x })} secenekler={[['bas', 'Baş'], ['makat', 'Makat'], ['transvers', 'Transvers / oblik']]} />
              <Segment etiket="Eylem" deger={(rb.eylem || '') as 'spontan'} set={(x) => setRb({ ...rb, eylem: x })} secenekler={[['spontan', 'Spontan eylem'], ['induksiyon', 'İndüksiyon'], ['eylem_oncesi_cs', 'Eylem öncesi C/S']]} />
              {!tdt && alan('hafta', 'Hafta — 39+2', 'Gebelik haftası', 130)}
            </div>
            <div style={{ ...metin, marginTop: 6 }}>{robson.grup ? <>Robson <b>{robson.grup}{robson.alt || ''}</b> — {robson.tanim} <span style={kucuk}>(hekim doğrular)</span></> : <span style={kucuk}>Robson için eksik: {robson.eksik.join(', ')}</span>}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', columnGap: 12, marginTop: 4 }}>
              <Kutu on={onay.alternatif} set={(x) => setOnay({ ...onay, alternatif: x })}>Alternatifler ve riskler hastayla konuşuldu</Kutu>
              <Kutu on={onay.onam} set={(x) => setOnay({ ...onay, onam: x })}>Sezaryen onamı alındı (ayrı belge)</Kutu>
              {endikasyon.some((x) => x.startsWith('Anne isteği')) && <Kutu on={onay.anneIstegi} set={(x) => setOnay({ ...onay, anneIstegi: x })}>Anne isteği: 39+ hafta ve bilgilendirme belgelendi</Kutu>}
            </div>
            {eksik.length > 0 && <div style={{ marginTop: 8 }}>{eksik.map((x) => <div key={x} style={{ ...metin, fontSize: 13, color: '#FCD34D' }}>• {x}</div>)}</div>}
            <div style={satir}>
              <button type="button" disabled={eksik.length > 0} onClick={() => { setKilitli(true); setKopya(''); }} style={{ ...btn, opacity: eksik.length ? 0.45 : 1, cursor: eksik.length ? 'not-allowed' : 'pointer' }}>Endikasyonu kilitle</button>
              <span style={kucuk}>Kilitlenen not yalnız kopyalanır; dosyaya ve e-Doğum'a siz eklersiniz.</span>
            </div>
          </>
        ))}
      </div>
      <div style={{ ...kucuk, marginTop: 4 }}>Kaynak sırası: SB DÖBYR 2026 / Riskli Gebelikler Yönetim Rehberi → ACOG (CO/PB; PB 205 SSVD) → SMFM 2021 kontrol listesi. Tanı ve endikasyon hekimindir.</div>
    </>
  );
}
