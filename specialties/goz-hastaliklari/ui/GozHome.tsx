'use client';
/**
 * GOZ-CHAPTER — Hasta dosyası › Göz. 8 saatlik poliklinik için: yapışkan şerit (OD/OS VA + Δ harf, GİB × hedef, DR evresi,
 * sıradaki enjeksiyon, geciken görev) + acil bandı + saniyeler içinde bilateral VA/GİB girişi (son vizitten kopyala → onay) +
 * kartlar (Fundus · Glokom · DR · Enjeksiyon · SGK rapor · Katarakt · Görüntü · Ön segment · Pediatrik · Kontrol). Hekim kilitleri:
 * tanı/evre/hedef/rejim/aralık yalnız hekim girişi. Sekreter salt okur (API sadeceDoktor).
 */
import React, { useCallback, useEffect, useState } from 'react';
import { getAccessTokenAsync, toolsCard, toolsInput } from '@/lib/doktor/toolsUi';
import { GozKartlar, type GozVeri, stil } from './GozKartlar';
import { AcilSablon, RefraksiyonAlanlari } from './GozKartlarEk';
import MuayeneFormunaDon from '@/components/doktor/MuayeneFormunaDon';
import { eklenenNotId } from '@/lib/doktor/muayeneFormuYolu';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

const { btn, ghost, etiket, kucuk, satir } = stil;
const ALANLAR = [['uzak_sc', 'Uzak sc'], ['uzak_cc', 'Uzak cc'], ['yakin', 'Yakın']] as const;
const SEKMELER = ['Özet', 'Fundus', 'Glokom', 'DR', 'Enjeksiyon', 'SGK rapor', 'Katarakt', 'Görüntü', 'Ön segment', 'Kuru göz', 'Pediatrik', 'Kontrol'] as const;
export type GozSekme = (typeof SEKMELER)[number];

type Form = { sag: Record<string, string>; sol: Record<string, string>; gibSag: string; gibSol: string; gibYontem: string; kopya: boolean; rapd: string; ref: Record<string, string> };
const bosForm = (): Form => ({ sag: {}, sol: {}, gibSag: '', gibSol: '', gibYontem: 'nct', kopya: false, rapd: '', ref: {} });

