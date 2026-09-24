'use client';
/**
 * NOTYA-JINE-02 — Jinekoloji V2 tabs: AUB/PALM-COEIN + PMP | KOK kapısı | Endometriozis | Tekrarlayan kayıp | Erken gebelik kaybı.
 * "Kaynak" toggle reveals ref_code dipnotlar (BEREK / SPEROFF / TJOD_* / HSGM / WHO MEC / ACOG) — clinician only, never printed.
 */
import React, { useState } from 'react';
import { toolsInput } from '@/lib/doktor/toolsUi';
import { PALM, COEIN, type Dipnot } from '../engines/jinekoloji-v2';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

type Calistir = (body: Record<string, unknown>, ok?: string) => Promise<unknown>;
type V2 = { aub: Record<string, unknown>[]; kok: Record<string, unknown>[]; endo: Record<string, unknown> | null; rm: Record<string, unknown> | null; egk: Record<string, unknown>[] };

const btn: React.CSSProperties = { background: '#0F9B8E', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' };
const ghost: React.CSSProperties = { ...btn, background: 'transparent', color: CHROME_RENK.muted, border: '1px solid rgba(255,255,255,0.15)' };
const etiket: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#0F9B8E', marginBottom: 6 };
const kucuk: React.CSSProperties = { fontSize: 11, color: CHROME_RENK.muted };
const satir: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 };
const chk = (label: string, v: boolean, on: (x: boolean) => void) => <label key={label} style={{ ...kucuk, display: 'flex', gap: 4, alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 999, padding: '2px 8px', color: v ? '#0F9B8E' : CHROME_RENK.muted }}><input type="checkbox" checked={v} onChange={(e) => on(e.target.checked)} />{label}</label>;

export function Kaynak({ dipnotlar, acik, refler }: { dipnotlar?: Dipnot[] | null; acik: boolean; refler: Record<string, string> }) {
  if (!acik || !dipnotlar?.length) return null;
  return <div style={{ ...kucuk, marginTop: 4, borderLeft: '2px solid rgba(15,155,142,0.5)', paddingLeft: 8 }}>{dipnotlar.map((d, i) => <div key={i}><b>{d.ref}</b> — {d.not} <span style={{ opacity: 0.7 }}>({refler[d.ref] || d.ref})</span></div>)}</div>;
}

