'use client';
/** NOTYA-DERM-02 — Derm spine tabs: Lezyon değerlendirme (ABCDE/resmi tanı) | İşlemler | İlaç güvenliği | Pediatrik | Kozmetik (kapalı varsayılan). Dermatoloji only. */
import React, { useCallback, useEffect, useState } from 'react';
import { getAccessTokenAsync, toolsCard, toolsInput } from '@/lib/doktor/toolsUi';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

type Lez = { id: string; region: string | null; morphology: string | null; size_mm: number | null; abcde: Record<string, boolean> | null; degerlendirme: { abcdePuan: number; melanomSuphesi: boolean; oneri: string[]; not: string } | null; resmi_tani: string | null; acil: boolean; patoloji_sonuc: string | null; created_at: string };
type Veri = { lezyonlar: Lez[]; islemler: { id: string; tur: string; tarih: string; lezyon_id: string | null; onam_id: string | null; patoloji_sonuc: string | null; yara_bakimi: string[] }[]; ilacGuvenlik: { id: string; ilac: string; baslangic: string | null; aylik_due: string | null; kapisi: { eksik?: string[]; uyari?: string[] } }[]; gorevler: { id: string; ad: string; due: string | null; kaynak: string }[]; onamlar: { id: string; sablon_adi: string; hasta_onayladi: boolean }[]; bebekBagli: boolean; kutuphane: { islemler: { kod: string; ad: string; notAlanlari: string[] }[]; onamlar: { kod: string; ad: string }[]; taniSecenekleri: readonly string[]; pediatrik: { kod: string; ad: string; maddeler: string[] }[] } };
const btn: React.CSSProperties = { background: '#0F9B8E', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' };
const ghost: React.CSSProperties = { ...btn, background: 'transparent', color: CHROME_RENK.muted, border: '1px solid rgba(255,255,255,0.15)' };
const etiket: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#0F9B8E', marginBottom: 6 };
const kucuk: React.CSSProperties = { fontSize: 11, color: CHROME_RENK.muted };
const satir: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 };
const chk = (label: string, v: boolean, on: (x: boolean) => void) => <label key={label} style={{ ...kucuk, display: 'flex', gap: 4, alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 999, padding: '2px 8px', color: v ? '#0F9B8E' : CHROME_RENK.muted }}><input type="checkbox" checked={v} onChange={(e) => on(e.target.checked)} />{label}</label>;
const SEKME = ['Lezyon değerlendirme', 'İşlemler', 'İlaç güvenliği', 'Pediatrik', 'Kozmetik'] as const;

