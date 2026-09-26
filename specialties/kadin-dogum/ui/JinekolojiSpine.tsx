'use client';
/**
 * NOTYA-JINE-01 — Office gynecology spine UI (kadın-doğum only; non-pregnant home).
 * Tabs: Tarama & Görevler | Serviks | CYBH | PCOS | Kontrasepsiyon | Menopoz/HRT | Lezyon | İnfertilite.
 * Every write is a doctor action through /api/doktor/jinekoloji. AI drafts (serviks aksiyonu, ön tanı, PCOS sayacı, HRT ön kontrol) — doctor locks.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { getAccessTokenAsync, toolsCard, toolsInput } from '@/lib/doktor/toolsUi';
import { JinekolojiV2Sekmeler } from './JinekolojiV2Sekmeler';
import { TrTarihAlan } from './TrTarihAlan';
import { JinekolojiWowSekmeler, WOW_SEKME, type WowVeri } from './JinekolojiWowSekmeler';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';
type Due = { kod: string; ad: string; due: string | null; durum: string; not: string; takvim: string };
type Gorev = { id: string; kod: string; ad: string; due: string | null; kaynak: string };
type Serviks = { id: string; tarih: string; pap_sonuc: string | null; hpv: string | null; taslak_aksiyon: { adim: string; sonrakiAy: number | null; guven: number; gerekce: string; kolposkopi: boolean } | null; resmi_plan: string | null; sonraki_due: string | null; hekim_onayladi: boolean; kolposkopi: Record<string, unknown> | null };
type Veri = { kadinSagligi: Record<string, unknown> | null; due: Due[]; serviks: Serviks[]; cybh: { id: string; tarih: string; etkenler: string[]; on_tani: { etken: string | null; guven: number; gerekce: string } | null; partner: { gerekli: boolean } | null; ilk_genital_ulser: boolean }[]; pcos: { kriterler: Record<string, unknown>; dislama: Record<string, boolean>; degerlendirme: { kriterSayisi: number; rotterdamKarsilar: boolean; dislamaTam: boolean; not: string[] } | null; hekim_tanisi: string | null; amenore_gun: number | null } | null; lezyonlar: { id: string; tur: string; boyut_mm: number | null; figo_tip: string | null; yer: string | null; semptom: string | null; sonraki_us: string | null; created_at: string }[]; kontrasepsiyon: { id: string; yontem: string; baslangic: string | null; son_kullanim: string | null; aktif: boolean; ria_notu: { ip_kontrol_tarihi?: string; pid_uyari_bitis?: string } | null }[]; hrt: { hrt_basladi: boolean; hrt_baslangic: string | null; rejim: string | null; degerlendirme: { engeller: string[]; uyarilar: string[]; eksikler: string[] } | null } | null; gorevler: Gorev[]; gebe: boolean; v2?: { aub: Record<string, unknown>[]; kok: Record<string, unknown>[]; endo: Record<string, unknown> | null; rm: Record<string, unknown> | null; egk: Record<string, unknown>[] }; wow?: WowVeri & { kokYillik?: { due: string; maddeler: string[] } | null }; kutuphane: { etkenler: readonly string[]; hrtYillik: string[]; infertilite: string[]; refler?: Record<string, string> } };

const btn: React.CSSProperties = { background: '#0F9B8E', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' };
const ghost: React.CSSProperties = { ...btn, background: 'transparent', color: CHROME_RENK.muted, border: '1px solid rgba(255,255,255,0.15)' };
const etiket: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#0F9B8E', marginBottom: 6 };
const kucuk: React.CSSProperties = { fontSize: 11, color: CHROME_RENK.muted };
const chk = (label: string, v: boolean, on: (x: boolean) => void) => <label key={label} style={{ ...kucuk, display: 'flex', gap: 4, alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 999, padding: '2px 8px', color: v ? '#0F9B8E' : CHROME_RENK.muted }}><input type="checkbox" checked={v} onChange={(e) => on(e.target.checked)} />{label}</label>;
const dueRenk: Record<string, string> = { gecikti: '#F87171', yaklasiyor: '#FBBF24', planli: '#0F9B8E', uygun_degil: CHROME_RENK.muted };
const SEKME = ['Tarama & Görevler', 'Serviks', 'CYBH', 'PCOS', 'Kontrasepsiyon', 'Menopoz / HRT', 'Lezyon', 'İnfertilite', 'AUB / PMP', 'KOK kapısı', 'Endometriozis', 'Tekrarlayan kayıp', 'Erken gebelik kaybı', ...WOW_SEKME] as const;
const YONTEM_SECENEK: Array<[string, string]> = [['ria_cu5', 'Cu RİA 5 yıl'], ['ria_cu10', 'Cu RİA 10 yıl'], ['ria_lng5', 'LNG RİA 5 yıl'], ['ria_lng8', 'LNG RİA 8 yıl'], ['okp', 'OKP'], ['implant', 'İmplant'], ['enjeksiyon', 'Enjeksiyon'], ['kondom', 'Kondom'], ['diger', 'Diğer']];
const YONTEM_AD: Record<string, string> = Object.fromEntries(YONTEM_SECENEK);
const LEZYON_AD: Record<string, string> = { myom: 'Myom', kist: 'Over kisti', polip: 'Polip', diger: 'Diğer' };
const PAP = ['NILM', 'ASC-US', 'ASC-H', 'LSIL', 'HSIL', 'AGC', 'CA', 'yetersiz'], HPV = [['neg', 'Negatif'], ['16', 'HPV 16'], ['18', 'HPV 18'], ['other_hr', 'Diğer HR'], ['low_risk', 'Düşük risk']];

export function JinekolojiSpine({ patientId, ofisModulleri }: { patientId: string; ofisModulleri?: boolean }) {
  const [v, setV] = useState<Veri | null>(null);
  const [sekme, setSekme] = useState<(typeof SEKME)[number]>('Tarama & Görevler');
  const [mesaj, setMesaj] = useState('');
  const [f, setF] = useState<Record<string, unknown>>({});
  const [kaynakAcik, setKaynakAcik] = useState(false); // NOTYA-JINE-02: clinician-only reference toggle
  const s = (k: string) => (f[k] as string) ?? '';
  const b = (k: string) => !!f[k];
  const set = (k: string, x: unknown) => setF((p) => ({ ...p, [k]: x }));

  const api = useCallback(async (body: Record<string, unknown>) => { const token = await getAccessTokenAsync(); const r = await fetch('/api/doktor/jinekoloji', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId, ...body }) }); const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || 'Hata'); return j; }, [patientId]);
  const yukle = useCallback(async () => { const token = await getAccessTokenAsync(); const r = await fetch(`/api/doktor/jinekoloji?patientId=${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }); if (r.ok) setV(await r.json()); }, [patientId]);
  useEffect(() => { yukle(); }, [yukle]);
  const calistir = async (body: Record<string, unknown>, ok?: string) => { setMesaj(''); try { const j = await api(body); setMesaj(ok || 'Kaydedildi.'); await yukle(); return j; } catch (e) { setMesaj(e instanceof Error ? e.message : 'Hata'); return null; } };

  if (!v) return <div style={{ ...toolsCard, color: CHROME_RENK.muted, fontSize: 12 }}>Jinekoloji yükleniyor…</div>;
  const ks = v.kadinSagligi || {};

  return (
    <div style={{ ...toolsCard, marginBottom: 12 }} data-chapter="jinekoloji-spine">
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>{SEKME.map((x) => <button key={x} type="button" onClick={() => setSekme(x)} style={{ ...ghost, background: sekme === x ? 'rgba(15,155,142,0.2)' : 'transparent', color: sekme === x ? '#0F9B8E' : CHROME_RENK.muted, borderRadius: 999 }}>{x}{x === 'Tarama & Görevler' && v.due.some((d) => d.durum === 'gecikti') ? ' ⚠' : ''}</button>)}</div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -4, marginBottom: 6 }}><button type="button" onClick={() => setKaynakAcik(!kaynakAcik)} style={{ ...ghost, padding: '2px 8px', fontSize: 10, color: kaynakAcik ? '#0F9B8E' : CHROME_RENK.muted }}>{kaynakAcik ? 'Kaynak: açık (yalnız hekim)' : 'Kaynak'}</button></div>
      {v.gebe && <div style={{ ...kucuk, color: '#FBBF24', marginBottom: 6 }}>Aktif gebelik var — gebelik akışı Doğum panelinde; burada yalnız gebelik dışı ofis jinekolojisi.</div>}
      {mesaj && <div style={{ fontSize: 12, color: /amadı|gerek|geçersiz|Hata|engel|onaylanmalı/.test(mesaj) ? '#F87171' : '#0F9B8E', marginBottom: 8 }}>{mesaj}</div>}

      {sekme === 'Tarama & Görevler' && (<div>
        <div style={etiket}>Tarama takvimi <span style={kucuk}>· SB (KETEM) + ofis; yaşa göre motor hesaplar</span></div>
        {v.due.map((d) => <div key={d.kod} style={{ display: 'flex', gap: 8, padding: '4px 0', fontSize: 12, color: CHROME_RENK.ink, borderTop: '1px solid rgba(255,255,255,0.06)' }}><span style={{ minWidth: 90, color: dueRenk[d.durum], fontWeight: 800 }}>{d.durum === 'gecikti' ? '✖ gecikti' : d.durum === 'yaklasiyor' ? '● yaklaşıyor' : d.durum === 'planli' ? '○ planlı' : '— uygun değil'}</span><span style={{ flex: 1 }}>{d.ad} <span style={kucuk}>{d.due ? `· ${d.due}` : ''} · {d.takvim} · {d.not}</span></span></div>)}
        <div style={{ ...etiket, marginTop: 10 }}>Son tarama tarihleri (düzenle)</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {[['son_pap', 'Son Pap'], ['son_hpv', 'Son HPV'], ['son_mamografi', 'Son mamografi'], ['son_dxa', 'Son DXA'], ['son_kolorektal', 'Son GGK']].map(([k, ad]) => <div key={k} style={{ width: 160 }}><TrTarihAlan label={ad} value={String(ks[k] || s(k))} onChange={(iso) => { set(k, iso); if (iso !== String(ks[k] || '')) calistir({ adim: 'kadin_sagligi', alanlar: { [k]: iso } }); }} /></div>)}
          {chk('Histerektomi (serviks taraması yok)', !!ks.histerektomi, (x) => calistir({ adim: 'kadin_sagligi', alanlar: { histerektomi: x } }))}
        </div>
        <div style={{ ...etiket, marginTop: 10 }}>Açık görevler ({v.gorevler.length})</div>
        {!v.gorevler.length && <div style={kucuk}>Açık görev yok.</div>}
        {v.gorevler.map((g) => <div key={g.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '3px 0', fontSize: 12, color: CHROME_RENK.ink }}><span style={{ flex: 1 }}>{g.ad} <span style={kucuk}>{g.due ? `· ${g.due}` : ''} · {g.kaynak}</span></span><button type="button" onClick={() => calistir({ adim: 'gorev', gorevId: g.id, durum: 'tamam' })} style={{ ...ghost, padding: '2px 8px', fontSize: 11 }}>Tamam</button></div>)}
        {!ofisModulleri && <><div style={{ ...etiket, marginTop: 10 }}>Yıllık kontrol kaydı</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ width: 160 }}><TrTarihAlan label="Jine SAT" value={s('lmp')} onChange={(iso) => set('lmp', iso)} /></div>
          <input value={s('gp')} onChange={(e) => set('gp', e.target.value)} placeholder="G/P" style={{ ...toolsInput, width: 70 }} />
          <input value={s('tvus_et')} onChange={(e) => set('tvus_et', e.target.value)} placeholder="TVUS ET mm" style={{ ...toolsInput, width: 110 }} />
          <input value={s('bulgu')} onChange={(e) => set('bulgu', e.target.value)} placeholder="Spekulum / bimanuel / meme" style={{ ...toolsInput, minWidth: 220 }} />
          {chk('β-hCG +', b('k_bhcg'), (x) => set('k_bhcg', x))}{chk('ağrı', b('k_agri'), (x) => set('k_agri', x))}{chk('kanama', b('k_kanama'), (x) => set('k_kanama', x))}{chk('ateş', b('k_ates'), (x) => set('k_ates', x))}{chk('servikal hassasiyet', b('k_sh'), (x) => set('k_sh', x))}{chk('postmenopozal kanama', b('k_pmp'), (x) => set('k_pmp', x))}
          {chk('şiddet riski (soruldu/evet)', b('siddet'), (x) => set('siddet', x))}
          <button type="button" onClick={() => calistir({ adim: 'vizit', tur: 'yillik', alanlar: { lmp: s('lmp') || null, gravida_para: s('gp') || null, tvus_et_mm: s('tvus_et') || null, spekulum: s('bulgu') || null, kirmizi: { bhcgPozitif: b('k_bhcg'), agri: b('k_agri'), kanama: b('k_kanama'), ates: b('k_ates'), servikalHassasiyet: b('k_sh'), postmenopozKanama: b('k_pmp') } } }, 'Kontrol kaydedildi; kırmızı bayraklar görevlere düştü.')} style={btn}>Kaydet</button>
          {b('siddet') && <button type="button" onClick={() => calistir({ adim: 'siddet', evet: true }, 'Şiddet sevk görevleri açıldı.')} style={ghost}>Şiddet yolunu aç</button>}
        </div></>}
      </div>)}
      {sekme === 'Serviks' && (<div>
        <div style={etiket}>Serviks tarama sonucu <span style={kucuk}>· HSGM/ASCCP ağacı taslak yazar, planı hekim kilitler</span></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ width: 160 }}><TrTarihAlan label="Tarih" value={s('sv_tarih')} onChange={(iso) => set('sv_tarih', iso)} /></div>
          <select value={s('pap')} onChange={(e) => set('pap', e.target.value)} style={{ ...toolsInput, width: 'auto' }}><option value="">Pap</option>{PAP.map((p) => <option key={p} value={p} style={{ color: '#000' }}>{p}</option>)}</select>
          <select value={s('hpv')} onChange={(e) => set('hpv', e.target.value)} style={{ ...toolsInput, width: 'auto' }}><option value="">HPV</option>{HPV.map(([k, a]) => <option key={k} value={k} style={{ color: '#000' }}>{a}</option>)}</select>
          <button type="button" onClick={() => calistir({ adim: 'serviks', tarih: s('sv_tarih') || undefined, pap: s('pap') || null, hpv: s('hpv') || null }, 'Sonuç kaydedildi; taslak aksiyon üretildi.')} style={btn}>Kaydet</button>
        </div>
        {v.serviks.map((k) => <div key={k.id} style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '6px 0', fontSize: 12, color: CHROME_RENK.ink }}>
          <div><b>{k.tarih}</b> · Pap {k.pap_sonuc || '—'} · HPV {k.hpv || '—'}{k.taslak_aksiyon && <span style={kucuk}> · taslak: {k.taslak_aksiyon.adim} (%{k.taslak_aksiyon.guven}, {k.taslak_aksiyon.gerekce}){k.taslak_aksiyon.kolposkopi ? ' · kolposkopi görevi' : ''}</span>}</div>
          {k.hekim_onayladi ? <div style={{ ...kucuk, color: '#0F9B8E' }}>✓ Resmi plan (hekim): {k.resmi_plan}{k.sonraki_due ? ` · sonraki ${k.sonraki_due}` : ''}</div> : <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}><input value={s('rp_' + k.id) || k.taslak_aksiyon?.adim || ''} onChange={(e) => set('rp_' + k.id, e.target.value)} style={{ ...toolsInput, minWidth: 260 }} /><div style={{ width: 160 }}><TrTarihAlan label="Sonraki" value={s('rd_' + k.id) || k.sonraki_due || ''} onChange={(iso) => set('rd_' + k.id, iso)} /></div><button type="button" onClick={() => calistir({ adim: 'serviks_onayla', kayitId: k.id, resmiPlan: s('rp_' + k.id) || k.taslak_aksiyon?.adim, sonrakiDue: s('rd_' + k.id) || k.sonraki_due }, 'Plan kilitlendi.')} style={btn}>Planı kilitle</button></div>}
          {k.taslak_aksiyon?.kolposkopi && !k.kolposkopi && <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}><input value={s('kb_' + k.id)} onChange={(e) => set('kb_' + k.id, e.target.value)} placeholder="Kolposkopi bulgu / biyopsi sonucu (CIN?)" style={{ ...toolsInput, minWidth: 260 }} /><button type="button" onClick={() => calistir({ adim: 'kolposkopi', kayitId: k.id, veri: { tarih: new Date().toISOString().slice(0, 10), bulgu: s('kb_' + k.id) } })} style={ghost}>Kolposkopi kaydet</button></div>}
          {k.kolposkopi && <div style={kucuk}>Kolposkopi: {String(k.kolposkopi.bulgu || '')} ({String(k.kolposkopi.tarih || '')})</div>}
        </div>)}
      </div>)}

      {sekme === 'CYBH' && (<div>
        <div style={etiket}>Akıntı / CYBH episodu <span style={kucuk}>· ofis bulgularından ön tanı; partner kuralı; ilk ülserde HIV/RPR kontrol listesi</span></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={s('ph')} onChange={(e) => set('ph', e.target.value)} placeholder="pH" style={{ ...toolsInput, width: 60 }} />
          {chk('whiff +', b('whiff'), (x) => set('whiff', x))}{chk('clue cell', b('clue'), (x) => set('clue', x))}{chk('hif/spor', b('hif'), (x) => set('hif', x))}{chk('hareketli trichomonas', b('trich'), (x) => set('trich', x))}{chk('ilk genital ülser', b('ulser'), (x) => set('ulser', x))}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>{v.kutuphane.etkenler.map((e) => chk(e, ((f.etk as string[]) || []).includes(e), (x) => set('etk', x ? [...((f.etk as string[]) || []), e] : ((f.etk as string[]) || []).filter((y) => y !== e))))}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 }}>
          <select value={s('hsvTip')} onChange={(e) => set('hsvTip', e.target.value)} style={{ ...toolsInput, width: 'auto' }}><option value="">HSV kartı yok</option><option value="hsv1" style={{ color: '#000' }}>HSV-1</option><option value="hsv2" style={{ color: '#000' }}>HSV-2</option></select>
          {s('hsvTip') && <><input value={s('atakYil')} onChange={(e) => set('atakYil', e.target.value)} placeholder="atak/yıl" style={{ ...toolsInput, width: 80 }} />{chk('ilk atak', b('ilkAtak'), (x) => set('ilkAtak', x))}</>}
          <button type="button" onClick={() => calistir({ adim: 'cybh', sikayet: { ph: s('ph'), whiff: b('whiff'), clue_cell: b('clue'), hif: b('hif'), trichomonas: b('trich') }, etkenler: f.etk || [], ilkGenitalUlser: b('ulser'), hsv: s('hsvTip') ? { tip: s('hsvTip'), ilkAtak: b('ilkAtak'), atakYil: Number(s('atakYil')) || 0, supresyon: false } : null }, 'Episod kaydedildi; görevler oluştu.')} style={btn}>Kaydet</button>
          <button type="button" onClick={() => { setSekme('CYBH tedavi'); set('etk', f.etk || []); }} style={ghost}>Tedavi motoruna geç →</button>
        </div>
        {v.cybh.map((c) => <div key={c.id} style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '5px 0', fontSize: 12, color: CHROME_RENK.ink }}><b>{c.tarih}</b> · {c.etkenler.join(', ') || '—'}{c.on_tani?.etken ? <span style={kucuk}> · ön tanı: {c.on_tani.etken} (%{c.on_tani.guven})</span> : null}{c.partner?.gerekli ? <span style={{ color: '#FBBF24' }}> · partner tedavisi</span> : null}{c.ilk_genital_ulser ? <span style={{ color: '#F87171' }}> · ilk ülser: HIV/RPR</span> : null}</div>)}
      </div>)}

      {sekme === 'PCOS' && (<div>
        <div style={etiket}>PCOS (Rotterdam, TJOD 2023) <span style={kucuk}>· sayaç taslak; tanıyı hekim koyar; menarş ilk yılında tanı yok</span></div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{chk('oligo/anovülasyon', b('oa'), (x) => set('oa', x))}{chk('hiperandrojenizm (klinik/biyokimyasal)', b('ha'), (x) => set('ha', x))}{chk('PCOM US', b('pcom'), (x) => set('pcom', x))}{chk('TSH bakıldı', b('tsh'), (x) => set('tsh', x))}{chk('PRL bakıldı', b('prl'), (x) => set('prl', x))}{chk('17-OHP bakıldı', b('ohp'), (x) => set('ohp', x))}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 }}>
          <input value={s('menars')} onChange={(e) => set('menars', e.target.value)} placeholder="menarştan beri yıl" style={{ ...toolsInput, width: 150 }} />
          <input value={s('amenore')} onChange={(e) => set('amenore', e.target.value)} placeholder="amenore gün" style={{ ...toolsInput, width: 110 }} />
          <input value={s('pcosTani')} onChange={(e) => set('pcosTani', e.target.value)} placeholder="Hekim tanısı (isteğe bağlı)" style={{ ...toolsInput, minWidth: 200 }} />
          <button type="button" onClick={() => calistir({ adim: 'pcos', kriterler: { oligoAnovulasyon: b('oa'), hiperandrojenizm: b('ha'), pcomUs: b('pcom'), menarsYil: s('menars') || null }, dislama: { tsh: b('tsh'), prl: b('prl'), ohp17: b('ohp') }, amenoreGun: s('amenore') || null, hekimTanisi: s('pcosTani') || null }, 'PCOS kartı güncellendi.')} style={btn}>Değerlendir</button>
        </div>
        {v.pcos?.degerlendirme && <div style={{ fontSize: 12, color: CHROME_RENK.ink, marginTop: 6 }}>Kriter: {v.pcos.degerlendirme.kriterSayisi}/3 · Rotterdam {v.pcos.degerlendirme.rotterdamKarsilar ? 'karşılanıyor (hekim kararı)' : 'karşılanmıyor / eksik'} · dışlama {v.pcos.degerlendirme.dislamaTam ? 'tam' : 'eksik'}{v.pcos.hekim_tanisi ? ` · Hekim tanısı: ${v.pcos.hekim_tanisi}` : ''}<ul style={{ ...kucuk, margin: '4px 0 0', paddingLeft: 18 }}>{v.pcos.degerlendirme.not.map((n) => <li key={n}>{n}</li>)}</ul></div>}
      </div>)}

      {sekme === 'Kontrasepsiyon' && (<div>
        <div style={etiket}>Kontrasepsiyon <span style={kucuk}>· RİA: CYBH taraması onayı zorunlu; ip kontrolü 4–6 hf; son kullanım görevi</span></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={s('yontem')} onChange={(e) => set('yontem', e.target.value)} style={{ ...toolsInput, width: 'auto' }}><option value="">yöntem</option>{YONTEM_SECENEK.map(([k, a]) => <option key={k} value={k} style={{ color: '#000' }}>{a}</option>)}</select>
          <div style={{ width: 160 }}><TrTarihAlan label="Başlangıç" value={s('kb')} onChange={(iso) => set('kb', iso)} /></div>
          {s('yontem').startsWith('ria_') && chk('CYBH taraması (klamidya/gonore) yapıldı', b('sti'), (x) => set('sti', x))}
          <button type="button" disabled={!s('yontem')} onClick={() => calistir({ adim: 'kontrasepsiyon', yontem: s('yontem'), baslangic: s('kb') || undefined, stiTaramaOnaylandi: b('sti') })} style={btn}>Kaydet</button>
        </div>
        {v.kontrasepsiyon.map((k) => <div key={k.id} style={{ fontSize: 12, color: k.aktif ? CHROME_RENK.ink : CHROME_RENK.muted, padding: '4px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>{k.aktif ? '● ' : '○ '}{YONTEM_AD[k.yontem] ?? k.yontem} <span style={kucuk}>{k.baslangic || ''}{k.son_kullanim ? ` → ${k.son_kullanim}` : ''}{k.ria_notu?.ip_kontrol_tarihi ? ` · ip kontrol ${k.ria_notu.ip_kontrol_tarihi} · PID uyarı ${k.ria_notu.pid_uyari_bitis}` : ''}</span></div>)}
      </div>)}

      {sekme === 'Menopoz / HRT' && (<div>
        <div style={etiket}>HRT ön kontrol <span style={kucuk}>· engel varsa başlatılamaz; başlangıç hekim kararı; yıllık güvenlik görevi</span></div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{chk('son 12 ay mamografi', b('mg12'), (x) => set('mg12', x))}{chk('VTE öyküsü', b('vte'), (x) => set('vte', x))}{chk('meme Ca öyküsü', b('mca'), (x) => set('mca', x))}{chk('tanısız kanama', b('tk'), (x) => set('tk', x))}{chk('aktif karaciğer hastalığı', b('kc'), (x) => set('kc', x))}{chk('sigara', b('sig'), (x) => set('sig', x))}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 }}>
          <input value={s('et')} onChange={(e) => set('et', e.target.value)} placeholder="TVUS ET mm" style={{ ...toolsInput, width: 110 }} />
          <input value={s('mpy')} onChange={(e) => set('mpy', e.target.value)} placeholder="menopozdan beri yıl" style={{ ...toolsInput, width: 150 }} />
          <input value={s('rejim')} onChange={(e) => set('rejim', e.target.value)} placeholder="rejim (hekim)" style={{ ...toolsInput, minWidth: 160 }} />
          <button type="button" onClick={() => calistir({ adim: 'hrt', onKontrol: { mamografi12Ay: b('mg12'), vteOykusu: b('vte'), memeCa: b('mca'), tanisizKanama: b('tk'), karacigerHastaligi: b('kc'), sigara: b('sig'), tvusEt: s('et') || null, menopozYil: s('mpy') || null }, hrtBasladi: false }, 'Ön kontrol kaydedildi.')} style={ghost}>Ön kontrol</button>
          <button type="button" onClick={() => calistir({ adim: 'hrt', onKontrol: { mamografi12Ay: b('mg12'), vteOykusu: b('vte'), memeCa: b('mca'), tanisizKanama: b('tk'), karacigerHastaligi: b('kc'), sigara: b('sig'), tvusEt: s('et') || null, menopozYil: s('mpy') || null }, hrtBasladi: true, rejim: s('rejim') }, 'HRT başlangıcı kaydedildi; yıllık kontrol görevi açıldı.')} style={btn}>HRT başlat (hekim kararı)</button>
        </div>
        {v.hrt?.degerlendirme && <div style={{ fontSize: 12, marginTop: 6 }}>{v.hrt.degerlendirme.engeller.map((e) => <div key={e} style={{ color: '#F87171' }}>✖ {e}</div>)}{v.hrt.degerlendirme.uyarilar.map((e) => <div key={e} style={{ color: '#FBBF24' }}>⚠ {e}</div>)}{v.hrt.degerlendirme.eksikler.map((e) => <div key={e} style={{ color: CHROME_RENK.muted }}>○ eksik: {e}</div>)}{v.hrt.hrt_basladi && <div style={{ color: '#0F9B8E' }}>✓ HRT {v.hrt.hrt_baslangic}{v.hrt.rejim ? ` · ${v.hrt.rejim}` : ''} · yıllık: {v.kutuphane.hrtYillik.join(', ')}</div>}</div>}
      </div>)}

      {sekme === 'Lezyon' && (<div>
        <div style={etiket}>Myom / kist / polip notu <span style={kucuk}>· boyut, FIGO tipi, sonraki US görevi</span></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={s('lt')} onChange={(e) => set('lt', e.target.value)} style={{ ...toolsInput, width: 'auto' }}>{[['myom', 'Myom'], ['kist', 'Over kisti'], ['polip', 'Polip'], ['diger', 'Diğer']].map(([k, a]) => <option key={k} value={k} style={{ color: '#000' }}>{a}</option>)}</select>
          <input value={s('lb')} onChange={(e) => set('lb', e.target.value)} placeholder="boyut mm" style={{ ...toolsInput, width: 90 }} />
          <input value={s('lf')} onChange={(e) => set('lf', e.target.value)} placeholder="FIGO tip / yer" style={{ ...toolsInput, width: 130 }} />
          <input value={s('ls')} onChange={(e) => set('ls', e.target.value)} placeholder="semptom" style={{ ...toolsInput, minWidth: 160 }} />
          <div style={{ width: 160 }}><TrTarihAlan label="Sonraki US" value={s('lu')} onChange={(iso) => set('lu', iso)} /></div>
          <button type="button" onClick={() => calistir({ adim: 'lezyon', tur: s('lt') || 'myom', boyutMm: s('lb') || null, figoTip: s('lf') || null, semptom: s('ls') || null, sonrakiUs: s('lu') || null })} style={btn}>Kaydet</button>
        </div>
        {v.lezyonlar.map((l) => <div key={l.id} style={{ fontSize: 12, color: CHROME_RENK.ink, padding: '4px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>{LEZYON_AD[l.tur] ?? l.tur} {l.boyut_mm ? `${l.boyut_mm} mm` : ''} {l.figo_tip || l.yer || ''} <span style={kucuk}>{l.semptom || ''}{l.sonraki_us ? ` · kontrol US ${l.sonraki_us}` : ''} · {new Date(l.created_at).toLocaleDateString('tr-TR')}</span></div>)}
        <div style={{ ...kucuk, marginTop: 6 }}>Ektopik ve D&C: onam kütüphanesinde (Doğum paneli › Onam); β-hCG serisi Lab ile izlenir.</div>
      </div>)}

      {sekme === 'İnfertilite' && (<div>
        <div style={etiket}>İnfertilite — 1. basamak <span style={kucuk}>· Notya sevkte durur; IVF laboratuvarı kapsam dışı</span></div>
        <ol style={{ fontSize: 12, color: CHROME_RENK.ink, margin: 0, paddingLeft: 18 }}>{v.kutuphane.infertilite.map((a) => <li key={a}>{a}</li>)}</ol>
      </div>)}
      {/* NOTYA-JINE-02 */}
      <JinekolojiV2Sekmeler sekme={sekme} v2={v.v2 || { aub: [], kok: [], endo: null, rm: null, egk: [] }} refler={v.kutuphane.refler || {}} calistir={calistir} kaynakAcik={kaynakAcik} />
      {/* NOTYA-JINE-04 / KD-05 */}
      <JinekolojiWowSekmeler sekme={sekme} wow={v.wow || {}} calistir={calistir} kaynakAcik={kaynakAcik} etkenler={v.kutuphane.etkenler} />
    </div>
  );
}