export function JinekolojiV2Sekmeler({ sekme, v2, refler, calistir, kaynakAcik }: { sekme: string; v2: V2; refler: Record<string, string>; calistir: Calistir; kaynakAcik: boolean }) {
  const [f, setF] = useState<Record<string, unknown>>({});
  const s = (k: string) => (f[k] as string) ?? '';
  const b = (k: string) => !!f[k];
  const set = (k: string, x: unknown) => setF((p) => ({ ...p, [k]: x }));
  const tri = (k: string) => (f[k] === true ? true : f[k] === false ? false : null);

  if (sekme === 'AUB / PMP') {
    const son = v2.aub[0] as { id: string; taslak?: { menoraji: boolean; anemi: string; tetkikler: string[]; endometrialOrnekZorunlu: boolean; gerekce: string[]; dipnotlar: Dipnot[] }; menoraji?: { hb?: number | null; hbKaynak?: string | null }; postmenopoz?: boolean; hekim_plani?: string | null; ornekleme?: { tur?: string; sonuc?: string } | null; tvus_et?: number | null; pmp_kapatildi?: boolean } | undefined;
    return (<div>
      <div style={etiket}>Anormal uterin kanama — PALM-COEIN (FIGO) <span style={kucuk}>· hekim işaretler; plan taslak, örnekleme kuralı sistemde</span></div>
      <div style={satir}>{PALM.map(([k, ad]) => chk(`${k} ${ad}`, b('p_' + k), (x) => set('p_' + k, x)))}</div>
      <div style={satir}>{COEIN.map(([k, ad]) => chk(`${k} ${ad}`, b('c_' + k), (x) => set('c_' + k, x)))}</div>
      <div style={satir}>
        <input value={s('sure')} onChange={(e) => set('sure', e.target.value)} placeholder="süre gün" style={{ ...toolsInput, width: 90 }} />
        <input value={s('ped')} onChange={(e) => set('ped', e.target.value)} placeholder="ped/adet" style={{ ...toolsInput, width: 90 }} />
        {chk('pıhtı', b('pihti'), (x) => set('pihti', x))}
        <input value={s('hb')} onChange={(e) => set('hb', e.target.value)} placeholder="Hb (boş: onaylı lab)" style={{ ...toolsInput, width: 150 }} />
        <input value={s('fer')} onChange={(e) => set('fer', e.target.value)} placeholder="ferritin" style={{ ...toolsInput, width: 90 }} />
        <input value={s('et')} onChange={(e) => set('et', e.target.value)} placeholder="TVUS ET mm" style={{ ...toolsInput, width: 110 }} />
        {chk('postmenopozal', b('pmp'), (x) => set('pmp', x))}{chk('obezite', b('ob'), (x) => set('ob', x))}{chk('anovulasyon öyküsü', b('anov'), (x) => set('anov', x))}{chk('kronik/dirençli', b('kr'), (x) => set('kr', x))}
        <button type="button" onClick={() => calistir({ adim: 'aub', girdi: { palm: Object.fromEntries(PALM.map(([k]) => [k, b('p_' + k)])), coein: Object.fromEntries(COEIN.map(([k]) => [k, b('c_' + k)])), sureGun: s('sure'), pedAdet: s('ped'), pihti: b('pihti'), hb: s('hb'), ferritin: s('fer'), tvusEt: s('et'), postmenopoz: b('pmp'), obezite: b('ob'), anovulasyon: b('anov'), kronik: b('kr') } }, 'AUB kartı oluşturuldu; plan taslağı hazır.')} style={btn}>Değerlendir</button>
      </div>
      {son?.taslak && (<div style={{ marginTop: 8, fontSize: 12, color: CHROME_RENK.ink }}>
        {son.postmenopoz && <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.5)', color: CHROME_RENK.warn, borderRadius: 8, padding: '6px 10px', fontWeight: 800, marginBottom: 6 }}>PMP kanama — TVUS ET + endometriyal örnekleme zorunlu · sitoloji/Pap bu yolu kapatmaz{son.pmp_kapatildi ? ' · ✓ kapatıldı' : ''}</div>}
        <div>Menoraji: {son.taslak.menoraji ? 'evet' : 'hayır'} · anemi {son.taslak.anemi}{son.menoraji?.hbKaynak ? ` (Hb ${son.menoraji.hb} — ${son.menoraji.hbKaynak})` : ''} · örnekleme {son.taslak.endometrialOrnekZorunlu ? 'ZORUNLU' : 'gerekli değil'}</div>
        <ul style={{ margin: '4px 0', paddingLeft: 18 }}>{son.taslak.tetkikler.map((t) => <li key={t}>{t}</li>)}</ul>
        {son.taslak.gerekce.map((g) => <div key={g} style={{ ...kucuk, color: '#FBBF24' }}>{g}</div>)}
        <Kaynak dipnotlar={son.taslak.dipnotlar} acik={kaynakAcik} refler={refler} />
        <div style={satir}>
          <select value={s('orn_tur')} onChange={(e) => set('orn_tur', e.target.value)} style={{ ...toolsInput, width: 'auto' }}><option value="">örnekleme türü</option><option value="pipelle" style={{ color: '#000' }}>Pipelle</option><option value="dc" style={{ color: '#000' }}>D&C</option><option value="histeroskopi" style={{ color: '#000' }}>Histeroskopi</option></select>
          <input value={s('orn_sonuc')} onChange={(e) => set('orn_sonuc', e.target.value)} placeholder="patoloji sonucu" style={{ ...toolsInput, minWidth: 200 }} />
          <input value={s('hp')} onChange={(e) => set('hp', e.target.value)} placeholder="Hekim planı" style={{ ...toolsInput, minWidth: 220 }} />
          <button type="button" onClick={() => calistir({ adim: 'aub_guncelle', aubId: son.id, ornekleme: s('orn_tur') ? { tur: s('orn_tur'), sonuc: s('orn_sonuc'), tarih: new Date().toISOString().slice(0, 10) } : undefined, hekimPlani: s('hp') || undefined })} style={ghost}>Kaydet</button>
          {son.postmenopoz && !son.pmp_kapatildi && <button type="button" onClick={() => calistir({ adim: 'aub_guncelle', aubId: son.id, ornekleme: s('orn_tur') ? { tur: s('orn_tur'), sonuc: s('orn_sonuc') } : undefined, pmpKapat: true, sitolojiVar: b('sit') }, 'PMP yolu kapatıldı (TVUS + örnekleme tamam).')} style={btn}>PMP yolunu kapat</button>}
          {son.postmenopoz && chk('yalnız sitoloji var', b('sit'), (x) => set('sit', x))}
        </div>
        {son.hekim_plani && <div style={{ ...kucuk, color: '#0F9B8E' }}>Hekim planı: {son.hekim_plani}</div>}
      </div>)}
    </div>);
  }

  if (sekme === 'KOK kapısı') {
    const son = v2.kok[0] as { sonuc?: { kategori: number; engeller: string[]; dikkat: string[]; alternatif: string[]; dipnotlar: Dipnot[] }; karar?: string; override?: boolean; override_gerekce?: string | null; preparat?: string | null } | undefined;
    const kontrol = () => ({ sigaraGunluk: s('sig'), taSistolik: s('tas'), taDiastolik: s('tad'), postpartumGun: s('pp'), bmi: s('bmi'), vteOykusu: b('vte'), migrenAura: b('aura'), migrenAurasiz: b('aurasiz'), vaskulerHastalik: b('vask'), memeCa: b('mca'), memeCaGecmis: b('mcag'), karacigerAgir: b('kc'), karacigerTumor: b('kct'), emziriyor: b('emz'), sleApl: b('sle'), dmVaskuler: b('dmv'), cerrahiImmobil: b('cer'), bilinmeyenKanama: b('bk'), hiperlipidemi: b('lip') });
    return (<div>
      <div style={etiket}>Kombine oral kontraseptif — WHO MEC kapısı <span style={kucuk}>· MEC 4 = başlanmaz (override gerekçeli, kayda geçer) · MEC 3 = dikkat · alternatif önerilir</span></div>
      <div style={satir}>
        <input value={s('sig')} onChange={(e) => set('sig', e.target.value)} placeholder="sigara/gün" style={{ ...toolsInput, width: 100 }} />
        <input value={s('tas')} onChange={(e) => set('tas', e.target.value)} placeholder="TA sist" style={{ ...toolsInput, width: 80 }} />
        <input value={s('tad')} onChange={(e) => set('tad', e.target.value)} placeholder="TA diast" style={{ ...toolsInput, width: 80 }} />
        <input value={s('pp')} onChange={(e) => set('pp', e.target.value)} placeholder="postpartum gün" style={{ ...toolsInput, width: 120 }} />
        <input value={s('bmi')} onChange={(e) => set('bmi', e.target.value)} placeholder="BMI" style={{ ...toolsInput, width: 70 }} />
      </div>
      <div style={satir}>{[['vte', 'VTE öyküsü'], ['aura', 'auralı migren'], ['aurasiz', 'aurasız migren ≥35'], ['vask', 'vasküler hastalık'], ['mca', 'meme Ca (aktif/5 yıl)'], ['mcag', 'meme Ca >5 yıl'], ['kc', 'ağır karaciğer hst'], ['kct', 'karaciğer tümörü'], ['emz', 'emziriyor'], ['sle', 'SLE + aPL'], ['dmv', 'DM vasküler'], ['cer', 'büyük cerrahi/immobil'], ['bk', 'açıklanmamış kanama'], ['lip', 'hiperlipidemi']].map(([k, ad]) => chk(ad, b(k), (x) => set(k, x)))}</div>
      <div style={satir}>
        <input value={s('prep')} onChange={(e) => set('prep', e.target.value)} placeholder="preparat (hekim)" style={{ ...toolsInput, minWidth: 180 }} />
        <button type="button" onClick={() => calistir({ adim: 'kok', kontrol: kontrol(), karar: 'beklemede' }, 'MEC değerlendirmesi kaydedildi.')} style={ghost}>Değerlendir</button>
        <button type="button" onClick={() => calistir({ adim: 'kok', kontrol: kontrol(), karar: 'baslandi', preparat: s('prep'), overrideGerekce: s('ovr') }, 'KOK başlangıcı kaydedildi.')} style={btn}>KOK başlat (hekim)</button>
        <input value={s('ovr')} onChange={(e) => set('ovr', e.target.value)} placeholder="MEC 4 override gerekçesi (≥15 karakter)" style={{ ...toolsInput, minWidth: 260 }} />
      </div>
      {son?.sonuc && (<div style={{ marginTop: 8, fontSize: 12 }}>
        <div style={{ fontWeight: 800, color: son.sonuc.kategori === 4 ? '#F87171' : son.sonuc.kategori === 3 ? '#FBBF24' : '#0F9B8E' }}>MEC kategori {son.sonuc.kategori} · karar: {son.karar}{son.override ? ` · OVERRIDE: ${son.override_gerekce}` : ''}{son.preparat ? ` · ${son.preparat}` : ''}</div>
        {son.sonuc.engeller.map((e) => <div key={e} style={{ color: '#F87171' }}>✖ {e}</div>)}{son.sonuc.dikkat.map((e) => <div key={e} style={{ color: '#FBBF24' }}>⚠ {e}</div>)}{son.sonuc.alternatif.map((e) => <div key={e} style={{ color: CHROME_RENK.muted }}>→ {e}</div>)}
        <Kaynak dipnotlar={son.sonuc.dipnotlar} acik={kaynakAcik} refler={refler} />
      </div>)}
    </div>);
  }

  if (sekme === 'Endometriozis') {
    const t = v2.endo?.taslak as { triadPuan: number; olasilik: string; ampirik: string[]; sevk: string[]; not: string[]; dipnotlar: Dipnot[] } | undefined;
    return (<div>
      <div style={etiket}>Endometriozis (TJOD 2014) <span style={kucuk}>· triad → olasılık; ampirik öneri; cerrahi/IVF sevk; evreleme yok</span></div>
      <div style={satir}>{[['dis', 'dismenore'], ['dsp', 'disparoni'], ['kpa', 'kronik pelvik ağrı'], ['inf', 'infertilite'], ['dsk', 'diskezi'], ['gi', 'gebelik isteği'], ['dir', 'medikal tedaviye dirençli']].map(([k, ad]) => chk(ad, b(k), (x) => set(k, x)))}
        <input value={s('endo')} onChange={(e) => set('endo', e.target.value)} placeholder="endometrioma cm" style={{ ...toolsInput, width: 130 }} />
        <input value={s('ca')} onChange={(e) => set('ca', e.target.value)} placeholder="CA-125 (isteğe bağlı)" style={{ ...toolsInput, width: 140 }} />
        <input value={s('ehp')} onChange={(e) => set('ehp', e.target.value)} placeholder="Hekim planı" style={{ ...toolsInput, minWidth: 200 }} />
        <button type="button" onClick={() => calistir({ adim: 'endometriozis', girdi: { dismenore: b('dis'), disparoni: b('dsp'), kronikPelvikAgri: b('kpa'), infertilite: b('inf'), diskezi: b('dsk'), gebelikIstegi: b('gi'), tedaviyeDirenc: b('dir'), endometriomaCm: s('endo'), ca125: s('ca') }, hekimPlani: s('ehp') || null }, 'Endometriozis kartı güncellendi.')} style={btn}>Değerlendir</button>
      </div>
      {t && (<div style={{ marginTop: 8, fontSize: 12, color: CHROME_RENK.ink }}>
        <div>Triad puanı {t.triadPuan} · olasılık <b>{t.olasilik}</b>{v2.endo?.hekim_plani ? ` · Hekim planı: ${String(v2.endo.hekim_plani)}` : ''}</div>
        {t.ampirik.map((a) => <div key={a}>• {a}</div>)}{t.sevk.map((a) => <div key={a} style={{ color: '#FBBF24' }}>→ {a}</div>)}{t.not.map((a) => <div key={a} style={kucuk}>{a}</div>)}
        <Kaynak dipnotlar={t.dipnotlar} acik={kaynakAcik} refler={refler} />
      </div>)}
    </div>);
  }

  if (sekme === 'Tekrarlayan kayıp') {
    const t = v2.rm?.taslak as { kriterKarsilandi: boolean; tetkikler: { ad: string; oneri: string }[]; not: string[]; dipnotlar: Dipnot[] } | undefined;
    return (<div>
      <div style={etiket}>Tekrarlayan gebelik kaybı (TJOD / RCOG / ESHRE) <span style={kucuk}>· ≥2 klinik kayıp (hekim 3 seçebilir); IVF yok</span></div>
      <div style={satir}>
        <input value={s('kayip')} onChange={(e) => set('kayip', e.target.value)} placeholder="klinik kayıp sayısı" style={{ ...toolsInput, width: 150 }} />
        {chk('eşik 3 (hekim)', b('e3'), (x) => set('e3', x))}{chk('ardışık', b('ard'), (x) => set('ard', x))}
        <input value={s('rhp')} onChange={(e) => set('rhp', e.target.value)} placeholder="Hekim planı" style={{ ...toolsInput, minWidth: 200 }} />
        <button type="button" onClick={() => calistir({ adim: 'rm', girdi: { klinikKayipSayisi: s('kayip'), hekimEsigi3: b('e3'), ardisik: b('ard') }, hekimPlani: s('rhp') || null }, 'RM kartı güncellendi; rutin tetkik görevleri açıldı.')} style={btn}>Değerlendir</button>
      </div>
      {t && (<div style={{ marginTop: 8, fontSize: 12, color: CHROME_RENK.ink }}>
        <div>Kriter {t.kriterKarsilandi ? 'karşılandı' : 'karşılanmadı'}</div>
        {t.tetkikler.map((x) => <div key={x.ad} style={{ color: x.oneri === 'rutin' ? CHROME_RENK.ink : x.oneri === 'secili' ? '#FBBF24' : CHROME_RENK.muted }}>{x.oneri === 'rutin' ? '● ' : x.oneri === 'secili' ? '○ ' : '✖ '}{x.ad} <span style={kucuk}>({x.oneri})</span></div>)}
        {t.not.map((n) => <div key={n} style={kucuk}>{n}</div>)}
        <Kaynak dipnotlar={t.dipnotlar} acik={kaynakAcik} refler={refler} />
      </div>)}
    </div>);
  }

  if (sekme === 'Erken gebelik kaybı') {
    const son = v2.egk[0] as { id: string; taslak?: { tanı: string; gerekce: string; secenekler: string[]; gorevler: string[]; dipnotlar: Dipnot[]; bhcgTrend?: string }; secenek?: string | null; gebelik_id?: string | null } | undefined;
    const tanıRenk: Record<string, string> = { kesin_nonviabl: '#F87171', suphe: '#FBBF24', viabl: '#0F9B8E', belirsiz: CHROME_RENK.muted };
    return (<div>
      <div style={etiket}>Erken gebelik kaybı <span style={kucuk}>· kesin nonviabilite yalnız CRL ≥7 mm FHR yok / MSD ≥25 mm embriyo yok; β-hCG serisi Lab + elle; D&C onamı kütüphanede</span></div>
      <div style={satir}>
        <input value={s('hf')} onChange={(e) => set('hf', e.target.value)} placeholder="hafta" style={{ ...toolsInput, width: 70 }} />
        <input value={s('crl')} onChange={(e) => set('crl', e.target.value)} placeholder="CRL mm" style={{ ...toolsInput, width: 80 }} />
        <select value={String(tri('fhr'))} onChange={(e) => set('fhr', e.target.value === 'true' ? true : e.target.value === 'false' ? false : null)} style={{ ...toolsInput, width: 'auto' }}><option value="null">FHR ?</option><option value="true" style={{ color: '#000' }}>FHR var</option><option value="false" style={{ color: '#000' }}>FHR yok</option></select>
        <input value={s('msd')} onChange={(e) => set('msd', e.target.value)} placeholder="MSD mm" style={{ ...toolsInput, width: 80 }} />
        <select value={String(tri('emb'))} onChange={(e) => set('emb', e.target.value === 'true' ? true : e.target.value === 'false' ? false : null)} style={{ ...toolsInput, width: 'auto' }}><option value="null">embriyo ?</option><option value="true" style={{ color: '#000' }}>embriyo var</option><option value="false" style={{ color: '#000' }}>embriyo yok</option></select>
        {chk('Rh negatif', b('rh'), (x) => set('rh', x))}
        <input value={s('b1')} onChange={(e) => set('b1', e.target.value)} placeholder="β-hCG önceki" style={{ ...toolsInput, width: 110 }} /><input value={s('b2')} onChange={(e) => set('b2', e.target.value)} placeholder="β-hCG şimdi" style={{ ...toolsInput, width: 110 }} />
        <button type="button" onClick={() => { const bh: { at: string; value: string }[] = []; const bugun = new Date(); if (s('b1')) bh.push({ at: new Date(bugun.getTime() - 2 * 864e5).toISOString().slice(0, 10), value: s('b1') }); if (s('b2')) bh.push({ at: bugun.toISOString().slice(0, 10), value: s('b2') }); calistir({ adim: 'egk', girdi: { hafta: s('hf'), crlMm: s('crl'), fhrVar: tri('fhr'), msdMm: s('msd'), embriyoVar: tri('emb'), rhNegatif: b('rh') }, bhcg: bh }, 'Erken gebelik kaybı kartı oluşturuldu.'); }} style={btn}>Değerlendir</button>
      </div>
      {son?.taslak && (<div style={{ marginTop: 8, fontSize: 12, color: CHROME_RENK.ink }}>
        <div style={{ fontWeight: 800, color: tanıRenk[son.taslak.tanı] }}>{son.taslak.tanı.replace('_', ' ')} — {son.taslak.gerekce}{son.taslak.bhcgTrend ? ` · β-hCG ${son.taslak.bhcgTrend}` : ''}{son.gebelik_id ? ' · obstetri kaydına bağlı' : ''}</div>
        {son.taslak.secenekler.map((x) => <div key={x}>• {x}</div>)}{son.taslak.gorevler.map((x) => <div key={x} style={{ color: '#FBBF24' }}>→ {x}</div>)}
        <Kaynak dipnotlar={son.taslak.dipnotlar} acik={kaynakAcik} refler={refler} />
        {son.taslak.tanı === 'kesin_nonviabl' && <div style={satir}><select value={s('sec') || son.secenek || ''} onChange={(e) => set('sec', e.target.value)} style={{ ...toolsInput, width: 'auto' }}><option value="">yönetim (hekim)</option><option value="bekleme" style={{ color: '#000' }}>Bekleme</option><option value="medikal" style={{ color: '#000' }}>Medikal</option><option value="cerrahi" style={{ color: '#000' }}>Cerrahi (D&C onamı)</option></select>{chk('anti-D uygulandı', b('antid'), (x) => set('antid', x))}<button type="button" onClick={() => calistir({ adim: 'egk_guncelle', egkId: son.id, secenek: s('sec') || son.secenek, antiD: b('antid') })} style={ghost}>Kaydet</button></div>}
      </div>)}
    </div>);
  }
  return null;
}