export default function GozHome({ patientId }: { patientId: string }) {
  const [v, setV] = useState<GozVeri | null>(null);
  const [sekme, setSekme] = useState<GozSekme>('Özet');
  const [kaynak, setKaynak] = useState(false);
  const [mesaj, setMesajHam] = useState('');
  // NOTYA-MUAYENEYE-DON-01 — "Nota ekle (O/S)" onayının yanındaki dönüş bağlantısı.
  const [eklenenNot, setEklenenNot] = useState<string | null>(null);
  const setMesaj = useCallback((m: string) => { setMesajHam(m); setEklenenNot(null); }, []);
  const [form, setForm] = useState<Form>(bosForm());
  const [kopyaOnay, setKopyaOnay] = useState(false);
  const [refAcik, setRefAcik] = useState(false);

  const yukle = useCallback(async () => {
    const token = await getAccessTokenAsync();
    const r = await fetch(`/api/doktor/goz?patientId=${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    const j = await r.json().catch(() => ({}));
    if (r.ok) setV(j); else setMesaj(j.error || 'Göz verisi yüklenemedi');
  }, [patientId, setMesaj]);
  useEffect(() => { yukle(); }, [yukle]);

  const calistir = useCallback(async (body: Record<string, unknown>, ok?: string): Promise<Record<string, unknown> | null> => {
    setMesaj('');
    try {
      const token = await getAccessTokenAsync();
      const r = await fetch('/api/doktor/goz', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId, ...body }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Hata');
      setMesaj(ok || 'Kaydedildi.'); setEklenenNot(eklenenNotId(j)); await yukle(); return j;
    } catch (e) { setMesaj(e instanceof Error ? e.message : 'Hata'); return null; }
  }, [patientId, yukle, setMesaj]);

  if (!v) return <div style={{ ...toolsCard, color: CHROME_RENK.muted, fontSize: 12 }}>{mesaj || 'Göz yükleniyor…'}</div>;
  const s = v.serit;
  const salt = v.rol !== 'doktor';
  // GOZ-EXCEPTIONAL-01: Pediatrik sekme yalnız bilinen yaş <18 veya kayıtlı pediatrik/ROP verisi (bilinmeyen yaş çocuk sayılmaz).
  const sekmeler = SEKMELER.filter((x) => x !== 'Pediatrik' || v.pediatrikGorunum?.pediatrikSekme);

  const kopyala = () => {
    if (!v.kopya) return;
    const t = v.kopya.taslak;
    setForm({ sag: { ...(t.va.sag || {}) } as Record<string, string>, sol: { ...(t.va.sol || {}) } as Record<string, string>, gibSag: t.gibSag == null ? '' : String(t.gibSag), gibSol: t.gibSol == null ? '' : String(t.gibSol), gibYontem: t.gibYontem || 'nct', kopya: true, rapd: '', ref: {} });
    setKopyaOnay(false);
    setMesaj(`${v.kopya.kaynakTarih} değerleri forma kopyalandı — bugün ölçüp onaylayın.`);
  };
  const kaydet = async () => {
    if (form.kopya && !kopyaOnay) { setMesaj('Kopyalanan değerleri bugün kontrol ettiğinizi onaylayın.'); return; }
    const temiz = (x: Record<string, string>) => Object.fromEntries(Object.entries(x).filter(([, y]) => String(y || '').trim()));
    const n = (x: string) => (x.trim() === '' ? undefined : Number(x.replace(',', '.')));
    const va: Record<string, Record<string, string>> = {};
    if (Object.keys(temiz(form.sag)).length) va.sag = temiz(form.sag);
    if (Object.keys(temiz(form.sol)).length) va.sol = temiz(form.sol);
    const r = form.ref;
    const refVar = Object.values(r).some((x) => String(x || '').trim());
    const refraksiyon = refVar ? { sag: { sph: r.sag_sph, cyl: r.sag_cyl, aks: r.sag_aks }, sol: { sph: r.sol_sph, cyl: r.sol_cyl, aks: r.sol_aks } } : null;
    const j = await calistir({ adim: 'olcum', olcum: { va, gibSag: n(form.gibSag), gibSol: n(form.gibSol), gibYontem: form.gibYontem, kopyaOnayli: form.kopya, ...(form.rapd ? { rapd: form.rapd } : {}) }, refraksiyon }, 'OD/OS ölçüm kaydedildi.');
    if (j) { setForm(bosForm()); setKopyaOnay(false); }
  };

  const chip = (ad: string, deger: string, renk: string = CHROME_RENK.ink) => <span style={{ border: `1px solid ${renk === CHROME_RENK.ink ? 'rgba(255,255,255,0.12)' : renk}`, borderRadius: 999, padding: '3px 10px', fontSize: 11, color: renk, whiteSpace: 'nowrap' }}><span style={{ color: CHROME_RENK.muted }}>{ad} </span>{deger}</span>;
  const harf = (x: number | null) => (x == null ? '' : ` (${x > 0 ? '+' : ''}${x} harf)`);

  return (
    <div style={{ ...toolsCard }} data-chapter="goz-hastaliklari">
      {/* Acil bandı — gecikme yok */}
      {v.acil.length > 0 && (
        <div role="alert" style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.6)', color: CHROME_RENK.warn, borderRadius: 10, padding: '8px 12px', marginBottom: 10, fontSize: 12 }}>
          {v.acil.map((a) => <div key={a.kod}><b style={{ color: '#F87171' }}>{a.oncelik === 'hemen' ? 'HEMEN' : 'AYNI GÜN'} · {a.ad}:</b> {a.eylem}</div>)}
          <div style={{ ...kucuk, marginTop: 4 }}>Şikâyet metni / ön form kırmızı bayrak kutularından otomatik eşleşme — klinik karar hekimin; 112 / acil yönlendirmesini geciktirmeyin.</div>
          <AcilSablon acil={v.acil} v={v} calistir={calistir} salt={salt} />
        </div>
      )}

      {/* Yapışkan şerit */}
      <div style={{ position: 'sticky', top: 0, zIndex: 5, background: '#0D1526', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '6px 0 8px', marginBottom: 8, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        {chip('VA OD', `${s.va.sag}${harf(s.va.harfSag)}`, s.va.harfSag != null && s.va.harfSag <= -5 ? '#FBBF24' : CHROME_RENK.ink)}
        {chip('VA OS', `${s.va.sol}${harf(s.va.harfSol)}`, s.va.harfSol != null && s.va.harfSol <= -5 ? '#FBBF24' : CHROME_RENK.ink)}
        {chip('GİB OD', `${s.gib.sag ?? '—'}${s.gib.hedefSag != null ? ` / hedef ${s.gib.hedefSag}` : ''}`, s.gib.ustSag ? '#F87171' : CHROME_RENK.ink)}
        {chip('GİB OS', `${s.gib.sol ?? '—'}${s.gib.hedefSol != null ? ` / hedef ${s.gib.hedefSol}` : ''}`, s.gib.ustSol ? '#F87171' : CHROME_RENK.ink)}
        {s.drEvre && chip('DR', s.drEvre)}
        {s.sonrakiEnjeksiyon && chip('Enjeksiyon', s.sonrakiEnjeksiyon, '#0F9B8E')}
        {s.gecikenGorev > 0 && chip('Geciken görev', String(s.gecikenGorev), '#F87171')}
        {!s.bugunOlcumVar && chip('Bugün', 'VA/GİB girilmedi', '#FBBF24')}
        {!salt && <button type="button" onClick={() => calistir({ adim: 'serit_nota' }, 'Şerit (VA + GİB + son göz dibi) bugünkü notun Objektif bölümüne yazıldı.')} style={{ ...ghost, padding: '2px 8px', fontSize: 11, marginLeft: 'auto' }} title="VA + GİB + RAPD + son fundus satırı">Şeridi Objektif&apos;e yaz</button>}
        <button type="button" onClick={() => setKaynak(!kaynak)} style={{ ...ghost, padding: '2px 8px', fontSize: 10, color: kaynak ? '#0F9B8E' : CHROME_RENK.muted, marginLeft: salt ? 'auto' : undefined }}>{kaynak ? 'Kaynak: açık' : 'Kaynak'}</button>
      </div>

      {/* Bilateral hızlı giriş */}
      {!salt && (
        <div style={{ border: '1px solid rgba(15,155,142,0.35)', borderRadius: 10, padding: 10, marginBottom: 10 }}>
          <div style={{ ...etiket, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span>Görme keskinliği + GİB</span><span style={kucuk}>0,8 · 6/12 · 20/40 · PS 1m · EH · IH · IHY — yazıldığı gibi saklanır</span>
            {v.kopya && <button type="button" onClick={kopyala} style={{ ...ghost, marginLeft: 'auto' }}>Son vizitten kopyala ({v.kopya.kaynakTarih})</button>}
          </div>
          <div className="goz-giris" style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0,1fr) minmax(0,1fr)', gap: 6, alignItems: 'center', fontSize: 12 }}>
            <span />
            <b style={{ color: '#0F9B8E' }}>OD (sağ)</b>
            <b style={{ color: '#60A5FA' }}>OS (sol)</b>
            {ALANLAR.map(([k, ad]) => (
              <React.Fragment key={k}>
                <span style={kucuk}>{ad}</span>
                <input aria-label={`Sağ ${ad}`} value={form.sag[k] || ''} onChange={(e) => setForm({ ...form, sag: { ...form.sag, [k]: e.target.value } })} style={{ ...toolsInput, minWidth: 0 }} inputMode="decimal" />
                <input aria-label={`Sol ${ad}`} value={form.sol[k] || ''} onChange={(e) => setForm({ ...form, sol: { ...form.sol, [k]: e.target.value } })} style={{ ...toolsInput, minWidth: 0 }} inputMode="decimal" />
              </React.Fragment>
            ))}
            <span style={kucuk}>GİB mmHg</span>
            <input aria-label="Sağ GİB" value={form.gibSag} onChange={(e) => setForm({ ...form, gibSag: e.target.value })} style={{ ...toolsInput, minWidth: 0 }} inputMode="decimal" />
            <input aria-label="Sol GİB" value={form.gibSol} onChange={(e) => setForm({ ...form, gibSol: e.target.value })} style={{ ...toolsInput, minWidth: 0 }} inputMode="decimal" />
          </div>
          <div style={satir}>
            <label style={{ ...kucuk, display: 'flex', gap: 6, alignItems: 'center' }}>RAPD
              <select aria-label="RAPD" value={form.rapd} onChange={(e) => setForm({ ...form, rapd: e.target.value })} style={{ ...toolsInput, width: 'auto' }}>
                {[['', '—'], ['yok', 'Yok'], ['sag', 'Sağ (OD)'], ['sol', 'Sol (OS)']].map(([k, a]) => <option key={k} value={k} style={{ color: '#000' }}>{a}</option>)}
              </select>
            </label>
            <button type="button" onClick={() => setRefAcik(!refAcik)} style={{ ...ghost, color: refAcik ? '#0F9B8E' : CHROME_RENK.muted }}>{refAcik ? 'Refraksiyonu gizle' : '+ Refraksiyon (opsiyonel)'}</button>
          </div>
          {refAcik && <RefraksiyonAlanlari deger={form.ref} set={(ref) => setForm({ ...form, ref })} />}
          <div style={satir}>
            <select value={form.gibYontem} onChange={(e) => setForm({ ...form, gibYontem: e.target.value })} style={{ ...toolsInput, width: 'auto' }}>
              {[['nct', 'NCT (hava)'], ['applanasyon', 'Aplanasyon'], ['tonopen', 'Tono-Pen'], ['icare', 'iCare'], ['diger', 'Diğer']].map(([k, a]) => <option key={k} value={k} style={{ color: '#000' }}>{a}</option>)}
            </select>
            {form.kopya && <label style={{ ...kucuk, display: 'flex', gap: 4, alignItems: 'center', color: kopyaOnay ? '#0F9B8E' : '#FBBF24' }}><input type="checkbox" checked={kopyaOnay} onChange={(e) => setKopyaOnay(e.target.checked)} />Kopyalanan değerleri bugün ölçtüm / onaylıyorum</label>}
            <button type="button" onClick={kaydet} style={btn}>Kaydet</button>
            <button type="button" onClick={() => calistir({ adim: 'olcum_nota' }, 'Son VA/GİB bugünkü notun Objektif bölümüne eklendi.')} style={ghost}>Nota ekle (O)</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {sekmeler.map((x) => <button key={x} type="button" onClick={() => setSekme(x)} style={{ ...ghost, background: sekme === x ? 'rgba(15,155,142,0.2)' : 'transparent', color: sekme === x ? '#0F9B8E' : CHROME_RENK.muted, borderRadius: 999, minHeight: 30 }}>{x}{x === 'DR' && v.acikGozSevkleri.length ? ' •' : ''}</button>)}
      </div>
      {mesaj && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: /okunamadı|Hata|hatalı|yok|girin|onaylayın|Eksik|bulunamadı|seçin|olamaz|Asistan/.test(mesaj) ? '#F87171' : '#0F9B8E' }}>{mesaj}</span>
          <MuayeneFormunaDon notId={eklenenNot} />
        </div>
      )}

      <GozKartlar v={v} sekme={sekme} kaynak={kaynak} salt={salt} calistir={calistir} />
      <style>{`@media (max-width: 420px) { .goz-giris input { padding: 6px 6px !important; font-size: 14px !important; } }`}</style>
    </div>
  );
}
