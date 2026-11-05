'use client';
/**
 * KD-RAPOR-01 (Kaan, 2026-11-05) — "USG & NST Raporları" of the KD chapter: structured obstetric USG (biometry with
 * INTERGROWTH-21st percentiles + Hadlock EFW, numeric AFI / DVP, placenta, presentation, FHR, Doppler with MCA-PSV MoM and
 * CPR, NT, anatomy), gynaecological USG (uterus, endometrium, ovaries, lesions) and NST (FIGO 2015 + ACOG reactivity),
 * each printable on the letterhead; and the link to the printable doğum epikrizi once a delivery is recorded.
 * KD ONLY: mounted by HastaGebelik for a Kadın Hastalıkları ve Doğum doctor alone (kadinDogumBransi).
 * Every computed number shows live under the form (the same pure engines the print page uses).
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getAccessTokenAsync, toolsCard, toolsInput } from '@/lib/doktor/toolsUi';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';
import {
  ANATOMI_ALANLARI, ANATOMI_DURUMLARI, BOS_JINEKOLOJIK_USG, BOS_OBSTETRIK_USG, LEZYON_TURLERI, LEZYON_YERLERI, PLASENTA_YERLERI,
  PREZENTASYONLAR, UA_EDF, USG_ETIKET, jinekolojikUsgHesapla, obstetrikUsgHesapla, type JinekolojikUsg, type ObstetrikUsg,
} from '../engines/usgRaporu';
import { BOS_NST, NST_ETIKET, nstSiniflandir, type NstGirdi } from '../engines/nstKtg';

type Tur = 'usg_obstetrik' | 'usg_jinekolojik' | 'nst';
type Rapor = { id: string; tur: Tur; rapor_tarihi: string; veri: Record<string, unknown> };
const TUR_AD: Record<Tur, string> = { usg_obstetrik: 'Obstetrik USG', usg_jinekolojik: 'Jinekolojik USG', nst: 'NST' };

const btn: React.CSSProperties = { background: CHROME_RENK.pine, color: '#FAF8F4', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' };
const ghost: React.CSSProperties = { ...btn, background: 'transparent', color: CHROME_RENK.ink, border: `1px solid ${CHROME_RENK.border}` };
const etiketS: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: CHROME_RENK.muted, marginBottom: 4 };
const izgara: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 };
const baslikS: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: CHROME_RENK.muted, margin: '14px 0 6px', textTransform: 'uppercase', letterSpacing: '0.04em' };
const sonucKutu: React.CSSProperties = { background: '#F6F0E4', border: `1px solid ${CHROME_RENK.border}`, borderRadius: 10, padding: 10, marginTop: 12, fontSize: 12.5, color: CHROME_RENK.ink, lineHeight: 1.55 };
const bugun = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };

function Sayi({ etiket, deger, onChange, adim = 0.1 }: { etiket: string; deger: number | null; onChange: (n: number | null) => void; adim?: number }) {
  return (
    <label><span style={etiketS}>{etiket}</span>
      <input type="number" step={adim} value={deger ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} style={{ ...toolsInput, width: '100%' }} />
    </label>
  );
}
function Secim({ etiket, deger, secenekler, onChange }: { etiket: string; deger: string; secenekler: Array<[string, string]>; onChange: (s: string) => void }) {
  return (
    <label><span style={etiketS}>{etiket}</span>
      <select value={deger} onChange={(e) => onChange(e.target.value)} style={{ ...toolsInput, width: '100%' }}>
        <option value="">—</option>{secenekler.map(([k, a]) => <option key={k} value={k}>{a}</option>)}
      </select>
    </label>
  );
}

// ───────────────────────── obstetric ─────────────────────────
export function ObstetrikUsgSonucu({ v }: { v: ObstetrikUsg }) {
  const h = obstetrikUsgHesapla(v);
  const satir: string[] = [];
  if (h.hafta != null) satir.push(`Gebelik yaşı: ${h.hafta} hf`);
  for (const b of h.biyometri) satir.push(`${b.param.toUpperCase()} ${b.mm} mm → ${b.persentil}. persentil${b.durum !== 'normal' ? (b.durum === 'dusuk' ? ' (düşük)' : ' (yüksek)') : ''} (INTERGROWTH-21st)`);
  if (h.efw != null) satir.push(`Tahmini fetal ağırlık (Hadlock): ${h.efw} g`);
  if (h.afiBant) satir.push(`AFI ${v.afiCm} cm → ${USG_ETIKET.sivBant[h.afiBant]}`);
  if (h.dvpBant) satir.push(`En derin cep ${v.dvpCm} cm → ${USG_ETIKET.sivBant[h.dvpBant]}`);
  if (h.mcaMom != null) satir.push(`MCA-PSV ${v.mcaPsv} cm/sn = ${h.mcaMom} MoM (medyan ${h.mcaMedian}, Mari 2000)${h.mcaAnemiBayragi ? ' — ≥1.5 MoM: orta-ağır fetal anemi eşiği' : ''}`);
  if (h.cpr != null) satir.push(`CPR (MCA PI / UA PI): ${h.cpr}${h.cprDusuk ? ' — <1.08 (Gramellini 1992 eşiği)' : ''}`);
  if (h.uaEdfBayragi) satir.push(`UA diyastol sonu akım: ${USG_ETIKET.uaEdf[h.uaEdfBayragi]}`);
  if (h.uterinOrtPi != null) satir.push(`Uterin arter ortalama PI: ${h.uterinOrtPi} (persentil tablosu yok — ölçüldüğü gibi)`);
  if (h.fkhBayragi) satir.push(`FKH ${v.fkh}/dk — ${h.fkhBayragi === 'bradikardi' ? '<110' : '>160'} (normal 110–160)`);
  if (h.nt) satir.push(h.nt.not);
  return <div style={sonucKutu} data-kd-rapor="obstetrik-sonuc">{satir.length ? satir.map((s, i) => <div key={i}>• {s}</div>) : 'Ölçüm girildikçe hesaplar burada görünür.'}<div style={{ fontSize: 11, color: CHROME_RENK.muted, marginTop: 6 }}>Hesaplar yayımlanmış referanslara dayanır; yorum ve tanı hekimindir.</div></div>;
}

function ObstetrikUsgFormu({ v, set }: { v: ObstetrikUsg; set: (f: (x: ObstetrikUsg) => ObstetrikUsg) => void }) {
  const s = <K extends keyof ObstetrikUsg>(k: K) => (val: ObstetrikUsg[K]) => set((x) => ({ ...x, [k]: val }));
  return (
    <>
      <div style={izgara}>
        <label><span style={etiketS}>Tarih</span><input type="date" value={v.tarih} onChange={(e) => s('tarih')(e.target.value)} style={{ ...toolsInput, width: '100%' }} /></label>
        <Sayi etiket="Gebelik haftası" adim={1} deger={v.haftaGun.hafta} onChange={(n) => set((x) => ({ ...x, haftaGun: { ...x.haftaGun, hafta: n } }))} />
        <Sayi etiket="+ gün (0–6)" adim={1} deger={v.haftaGun.gun} onChange={(n) => set((x) => ({ ...x, haftaGun: { ...x.haftaGun, gun: n } }))} />
        <Sayi etiket="Fetüs sayısı" adim={1} deger={v.fetusSayisi} onChange={s('fetusSayisi')} />
        <Sayi etiket="FKH (/dk)" adim={1} deger={v.fkh} onChange={s('fkh')} />
        <Secim etiket="Prezentasyon" deger={v.prezentasyon} secenekler={PREZENTASYONLAR.map((p) => [p, USG_ETIKET.prezentasyon[p]])} onChange={s('prezentasyon')} />
      </div>
      <div style={baslikS}>Biyometri (mm)</div>
      <div style={izgara}>
        <Sayi etiket="CRL" deger={v.crlMm} onChange={s('crlMm')} /><Sayi etiket="BPD" deger={v.bpdMm} onChange={s('bpdMm')} />
        <Sayi etiket="HC" deger={v.hcMm} onChange={s('hcMm')} /><Sayi etiket="AC" deger={v.acMm} onChange={s('acMm')} /><Sayi etiket="FL" deger={v.flMm} onChange={s('flMm')} />
      </div>
      <div style={baslikS}>Amnion, plasenta</div>
      <div style={izgara}>
        <Sayi etiket="AFI (cm)" deger={v.afiCm} onChange={s('afiCm')} /><Sayi etiket="En derin cep (cm)" deger={v.dvpCm} onChange={s('dvpCm')} />
        <Secim etiket="Plasenta yeri" deger={v.plasentaYeri} secenekler={PLASENTA_YERLERI.map((p) => [p, USG_ETIKET.plasenta[p]])} onChange={s('plasentaYeri')} />
        <label style={{ gridColumn: 'span 2' }}><span style={etiketS}>Plasenta notu</span><input value={v.plasentaNot} onChange={(e) => s('plasentaNot')(e.target.value)} style={{ ...toolsInput, width: '100%' }} /></label>
      </div>
      <div style={baslikS}>Doppler</div>
      <div style={izgara}>
        <Sayi etiket="UA PI" adim={0.01} deger={v.uaPi} onChange={s('uaPi')} /><Sayi etiket="UA RI" adim={0.01} deger={v.uaRi} onChange={s('uaRi')} />
        <Secim etiket="UA diyastol sonu akım" deger={v.uaEdf} secenekler={UA_EDF.map((p) => [p, USG_ETIKET.uaEdf[p]])} onChange={(x) => s('uaEdf')(x as ObstetrikUsg['uaEdf'])} />
        <Sayi etiket="MCA PI" adim={0.01} deger={v.mcaPi} onChange={s('mcaPi')} /><Sayi etiket="MCA PSV (cm/sn)" deger={v.mcaPsv} onChange={s('mcaPsv')} />
        <Sayi etiket="Uterin a. PI sağ" adim={0.01} deger={v.uterinPiSag} onChange={s('uterinPiSag')} /><Sayi etiket="Uterin a. PI sol" adim={0.01} deger={v.uterinPiSol} onChange={s('uterinPiSol')} />
      </div>
      <div style={baslikS}>NT / 11–14 hafta</div>
      <div style={izgara}>
        <Sayi etiket="NT (mm)" deger={v.ntMm} onChange={s('ntMm')} />
        <Secim etiket="Nazal kemik" deger={v.nazalKemik} secenekler={[['var', 'Var'], ['yok', 'Yok'], ['degerlendirilemedi', 'Değerlendirilemedi']]} onChange={(x) => s('nazalKemik')(x as ObstetrikUsg['nazalKemik'])} />
      </div>
      <div style={baslikS}>Anatomi</div>
      <div style={izgara}>
        {ANATOMI_ALANLARI.map((a) => <Secim key={a} etiket={USG_ETIKET.anatomi[a]} deger={v.anatomi[a] || ''} secenekler={ANATOMI_DURUMLARI.map((d) => [d, USG_ETIKET.anatomiDurum[d]])} onChange={(x) => set((y) => ({ ...y, anatomi: { ...y.anatomi, [a]: x || undefined } }))} />)}
      </div>
      <label style={{ display: 'block', marginTop: 10 }}><span style={etiketS}>Sonuç / yorum (hekim)</span><textarea value={v.sonuc} onChange={(e) => s('sonuc')(e.target.value)} rows={3} style={{ ...toolsInput, width: '100%', fontFamily: 'inherit' }} /></label>
      <ObstetrikUsgSonucu v={v} />
    </>
  );
}

// ───────────────────────── gynaecological ─────────────────────────
export function JinekolojikUsgSonucu({ v }: { v: JinekolojikUsg }) {
  const h = jinekolojikUsgHesapla(v);
  const s: string[] = [];
  if (h.uterusHacmiMl != null) s.push(`Uterus hacmi: ${h.uterusHacmiMl} mL (elipsoid)`);
  if (h.overSagHacmiMl != null) s.push(`Sağ over hacmi: ${h.overSagHacmiMl} mL`);
  if (h.overSolHacmiMl != null) s.push(`Sol over hacmi: ${h.overSolHacmiMl} mL`);
  if (h.postmenopozalEndometriumBayragi) s.push(`Postmenopozal endometrium ${v.endometriumMm} mm — >4 mm (ACOG CO 734): değerlendirme önerilir`);
  return <div style={sonucKutu} data-kd-rapor="jinekolojik-sonuc">{s.length ? s.map((x, i) => <div key={i}>• {x}</div>) : 'Ölçüm girildikçe hacimler burada görünür.'}</div>;
}

function JinekolojikUsgFormu({ v, set }: { v: JinekolojikUsg; set: (f: (x: JinekolojikUsg) => JinekolojikUsg) => void }) {
  const s = <K extends keyof JinekolojikUsg>(k: K) => (val: JinekolojikUsg[K]) => set((x) => ({ ...x, [k]: val }));
  const uc = (k: 'overSag' | 'overSol', i: number) => (n: number | null) => set((x) => { const a = [...x[k]] as JinekolojikUsg['overSag']; a[i] = n; return { ...x, [k]: a }; });
  return (
    <>
      <div style={izgara}>
        <label><span style={etiketS}>Tarih</span><input type="date" value={v.tarih} onChange={(e) => s('tarih')(e.target.value)} style={{ ...toolsInput, width: '100%' }} /></label>
        <Secim etiket="Yol" deger={v.yol} secenekler={[['transvajinal', 'Transvajinal'], ['transabdominal', 'Transabdominal'], ['transrektal', 'Transrektal']]} onChange={(x) => s('yol')(x as JinekolojikUsg['yol'])} />
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 18, fontSize: 13, color: CHROME_RENK.ink }}><input type="checkbox" checked={v.menopoz} onChange={(e) => s('menopoz')(e.target.checked)} /> Postmenopozal</label>
      </div>
      <div style={baslikS}>Uterus (mm)</div>
      <div style={izgara}>
        <Sayi etiket="Uzunluk" deger={v.uterusUzunlukMm} onChange={s('uterusUzunlukMm')} /><Sayi etiket="AP" deger={v.uterusApMm} onChange={s('uterusApMm')} /><Sayi etiket="Genişlik" deger={v.uterusGenislikMm} onChange={s('uterusGenislikMm')} />
        <label><span style={etiketS}>Pozisyon</span><input value={v.uterusPozisyon} onChange={(e) => s('uterusPozisyon')(e.target.value)} placeholder="AVF / RVF…" style={{ ...toolsInput, width: '100%' }} /></label>
        <Sayi etiket="Endometrium (mm)" deger={v.endometriumMm} onChange={s('endometriumMm')} />
        <label><span style={etiketS}>Endometrium notu</span><input value={v.endometriumNot} onChange={(e) => s('endometriumNot')(e.target.value)} style={{ ...toolsInput, width: '100%' }} /></label>
      </div>
      <div style={baslikS}>Overler (mm)</div>
      <div style={izgara}>
        {[0, 1, 2].map((i) => <Sayi key={`s${i}`} etiket={`Sağ ${['uzunluk', 'AP', 'genişlik'][i]}`} deger={v.overSag[i]} onChange={uc('overSag', i)} />)}
        <label><span style={etiketS}>Sağ over notu</span><input value={v.overSagNot} onChange={(e) => s('overSagNot')(e.target.value)} style={{ ...toolsInput, width: '100%' }} /></label>
        {[0, 1, 2].map((i) => <Sayi key={`l${i}`} etiket={`Sol ${['uzunluk', 'AP', 'genişlik'][i]}`} deger={v.overSol[i]} onChange={uc('overSol', i)} />)}
        <label><span style={etiketS}>Sol over notu</span><input value={v.overSolNot} onChange={(e) => s('overSolNot')(e.target.value)} style={{ ...toolsInput, width: '100%' }} /></label>
      </div>
      <div style={baslikS}>Lezyonlar</div>
      {v.lezyonlar.map((l, i) => (
        <div key={i} style={{ ...izgara, borderTop: `1px solid ${CHROME_RENK.border}`, paddingTop: 8, marginBottom: 6 }}>
          <Secim etiket="Yer" deger={l.yer} secenekler={LEZYON_YERLERI.map((x) => [x, USG_ETIKET.lezyonYer[x]])} onChange={(x) => set((y) => ({ ...y, lezyonlar: y.lezyonlar.map((z, j) => (j === i ? { ...z, yer: x } : z)) }))} />
          <Secim etiket="Tür" deger={l.tur} secenekler={LEZYON_TURLERI.map((x) => [x, USG_ETIKET.lezyonTur[x]])} onChange={(x) => set((y) => ({ ...y, lezyonlar: y.lezyonlar.map((z, j) => (j === i ? { ...z, tur: x } : z)) }))} />
          {[0, 1, 2].map((k) => <Sayi key={k} etiket={`Boyut ${k + 1} (mm)`} deger={l.boyutMm[k]} onChange={(n) => set((y) => ({ ...y, lezyonlar: y.lezyonlar.map((z, j) => { if (j !== i) return z; const b = [...z.boyutMm] as typeof z.boyutMm; b[k] = n; return { ...z, boyutMm: b }; }) }))} />)}
          <label><span style={etiketS}>FIGO (myom)</span><input value={l.figo} onChange={(e) => set((y) => ({ ...y, lezyonlar: y.lezyonlar.map((z, j) => (j === i ? { ...z, figo: e.target.value } : z)) }))} style={{ ...toolsInput, width: '100%' }} /></label>
          <Secim etiket="O-RADS US (hekim)" deger={l.orads} secenekler={['0', '1', '2', '3', '4', '5'].map((x) => [x, x])} onChange={(x) => set((y) => ({ ...y, lezyonlar: y.lezyonlar.map((z, j) => (j === i ? { ...z, orads: x } : z)) }))} />
          <label style={{ gridColumn: 'span 2' }}><span style={etiketS}>Açıklama</span><input value={l.aciklama} onChange={(e) => set((y) => ({ ...y, lezyonlar: y.lezyonlar.map((z, j) => (j === i ? { ...z, aciklama: e.target.value } : z)) }))} style={{ ...toolsInput, width: '100%' }} /></label>
          <button type="button" style={{ ...ghost, alignSelf: 'end' }} onClick={() => set((y) => ({ ...y, lezyonlar: y.lezyonlar.filter((_, j) => j !== i) }))}>Kaldır</button>
        </div>
      ))}
      {v.lezyonlar.length < 12 && <button type="button" style={ghost} onClick={() => set((y) => ({ ...y, lezyonlar: [...y.lezyonlar, { yer: '', tur: '', boyutMm: [null, null, null], figo: '', orads: '', aciklama: '' }] }))}>+ Lezyon ekle</button>}
      <div style={izgara}><label style={{ gridColumn: '1 / -1', marginTop: 10 }}><span style={etiketS}>Serbest sıvı</span><input value={v.serbestSivi} onChange={(e) => s('serbestSivi')(e.target.value)} style={{ ...toolsInput, width: '100%' }} /></label></div>
      <label style={{ display: 'block', marginTop: 10 }}><span style={etiketS}>Sonuç / yorum (hekim)</span><textarea value={v.sonuc} onChange={(e) => s('sonuc')(e.target.value)} rows={3} style={{ ...toolsInput, width: '100%', fontFamily: 'inherit' }} /></label>
      <JinekolojikUsgSonucu v={v} />
    </>
  );
}

// ───────────────────────── NST ─────────────────────────
export function NstSonucu({ v }: { v: NstGirdi }) {
  const r = nstSiniflandir(v);
  if (!r.tamam) return <div style={sonucKutu}>Bazal FKH ve varyabilite girildiğinde sınıflama burada görünür.</div>;
  const renk = r.figo === 'patolojik' ? '#B42318' : r.figo === 'supheli' ? '#B45309' : '#2E6E4E';
  return (
    <div style={sonucKutu} data-kd-rapor="nst-sonuc">
      <div style={{ fontWeight: 800, color: renk }}>{NST_ETIKET.figo[r.figo!]}</div>
      {r.reaktivite && <div>Antenatal NST: {NST_ETIKET.reaktivite[r.reaktivite]}{r.akselerasyonEsigi ? ` (akselerasyon ölçütü ${NST_ETIKET.esik[r.akselerasyonEsigi]}; ACOG PB 229)` : ''}</div>}
      {r.ozellikler.map((o) => <div key={o}>• {NST_ETIKET.ozellik[o]}</div>)}
      <div style={{ fontSize: 11, color: CHROME_RENK.muted, marginTop: 6 }}>Sınıflama FIGO 2015 eşiklerini uygular; klinik karar hekimindir.</div>
    </div>
  );
}

function NstFormu({ v, set }: { v: NstGirdi; set: (f: (x: NstGirdi) => NstGirdi) => void }) {
  const s = <K extends keyof NstGirdi>(k: K) => (val: NstGirdi[K]) => set((x) => ({ ...x, [k]: val }));
  return (
    <>
      <div style={izgara}>
        <label><span style={etiketS}>Tarih</span><input type="date" value={v.tarih} onChange={(e) => s('tarih')(e.target.value)} style={{ ...toolsInput, width: '100%' }} /></label>
        <label><span style={etiketS}>Saat</span><input type="time" value={v.saat} onChange={(e) => s('saat')(e.target.value)} style={{ ...toolsInput, width: '100%' }} /></label>
        <Sayi etiket="Gebelik haftası" adim={1} deger={v.haftaGun.hafta} onChange={(n) => set((x) => ({ ...x, haftaGun: { ...x.haftaGun, hafta: n } }))} />
        <Sayi etiket="Süre (dk)" adim={1} deger={v.sureDk} onChange={s('sureDk')} />
        <Sayi etiket="Bazal FKH (/dk)" adim={1} deger={v.bazalFkh} onChange={s('bazalFkh')} />
        <Sayi etiket="Varyabilite (vuru/dk)" adim={1} deger={v.varyabiliteBpm} onChange={s('varyabiliteBpm')} />
        <Sayi etiket="<5 varyabilite süresi (dk)" adim={1} deger={v.azalmisVaryabiliteDk} onChange={s('azalmisVaryabiliteDk')} />
        <Sayi etiket=">25 varyabilite süresi (dk)" adim={1} deger={v.artmisVaryabiliteDk} onChange={s('artmisVaryabiliteDk')} />
        <Sayi etiket="Sinüzoidal patern (dk)" adim={1} deger={v.sinuzoidalDk} onChange={s('sinuzoidalDk')} />
        <Sayi etiket="Akselerasyon (20 dk içinde)" adim={1} deger={v.akselerasyon20dk} onChange={s('akselerasyon20dk')} />
        <Sayi etiket="Kontraksiyon (/10 dk)" adim={1} deger={v.kontraksiyon10dk} onChange={s('kontraksiyon10dk')} />
      </div>
      <div style={baslikS}>Deselerasyonlar (sayı)</div>
      <div style={izgara}>
        <Sayi etiket="Erken" adim={1} deger={v.erkenDes} onChange={s('erkenDes')} /><Sayi etiket="Geç" adim={1} deger={v.gecDes} onChange={s('gecDes')} />
        <Sayi etiket="Değişken" adim={1} deger={v.degiskenDes} onChange={s('degiskenDes')} /><Sayi etiket="Uzamış (>3 dk)" adim={1} deger={v.uzamisDes} onChange={s('uzamisDes')} />
        <Sayi etiket="En uzun deselerasyon (dk)" adim={0.5} deger={v.enUzunDesDk} onChange={s('enUzunDesDk')} />
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 18, fontSize: 13, color: CHROME_RENK.ink }}><input type="checkbox" checked={v.tekrarlayan} onChange={(e) => s('tekrarlayan')(e.target.checked)} /> Tekrarlayan (&gt;%50 kontraksiyon)</label>
        {v.tekrarlayan && <Sayi etiket="Tekrarlayan geç/uzamış süresi (dk)" adim={1} deger={v.tekrarlayanDesDk} onChange={s('tekrarlayanDesDk')} />}
      </div>
      <label style={{ display: 'block', marginTop: 10 }}><span style={etiketS}>Yorum / plan (hekim)</span><textarea value={v.sonuc} onChange={(e) => s('sonuc')(e.target.value)} rows={2} style={{ ...toolsInput, width: '100%', fontFamily: 'inherit' }} /></label>
      <NstSonucu v={v} />
    </>
  );
}

// ───────────────────────── panel ─────────────────────────
export default function KdRaporlar({ patientId, gebelikId, dogumVar }: { patientId: string; gebelikId?: string | null; dogumVar?: boolean }) {
  const [raporlar, setRaporlar] = useState<Rapor[] | null>(null);
  const [acik, setAcik] = useState<{ tur: Tur; id?: string } | null>(null);
  const [obs, setObs] = useState<ObstetrikUsg>({ ...BOS_OBSTETRIK_USG, tarih: bugun() });
  const [jin, setJin] = useState<JinekolojikUsg>({ ...BOS_JINEKOLOJIK_USG, tarih: bugun() });
  const [nst, setNst] = useState<NstGirdi>({ ...BOS_NST, tarih: bugun() });
  const [mesaj, setMesaj] = useState('');

  const yukle = useCallback(async () => {
    const t = await getAccessTokenAsync();
    const r = await fetch(`/api/doktor/kd-raporlari?patientId=${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' });
    const j = await r.json().catch(() => ({}));
    setRaporlar(r.ok ? j.raporlar || [] : []);
  }, [patientId]);
  useEffect(() => { yukle(); }, [yukle]);

  const ac = (tur: Tur, r?: Rapor) => {
    setMesaj('');
    if (tur === 'usg_obstetrik') setObs(r ? { ...BOS_OBSTETRIK_USG, ...(r.veri as ObstetrikUsg) } : { ...BOS_OBSTETRIK_USG, tarih: bugun() });
    if (tur === 'usg_jinekolojik') setJin(r ? { ...BOS_JINEKOLOJIK_USG, ...(r.veri as JinekolojikUsg) } : { ...BOS_JINEKOLOJIK_USG, tarih: bugun() });
    if (tur === 'nst') setNst(r ? { ...BOS_NST, ...(r.veri as NstGirdi) } : { ...BOS_NST, tarih: bugun() });
    setAcik({ tur, id: r?.id });
  };
  const veri = useMemo(() => (acik?.tur === 'usg_obstetrik' ? obs : acik?.tur === 'usg_jinekolojik' ? jin : nst), [acik, obs, jin, nst]);

  const kaydet = async () => {
    if (!acik) return;
    setMesaj('');
    const t = await getAccessTokenAsync();
    const r = await fetch('/api/doktor/kd-raporlari', { method: 'POST', headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId, id: acik.id, tur: acik.tur, gebelikId: acik.tur === 'usg_jinekolojik' ? undefined : gebelikId || undefined, veri }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setMesaj(j.error || 'Kaydedilemedi.'); return; }
    setAcik(null); yukle();
  };

  return (
    <div style={{ ...toolsCard, marginBottom: 12 }} data-kd="raporlar">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 700, color: CHROME_RENK.ink }}>USG &amp; NST Raporları</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['usg_obstetrik', 'usg_jinekolojik', 'nst'] as Tur[]).map((t) => <button key={t} type="button" style={ghost} onClick={() => ac(t)}>+ {TUR_AD[t]}</button>)}
          {dogumVar && <a href={`/dashboard/doktor/hastalar/${patientId}/gebelik/dogum-epikrizi/yazdir`} target="_blank" rel="noreferrer" style={{ ...btn, textDecoration: 'none' }} data-kd="dogum-epikrizi-link">Doğum epikrizi (yazdır)</a>}
        </div>
      </div>
      {acik && (
        <div style={{ marginTop: 12, borderTop: `1px solid ${CHROME_RENK.border}`, paddingTop: 10 }}>
          <div style={{ fontWeight: 700, color: CHROME_RENK.ink, marginBottom: 6 }}>{TUR_AD[acik.tur]}{acik.id ? ' (düzenle)' : ''}</div>
          {acik.tur === 'usg_obstetrik' && <ObstetrikUsgFormu v={obs} set={setObs} />}
          {acik.tur === 'usg_jinekolojik' && <JinekolojikUsgFormu v={jin} set={setJin} />}
          {acik.tur === 'nst' && <NstFormu v={nst} set={setNst} />}
          {mesaj && <div style={{ color: CHROME_RENK.warn, fontSize: 12.5, marginTop: 8 }}>{mesaj}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}><button type="button" style={btn} onClick={kaydet}>Kaydet</button><button type="button" style={ghost} onClick={() => setAcik(null)}>Vazgeç</button></div>
        </div>
      )}
      {raporlar && raporlar.length > 0 && (
        <div style={{ marginTop: 10 }}>
          {raporlar.map((r) => (
            <div key={r.id} style={{ display: 'flex', gap: 8, alignItems: 'center', borderTop: `1px solid ${CHROME_RENK.border}`, padding: '8px 0', flexWrap: 'wrap' }}>
              <span style={{ flex: 1, fontSize: 13, color: CHROME_RENK.ink }}>{TUR_AD[r.tur]} · {new Date(`${r.rapor_tarihi}T12:00:00Z`).toLocaleDateString('tr-TR')}</span>
              <button type="button" style={ghost} onClick={() => ac(r.tur, r)}>Düzenle</button>
              <a href={`/dashboard/doktor/hastalar/${patientId}/kd-rapor/${r.id}/yazdir`} target="_blank" rel="noreferrer" style={{ ...ghost, textDecoration: 'none' }}>Yazdır / PDF</a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
