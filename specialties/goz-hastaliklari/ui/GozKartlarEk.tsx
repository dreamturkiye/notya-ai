'use client';
/**
 * GOZ-EXCEPTIONAL-01 — Göz sekmelerine eklenen kartlar: acil şablon (yıkama zamanlayıcısı + yazdırılabilir eylem listesi),
 * Fundus → DR (hekim onaylı), lazer kaydı, IVT odası kontrol listesi, katarakt biyometri + post-op, biyomikroskopi + keratokonus,
 * OCT kalınlık, şaşılık testleri + ROP kartı, hasta hatırlatması. Motor önerir/uyarır; evre, tanı, doz, GİL gücü hekimin.
 */
import React, { useEffect, useState } from 'react';
import { toolsInput } from '@/lib/doktor/toolsUi';
import { stil } from './stil';
import { EVRE_ADI, DMO_ADI, LAZER_AD, type Lazer } from '../engines/dr';
import { BIYO_ALANLAR, normalBiyoGoz, biyoMetni, keratokonusMetni, refraksiyonGozMetni, type Biyomikroskopi, type Keratokonus, type Refraksiyon } from '../engines/muayene';
import { ROP_ZON, ROP_EVRE, PLUS_AD } from '../engines/rop';
import { GOZ_BAYRAK_AD, type GozKohortBayrak } from '../engines/kohort';
import type { AcilBayrak, AcilKod } from '../engines/acil';
import type { Biyometri, PostopKayit } from '../engines/katarakt';
import type { GlokomOneri } from '../engines/glokom';
import type { Dipnot } from '../protocols/sources';

const { btn, ghost, etiket, kucuk, satir, metin } = stil;
type Calistir = (b: Record<string, unknown>, ok?: string) => Promise<Record<string, unknown> | null>;
const bugun = () => new Date().toISOString().slice(0, 10);
const gozAd = (g: string | null | undefined) => (g === 'sag' ? 'OD' : g === 'sol' ? 'OS' : g === 'iki' ? 'OU' : '—');
const kutu: React.CSSProperties = { border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 8, marginTop: 10 };
const inp = (w: number | string): React.CSSProperties => ({ ...toolsInput, width: w, minWidth: 0 });
const Secim = ({ deger, set, secenekler, bos, ad }: { deger: string; set: (x: string) => void; secenekler: Array<[string, string]>; bos?: string; ad?: string }) => (
  <select aria-label={ad} value={deger} onChange={(e) => set(e.target.value)} style={{ ...toolsInput, width: 'auto' }}>
    {bos != null && <option value="" style={{ color: '#000' }}>{bos}</option>}
    {secenekler.map(([k, a]) => <option key={k} value={k} style={{ color: '#000' }}>{a}</option>)}
  </select>
);
const Kutu = ({ c, set, children }: { c: boolean; set: (x: boolean) => void; children: React.ReactNode }) => (
  <label style={{ ...metin, display: 'flex', gap: 6, alignItems: 'flex-start', minHeight: 28 }}><input type="checkbox" checked={c} onChange={(e) => set(e.target.checked)} style={{ marginTop: 3 }} /><span>{children}</span></label>
);

// ────────────────────────────── Veri sözleşmesi (GET /api/doktor/goz ek alanları) ──────────────────────────────
export interface GozEkVeri {
  lazerler: Lazer[]
  lazerOzeti: { goz: 'sag' | 'sol'; satirlar: string[] }[]
  rop: Array<{ id: string; tarih: string; pmaHafta: number | null; metin: string; sonrakiTarama: string | null }>
  ropEndikasyon: { var: boolean | null; metin: string } | null
  pediatrikGorunum: { pediatrikSekme: boolean; ropKart: boolean }
  acilKayitlari: Array<{ id: string; baslangic: string | null; bitis: string | null; dakika: number | null; canliDakika: number | null; ph_once: string | null; ph_sonra: string | null; va: { sag?: string | null; sol?: string | null; saat?: string | null } | null; kontrol: Record<string, boolean> | null }>
  acilEylemListesi: Record<AcilKod, string[]>
  octOlcumleri: Array<{ goruntu_id: string; goz: string | null; mfk_mikron: number | null; rnfl_mikron: number | null; not_hekim: string | null }>
  glokomOnerileri: GlokomOneri[]
  glokomOneriEtiketi: string
  shafferAd: Record<string, string>
  ivtKontrol: Array<{ kod: string; ad: string }>
  hatirlatma: { bayraklar: GozKohortBayrak[]; detay: string[]; sonGonderim: string | null }
  sonRefraksiyon: (Refraksiyon & { tarih: string }) | null
  sonBiyomikroskopi: (Biyomikroskopi & { tarih: string }) | null
  sonKeratokonus: (Keratokonus & { tarih: string }) | null
}