export function DermSpine({ patientId }: { patientId: string }) {
  const [v, setV] = useState<Veri | null>(null);
  const [sekme, setSekme] = useState<(typeof SEKME)[number]>('Lezyon değerlendirme');
  const [kozmetikAcik, setKozmetikAcik] = useState(false);
  const [mesaj, setMesaj] = useState('');
  const [f, setF] = useState<Record<string, unknown>>({});
  const s = (k: string) => (f[k] as string) ?? ''; const b = (k: string) => !!f[k]; const set = (k: string, x: unknown) => setF((p) => ({ ...p, [k]: x }));
  const api = useCallback(async (body: Record<string, unknown>) => { const token = await getAccessTokenAsync(); const r = await fetch('/api/doktor/dermatoloji/spine', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId, ...body }) }); const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || 'Hata'); return j; }, [patientId]);
  const yukle = useCallback(async () => { const token = await getAccessTokenAsync(); const r = await fetch(`/api/doktor/dermatoloji/spine?patientId=${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }); if (r.ok) setV(await r.json()); }, [patientId]);
  useEffect(() => { yukle(); }, [yukle]);
  const calistir = async (body: Record<string, unknown>, ok?: string) => { setMesaj(''); try { const j = await api(body); setMesaj(ok || 'Kaydedildi.'); await yukle(); return j; } catch (e) { setMesaj(e instanceof Error ? e.message : 'Hata'); return null; } };
  if (!v) return <div style={{ ...toolsCard, color: CHROME_RENK.muted, fontSize: 12 }}>Derm spine yükleniyor…</div>;
  const lez = v.lezyonlar.find((l) => l.id === s('lezyonId')) || v.lezyonlar[0];

  return (
    <div style={{ ...toolsCard, marginBottom: 12 }} data-chapter="derm-spine">
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>{SEKME.filter((x) => x !== 'Kozmetik' || kozmetikAcik).map((x) => <button key={x} type="button" onClick={() => setSekme(x)} style={{ ...ghost, background: sekme === x ? 'rgba(15,155,142,0.2)' : 'transparent', color: sekme === x ? '#0F9B8E' : CHROME_RENK.muted, borderRadius: 999 }}>{x}{x === 'Lezyon değerlendirme' && v.lezyonlar.some((l) => l.acil) ? ' ⚠' : ''}</button>)}{!kozmetikAcik && <button type="button" onClick={() => setKozmetikAcik(true)} style={{ ...ghost, borderRadius: 999, color: CHROME_RENK.muted, fontSize: 10 }}>+ Kozmetik (isteğe bağlı)</button>}</div>
      {mesaj && <div style={{ fontSize: 12, color: /amadı|eksik|geçersiz|Hata/.test(mesaj) ? '#F87171' : '#0F9B8E', marginBottom: 8 }}>{mesaj}</div>}
      {v.gorevler.length > 0 && <div style={{ ...kucuk, marginBottom: 8 }}>Açık görevler: {v.gorevler.map((g) => <span key={g.id} style={{ marginRight: 8 }}>{g.ad}{g.due ? ` (${g.due})` : ''} <button type="button" onClick={() => calistir({ adim: 'gorev', gorevId: g.id, durum: 'tamam' })} style={{ ...ghost, padding: '0 6px', fontSize: 10 }}>✓</button></span>)}</div>}

      {sekme === 'Lezyon değerlendirme' && (<div>
        <div style={etiket}>ABCDE + dermoskopi <span style={kucuk}>· tarama aracıdır; tanı histopatoloji ile; melanom şüphesi → acil bayrak + sevk (asistan tanı koymaz)</span></div>
        {!v.lezyonlar.length && <div style={kucuk}>Önce Lezyonlar kartından foto ile lezyon oluşturun (aynı lezyon_id serisi).</div>}
        {v.lezyonlar.length > 0 && (<>
          <div style={satir}><select value={lez?.id || ''} onChange={(e) => set('lezyonId', e.target.value)} style={{ ...toolsInput, width: 'auto' }}>{v.lezyonlar.map((l) => <option key={l.id} value={l.id} style={{ color: '#000' }}>{l.region || '—'} · {l.morphology || 'lezyon'} · {new Date(l.created_at).toLocaleDateString('tr-TR')}{l.acil ? ' ⚠' : ''}</option>)}</select>
            <input value={s('boyut')} onChange={(e) => set('boyut', e.target.value)} placeholder="boyut mm" style={{ ...toolsInput, width: 90 }} />
            {[['asimetri', 'A asimetri'], ['sinir', 'B sınır düzensiz'], ['renk', 'C renk çeşitliliği'], ['cap6mm', 'D çap >6 mm'], ['evrim', 'E evrim/değişim']].map(([k2, ad]) => chk(ad, b(k2), (x) => set(k2, x)))}
            {chk('dermoskopi uyarı (atipik ağ, mavi-beyaz peçe, düzensiz nokta)', b('duy'), (x) => set('duy', x))}{chk('çirkin ördek yavrusu', b('cirkin'), (x) => set('cirkin', x))}
            <input value={s('dnot')} onChange={(e) => set('dnot', e.target.value)} placeholder="dermoskop notu" style={{ ...toolsInput, minWidth: 220 }} />
            <button type="button" disabled={!lez} onClick={() => calistir({ adim: 'lezyon_degerlendir', lezyonId: lez!.id, boyutMm: s('boyut'), abcde: { asimetri: b('asimetri'), sinir: b('sinir'), renk: b('renk'), cap6mm: b('cap6mm'), evrim: b('evrim') }, dermoskopUyari: b('duy'), cirkinOrdek: b('cirkin'), dermoskopNotu: s('dnot') }, 'Lezyon değerlendirildi.')} style={btn}>Değerlendir</button></div>
          {lez?.degerlendirme && <div style={{ fontSize: 12, color: CHROME_RENK.ink, marginTop: 6 }}><span style={{ fontWeight: 800, color: lez.acil ? '#F87171' : '#0F9B8E' }}>{lez.acil ? '⚠ MELANOM ŞÜPHESİ (acil bayrak)' : 'Şüphe yok'}</span> · ABCDE {lez.degerlendirme.abcdePuan}/5{lez.size_mm ? ` · ${lez.size_mm} mm` : ''}{lez.resmi_tani ? ` · Resmi tanı: ${lez.resmi_tani}` : ''}{lez.patoloji_sonuc ? ` · Patoloji: ${lez.patoloji_sonuc}` : ''}<ul style={{ ...kucuk, margin: '4px 0 0', paddingLeft: 18 }}>{lez.degerlendirme.oneri.map((o) => <li key={o}>{o}</li>)}</ul></div>}
          <div style={satir}><select value={s('tani')} onChange={(e) => set('tani', e.target.value)} style={{ ...toolsInput, width: 'auto' }}><option value="">resmi tanı (hekim)</option>{v.kutuphane.taniSecenekleri.map((t) => <option key={t} value={t} style={{ color: '#000' }}>{t}</option>)}</select><button type="button" disabled={!lez || !s('tani')} onClick={() => calistir({ adim: 'lezyon_tani', lezyonId: lez!.id, resmiTani: s('tani') }, 'Resmi tanı kilitlendi.')} style={ghost}>Tanıyı kilitle</button><span style={kucuk}>Görüntü raporu: Belgeler › Asistana raporla (Derm Foundation / Claude).</span></div>
        </>)}
      </div>)}

      {sekme === 'İşlemler' && (<div>
        <div style={etiket}>Biyopsi + küçük cerrahi <span style={kucuk}>· onam şablonu + işlem notu + yara bakımı görevi; patoloji aynı lezyona bağlanır</span></div>
        <div style={satir}><select value={s('itur')} onChange={(e) => set('itur', e.target.value)} style={{ ...toolsInput, width: 'auto' }}><option value="">işlem</option>{v.kutuphane.islemler.map((i) => <option key={i.kod} value={i.kod} style={{ color: '#000' }}>{i.ad}</option>)}</select>
          <select value={s('ilez')} onChange={(e) => set('ilez', e.target.value)} style={{ ...toolsInput, width: 'auto' }}><option value="">lezyon (isteğe bağlı)</option>{v.lezyonlar.map((l) => <option key={l.id} value={l.id} style={{ color: '#000' }}>{l.region || '—'} · {l.morphology || 'lezyon'}</option>)}</select>
          <input type="date" value={s('itarih')} onChange={(e) => set('itarih', e.target.value)} style={{ ...toolsInput, width: 140 }} />{chk('onam alındı (şablon kaydedilir)', b('ionam'), (x) => set('ionam', x))}</div>
        {s('itur') && <div style={satir}>{(v.kutuphane.islemler.find((i) => i.kod === s('itur'))?.notAlanlari || []).map((a) => <input key={a} value={s('n_' + a)} onChange={(e) => set('n_' + a, e.target.value)} placeholder={a} style={{ ...toolsInput, width: 130 }} />)}<button type="button" onClick={() => { const notu: Record<string, string> = {}; for (const a of v.kutuphane.islemler.find((i) => i.kod === s('itur'))?.notAlanlari || []) if (s('n_' + a)) notu[a] = s('n_' + a); calistir({ adim: 'islem', tur: s('itur'), lezyonId: s('ilez') || null, tarih: s('itarih') || undefined, islemNotu: notu, onamKaydet: b('ionam') }, 'İşlem kaydedildi; görevler açıldı.'); }} style={btn}>Kaydet</button></div>}
        {v.islemler.map((i) => <div key={i.id} style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '5px 0', fontSize: 12, color: CHROME_RENK.ink }}><b>{i.tarih}</b> · {v.kutuphane.islemler.find((x) => x.kod === i.tur)?.ad || i.tur}{i.onam_id ? ' · onam ✓' : ''}{i.patoloji_sonuc ? <span style={kucuk}> · patoloji: {i.patoloji_sonuc}</span> : (['punch', 'shave', 'eksizyon'].includes(i.tur) && <span style={satir}><input value={s('pat_' + i.id)} onChange={(e) => set('pat_' + i.id, e.target.value)} placeholder="patoloji sonucu" style={{ ...toolsInput, minWidth: 220 }} /><button type="button" onClick={() => calistir({ adim: 'islem_patoloji', islemId: i.id, patolojiSonuc: s('pat_' + i.id) }, 'Patoloji aynı lezyona bağlandı.')} style={ghost}>Bağla</button></span>)}<div style={kucuk}>Yara bakımı: {i.yara_bakimi.join(' · ')}</div></div>)}
      </div>)}

      {sekme === 'İlaç güvenliği' && (<div>
        <div style={etiket}>İzotretinoin / biyolojik kapıları <span style={kucuk}>· kadın hasta: son 30 gün negatif β-hCG (Lab) + korunma onamı; biyolojik: TB/HBV onaylı labdan</span></div>
        <div style={satir}>{chk('korunma onamı şimdi alındı', b('izonam'), (x) => set('izonam', x))}<button type="button" onClick={() => calistir({ adim: 'izotretinoin_basla', onamKaydet: b('izonam') }, 'İzotretinoin başlangıcı kaydedildi.')} style={btn}>İzotretinoin başlat (hekim)</button>
          <button type="button" onClick={() => calistir({ adim: 'biyolojik_kapisi' }).then((j) => j && setMesaj(`Biyolojik kapısı: ${(j as { kapisi: { hazir: boolean; eksik: string[]; uyari: string[] } }).kapisi.hazir ? 'HAZIR' : 'eksik: ' + (j as { kapisi: { eksik: string[] } }).kapisi.eksik.join(', ')} ${(j as { kapisi: { uyari: string[] } }).kapisi.uyari.join(' | ')}`))} style={ghost}>Biyolojik kapısını kontrol et</button>
          <input value={s('bilac')} onChange={(e) => set('bilac', e.target.value)} placeholder="biyolojik ajan" style={{ ...toolsInput, width: 160 }} /><button type="button" onClick={() => calistir({ adim: 'biyolojik_basla', ilac: s('bilac') || 'biyolojik' }, 'Biyolojik başlangıcı kaydedildi.')} style={btn}>Biyolojik başlat (hekim)</button></div>
        {v.ilacGuvenlik.map((i) => <div key={i.id} style={{ fontSize: 12, color: CHROME_RENK.ink, padding: '4px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>{i.ilac} · başlangıç {i.baslangic || '—'}{i.aylik_due ? ` · aylık β-hCG ${i.aylik_due}` : ''}{i.kapisi?.uyari?.length ? <span style={{ color: '#FBBF24' }}> · {i.kapisi.uyari.join('; ')}</span> : null}</div>)}
        <div style={kucuk}>Onamlar: {v.onamlar.map((o) => `${o.hasta_onayladi ? '✓' : '○'} ${o.sablon_adi}`).join(' · ') || '—'}</div>
      </div>)}

      {sekme === 'Pediatrik' && (<div>
        <div style={etiket}>Pediatrik derm şablonları <span style={kucuk}>· {v.bebekBagli ? 'bebek kartına bağlı — görev pediatriye (Ayşe) düşer' : 'bebek kartı yok; görev bu dosyada kalır'}</span></div>
        <div style={satir}>{v.kutuphane.pediatrik.map((p) => <button key={p.kod} type="button" onClick={() => calistir({ adim: 'pediatrik', sablon: p.kod }, `${p.ad} şablonu uygulandı.`)} style={ghost} title={p.maddeler.join(' · ')}>{p.ad}</button>)}</div>
      </div>)}

      {sekme === 'Kozmetik' && (<div>
        <div style={etiket}>Kozmetik (isteğe bağlı) <span style={kucuk}>· yalnız onam stub'ları; yapay zekâ tanısı yok; tıbbi derm listesinden ayrı</span></div>
        <div style={satir}>{v.kutuphane.onamlar.filter((o) => o.kod.startsWith('derm_kozmetik')).map((o) => <button key={o.kod} type="button" onClick={() => calistir({ adim: 'onam', sablonKodu: o.kod, hastaOnayladi: true }, 'Onam kaydedildi.')} style={ghost}>{o.ad}</button>)}</div>
      </div>)}
    </div>
  );
}
