'use client';
/**
 * NOTYA-KD-02 — Obstetrics spine UI (kadın-doğum only). Tabs: Takip (görevler) | Onam | Travay | Doğum | Lohusa & Taburcu | Bebek.
 * Every write is a doctor action through /api/doktor/gebelik/dogum. Apple-simple: one card per stage, no drug orders.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { getAccessTokenAsync, toolsCard, toolsInput } from '@/lib/doktor/toolsUi';
import { PARTOGRAF_ALANLARI, ANNE_KOMPLIKASYONLARI, BEBEK_KOMPLIKASYONLARI, ERKEK_BEBEK_EK, pretermOnerileri } from '../engines/dogum-spine';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

type Gorev = { id: string; kod: string; ad: string; tur: string; hedef_baslangic: string; hedef_bitis: string; sert: boolean; kacirilinca: string | null; durum: string; not_metni: string | null };
type Onam = { id: string; sablon_kodu: string; sablon_adi: string; ek_kutu_isaretli: boolean; hasta_onayladi: boolean; onay_at: string | null; created_at: string };
type Dogum = { id: string; durum: string; travay_baslangic: string | null; cs_karar_at: string | null; cs_endikasyon: string[]; fetal_distres: Record<string, unknown> | null; dogum_sekli: string | null; dogum_zamani: string | null; preop: Record<string, unknown> | null; intraop: Record<string, unknown> | null; postop: Record<string, Record<string, unknown>> | null; ssvd: Record<string, unknown> | null; preterm: Record<string, unknown> | null; pph: Record<string, unknown> | null; canli_dogum: boolean | null; lohusa: { ziyaretler?: { kod: string; ad: string; tarih: string; not: string | null }[] } | null };
type Bebek = { id: string; sira: number; cinsiyet: string | null; kilo_gram: number | null; apgar1: number | null; apgar5: number | null; gebelik_haftasi: number | null; canli: boolean; yenidogan_tarama: Record<string, unknown>; gorevler: { kod: string; ad: string; sahip: string; tamam?: boolean }[]; komplikasyonlar: string[]; bebek_patient_id: string | null };
type Taburcu = { id: string; bebek_id: string | null; maddeler: Record<string, boolean>; istisna: { tur: string; aciklama: string } | null; kapatildi: boolean };
type Veri = { gebelik: { id: string; sat: string | null; tdt: string | null; kan_grubu: string | null; durum: string }; gorevler: Gorev[]; onamlar: Onam[]; dogum: Dogum | null; partograf: Record<string, unknown>[]; partografUyarisi: { uyari: string | null; aksiyon: string | null } | null; komplikasyonlar: { id: string; kime: string; ad: string; ayrinti: string | null; acil: boolean; zaman: string }[]; bebekler: Bebek[]; taburcu: Taburcu[]; kutuphane: { onam: { kod: string; ad: string; olay: string; ekKutu: string | null }[]; csEndikasyon: string[]; lohusa: { kod: string; ad: string; gunBas: number; gunBit: number }[] } };

const btn: React.CSSProperties = { background: '#0F9B8E', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' };
const ghost: React.CSSProperties = { ...btn, background: 'transparent', color: CHROME_RENK.muted, border: '1px solid rgba(255,255,255,0.15)' };
const etiket: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#0F9B8E', marginBottom: 6 };
const kucuk: React.CSSProperties = { fontSize: 11, color: CHROME_RENK.muted };
const durumRenk: Record<string, string> = { bekliyor: CHROME_RENK.muted, pencerede: '#FBBF24', kacirildi: '#F87171', tamam: '#0F9B8E', atlandi: '#94A3B8' };
const SEKME = ['Takip', 'Onam', 'Travay', 'Doğum', 'Lohusa & Taburcu', 'Bebek'] as const;
const TABURCU_MADDELERI: [string, string, boolean][] = [['ntp1', 'NTP-1 topuk kanı', true], ['hepb1', 'Hepatit B 1. doz', true], ['vitk', 'K vitamini', true], ['isitme', 'İşitme taraması', true], ['ntp2_randevu', 'NTP-2 randevusu (ASM 3–5 g)', false], ['pulseox', 'Pulse oksimetre', false], ['kirmizi_refleks', 'Kırmızı refleks', false], ['gkd', 'GKD → kalça US planı', false], ['dvit', 'D vitamini 3 damla', false], ['emzirme', 'Emzirme danışmanlığı', false]];

export function DogumSpine({ gebelikId, patientId }: { gebelikId: string; patientId: string }) {
  const [v, setV] = useState<Veri | null>(null);
  const [sekme, setSekme] = useState<(typeof SEKME)[number]>('Takip');
  const [mesaj, setMesaj] = useState('');
  const [form, setForm] = useState<Record<string, unknown>>({});

  const api = useCallback(async (body: Record<string, unknown>) => {
    const token = await getAccessTokenAsync();
    const r = await fetch('/api/doktor/gebelik/dogum', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || 'Hata');
    return j;
  }, []);
  const yukle = useCallback(async () => {
    const token = await getAccessTokenAsync();
    const r = await fetch(`/api/doktor/gebelik/dogum?gebelikId=${encodeURIComponent(gebelikId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if (r.ok) setV(await r.json());
  }, [gebelikId]);
  useEffect(() => { yukle(); }, [yukle]);
  const calistir = async (body: Record<string, unknown>, ok?: string) => { setMesaj(''); try { const j = await api(body); setMesaj(ok || 'Kaydedildi.'); await yukle(); return j; } catch (e) { setMesaj(e instanceof Error ? e.message : 'Hata'); return null; } };
  const f = (k: string) => (form[k] as string) ?? '';
  const set = (k: string, val: unknown) => setForm((x) => ({ ...x, [k]: val }));

  if (!v) return <div style={{ ...toolsCard, color: CHROME_RENK.muted, fontSize: 12 }}>Doğum spine yükleniyor…</div>;
  const d = v.dogum;
  const haftaTahmini = v.gebelik.sat ? Math.floor((Date.now() - new Date(v.gebelik.sat).getTime()) / (7 * 864e5)) : 0;

  return (
    <div style={{ ...toolsCard, marginBottom: 12 }} data-chapter="kadin-dogum-spine">
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {SEKME.map((s) => <button key={s} type="button" onClick={() => setSekme(s)} style={{ ...ghost, background: sekme === s ? 'rgba(15,155,142,0.2)' : 'transparent', color: sekme === s ? '#0F9B8E' : CHROME_RENK.muted, borderRadius: 999 }}>{s}{s === 'Takip' && v.gorevler.some((g) => g.durum === 'kacirildi') ? ' ⚠' : ''}{s === 'Bebek' && v.bebekler.length ? ` (${v.bebekler.length})` : ''}</button>)}
      </div>
      {mesaj && <div style={{ fontSize: 12, color: /amadı|gerek|geçersiz|Hata/.test(mesaj) ? '#F87171' : '#0F9B8E', marginBottom: 8 }}>{mesaj}</div>}

      {sekme === 'Takip' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <div style={etiket}>Gebelik görevleri <span style={kucuk}>· SAT {v.gebelik.sat || '—'} · TDT {v.gebelik.tdt || '—'} · ~{haftaTahmini} hf · Rh {v.gebelik.kan_grubu || '?'}</span></div>
            <button type="button" onClick={() => calistir({ adim: 'gorevleri_olustur', gebelikId }, 'Görevler oluşturuldu (mevcutlar korundu).')} style={ghost}>{v.gorevler.length ? 'Eksik görevleri tamamla' : 'Görevleri oluştur'}</button>
          </div>
          {!v.gorevler.length && <div style={kucuk}>Henüz görev yok. SAT/TDT girildiyse "Görevleri oluştur" ile Acıbadem/SB kadansı üretilir (ikili tarama ve GDM sert hatırlatmadır).</div>}
          {v.gorevler.map((g) => (
            <div key={g.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.06)', background: g.durum === 'kacirildi' && g.sert ? 'rgba(248,113,113,0.06)' : 'transparent' }}>
              <span style={{ minWidth: 84, fontSize: 11, fontWeight: 800, color: durumRenk[g.durum] }}>{g.durum === 'pencerede' ? '● pencerede' : g.durum === 'kacirildi' ? '✖ kaçırıldı' : g.durum === 'tamam' ? '✓ tamam' : g.durum === 'atlandi' ? '— atlandı' : '○ bekliyor'}</span>
              <div style={{ flex: 1, fontSize: 12, color: CHROME_RENK.ink }}>
                <div style={{ fontWeight: g.sert ? 800 : 500 }}>{g.ad} <span style={kucuk}>{g.hedef_baslangic} → {g.hedef_bitis}</span></div>
                {g.durum === 'kacirildi' && g.kacirilinca && <div style={{ fontSize: 11, color: '#F87171' }}>{g.kacirilinca}</div>}
                {g.not_metni && <div style={kucuk}>{g.not_metni}</div>}
              </div>
              {g.durum !== 'tamam' && <button type="button" onClick={() => calistir({ adim: 'gorev', gorevId: g.id, durum: 'tamam' })} style={{ ...ghost, padding: '3px 8px', fontSize: 11 }}>Tamam</button>}
              {g.durum !== 'tamam' && g.durum !== 'atlandi' && <button type="button" onClick={() => calistir({ adim: 'gorev', gorevId: g.id, durum: 'atlandi', not: 'hekim atladı' })} style={{ ...ghost, padding: '3px 8px', fontSize: 11 }}>Atla</button>}
              {g.durum === 'tamam' && <button type="button" onClick={() => calistir({ adim: 'gorev', gorevId: g.id, durum: 'bekliyor' })} style={{ ...ghost, padding: '3px 8px', fontSize: 11 }}>Geri al</button>}
            </div>
          ))}
          <div style={{ ...kucuk, marginTop: 8 }}>Her sonuç bir lab/US belgesidir → Belgeler › Asistana raporla → hekim Onayla. Tarama pozitif ≠ tanı.</div>
        </div>
      )}

      {sekme === 'Onam' && (
        <div>
          <div style={etiket}>Onam kütüphanesi <span style={kucuk}>· V1: yazdır + kutucuk; e-imza sonra</span></div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={f('onamKod')} onChange={(e) => set('onamKod', e.target.value)} style={{ ...toolsInput, width: 'auto' }}><option value="">Şablon seçin</option>{v.kutuphane.onam.map((o) => <option key={o.kod} value={o.kod} style={{ color: '#000' }}>{o.ad}</option>)}</select>
            {v.kutuphane.onam.find((o) => o.kod === f('onamKod'))?.ekKutu && <label style={{ ...kucuk, display: 'flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={!!form.ekKutu} onChange={(e) => set('ekKutu', e.target.checked)} />{v.kutuphane.onam.find((o) => o.kod === f('onamKod'))?.ekKutu}</label>}
            <label style={{ ...kucuk, display: 'flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={!!form.hastaOnayladi} onChange={(e) => set('hastaOnayladi', e.target.checked)} />Hasta okudu ve onayladı (imza kâğıtta)</label>
            <button type="button" disabled={!f('onamKod')} onClick={() => calistir({ adim: 'onam', gebelikId, sablonKodu: f('onamKod'), ekKutu: !!form.ekKutu, hastaOnayladi: !!form.hastaOnayladi }, 'Onam kaydedildi.')} style={btn}>Kaydet</button>
            {f('onamKod') && <a href={`/dashboard/doktor/onam/yazdir?kod=${encodeURIComponent(f('onamKod'))}&patientId=${encodeURIComponent(patientId)}`} target="_blank" rel="noreferrer" style={{ ...ghost, textDecoration: 'none' }}>Yazdır / PDF</a>}
          </div>
          {v.onamlar.map((o) => <div key={o.id} style={{ fontSize: 12, color: CHROME_RENK.ink, padding: '5px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>{o.hasta_onayladi ? '✓' : '○'} {o.sablon_adi}{o.ek_kutu_isaretli ? ' · ek kutu işaretli' : ''} <span style={kucuk}>{new Date(o.onay_at || o.created_at).toLocaleDateString('tr-TR')}</span></div>)}
        </div>
      )}

      {sekme === 'Travay' && (
        <div>
          {!d && <button type="button" onClick={() => calistir({ adim: 'dogum_baslat', gebelikId }, 'Travay açıldı.')} style={btn}>Travayı başlat</button>}
          {d && (
            <>
              <div style={etiket}>Partograf (WHO modifiye) <span style={kucuk}>· {d.travay_baslangic ? `başlangıç ${new Date(d.travay_baslangic).toLocaleString('tr-TR')}` : ''}</span></div>
              {v.partografUyarisi?.aksiyon && <div style={{ fontSize: 12, color: '#F87171', fontWeight: 800, marginBottom: 6 }}>⚠ {v.partografUyarisi.aksiyon}</div>}
              {v.partografUyarisi?.uyari && !v.partografUyarisi.aksiyon && <div style={{ fontSize: 12, color: '#FBBF24', fontWeight: 700, marginBottom: 6 }}>{v.partografUyarisi.uyari}</div>}
              <div style={{ overflowX: 'auto' }}><table style={{ borderCollapse: 'collapse', fontSize: 11, color: CHROME_RENK.ink }}>
                <thead><tr>{['Zaman', ...PARTOGRAF_ALANLARI.map((a) => a.ad.split(' (')[0])].map((h) => <th key={h} style={{ padding: '3px 6px', color: CHROME_RENK.muted, textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
                <tbody>
                  {v.partograf.map((r, i) => <tr key={i}><td style={{ padding: '3px 6px', whiteSpace: 'nowrap' }}>{new Date(String(r.zaman)).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</td>{PARTOGRAF_ALANLARI.map((a) => <td key={a.kod} style={{ padding: '3px 6px' }}>{String(r[a.kod] ?? '')}</td>)}</tr>)}
                  <tr><td style={{ padding: '3px 6px' }}><input type="datetime-local" value={f('p_zaman')} onChange={(e) => set('p_zaman', e.target.value)} style={{ ...toolsInput, width: 150, fontSize: 11 }} /></td>{PARTOGRAF_ALANLARI.map((a) => <td key={a.kod} style={{ padding: '3px 6px' }}><input value={f('p_' + a.kod)} onChange={(e) => set('p_' + a.kod, e.target.value)} placeholder={a.birim} style={{ ...toolsInput, width: 64, fontSize: 11 }} /></td>)}</tr>
                </tbody></table></div>
              <div style={{ marginTop: 6, display: 'flex', gap: 8 }}><button type="button" onClick={() => { const satir: Record<string, unknown> = { zaman: f('p_zaman') || undefined }; for (const a of PARTOGRAF_ALANLARI) satir[a.kod] = f('p_' + a.kod); calistir({ adim: 'partograf', dogumId: d.id, satir }, 'Satır eklendi.').then(() => setForm((x) => Object.fromEntries(Object.entries(x).filter(([k]) => !k.startsWith('p_'))))); }} style={btn}>Satır ekle</button></div>
              <div style={{ ...etiket, marginTop: 12 }}>Fetal distres notu</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input value={f('ktg')} onChange={(e) => set('ktg', e.target.value)} placeholder="KTG paterni (örn. geç deselerasyon, kategori II/III)" style={{ ...toolsInput, minWidth: 260 }} />
                <label style={{ ...kucuk, display: 'flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={!!form.mekonyum} onChange={(e) => set('mekonyum', e.target.checked)} />mekonyum</label>
                <input value={f('aksiyon')} onChange={(e) => set('aksiyon', e.target.value)} placeholder="Aksiyon (pozisyon, O₂, oksitosin kes, C/S kararı…)" style={{ ...toolsInput, minWidth: 260 }} />
                <button type="button" onClick={() => calistir({ adim: 'fetal_distres', dogumId: d.id, ktg_patern: f('ktg'), mekonyum: !!form.mekonyum, aksiyon: f('aksiyon') })} style={ghost}>Kaydet</button>
              </div>
              {d.fetal_distres && <div style={kucuk}>Son: {String(d.fetal_distres.ktg_patern || '')}{d.fetal_distres.mekonyum ? ' · mekonyum' : ''} — {String(d.fetal_distres.aksiyon || '')}</div>}
              <div style={{ ...etiket, marginTop: 12 }}>Sezaryen kararı <span style={kucuk}>· endikasyonu hekim seçer (SB Sezaryen KP); asistan yazmaz</span></div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{v.kutuphane.csEndikasyon.map((e) => <label key={e} style={{ ...kucuk, display: 'flex', gap: 4, alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 999, padding: '2px 8px' }}><input type="checkbox" checked={(form.cs as string[] | undefined)?.includes(e) || false} onChange={(ev) => set('cs', ev.target.checked ? [...((form.cs as string[]) || []), e] : ((form.cs as string[]) || []).filter((x) => x !== e))} />{e}</label>)}</div>
              <div style={{ marginTop: 6, display: 'flex', gap: 8 }}><button type="button" onClick={() => calistir({ adim: 'cs_karar', dogumId: d.id, endikasyon: form.cs || [], not: f('csNot') }, 'C/S kararı zaman damgasıyla kaydedildi.')} style={btn}>C/S kararı ver (zaman damgası)</button><input value={f('csNot')} onChange={(e) => set('csNot', e.target.value)} placeholder="Not" style={{ ...toolsInput, minWidth: 200 }} /></div>
              {d.cs_karar_at && <div style={kucuk}>Karar: {new Date(d.cs_karar_at).toLocaleString('tr-TR')} — {d.cs_endikasyon.join(', ')}</div>}
              <div style={{ ...etiket, marginTop: 12 }}>Erken doğum kartı</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <input value={f('pt_hafta') || String(haftaTahmini)} onChange={(e) => set('pt_hafta', e.target.value)} placeholder="hafta" style={{ ...toolsInput, width: 70 }} />
                <label style={{ ...kucuk, display: 'flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={!!form.pprom} onChange={(e) => set('pprom', e.target.checked)} />PPROM</label>
                <label style={{ ...kucuk, display: 'flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={!!form.dogum24} onChange={(e) => set('dogum24', e.target.checked)} />doğum 24 saat içinde olası</label>
                <button type="button" onClick={() => calistir({ adim: 'preterm', dogumId: d.id, veri: { hafta: Number(f('pt_hafta') || haftaTahmini), pprom: !!form.pprom, dogum24: !!form.dogum24, oneriler: pretermOnerileri({ hafta: Number(f('pt_hafta') || haftaTahmini), pprom: !!form.pprom, dogum24saatIcinde: !!form.dogum24 }) } })} style={ghost}>Kartı kaydet</button>
              </div>
              <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 12, color: CHROME_RENK.ink }}>{pretermOnerileri({ hafta: Number(f('pt_hafta') || haftaTahmini), pprom: !!form.pprom, dogum24saatIcinde: !!form.dogum24 }).map((o) => <li key={o.madde}>{o.madde} <span style={kucuk}>({o.neden})</span></li>)}</ul>
              <div style={kucuk}>İlaç emri verilmez; kontrol listesi ve öneri — karar hekimindir.</div>
            </>
          )}
        </div>
      )}

      {sekme === 'Doğum' && (
        <div>
          {!d && <div style={kucuk}>Önce Travay sekmesinden travayı başlatın.</div>}
          {d && (
            <>
              <div style={etiket}>Sezaryen paketi</div>
              {(['preop', 'intraop', 'ssvd'] as const).map((b) => (
                <details key={b} style={{ marginBottom: 6 }}><summary style={{ fontSize: 12, color: CHROME_RENK.ink, cursor: 'pointer' }}>{b === 'preop' ? 'Preop: CBC, kan grubu, kros, açlık, anestezi, antibiyotik' : b === 'intraop' ? 'Intraop: kesi, uterus, plasenta, kanama ml, komplikasyon, bebek çıkış saati, apgar, kilo' : 'SSVD: önceki kesi tipi, rüptür riski onamı'}</summary>
                  <textarea rows={3} defaultValue={d[b] ? JSON.stringify(d[b], null, 1).replace(/[{}"]/g, '') : ''} onBlur={(e) => { const obj: Record<string, string> = {}; e.target.value.split('\n').forEach((l) => { const [k, ...r] = l.split(':'); if (k && r.length) obj[k.trim()] = r.join(':').trim(); }); calistir({ adim: b, dogumId: d.id, veri: obj }); }} placeholder={b === 'preop' ? 'cbc: yapıldı\nkan_grubu: A Rh+\nkros: 2Ü hazır\naclik: 8 saat\nanestezi: spinal\nantibiyotik: sefazolin 2 g (hekim)' : b === 'intraop' ? 'kesi: Pfannenstiel\nuterus: alt segment transvers\nplasenta: tam\nkanama_ml: 600\nkomplikasyon: yok\nbebek_cikis_saati: 10:42\napgar: 8/9\nkilo: 3250' : 'onceki_kesi_tipi: alt segment transvers\nruptur_onami: alındı'} style={{ ...toolsInput, width: '100%', fontFamily: 'monospace', fontSize: 11 }} />
                </details>
              ))}
              <div style={etiket}>Postop 2 / 6 / 24 saat</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{['2s', '6s', '24s'].map((s) => <textarea key={s} rows={3} defaultValue={d.postop?.[s] ? Object.entries(d.postop[s]).map(([k, v2]) => `${k}: ${v2}`).join('\n') : ''} onBlur={(e) => { const obj: Record<string, string> = {}; e.target.value.split('\n').forEach((l) => { const [k, ...r] = l.split(':'); if (k && r.length) obj[k.trim()] = r.join(':').trim(); }); calistir({ adim: 'postop', dogumId: d.id, veri: { [s]: obj } }); }} placeholder={`${s}: kanama, idrar, barsak, yara, ateş, mobilizasyon`} style={{ ...toolsInput, flex: 1, minWidth: 180, fontFamily: 'monospace', fontSize: 11 }} />)}</div>
              <div style={{ ...etiket, marginTop: 12 }}>PPH</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <input value={f('pph_ml')} onChange={(e) => set('pph_ml', e.target.value)} placeholder="tahmini kanama ml" style={{ ...toolsInput, width: 140 }} />
                <input value={f('pph_ut')} onChange={(e) => set('pph_ut', e.target.value)} placeholder="uterotonik (hekim yazar)" style={{ ...toolsInput, width: 220 }} />
                <label style={{ ...kucuk, display: 'flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={!!form.hist} onChange={(e) => set('hist', e.target.checked)} />histerektomi</label>
                <button type="button" onClick={() => calistir({ adim: 'pph', dogumId: d.id, tahmin_ml: f('pph_ml'), uterotonik: f('pph_ut'), histerektomi: !!form.hist })} style={ghost}>Kaydet</button>
              </div>
              {d.pph && <div style={{ fontSize: 12, color: d.pph.acil ? '#F87171' : CHROME_RENK.muted, fontWeight: d.pph.acil ? 800 : 400 }}>{d.pph.acil ? '⚠ ACİL BAYRAK — ' : ''}{String(d.pph.siniflama)}</div>}
              <div style={{ ...etiket, marginTop: 12 }}>Doğumu kaydet <span style={kucuk}>· canlı doğum bebek kartı oluşturur (pediatri devralır)</span></div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <select value={f('sekil') || 'nsd'} onChange={(e) => set('sekil', e.target.value)} style={{ ...toolsInput, width: 'auto' }}>{[['nsd', 'Normal vajinal'], ['mudahaleli', 'Müdahaleli vajinal'], ['cs_elektif', 'Elektif C/S'], ['cs_acil', 'Acil C/S'], ['ssvd', 'SSVD']].map(([k, a]) => <option key={k} value={k} style={{ color: '#000' }}>{a}</option>)}</select>
                <input type="datetime-local" value={f('dz')} onChange={(e) => set('dz', e.target.value)} style={{ ...toolsInput, width: 170 }} />
                <label style={{ ...kucuk, display: 'flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={form.olu !== true} onChange={(e) => set('olu', !e.target.checked)} />canlı doğum</label>
                <select value={f('cins')} onChange={(e) => set('cins', e.target.value)} style={{ ...toolsInput, width: 'auto' }}><option value="">cinsiyet</option><option value="K" style={{ color: '#000' }}>Kız</option><option value="E" style={{ color: '#000' }}>Erkek</option></select>
                <input value={f('kilo')} onChange={(e) => set('kilo', e.target.value)} placeholder="kilo g" style={{ ...toolsInput, width: 80 }} />
                <input value={f('a1')} onChange={(e) => set('a1', e.target.value)} placeholder="Apgar 1" style={{ ...toolsInput, width: 70 }} />
                <input value={f('a5')} onChange={(e) => set('a5', e.target.value)} placeholder="Apgar 5" style={{ ...toolsInput, width: 70 }} />
                <input value={f('hf')} onChange={(e) => set('hf', e.target.value)} placeholder={`hafta (${haftaTahmini})`} style={{ ...toolsInput, width: 90 }} />
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>{BEBEK_KOMPLIKASYONLARI.map((k) => <label key={k} style={{ ...kucuk, display: 'flex', gap: 4, alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 999, padding: '2px 8px' }}><input type="checkbox" checked={(form.bk as string[] | undefined)?.includes(k) || false} onChange={(ev) => set('bk', ev.target.checked ? [...((form.bk as string[]) || []), k] : ((form.bk as string[]) || []).filter((x) => x !== k))} />{k}</label>)}</div>
              <div style={{ marginTop: 6 }}><button type="button" disabled={!!d.dogum_zamani} onClick={() => calistir({ adim: 'dogum_kaydet', dogumId: d.id, dogumSekli: f('sekil') || 'nsd', dogumZamani: f('dz') || undefined, canli: form.olu !== true, bebekler: [{ cinsiyet: f('cins') || null, kilo: f('kilo'), apgar1: f('a1'), apgar5: f('a5'), hafta: f('hf') || haftaTahmini, komplikasyonlar: form.bk || [] }] }, 'Doğum kaydedildi; bebek kartı oluşturuldu.')} style={btn}>{d.dogum_zamani ? `Doğum kaydedildi (${new Date(d.dogum_zamani).toLocaleString('tr-TR')})` : 'Doğumu kaydet'}</button></div>
              <div style={{ ...etiket, marginTop: 12 }}>Anne komplikasyonu ekle</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <select value={f('ak')} onChange={(e) => set('ak', e.target.value)} style={{ ...toolsInput, width: 'auto' }}><option value="">seçin</option>{ANNE_KOMPLIKASYONLARI.map((k) => <option key={k} value={k} style={{ color: '#000' }}>{k}</option>)}</select>
                <input value={f('akd')} onChange={(e) => set('akd', e.target.value)} placeholder="ayrıntı" style={{ ...toolsInput, minWidth: 200 }} />
                <button type="button" disabled={!f('ak')} onClick={() => calistir({ adim: 'komplikasyon', dogumId: d.id, kime: 'anne', ad: f('ak'), ayrinti: f('akd'), acil: /PPH|emboli|preeklampsi/i.test(f('ak')) })} style={ghost}>Ekle</button>
              </div>
              {v.komplikasyonlar.map((k) => <div key={k.id} style={{ fontSize: 12, color: k.acil ? '#F87171' : CHROME_RENK.ink }}>{k.acil ? '⚠ ' : ''}{k.kime}: {k.ad}{k.ayrinti ? ` — ${k.ayrinti}` : ''} <span style={kucuk}>{new Date(k.zaman).toLocaleString('tr-TR')}</span></div>)}
            </>
          )}
        </div>
      )}

      {sekme === 'Lohusa & Taburcu' && (
        <div>
          {!d?.dogum_zamani && <div style={kucuk}>Doğum kaydedildikten sonra lohusa izlemi ve taburcu listesi açılır.</div>}
          {d?.dogum_zamani && (
            <>
              <div style={etiket}>Lohusa izlemleri (anne)</div>
              {v.kutuphane.lohusa.map((z) => { const yapilan = d.lohusa?.ziyaretler?.find((x) => x.kod === z.kod); return (
                <div key={z.kod} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '4px 0', fontSize: 12, color: CHROME_RENK.ink }}>
                  <span style={{ minWidth: 20, color: yapilan ? '#0F9B8E' : CHROME_RENK.muted }}>{yapilan ? '✓' : '○'}</span><span style={{ flex: 1 }}>{z.ad}{yapilan ? <span style={kucuk}> · {new Date(yapilan.tarih).toLocaleDateString('tr-TR')}{yapilan.not ? ` · ${yapilan.not}` : ''}</span> : null}</span>
                  {!yapilan && <><input value={f('lz_' + z.kod)} onChange={(e) => set('lz_' + z.kod, e.target.value)} placeholder="TA, kanama, EPDS, emzirme…" style={{ ...toolsInput, width: 220 }} /><button type="button" onClick={() => calistir({ adim: 'lohusa_ziyaret', dogumId: d.id, kod: z.kod, not: f('lz_' + z.kod) })} style={{ ...ghost, padding: '3px 8px', fontSize: 11 }}>Kaydet</button></>}
                </div>); })}
              {v.bebekler.filter((b) => b.canli).map((b) => { const tc = v.taburcu.find((t) => t.bebek_id === b.id); const m = { ...(tc?.maddeler || {}), ...((form['tab_' + b.id] as Record<string, boolean>) || {}) }; const ist = (form['ist_' + b.id] as { tur: string; aciklama: string } | undefined) || tc?.istisna || null; return (
                <div key={b.id} style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8 }}>
                  <div style={etiket}>Taburcu kontrol listesi — Bebek {b.sira} {tc?.kapatildi ? <span style={{ color: '#0F9B8E' }}>· kapatıldı</span> : null}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{TABURCU_MADDELERI.map(([k, ad, zorunlu]) => <label key={k} style={{ ...kucuk, display: 'flex', gap: 4, alignItems: 'center', color: zorunlu ? CHROME_RENK.ink : CHROME_RENK.muted }}><input type="checkbox" disabled={tc?.kapatildi} checked={!!m[k]} onChange={(e) => set('tab_' + b.id, { ...m, [k]: e.target.checked })} />{ad}{zorunlu ? ' *' : ''}</label>)}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 }}>
                    <select value={ist?.tur || ''} disabled={tc?.kapatildi} onChange={(e) => set('ist_' + b.id, e.target.value ? { tur: e.target.value, aciklama: ist?.aciklama || '' } : null)} style={{ ...toolsInput, width: 'auto' }}><option value="">istisna yok</option><option value="red" style={{ color: '#000' }}>Aile reddi</option><option value="erken_taburcu" style={{ color: '#000' }}>Erken taburcu</option><option value="sevk" style={{ color: '#000' }}>Sevk</option></select>
                    {ist && <input value={ist.aciklama} disabled={tc?.kapatildi} onChange={(e) => set('ist_' + b.id, { ...ist, aciklama: e.target.value })} placeholder="belgelenmiş açıklama (≥10 karakter)" style={{ ...toolsInput, minWidth: 240 }} />}
                    {!tc?.kapatildi && <><button type="button" onClick={() => calistir({ adim: 'taburcu', dogumId: d.id, bebekId: b.id, maddeler: m, istisna: ist })} style={ghost}>Kaydet</button><button type="button" onClick={() => calistir({ adim: 'taburcu', dogumId: d.id, bebekId: b.id, maddeler: m, istisna: ist, kapat: true }, 'Taburcu kapatıldı.')} style={btn}>Taburcuyu kapat</button></>}
                  </div>
                  <div style={kucuk}>* NTP-1, HepB-1, K vitamini ve işitme olmadan taburcu kapatılamaz — belgelenmiş istisna (red / erken taburcu / sevk) hariç.</div>
                </div>); })}
            </>
          )}
        </div>
      )}

      {sekme === 'Bebek' && (
        <div>
          {!v.bebekler.length && <div style={kucuk}>Canlı doğum kaydedildiğinde bebek kartı burada oluşur; sonrası pediatriye (Ayşe) aittir.</div>}
          {v.bebekler.map((b) => (
            <div key={b.id} style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '8px 0' }}>
              <div style={etiket}>Bebek {b.sira} <span style={kucuk}>· {b.cinsiyet === 'E' ? 'erkek' : b.cinsiyet === 'K' ? 'kız' : '—'} · {b.kilo_gram ?? '—'} g · Apgar {b.apgar1 ?? '—'}/{b.apgar5 ?? '—'} · {b.gebelik_haftasi ?? '—'} hf {b.bebek_patient_id && <a href={`/dashboard/doktor/hastalar/${b.bebek_patient_id}`} style={{ color: '#0F9B8E' }}>· dosyayı aç →</a>}</span></div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{b.gorevler.map((g) => <label key={g.kod} style={{ ...kucuk, display: 'flex', gap: 4, alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 999, padding: '2px 8px', color: g.tamam ? '#0F9B8E' : CHROME_RENK.ink }}><input type="checkbox" checked={!!g.tamam} onChange={(e) => calistir({ adim: 'bebek_tarama', bebekId: b.id, alan: g.kod, deger: e.target.checked })} />{g.ad} <span style={kucuk}>({g.sahip})</span></label>)}</div>
              {b.komplikasyonlar.length > 0 && <div style={{ fontSize: 12, color: '#F87171', marginTop: 4 }}>Komplikasyon: {b.komplikasyonlar.join(', ')}</div>}
              {b.cinsiyet === 'E' && <div style={{ ...kucuk, marginTop: 4 }}>Erkek bebek: {ERKEK_BEBEK_EK.join(' · ')} — ayrı lab paneli yoktur.</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