// ────────────────────────────── Acil şablon ──────────────────────────────
/** Acil bandının altında: bayrak başına eylem listesi (yazdırılabilir) + kimyasal yıkama zamanlayıcısı. */
export function AcilSablon({ acil, v, calistir, salt }: { acil: AcilBayrak[]; v: GozEkVeri; calistir: Calistir; salt: boolean }) {
  const [acik, setAcik] = useState(false);
  const [simdi, setSimdi] = useState(Date.now());
  const [yerel, setYerel] = useState<Record<string, string>>({});
  const aktif = v.acilKayitlari.find((a) => a.baslangic && !a.bitis) || null;
  const son = aktif || v.acilKayitlari[0] || null;
  useEffect(() => { if (!aktif) return; const t = setInterval(() => setSimdi(Date.now()), 1000); return () => clearInterval(t); }, [aktif]);
  const kimyasal = acil.some((a) => a.kod === 'kimyasal_yanik');
  const kodlar = acil.length ? acil.map((a) => a.kod) : (['kimyasal_yanik'] as AcilKod[]);
  const liste = [...new Set(kodlar.flatMap((k) => v.acilEylemListesi[k] || []))];
  const kontrol = { ...(son?.kontrol || {}) } as Record<string, boolean>;
  const sure = aktif?.baslangic ? Math.max(0, Math.floor((simdi - Date.parse(aktif.baslangic)) / 1000)) : null;
  const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const saat = (iso: string | null) => (iso ? new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '—');
  const yazdir = () => {
    const w = window.open('', '_blank', 'width=720,height=900');
    if (!w) return;
    const esc = (x: string) => x.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string));
    w.document.write(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Göz acil eylem listesi</title><style>body{font-family:system-ui,sans-serif;padding:24px;color:#111}h1{font-size:18px}li{margin:10px 0;font-size:15px}.k{display:inline-block;width:16px;height:16px;border:2px solid #111;margin-right:10px;vertical-align:middle}small{color:#555}</style></head><body><h1>Göz acil eylem listesi</h1><p>${esc(acil.map((a) => a.ad).join(' · ') || 'Kimyasal temas')}</p><ol>${liste.map((x) => `<li><span class="k"></span>${esc(x)}</li>`).join('')}</ol><p>Saat: ______ &nbsp; VA OD: ______ OS: ______ &nbsp; pH önce: ____ sonra: ____</p><small>112 / acil yönlendirmesini geciktirmeyin. Klinik karar hekimindir.</small><script>window.print()</script></body></html>`);
    w.document.close();
  };
  return (
    <div style={{ marginTop: 6 }}>
      <button type="button" onClick={() => setAcik(!acik)} style={{ ...ghost, color: '#FCA5A5', borderColor: 'rgba(248,113,113,0.5)' }}>{acik ? 'Acil şablonu kapat' : 'Acil şablon — eylem listesi' + (kimyasal ? ' + yıkama zamanlayıcısı' : '')}</button>
      {acik && (
        <div style={{ marginTop: 8, color: '#EDF1F7' }}>
          {(kimyasal || aktif) && !salt && (
            <div style={{ border: '1px solid rgba(248,113,113,0.5)', borderRadius: 8, padding: 8, marginBottom: 8 }}>
              <div style={{ ...etiket, color: '#F87171' }}>Kimyasal yıkama zamanlayıcısı</div>
              {!aktif ? (
                <div style={satir}>
                  <input value={yerel.phOnce || ''} onChange={(e) => setYerel({ ...yerel, phOnce: e.target.value })} placeholder="pH önce (imkân varsa)" aria-label="pH önce" style={inp(150)} />
                  <button type="button" onClick={() => calistir({ adim: 'acil_kayit', eylem: 'baslat', phOnce: yerel.phOnce || null }, 'Yıkama başladı — saat kaydedildi.')} style={{ ...btn, background: '#DC2626' }}>Yıkama BAŞLAT</button>
                </div>
              ) : (
                <div style={satir}>
                  <span style={{ fontSize: 22, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: '#FCA5A5' }} aria-live="polite">{sure != null ? mmss(sure) : '—'}</span>
                  <span style={kucuk}>başladı {saat(aktif.baslangic)}</span>
                  <button type="button" onClick={() => calistir({ adim: 'acil_kayit', eylem: 'bitir', id: aktif.id }, 'Yıkama bitti — süre kaydedildi.')} style={btn}>Yıkamayı BİTİR</button>
                </div>
              )}
              {son && !aktif && son.bitis && <div style={{ ...metin, marginTop: 4 }}>Son yıkama: {saat(son.baslangic)}–{saat(son.bitis)} · <b>{String(son.dakika ?? '—').replace('.', ',')} dk</b></div>}
            </div>
          )}
          <div style={etiket}>Eylem listesi</div>
          {liste.map((x) => (
            <Kutu key={x} c={yerel[`k_${x}`] != null ? yerel[`k_${x}`] === '1' : !!kontrol[x]} set={(c) => setYerel({ ...yerel, [`k_${x}`]: c ? '1' : '0' })}>{x}</Kutu>
          ))}
          {!salt && son && (
            <div style={satir}>
              <input value={yerel.vaSag ?? son.va?.sag ?? ''} onChange={(e) => setYerel({ ...yerel, vaSag: e.target.value })} placeholder="VA OD" aria-label="Acil VA sağ" style={inp(80)} />
              <input value={yerel.vaSol ?? son.va?.sol ?? ''} onChange={(e) => setYerel({ ...yerel, vaSol: e.target.value })} placeholder="VA OS" aria-label="Acil VA sol" style={inp(80)} />
              <input type="time" value={yerel.vaSaat ?? son.va?.saat ?? ''} onChange={(e) => setYerel({ ...yerel, vaSaat: e.target.value })} aria-label="VA saati" style={inp(110)} />
              <input value={yerel.phSonra ?? son.ph_sonra ?? ''} onChange={(e) => setYerel({ ...yerel, phSonra: e.target.value })} placeholder="pH sonra" aria-label="pH sonra" style={inp(90)} />
              <button type="button" onClick={() => calistir({ adim: 'acil_kayit', eylem: 'kaydet', id: son.id, va: { sag: yerel.vaSag ?? son.va?.sag ?? null, sol: yerel.vaSol ?? son.va?.sol ?? null, saat: yerel.vaSaat ?? son.va?.saat ?? null }, phSonra: yerel.phSonra ?? son.ph_sonra ?? null, kontrol: Object.fromEntries(liste.map((x) => [x, yerel[`k_${x}`] != null ? yerel[`k_${x}`] === '1' : !!kontrol[x]])) }, 'Acil kaydı güncellendi.')} style={ghost}>Kaydet</button>
              <button type="button" onClick={() => calistir({ adim: 'acil_nota', id: son.id }, 'Acil kaydı bugünkü notun Objektif bölümüne eklendi.')} style={ghost}>Nota ekle (O)</button>
            </div>
          )}
          <div style={satir}><button type="button" onClick={yazdir} style={ghost}>Yazdır</button><span style={kucuk}>112 / acil yönlendirmesini geciktirmeyin — liste hatırlatıcıdır, klinik karar hekimindir.</span></div>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────── Fundus → DR ──────────────────────────────
export function FundusDrPaneli({ fundusTarihi, dr, calistir, kapat }: { fundusTarihi: string; dr: Record<string, unknown> | null; calistir: Calistir; kapat: () => void }) {
  const [e, setE] = useState<Record<string, string>>({ evreSag: String(dr?.evre_sag || ''), evreSol: String(dr?.evre_sol || ''), dmoSag: String(dr?.dmo_sag || ''), dmoSol: String(dr?.dmo_sol || '') });
  const [onay, setOnay] = useState(false);
  const evreSec = Object.entries(EVRE_ADI) as Array<[string, string]>, dmoSec = Object.entries(DMO_ADI) as Array<[string, string]>;
  return (
    <div style={{ ...kutu, borderColor: 'rgba(45,212,191,0.45)' }}>
      <div style={etiket}>DR evresini güncelle <span style={kucuk}>· fundus {fundusTarihi} · evreyi siz seçersiniz — Notya fundus metninden / görüntüden evre çıkarmaz</span></div>
      <div style={satir}><span style={kucuk}>OD</span><Secim ad="Evre OD" deger={e.evreSag} set={(x) => setE({ ...e, evreSag: x })} secenekler={evreSec} bos="evre" /><Secim ad="DMÖ OD" deger={e.dmoSag} set={(x) => setE({ ...e, dmoSag: x })} secenekler={dmoSec} bos="DMÖ" /></div>
      <div style={satir}><span style={kucuk}>OS</span><Secim ad="Evre OS" deger={e.evreSol} set={(x) => setE({ ...e, evreSol: x })} secenekler={evreSec} bos="evre" /><Secim ad="DMÖ OS" deger={e.dmoSol} set={(x) => setE({ ...e, dmoSol: x })} secenekler={dmoSec} bos="DMÖ" /></div>
      <Kutu c={onay} set={setOnay}>Bu evreyi kendi fundus muayenemle belirledim (hekim kilidi).</Kutu>
      <div style={satir}>
        <button type="button" disabled={!onay} onClick={async () => { const j = await calistir({ adim: 'fundus_dr', hekimOnay: onay, fundusTarihi, ...e }, 'DR kartı güncellendi (hekim evresi) — kontrol pencereleri DR sekmesinde.'); if (j) kapat(); }} style={{ ...btn, opacity: onay ? 1 : 0.45 }}>DR kartına yaz</button>
        <button type="button" onClick={kapat} style={ghost}>Şimdi değil</button>
      </div>
    </div>
  );
}

// ────────────────────────────── Lazer ──────────────────────────────
export function LazerKarti({ v, calistir, salt }: { v: GozEkVeri; calistir: Calistir; salt: boolean }) {
  const [l, setL] = useState<Record<string, string>>({ goz: 'sag', tip: 'prp', tarih: bugun() });
  const [nota, setNota] = useState(true);
  return (
    <div style={kutu}>
      <div style={etiket}>Lazer kaydı <span style={kucuk}>· PRP / fokal / grid · göz başına · kontrole bağlanır · tanıdan bağımsız hekim kaydı</span></div>
      {v.lazerOzeti.map((o) => <div key={o.goz} style={metin}><b>{gozAd(o.goz)}:</b> {o.satirlar.length ? o.satirlar.join(' | ') : <span style={kucuk}>kayıt yok</span>}</div>)}
      {!salt && <>
        <div style={satir}>
          <Secim ad="Lazer göz" deger={l.goz} set={(x) => setL({ ...l, goz: x })} secenekler={[['sag', 'OD'], ['sol', 'OS']]} />
          <Secim ad="Lazer tipi" deger={l.tip} set={(x) => setL({ ...l, tip: x })} secenekler={Object.entries(LAZER_AD) as Array<[string, string]>} />
          <input type="date" aria-label="Lazer tarihi" value={l.tarih} onChange={(e) => setL({ ...l, tarih: e.target.value })} style={inp(150)} />
          <input value={l.seansNo || ''} onChange={(e) => setL({ ...l, seansNo: e.target.value })} placeholder="seans no" aria-label="Seans no" inputMode="numeric" style={inp(80)} />
        </div>
        <div style={satir}>
          <input value={l.hekimAdi || ''} onChange={(e) => setL({ ...l, hekimAdi: e.target.value })} placeholder="uygulayan hekim (boşsa siz)" aria-label="Uygulayan hekim" style={inp(200)} />
          <span style={kucuk}>kontrol</span><input type="date" aria-label="Lazer sonrası kontrol" value={l.kontrolTarihi || ''} onChange={(e) => setL({ ...l, kontrolTarihi: e.target.value })} style={inp(150)} />
          <input value={l.not || ''} onChange={(e) => setL({ ...l, not: e.target.value })} placeholder="not (opsiyonel)" aria-label="Lazer notu" style={{ ...inp(160), flex: 1 }} />
        </div>
        <div style={satir}>
          <Kutu c={nota} set={setNota}>Bugünkü nota ekle (O)</Kutu>
          <button type="button" onClick={async () => { const j = await calistir({ adim: 'lazer', ...l, notaEkle: nota }, 'Lazer kaydedildi.'); if (j) setL({ goz: l.goz, tip: l.tip, tarih: bugun() }); }} style={btn}>Lazeri kaydet</button>
        </div>
      </>}
    </div>
  );
}

// ────────────────────────────── IVT odası kontrol listesi ──────────────────────────────
export function IvtKontrolPaneli({ goz, maddeler, onay, iptal }: { goz: 'sag' | 'sol'; maddeler: Array<{ kod: string; ad: string }>; onay: (k: Record<string, unknown>) => void; iptal: () => void }) {
  const [k, setK] = useState<Record<string, unknown>>({ isaretliGoz: '' });
  const [gecmis, setGecmis] = useState(false);
  const tamam = gecmis || (maddeler.every((m) => !!k[m.kod]) && String(k.lot || '').trim() !== '' && k.isaretliGoz === goz);
  return (
    <div style={{ ...kutu, borderColor: 'rgba(96,165,250,0.5)' }} role="group" aria-label="IVT odası kontrol listesi">
      <div style={etiket}>IVT odası kontrol listesi — {gozAd(goz)} <span style={kucuk}>· "yapıldı" öncesi zorunlu</span></div>
      {!gecmis && <>
        {maddeler.map((m) => <Kutu key={m.kod} c={!!k[m.kod]} set={(c) => setK({ ...k, [m.kod]: c })}>{m.ad}</Kutu>)}
        <div style={satir}>
          <span style={kucuk}>İşaretlenen göz</span>
          <Secim ad="İşaretlenen göz" deger={String(k.isaretliGoz || '')} set={(x) => setK({ ...k, isaretliGoz: x })} secenekler={[['sag', 'OD (sağ)'], ['sol', 'OS (sol)']]} bos="seçin" />
          <input value={String(k.lot || '')} onChange={(e) => setK({ ...k, lot: e.target.value })} placeholder="lot / seri no" aria-label="Lot" style={inp(150)} />
          <input type="time" value={String(k.saat || '')} onChange={(e) => setK({ ...k, saat: e.target.value })} aria-label="Uygulama saati" style={inp(110)} />
        </div>
        {!!k.isaretliGoz && k.isaretliGoz !== goz && <div style={{ ...metin, color: '#F87171', fontWeight: 700 }}>YANLIŞ GÖZ: kayıt {gozAd(goz)}, işaretlenen {gozAd(String(k.isaretliGoz))}.</div>}
      </>}
      <Kutu c={gecmis} set={setGecmis}>Geçmiş kayıt (başka merkezde / önceden yapıldı — liste uygulanamaz)</Kutu>
      <div style={satir}>
        <button type="button" disabled={!tamam} onClick={() => onay(gecmis ? { gecmisKayit: true } : k)} style={{ ...btn, opacity: tamam ? 1 : 0.45 }}>Yapıldı olarak işaretle</button>
        <button type="button" onClick={iptal} style={ghost}>Vazgeç</button>
      </div>
    </div>
  );
}

// ────────────────────────────── Katarakt: biyometri + post-op ──────────────────────────────
export function KataraktEk({ k, ek3g, calistir, salt }: { k: { id: string; goz: string; checklist: Record<string, boolean>; gil_tipi_hekim: string | null; planlanan_tarih: string | null; durum: string; biyometri?: Biyometri | null; postop?: Partial<Record<'gun1' | 'hafta1', PostopKayit>> | null; ek3g_kod?: string | null; postopUyari?: string[] }; ek3g: Array<{ kod: string; ad: string }>; calistir: Calistir; salt: boolean }) {
  const b = k.biyometri || null;
  const [bi, setBi] = useState<Record<string, string>>({});
  const [po, setPo] = useState<Record<string, string>>({ zaman: 'gun1', tarih: bugun() });
  const [endof, setEndof] = useState(false);
  const d = (x: number | null | undefined) => (x == null ? '' : String(x).replace('.', ','));
  const val = (key: keyof Biyometri) => (bi[key] ?? (b?.[key] != null ? (typeof b[key] === 'number' ? d(b[key] as number) : String(b[key])) : ''));
  return (
    <div style={{ marginTop: 6 }}>
      {(k.postopUyari || []).map((u) => <div key={u} role="alert" style={{ ...metin, color: '#F87171', fontWeight: 700 }}>⚠ {u}</div>)}
      <div style={kucuk}>Biyometri (hekim girer) · GİL gücü Notya tarafından hesaplanmaz{b?.alMm != null ? ` · kayıtlı: AL ${d(b.alMm)} mm, K1 ${d(b.k1D)} / K2 ${d(b.k2D)} D, A ${d(b.aSabiti)}` : ''}</div>
      {!salt && <>
        <div style={satir}>
          {([['alMm', 'AL mm', 80], ['k1D', 'K1 D', 70], ['k2D', 'K2 D', 70], ['kAks', 'K aks °', 70], ['aSabiti', 'A-sabiti', 80]] as const).map(([key, ph, w]) => <input key={key} value={val(key)} onChange={(e) => setBi({ ...bi, [key]: e.target.value })} placeholder={ph} aria-label={ph} inputMode="decimal" style={inp(w)} />)}
          <input value={val('cihaz')} onChange={(e) => setBi({ ...bi, cihaz: e.target.value })} placeholder="cihaz" aria-label="Biyometri cihazı" style={inp(110)} />
          <input type="date" value={val('tarih')} onChange={(e) => setBi({ ...bi, tarih: e.target.value })} aria-label="Biyometri tarihi" style={inp(150)} />
        </div>
        <div style={satir}>
          <Secim ad="EK-3/G kalemi" deger={bi.ek3g ?? k.ek3g_kod ?? ''} set={(x) => setBi({ ...bi, ek3g: x })} secenekler={ek3g.map((x) => [x.kod, `${x.kod} — ${x.ad}`])} bos="EK-3/G kodu" />
          <button type="button" onClick={() => calistir({ adim: 'katarakt', id: k.id, goz: k.goz, gilTipi: k.gil_tipi_hekim || null, planlananTarih: k.planlanan_tarih || null, checklist: k.checklist, durum: k.durum, biyometri: Object.fromEntries((['alMm', 'k1D', 'k2D', 'kAks', 'aSabiti', 'cihaz', 'tarih'] as const).map((x) => [x, val(x)])), ek3gKod: bi.ek3g ?? k.ek3g_kod ?? null }, 'Biyometri / EK-3/G kaydedildi.')} style={ghost}>Biyometriyi kaydet</button>
        </div>
      </>}
      {(['gun1', 'hafta1'] as const).map((z) => k.postop?.[z] ? <div key={z} style={metin}><b>{z === 'gun1' ? 'Post-op 1. gün' : 'Post-op 1. hafta'}</b> {k.postop[z]!.tarih || ''}: VA {k.postop[z]!.va || '—'} · GİB {k.postop[z]!.gib ?? '—'} · kornea {k.postop[z]!.kornea || '—'}{k.postop[z]!.endoftalmiBayrak ? <b style={{ color: '#F87171' }}> · ENDOFTALMİ ŞÜPHESİ</b> : ''}</div> : null)}
      {!salt && <>
        <div style={satir}>
          <Secim ad="Post-op zamanı" deger={po.zaman} set={(x) => setPo({ ...po, zaman: x })} secenekler={[['gun1', 'Post-op 1. gün'], ['hafta1', 'Post-op 1. hafta']]} />
          <input type="date" aria-label="Post-op tarihi" value={po.tarih} onChange={(e) => setPo({ ...po, tarih: e.target.value })} style={inp(150)} />
          <input value={po.va || ''} onChange={(e) => setPo({ ...po, va: e.target.value })} placeholder="VA" aria-label="Post-op VA" style={inp(70)} />
          <input value={po.gib || ''} onChange={(e) => setPo({ ...po, gib: e.target.value })} placeholder="GİB" aria-label="Post-op GİB" inputMode="decimal" style={inp(70)} />
          <input value={po.kornea || ''} onChange={(e) => setPo({ ...po, kornea: e.target.value })} placeholder="kornea (ör. saydam / ödem)" aria-label="Kornea" style={{ ...inp(160), flex: 1 }} />
        </div>
        <div style={satir}>
          <Kutu c={endof} set={setEndof}><span style={{ color: endof ? '#F87171' : undefined }}>Endoftalmi şüphesi (hekim işareti)</span></Kutu>
          <button type="button" onClick={async () => { const j = await calistir({ adim: 'katarakt_postop', id: k.id, zaman: po.zaman, kayit: { ...po, endoftalmiBayrak: endof } }, 'Post-op kaydedildi.'); if (j) { setPo({ zaman: po.zaman === 'gun1' ? 'hafta1' : 'hafta1', tarih: bugun() }); setEndof(false); } }} style={btn}>Post-op kaydet</button>
          <button type="button" onClick={() => calistir({ adim: 'katarakt_nota', id: k.id }, 'Biyometri / post-op bugünkü notun Objektif bölümüne eklendi.')} style={ghost}>Nota ekle (O)</button>
        </div>
      </>}
    </div>
  );
}

// ────────────────────────────── Biyomikroskopi + keratokonus ──────────────────────────────
export function BiyoKarti({ v, calistir, salt }: { v: GozEkVeri; calistir: Calistir; salt: boolean }) {
  const son = v.sonBiyomikroskopi;
  const [f, setF] = useState<Record<string, string>>({});
  const [flo, setFlo] = useState(false);
  const [k, setK] = useState<Record<string, string>>({});
  const al = (t: 'sag' | 'sol', a: string) => f[`${t}_${a}`] ?? (son?.tarih === bugun() ? String((son?.[t] as Record<string, string | null> | undefined)?.[a] || '') : '');
  const normal = () => { const n = normalBiyoGoz(); const o: Record<string, string> = {}; for (const t of ['sag', 'sol'] as const) for (const [a, x] of Object.entries(n)) o[`${t}_${a}`] = String(x || ''); setF(o); };
  const payload = () => ({ floresein: flo, sag: Object.fromEntries(BIYO_ALANLAR.map(([a]) => [a, al('sag', a)])), sol: Object.fromEntries(BIYO_ALANLAR.map(([a]) => [a, al('sol', a)])) });
  const ker = v.sonKeratokonus;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={etiket}>Biyomikroskopi (ön segment) <span style={kucuk}>· OD/OS · gözlem kaydı, tanı yok</span></div>
      {son && <div style={{ ...metin, padding: 8, background: 'rgba(255,255,255,0.03)', borderRadius: 8, marginBottom: 6 }}>{son.tarih}: {biyoMetni(son)}</div>}
      {!salt && <>
        <div className="goz-giris" style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0,1fr) minmax(0,1fr)', gap: 6, alignItems: 'center', fontSize: 12 }}>
          <span /><b style={{ color: '#2DD4BF' }}>OD (sağ)</b><b style={{ color: '#60A5FA' }}>OS (sol)</b>
          {BIYO_ALANLAR.map(([a, ad]) => <React.Fragment key={a}><span style={kucuk}>{ad}</span><input aria-label={`Sağ ${ad}`} value={al('sag', a)} onChange={(e) => setF({ ...f, [`sag_${a}`]: e.target.value })} style={{ ...toolsInput, minWidth: 0 }} /><input aria-label={`Sol ${ad}`} value={al('sol', a)} onChange={(e) => setF({ ...f, [`sol_${a}`]: e.target.value })} style={{ ...toolsInput, minWidth: 0 }} /></React.Fragment>)}
        </div>
        <div style={satir}>
          <button type="button" onClick={normal} style={ghost}>Her iki göz doğal</button>
          <Kutu c={flo} set={setFlo}>Floresein boyalı</Kutu>
          <button type="button" onClick={() => calistir({ adim: 'biyomikroskopi', biyomikroskopi: payload() }, 'Biyomikroskopi kaydedildi.')} style={btn}>Kaydet</button>
          <button type="button" onClick={() => calistir({ adim: 'on_segment_nota' }, 'Ön segment bugünkü notun Objektif bölümüne eklendi.')} style={ghost}>Nota ekle (O)</button>
        </div>
      </>}
      <div style={{ ...kutu }}>
        <div style={etiket}>Keratokonus / kornea izlemi <span style={kucuk}>· topografi notu, Kmax, CXL tarihi — hekim</span></div>
        {ker && <div style={metin}>{ker.tarih}: {keratokonusMetni(ker)}</div>}
        {!salt && <>
          <div style={satir}>
            <input value={k.topoNot ?? ''} onChange={(e) => setK({ ...k, topoNot: e.target.value })} placeholder="topografi notu (ör. inferior dikleşme, asimetrik papyon)" aria-label="Topografi notu" style={{ ...inp(220), flex: 1 }} />
            <input value={k.kmaxSag ?? ''} onChange={(e) => setK({ ...k, kmaxSag: e.target.value })} placeholder="Kmax OD" aria-label="Kmax OD" inputMode="decimal" style={inp(90)} />
            <input value={k.kmaxSol ?? ''} onChange={(e) => setK({ ...k, kmaxSol: e.target.value })} placeholder="Kmax OS" aria-label="Kmax OS" inputMode="decimal" style={inp(90)} />
          </div>
          <div style={satir}>
            <span style={kucuk}>CXL OD</span><input type="date" aria-label="CXL OD" value={k.cxlSag ?? ker?.cxlSag ?? ''} onChange={(e) => setK({ ...k, cxlSag: e.target.value })} style={inp(150)} />
            <span style={kucuk}>CXL OS</span><input type="date" aria-label="CXL OS" value={k.cxlSol ?? ker?.cxlSol ?? ''} onChange={(e) => setK({ ...k, cxlSol: e.target.value })} style={inp(150)} />
            <button type="button" onClick={async () => { const j = await calistir({ adim: 'keratokonus', keratokonus: { ...k, cxlSag: k.cxlSag ?? ker?.cxlSag ?? null, cxlSol: k.cxlSol ?? ker?.cxlSol ?? null } }, 'Keratokonus izlemi kaydedildi.'); if (j) setK({}); }} style={btn}>Kaydet</button>
          </div>
        </>}
      </div>
    </div>
  );
}

// ────────────────────────────── OCT kalınlık (hekim) ──────────────────────────────
export function OctKalinlik({ goruntuId, goz, olcum, calistir, salt }: { goruntuId: string; goz: string | null; olcum: { mfk_mikron: number | null; rnfl_mikron: number | null; goz: string | null } | null; calistir: Calistir; salt: boolean }) {
  const [f, setF] = useState<Record<string, string>>({});
  return (
    <div style={{ ...satir, marginTop: 4 }}>
      <span style={kucuk}>Kalınlık (hekim ölçümü)</span>
      {olcum && <span style={metin}>{gozAd(olcum.goz)} · MFK {olcum.mfk_mikron ?? '—'} µm · RNFL {olcum.rnfl_mikron ?? '—'} µm</span>}
      {!salt && <>
        {goz !== 'sag' && goz !== 'sol' && <Secim ad="Kalınlık göz" deger={f.goz || olcum?.goz || ''} set={(x) => setF({ ...f, goz: x })} secenekler={[['sag', 'OD'], ['sol', 'OS']]} bos="göz" />}
        <input value={f.mfk ?? ''} onChange={(e) => setF({ ...f, mfk: e.target.value })} placeholder="MFK µm" aria-label="MFK mikron" inputMode="numeric" style={inp(90)} />
        <input value={f.rnfl ?? ''} onChange={(e) => setF({ ...f, rnfl: e.target.value })} placeholder="RNFL µm" aria-label="RNFL mikron" inputMode="numeric" style={inp(90)} />
        <button type="button" onClick={async () => { const j = await calistir({ adim: 'oct_olcum', goruntuId, goz: goz === 'sag' || goz === 'sol' ? goz : f.goz || olcum?.goz, mfkMikron: f.mfk || null, rnflMikron: f.rnfl || null }, 'OCT kalınlığı kaydedildi.'); if (j) setF({}); }} style={ghost}>Kaydet</button>
      </>}
    </div>
  );
}

// ────────────────────────────── Pediatrik: şaşılık testleri + ROP ──────────────────────────────
export function RopKarti({ v, calistir, salt }: { v: GozEkVeri; calistir: Calistir; salt: boolean }) {
  const [r, setR] = useState<Record<string, string>>({ tarih: bugun() });
  const [nota, setNota] = useState(true);
  const zon: Array<[string, string]> = ROP_ZON.map((z) => [z, `Zon ${z}`]);
  const evre: Array<[string, string]> = ROP_EVRE.map((e) => [e, `Evre ${e}`]);
  const plus = Object.entries(PLUS_AD) as Array<[string, string]>;
  return (
    <div style={{ ...kutu, borderColor: 'rgba(251,191,36,0.4)' }}>
      <div style={etiket}>ROP tarama kartı <span style={kucuk}>· zon / evre / plus hekim girer (ICROP adları) · sonraki taramayı hekim kilitler</span></div>
      {v.ropEndikasyon && <div style={{ ...metin, color: v.ropEndikasyon.var ? '#FBBF24' : '#8FA0B5' }}>{v.ropEndikasyon.metin}</div>}
      {v.rop.map((x) => <div key={x.id} style={metin}>• {x.metin}</div>)}
      {!salt && <>
        <div style={satir}>
          <input type="date" aria-label="ROP muayene tarihi" value={r.tarih} onChange={(e) => setR({ ...r, tarih: e.target.value })} style={inp(150)} />
          <input value={r.dogumHaftasi || ''} onChange={(e) => setR({ ...r, dogumHaftasi: e.target.value })} placeholder="doğum haftası" aria-label="Doğum haftası" inputMode="decimal" style={inp(110)} />
          <input value={r.dogumAgirligiG || ''} onChange={(e) => setR({ ...r, dogumAgirligiG: e.target.value })} placeholder="doğum ağırlığı g" aria-label="Doğum ağırlığı" inputMode="numeric" style={inp(130)} />
        </div>
        {(['Sag', 'Sol'] as const).map((t) => (
          <div key={t} style={satir}><span style={kucuk}>{t === 'Sag' ? 'OD' : 'OS'}</span>
            <Secim ad={`Zon ${t}`} deger={r[`zon${t}`] || ''} set={(x) => setR({ ...r, [`zon${t}`]: x })} secenekler={zon} bos="zon" />
            <Secim ad={`Evre ${t}`} deger={r[`evre${t}`] || ''} set={(x) => setR({ ...r, [`evre${t}`]: x })} secenekler={evre} bos="evre" />
            <Secim ad={`Plus ${t}`} deger={r[`plus${t}`] || ''} set={(x) => setR({ ...r, [`plus${t}`]: x })} secenekler={plus} bos="plus" />
          </div>
        ))}
        <div style={satir}>
          <span style={kucuk}>Sonraki tarama (hekim)</span><input type="date" aria-label="Sonraki ROP taraması" value={r.sonrakiTarama || ''} onChange={(e) => setR({ ...r, sonrakiTarama: e.target.value })} style={inp(150)} />
          <input value={r.not || ''} onChange={(e) => setR({ ...r, not: e.target.value })} placeholder="not" aria-label="ROP notu" style={{ ...inp(140), flex: 1 }} />
        </div>
        <div style={satir}><Kutu c={nota} set={setNota}>Bugünkü nota ekle (O)</Kutu><button type="button" onClick={async () => { const j = await calistir({ adim: 'rop', ...r, notaEkle: nota }, 'ROP taraması kaydedildi.'); if (j) setR({ tarih: bugun() }); }} style={btn}>ROP kaydet</button></div>
      </>}
    </div>
  );
}

// ────────────────────────────── Hatırlatma (Sağlığım) ──────────────────────────────
export function HatirlatmaKarti({ v, calistir, salt }: { v: GozEkVeri; calistir: Calistir; salt: boolean }) {
  const h = v.hatirlatma;
  if (!h.bayraklar.length && !h.sonGonderim) return null;
  return (
    <div style={{ ...kutu, borderColor: 'rgba(251,191,36,0.4)', marginTop: 0, marginBottom: 10 }}>
      <div style={etiket}>Geciken takip <span style={kucuk}>· hastaya Sağlığım mesajı (tanı / değer içermez) + dönüş görevi</span></div>
      {h.bayraklar.map((b) => <span key={b} style={{ display: 'inline-block', border: '1px solid rgba(248,113,113,0.45)', borderRadius: 999, padding: '2px 8px', fontSize: 11, color: '#FCA5A5', marginRight: 6 }}>{GOZ_BAYRAK_AD[b]}</span>)}
      {h.detay.length > 0 && <div style={{ ...kucuk, marginTop: 4 }}>{h.detay.join(' · ')}</div>}
      <div style={satir}>
        {!salt && h.bayraklar.length > 0 && <button type="button" onClick={() => calistir({ adim: 'hatirlatma' }, 'Hatırlatma gönderildi — Sağlığım › Mesajlar; dönüş görevi açıldı.')} style={btn}>Hastaya hatırlatma gönder</button>}
        {h.sonGonderim && <span style={kucuk}>Son hatırlatma: {h.sonGonderim}</span>}
      </div>
    </div>
  );
}

// ────────────────────────────── Refraksiyon + RAPD (ölçüm bloğu) ──────────────────────────────
export function RefraksiyonAlanlari({ deger, set }: { deger: Record<string, string>; set: (d: Record<string, string>) => void }) {
  return (
    <div className="goz-giris" style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)', gap: 6, alignItems: 'center', fontSize: 12, marginTop: 6 }}>
      <span /><span style={kucuk}>Sferik (D)</span><span style={kucuk}>Silindir (D)</span><span style={kucuk}>Aks (°)</span>
      {(['sag', 'sol'] as const).map((t) => (
        <React.Fragment key={t}>
          <b style={{ color: t === 'sag' ? '#2DD4BF' : '#60A5FA' }}>{t === 'sag' ? 'OD' : 'OS'}</b>
          {(['sph', 'cyl', 'aks'] as const).map((a) => <input key={a} aria-label={`${t === 'sag' ? 'Sağ' : 'Sol'} ${a}`} value={deger[`${t}_${a}`] || ''} onChange={(e) => set({ ...deger, [`${t}_${a}`]: e.target.value })} placeholder={a === 'aks' ? '0–180' : '−1,25'} inputMode="decimal" style={{ ...toolsInput, minWidth: 0 }} />)}
        </React.Fragment>
      ))}
    </div>
  );
}
export const refraksiyonOzet = (r: Refraksiyon | null) => (r ? `OD ${refraksiyonGozMetni(r.sag)} · OS ${refraksiyonGozMetni(r.sol)}` : null);

// ────────────────────────────── Glokom ön ayar düğmeleri ──────────────────────────────
export function GlokomOneriDugmeleri({ oneriler, etiketMetni, secili, sec, kaynak }: { oneriler: GlokomOneri[]; etiketMetni: string; secili: string; sec: (o: GlokomOneri) => void; kaynak: (d: Dipnot[]) => React.ReactNode }) {
  const o = oneriler.find((x) => x.kod === secili);
  return (
    <div style={{ marginTop: 8 }}>
      <div style={kucuk}>Aralık ön ayarı (EGS 5 — TOD birim metni doğrulanana dek) · <b style={{ color: '#FBBF24' }}>{etiketMetni}</b></div>
      <div style={satir}>{oneriler.map((x) => <button key={x.kod} type="button" onClick={() => sec(x)} title={x.aralikMetni} style={{ ...ghost, color: secili === x.kod ? '#2DD4BF' : '#8FA0B5', borderColor: secili === x.kod ? 'rgba(45,212,191,0.5)' : 'rgba(255,255,255,0.15)' }}>{x.ad}</button>)}</div>
      {o && <div style={{ ...metin, marginTop: 4 }}>{o.ad}: {o.aralikMetni} — {o.not} <span style={{ ...kucuk, color: '#FBBF24' }}>Kaydet'e basınca hekim kilidi olur.</span>{kaynak([o.dipnot])}</div>}
    </div>
  );
}

// ────────────────────────────── Görüntü › Asistana raporla (Belge Tier A ile aynı yol) ──────────────────────────────
/** Görüntü tarayıcıda kimliksizleştirilir (EXIF temizlenir, küçültülür); hekim kimlik bilgisi olmadığını onaylar; OD/OS zorunlu. */
export function AsistanaRaporla({ g, calistir }: { g: { id: string; modalite: string; goz: string | null; url: string | null }; calistir: Calistir }) {
  const [acik, setAcik] = useState(false);
  const [kimlikYok, setKimlikYok] = useState(false);
  const [tekAlan, setTekAlan] = useState(true);
  const [goz, setGoz] = useState(g.goz === 'sag' || g.goz === 'sol' ? g.goz : '');
  const [durum, setDurum] = useState<'hazir' | 'hazirlaniyor' | 'yaziyor'>('hazir');
  const [hata, setHata] = useState('');
  if (!g.url) return null;
  const gonder = async () => {
    setHata('');
    if (!kimlikYok) { setHata('Önce görüntüde kimlik bilgisi olmadığını onaylayın (KVKK).'); return; }
    if (goz !== 'sag' && goz !== 'sol') { setHata('Göz seçin: OD veya OS.'); return; }
    try {
      setDurum('hazirlaniyor');
      const r = await fetch(g.url!, { cache: 'no-store' });
      if (!r.ok) throw new Error('Görüntü indirilemedi');
      const { gorseliKimliksizlestir } = await import('@/core/belgeler/deid');
      const deid = await gorseliKimliksizlestir(await r.blob());
      setDurum('yaziyor');
      const j = await calistir({ adim: 'goruntu_okuma', eylem: 'asistana_raporla', goruntuId: g.id, goz, kimlikYok: true, tekAlanFundus: g.modalite === 'fundus' ? tekAlan : undefined, deid: { mime: deid.mime, base64: deid.base64, hash: deid.hash } }, 'Asistan taslağı eklendi — uzman onayı bekliyor.');
      if (j) setAcik(false);
    } catch (e) { setHata(e instanceof Error ? e.message : 'Hata'); } finally { setDurum('hazir'); }
  };
  if (!acik) return <button type="button" onClick={() => setAcik(true)} style={ghost}>Asistana raporla</button>;
  return (
    <div style={{ ...kutu, borderColor: 'rgba(99,102,241,0.5)', width: '100%' }}>
      <div style={etiket}>Asistana raporla <span style={kucuk}>· Belge › Asistana raporla ile aynı Tier A yolu · taslak → uzman onayı</span></div>
      <div style={satir}>
        {!(g.goz === 'sag' || g.goz === 'sol') && <Secim ad="Görüntü gözü" deger={goz} set={setGoz} secenekler={[['sag', 'OD (sağ)'], ['sol', 'OS (sol)']]} bos="göz seçin" />}
        {g.modalite === 'fundus' && <Kutu c={tekAlan} set={setTekAlan}>Tek alan fundus fotoğrafı (güven ≤%70)</Kutu>}
      </div>
      <Kutu c={kimlikYok} set={setKimlikYok}>Görüntüde hasta adı, T.C., doğum tarihi gibi kimlik bilgisi yok. (Üst veri cihazınızda temizlenir; yalnız kimliksiz kopya gönderilir.)</Kutu>
      <div style={satir}>
        <button type="button" disabled={durum !== 'hazir'} onClick={gonder} style={{ ...btn, opacity: durum === 'hazir' ? 1 : 0.6 }}>{durum === 'hazirlaniyor' ? 'Kimliksizleştiriliyor…' : durum === 'yaziyor' ? 'Asistan yazıyor…' : 'Gönder'}</button>
        <button type="button" onClick={() => setAcik(false)} style={ghost}>Vazgeç</button>
        {hata && <span style={{ ...metin, color: '#F87171' }}>{hata}</span>}
      </div>
      <div style={kucuk}>Görüntü okunamazsa kontrol listesi taslağı eklenir. DR evresi yazılmaz — evre DR kartında hekim kilidi.</div>
    </div>
  );
}
