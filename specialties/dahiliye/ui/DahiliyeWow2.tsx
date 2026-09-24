'use client';
/** NOTYA-DAH-WOW Wave 2 UI — DM döngü · Anemi · Obezite · Tarama/Aşı · Ön anket · HT panel (HT sekmesinin altında). DahiliyeHome'dan çağrılır. */
import React, { useState } from 'react';
import { toolsInput } from '@/lib/doktor/toolsUi';
import type { Wow2Veri } from '@/app/api/doktor/dahiliye/_wow2';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

type Dip = { ref: string; not: string };
type Props = { sekme: string; w2: Wow2Veri; kaynak: boolean; refler: Record<string, string>; calistir: (body: Record<string, unknown>, ok?: string) => Promise<Record<string, unknown> | null> };

const kucuk: React.CSSProperties = { fontSize: 11, color: CHROME_RENK.muted };
const etiket: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#0F9B8E', marginBottom: 6 };
const satir: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 };
const govde: React.CSSProperties = { fontSize: 12, color: CHROME_RENK.ink, marginTop: 8 };
const btn: React.CSSProperties = { background: '#0F9B8E', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' };
const ghost: React.CSSProperties = { ...btn, background: 'transparent', color: CHROME_RENK.muted, border: '1px solid rgba(255,255,255,0.15)' };
const chk = (label: string, v: boolean, on: (x: boolean) => void) => <label key={label} style={{ ...kucuk, display: 'flex', gap: 4, alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 999, padding: '3px 8px', cursor: 'pointer', color: v ? '#2DD4BF' : CHROME_RENK.muted }}><input type="checkbox" checked={v} onChange={(e) => on(e.target.checked)} />{label}</label>;
export const Kaynak = ({ d, acik, refler }: { d?: Dip[] | null; acik: boolean; refler: Record<string, string> }) => (!acik || !d?.length ? null : <div style={{ ...kucuk, marginTop: 4, borderLeft: '2px solid rgba(45,212,191,0.4)', paddingLeft: 6 }}>{d.map((x, i) => <div key={i}>[{refler[x.ref] || x.ref}] {x.not}</div>)}</div>);
const DURUM_RENK: Record<string, string> = { gecikti: '#F87171', sevk: '#F87171', zamani: '#FBBF24', seroloji: '#FBBF24', yaklasiyor: '#FBBF24', planli: CHROME_RENK.muted, tamam: '#22C55E', bilgi: CHROME_RENK.muted, uygun_degil: CHROME_RENK.muted };
const ASILAR: [string, string][] = [['grip', 'Grip'], ['pcv20', 'PCV20'], ['pcv13', 'PCV13'], ['ppsv23', 'PPSV23'], ['zona', 'Zona'], ['td', 'Td/Tdap'], ['hbv', 'HBV'], ['covid', 'COVID-19']];

/** Hekim plan kilidi — anemi / obezite / aşı / tarama kartları için tek satır. */
function PlanKilit({ kart, calistir }: { kart: string; calistir: Props['calistir'] }) {
  const [v, setV] = useState('');
  return (<div style={satir}><input value={v} onChange={(e) => setV(e.target.value)} placeholder="hekim planı (kilitlenir; nota yalnız hekim yazar)" style={{ ...toolsInput, minWidth: 280 }} /><button type="button" style={btn} disabled={!v} onClick={() => calistir({ adim: 'kilit', kart, alan: 'plan', deger: v }, 'Plan hekim kilidiyle kaydedildi.')}>Planı kilitle</button></div>);
}

export default function DahiliyeWow2({ sekme, w2, kaynak, refler, calistir }: Props) {
  const [f, setF] = useState<Record<string, unknown>>({});
  const s = (k: string) => (f[k] as string) ?? ''; const set = (k: string, x: unknown) => setF((p) => ({ ...p, [k]: x }));
  const bv = (k: string, d: boolean) => (f[k] === undefined ? d : !!f[k]);

  if (sekme === 'DM döngü') {
    const d = w2.dm; const r = d?.sonuc;
    if (!d) return <div style={kucuk}>Önce DM sekmesinden kartı değerlendirin.</div>;
    return (<div>
      <div style={etiket}>DM kapalı döngü <span style={kucuk}>· FIB-4 · ayak foto → Belgeler · aşı · SGLT2/GLP-1 kardiyo-renal bayrak · hipoglisemi riski · sınıf önerisi</span></div>
      <div style={satir}>
        {chk('kalp yetersizliği', bv('kky', d.kky), (x) => set('kky', x))}
        <span style={kucuk}>son ayak foto</span><input type="date" value={s('af') || d.son_ayak_foto || ''} onChange={(e) => set('af', e.target.value)} style={{ ...toolsInput, width: 140 }} />
        <button type="button" style={btn} onClick={() => calistir({ adim: 'dmdongu', kky: bv('kky', d.kky), sonAyakFoto: s('af') || d.son_ayak_foto }, 'DM döngü güncellendi.')}>Kaydet</button>
      </div>
      {r && (<div style={govde}>
        {r.kardiyoRenal.map((k) => <div key={k.sinif + k.neden} style={{ color: k.kullaniyor ? '#22C55E' : '#FBBF24' }}>{k.kullaniyor ? '✓' : '⚑'} {k.sinif} — {k.neden}{k.kullaniyor ? ' (kullanıyor)' : ' (endikasyon bayrağı — hekim)'}</div>)}
        {r.hipoRiski && <div style={{ color: '#F87171' }}>⚠ {r.hipoRiski}</div>}
        <div>FIB-4: {r.fib4 ? <b style={{ color: r.fib4.kategori === 'yuksek' ? '#F87171' : r.fib4.kategori === 'belirsiz' ? '#FBBF24' : '#22C55E' }}>{String(r.fib4.skor).replace('.', ',')}</b> : '—'} {r.fib4 ? <span style={kucuk}>({r.fib4.tarih}) {r.fib4.aksiyon}</span> : <span style={kucuk}>ALT + AST + trombosit onaylı lab gerekli</span>}</div>
        {r.plan.filter((p) => !/hipoglisemi/.test(p)).map((p) => <div key={p}>• {p}</div>)}
        {r.gorevler.map((g) => <div key={g.kod} style={kucuk}>□ {g.ad} · {g.due}</div>)}
        <div style={kucuk}>Ayak fotoğrafı: hasta dosyası › Belgeler › Yükle (tür: fotoğraf) — sonra tarihi buraya girin.</div>
        <Kaynak d={r.dipnotlar} acik={kaynak} refler={refler} />
        <div style={satir}>
          {r.gorevler.length > 0 && <button type="button" style={ghost} onClick={() => calistir({ adim: 'dmdongu', kky: bv('kky', d.kky), sonAyakFoto: s('af') || d.son_ayak_foto, gorevler: r.gorevler }, 'Görevler açıldı.')}>Görevleri aç</button>}
          {r.sevk.length > 0 && <button type="button" style={{ ...btn, background: '#B91C1C' }} onClick={() => calistir({ adim: 'dmdongu', kky: bv('kky', d.kky), sonAyakFoto: s('af') || d.son_ayak_foto, sevkNot: r.sevk[0] }, 'Gastroenteroloji sevki oluşturuldu.')}>Gastro sevk (FIB-4)</button>}
        </div>
      </div>)}
    </div>);
  }

  if (sekme === 'Anemi') {
    const a = w2.anemi; const r = a.sonuc;
    return (<div>
      <div style={etiket}>Anemi tetkik merdiveni <span style={kucuk}>· onaylı hemogram/ferritin/B12/folat/retikülosit · sonraki test önerisi · plan hekim kilidi</span></div>
      <div style={satir}>
        {chk('menstrüasyon devam ediyor', bv('men', !!a.menstruasyon), (x) => set('men', x))}{chk('GİS kanama bulgusu (melena/hematokezya)', bv('gis', a.gis_kanama), (x) => set('gis', x))}
        <button type="button" style={btn} onClick={() => calistir({ adim: 'anemi', menstruasyon: bv('men', !!a.menstruasyon), gisKanama: bv('gis', a.gis_kanama) }, 'Anemi kartı güncellendi.')}>Değerlendir</button>
      </div>
      <div style={govde}>
        <div>{r.anemi == null ? 'Hb onaylı lab satırı yok' : r.anemi ? <>Anemi: <b>{r.derece}</b>{r.morfoloji ? ` · ${r.morfoloji}` : ''}</> : 'Anemi yok (Hb eşik üstünde)'}</div>
        {r.kirmizi.map((x) => <div key={x} style={{ color: '#F87171', fontWeight: 700 }}>⚑ {x}</div>)}
        {r.olasiNeden.map((x) => <div key={x}>◦ {x}</div>)}
        {r.sonrakiTestler.length > 0 && <div style={{ color: '#FBBF24' }}>Sonraki test: {r.sonrakiTestler.join(' · ')}</div>}
        {r.plan.map((x) => <div key={x}>• {x}</div>)}
        {r.sevk.map((x) => <div key={x} style={{ color: '#F87171' }}>→ {x}</div>)}
        <Kaynak d={r.dipnotlar} acik={kaynak} refler={refler} />
        {r.anemi && <PlanKilit kart="anemi" calistir={calistir} />}
      </div>
    </div>);
  }

  if (sekme === 'Obezite') {
    const o = w2.obezite; const r = o.sonuc; const km = o.komorbidite || {};
    const KOM: [string, string][] = [['prediyabet', 'prediyabet'], ['ht', 'HT'], ['dislipidemi', 'dislipidemi'], ['osa', 'uyku apnesi'], ['masld', 'yağlı karaciğer'], ['osteoartrit', 'osteoartrit'], ['kvh', 'KVH']];
    return (<div>
      <div style={etiket}>Obezite / TEMD basamakları <span style={kucuk}>· VKİ · bel · yaşam tarzı → farmakoterapi sınıfı → bariatrik değerlendirme sevki · 3. ay %5 yanıt</span></div>
      <div style={satir}>
        <input value={s('kg')} onChange={(e) => set('kg', e.target.value)} placeholder={`kilo kg${o.kilo_kg ? ` (${o.kilo_kg})` : ''}`} style={{ ...toolsInput, width: 110 }} />
        <input value={s('boy') || (o.boy_cm != null ? String(o.boy_cm) : '')} onChange={(e) => set('boy', e.target.value)} placeholder="boy cm" style={{ ...toolsInput, width: 90 }} />
        <input value={s('bel') || (o.bel_cm != null ? String(o.bel_cm) : '')} onChange={(e) => set('bel', e.target.value)} placeholder="bel cm" style={{ ...toolsInput, width: 90 }} />
        <span style={kucuk}>farmakoterapi başlangıç</span><input type="date" value={s('fb') || o.farmakoterapi_baslangic || ''} onChange={(e) => set('fb', e.target.value)} style={{ ...toolsInput, width: 140 }} />
      </div>
      <div style={satir}>{KOM.map(([k, ad]) => chk(ad, bv(`k_${k}`, !!km[k]), (x) => set(`k_${k}`, x)))}
        <button type="button" style={btn} onClick={() => calistir({ adim: 'obezite', kiloKg: s('kg') || o.kilo_kg, boyCm: s('boy') || o.boy_cm, belCm: s('bel') || o.bel_cm, farmakoterapiBaslangic: s('fb') || o.farmakoterapi_baslangic, komorbidite: Object.fromEntries(KOM.map(([k]) => [k, bv(`k_${k}`, !!km[k])])) }, 'Obezite kartı güncellendi.')}>Değerlendir</button>
      </div>
      <div style={govde}>
        <div>VKİ <b>{r.vki != null ? String(r.vki).replace('.', ',') : '—'}</b> · {r.sinifAd}{r.belRiski ? ` · bel riski: ${r.belRiski}` : ''}{r.basamak ? ` · basamak: ${r.basamak.replace('_', ' ')}` : ''}</div>
        {r.plan.map((x) => <div key={x}>• {x}</div>)}
        {r.sevk.map((x) => <div key={x} style={{ color: '#F87171' }}>→ {x}</div>)}
        <Kaynak d={r.dipnotlar} acik={kaynak} refler={refler} />
        {r.gerekceMetni && (r.basamak === 'farmakoterapi' || r.basamak === 'bariatrik_degerlendirme') && (<details style={{ marginTop: 6 }}><summary style={{ ...kucuk, cursor: 'pointer' }}>Ödeme onayı gerekçe metni (taslak)</summary><pre style={{ whiteSpace: 'pre-wrap', fontSize: 11, color: CHROME_RENK.ink }}>{r.gerekceMetni}</pre><button type="button" style={ghost} onClick={() => navigator.clipboard?.writeText(r.gerekceMetni)}>📋 Kopyala</button></details>)}
        {r.vki != null && r.vki >= 25 && <PlanKilit kart="obezite" calistir={calistir} />}
      </div>
    </div>);
  }

  if (sekme === 'Tarama/Aşı') {
    const t = w2.tarama.satir; const ap = w2.asi.profil;
    const acik = [...w2.tarama.due.filter((x) => x.durum === 'gecikti' || x.durum === 'sevk').map((x) => ({ kod: `tarama_${x.kod}`, ad: x.ad, due: x.due, kaynak: 'tarama' })), ...w2.asi.due.filter((x) => x.durum === 'gecikti' || x.durum === 'zamani' || x.durum === 'seroloji').map((x) => ({ kod: `asi_${x.kod}`, ad: x.ad, due: x.due, kaynak: 'asi' }))];
    return (<div>
      <div style={etiket}>KETEM kanser taraması <span style={kucuk}>· kolon 50–70 · meme 40–69 · serviks 30–65 · kadında jine takvimi tarihleri ortak</span></div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{w2.tarama.due.map((d) => <span key={d.kod} title={d.not} style={{ fontSize: 12, color: CHROME_RENK.ink, border: `1px solid ${DURUM_RENK[d.durum]}`, borderRadius: 999, padding: '2px 8px' }}>{d.ad} <b style={{ color: DURUM_RENK[d.durum] }}>{d.due || ''} {d.durum}</b></span>)}{!w2.tarama.due.length && <span style={kucuk}>Yaşa göre tarama satırı yok.</span>}</div>
      <div style={satir}>
        {([['ggk', 'son GGK', t?.son_ggk], ['kol', 'son kolonoskopi', t?.son_kolonoskopi], ['mg', 'son mamografi', t?.son_mamografi], ['hpv', 'son HPV', t?.son_hpv]] as [string, string, string | null | undefined][]).map(([k, ad, v]) => <span key={k} style={{ display: 'flex', gap: 4, alignItems: 'center' }}><span style={kucuk}>{ad}</span><input type="date" value={s(k) || v || ''} onChange={(e) => set(k, e.target.value)} style={{ ...toolsInput, width: 135 }} /></span>)}
        {chk('GGK pozitif', bv('ggkp', !!t?.ggk_pozitif), (x) => set('ggkp', x))}{chk('histerektomi', bv('hist', !!t?.histerektomi), (x) => set('hist', x))}
        <button type="button" style={btn} onClick={() => calistir({ adim: 'tarama', sonGgk: s('ggk') || t?.son_ggk, sonKolonoskopi: s('kol') || t?.son_kolonoskopi, sonMamografi: s('mg') || t?.son_mamografi, sonHpv: s('hpv') || t?.son_hpv, ggkPozitif: bv('ggkp', !!t?.ggk_pozitif), histerektomi: bv('hist', !!t?.histerektomi) }, 'Tarama tarihleri kaydedildi.')}>Kaydet</button>
      </div>
      <Kaynak d={w2.tarama.due.slice(0, 1).map((x) => x.dipnot)} acik={kaynak} refler={refler} />

      <div style={{ ...etiket, marginTop: 12 }}>Erişkin aşı takvimi <span style={kucuk}>· HYP · risk grubu kartlardan (DM, KBH, KVH, sigara) + aşağıdaki işaretler</span></div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{w2.asi.due.map((d) => <span key={d.kod} title={d.not} style={{ fontSize: 12, color: CHROME_RENK.ink, border: `1px solid ${DURUM_RENK[d.durum]}`, borderRadius: 999, padding: '2px 8px' }}>{d.ad} <b style={{ color: DURUM_RENK[d.durum] }}>{d.durum}{d.due ? ` · ${d.due}` : ''}</b></span>)}</div>
      <div style={{ ...govde, marginTop: 4 }}>{w2.asi.due.filter((d) => d.durum !== 'tamam').map((d) => <div key={d.kod} style={kucuk}>{d.ad}: {d.not}</div>)}</div>
      <div style={satir}>
        {chk('kronik akciğer', bv('akc', !!ap?.akciger), (x) => set('akc', x))}{chk('kronik karaciğer', bv('kc', !!ap?.karaciger), (x) => set('kc', x))}{chk('immünsüpresyon', bv('imm', !!ap?.immunsup), (x) => set('imm', x))}{chk('asplenia', bv('asp', !!ap?.asplenik), (x) => set('asp', x))}{chk('alkol', bv('alk', !!ap?.alkol), (x) => set('alk', x))}
        <button type="button" style={ghost} onClick={() => calistir({ adim: 'asiprofil', akciger: bv('akc', !!ap?.akciger), karaciger: bv('kc', !!ap?.karaciger), immunsup: bv('imm', !!ap?.immunsup), asplenik: bv('asp', !!ap?.asplenik), alkol: bv('alk', !!ap?.alkol) }, 'Risk profili kaydedildi.')}>Risk profilini kaydet</button>
      </div>
      <div style={satir}>
        <select value={s('asi')} onChange={(e) => set('asi', e.target.value)} style={{ ...toolsInput, width: 'auto' }}><option value="">yapılan aşı</option>{ASILAR.map(([v, a]) => <option key={v} value={v} style={{ color: '#000' }}>{a}</option>)}</select>
        <input type="date" value={s('asiT')} onChange={(e) => set('asiT', e.target.value)} style={{ ...toolsInput, width: 140 }} />
        <button type="button" style={btn} disabled={!s('asi')} onClick={() => calistir({ adim: 'asi', asi: s('asi'), tarih: s('asiT') || undefined }, 'Aşı dozu kaydedildi.')}>Doz ekle</button>
        {acik.length > 0 && <button type="button" style={ghost} onClick={() => calistir({ adim: 'duegorev', gorevler: acik }, `${acik.length} tarama/aşı görevi açıldı (şerit › gecikmiş).`)}>Due olanları görevlere ekle ({acik.length})</button>}
      </div>
      {w2.asi.dozlar.length > 0 && <div style={{ ...kucuk, marginTop: 4 }}>Kayıtlı dozlar: {w2.asi.dozlar.slice(0, 12).map((d) => `${d.asi} ${d.tarih}`).join(' · ')}</div>}
      <Kaynak d={w2.asi.due.slice(0, 1).map((x) => x.dipnot)} acik={kaynak} refler={refler} />
      <PlanKilit kart="asi" calistir={calistir} />
    </div>);
  }

  if (sekme === 'Ön anket') {
    const a = w2.anket;
    return (<div>
      <div style={etiket}>Muayene öncesi hasta anketi <span style={kucuk}>· Sağlığım portalı › Takip › Ön anket · ev ölçümleri Ev kayıt'a (portal) düşer</span></div>
      {!a && <div style={kucuk}>Son 14 günde yanıt yok. Hastaya Sağlığım linki verin (Araçlar › Hasta Portalı); anket Takip sayfasında.</div>}
      {a && (<div style={govde}>
        <div>{a.tarih} {a.okundu ? <span style={{ color: '#22C55E' }}>· Subjektif'e eklendi</span> : <span style={{ color: '#FBBF24' }}>· yeni</span>}</div>
        {a.alarmlar.map((x) => <div key={x} style={{ color: '#F87171', fontWeight: 700 }}>⚑ {x}</div>)}
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, color: CHROME_RENK.ink, fontFamily: 'inherit' }}>{a.soap}</pre>
        <div style={satir}>
          <button type="button" style={btn} onClick={() => calistir({ adim: 'anketsoap', anketId: a.id }, "Bugünkü muayenenin Subjektif bölümüne eklendi.")}>Subjektif'e ekle</button>
          <button type="button" style={ghost} onClick={() => navigator.clipboard?.writeText(a.soap)}>📋 Kopyala</button>
        </div>
      </div>)}
    </div>);
  }

  if (sekme === 'HT panel') {
    const p = w2.htPanel;
    return (<div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8 }}>
      <div style={etiket}>HT başlangıç paneli <span style={kucuk}>· tek tıkla istem · 14 gün sonuçlanmazsa takip görevi · yalnız onaylı lab "geldi" sayılır</span></div>
      <div style={kucuk}>{p.kalemler.map((k) => k.ad).join(' · ')}</div>
      <div style={satir}><button type="button" style={btn} onClick={() => calistir({ adim: 'htpanel' }, 'HT başlangıç paneli istendi (bugünkü nota eklendi). Tetkik İstek formundan yazdırabilirsiniz.')}>1-tık panel iste</button><a href="/doktor-tools/tetkik" style={{ ...kucuk, color: '#2DD4BF' }}>Tetkik İstek formu →</a></div>
      {p.istemler.map((i) => (<div key={i.id} style={{ ...govde, marginTop: 6 }}>
        <div>{i.tarih} · {i.durum.gunGecen} gün · <b style={{ color: i.durum.tamam ? '#22C55E' : i.durum.gecikti ? '#F87171' : '#FBBF24' }}>{i.durum.tamam ? 'tamam' : i.durum.gecikti ? 'GECİKTİ' : 'bekleniyor'}</b></div>
        {i.durum.bekleyen.length > 0 && <div style={kucuk}>Bekleyen: {i.durum.bekleyen.join(', ')}</div>}
        <div style={satir}>
          {i.durum.takipGorevi && <button type="button" style={{ ...btn, background: '#B91C1C' }} onClick={() => calistir({ adim: 'duegorev', gorevler: [{ ...i.durum.takipGorevi, kaynak: 'lab_takip' }] }, 'Takip görevi açıldı.')}>Takip görevi aç</button>}
          <button type="button" style={ghost} onClick={() => calistir({ adim: 'htpanelkapat', istemId: i.id, iptal: !i.durum.tamam }, 'İstem kapatıldı.')}>{i.durum.tamam ? 'Kapat' : 'İptal et'}</button>
        </div>
      </div>))}
      <Kaynak d={[p.dipnot]} acik={kaynak} refler={refler} />
    </div>);
  }
  return null;
}
