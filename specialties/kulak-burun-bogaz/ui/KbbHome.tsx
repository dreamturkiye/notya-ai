'use client';
/**
 * KBB-EXCEPTIONAL-01 — KBB bölüm ana ekranı (hasta dosyası › KBB).
 * Sticky şerit + sekmeler: Özet | Otoskopi | Odyometri | Vertigo | Risk | Görevler | SGK.
 * Bilinçli olarak KOMPAKT: ayaktan poliklinikte iki dokunuşta iş bitmeli.
 *
 * Kilitler: doz yazılmaz, tanı kilitlenmez, PTA bandı "karar desteği" etiketiyle gösterilir, kayıp
 * tipini hekim seçer. Açık kırmızı bayrak varken hekim onayı olmadan risk kaydı yazılmaz (API 409).
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getAccessTokenAsync, toolsCard, toolsInput } from '@/lib/doktor/toolsUi';
import MuayeneFormunaDon from '@/components/doktor/MuayeneFormunaDon';
import { eklenenNotId } from '@/lib/doktor/muayeneFormuYolu';
import { skorla as odyoSkorla, PTA_FREKANSLARI } from '../engines/odyometri';
import { kbbRaporTaslagi, KBB_RAPOR_SABLONLARI, type KbbRaporSablon } from '../engines/sgkRapor';
import type { KbbSerit } from '../engines/serit';

type Odyo = { id: string; tarih: string; yan: string; pta_db: number | null; tip: string | null; maddeler: Record<string, unknown> | null; hekim_kilit: boolean; not_hekim: string | null };
type Veri = {
  serit: KbbSerit;
  bolum: { nextKontrol: string | null; osas: { durum?: string; not?: string | null; due?: string | null } | null };
  odyometriler: Odyo[];
  sonOdyometri: (Odyo & { bantAd: string; degisim: { not: string } }) | null;
  asimetri: string | null;
  risk: { son: { tarih: string; bayraklar: string[]; eylem: string | null; hekim_onay: boolean } | null; acik: Array<{ tarih: string; bayraklar: string[] }>; gecmis: Array<{ id: string; tarih: string; bayraklar: string[]; eylem: string | null; hekim_onay: boolean }> };
  gorevler: Array<{ id: string; kod: string; ad: string; due: string | null; kaynak: string | null }>;
  kutuphane: {
    odyometri: { frekanslar: number[]; bantlar: Record<string, string>; tipler: Record<string, string> };
    otoskopi: { disKulak: Record<string, string>; tm: Record<string, string>; ekBulgular: string[] };
    vertigo: { manevralar: Record<string, string>; sonuclar: Record<string, string>; nistagmus: string[]; santral: string[] };
    burun: { sikayetler: Record<string, string>; bulgular: string[]; basamaklar: string[]; sureler: Record<string, string> };
    acilKodlari: Array<{ kod: string; ad: string }>;
    acilListesi: string[];
    raporSablonlari: Array<{ id: KbbRaporSablon; ad: string }>;
    refler: Record<string, string>;
    hekimKilidi: string;
    acilYonlendirme: string;
    kapsam: string;
  };
};

const ACCENT = '#4F46E5';
const btn: React.CSSProperties = { background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', minHeight: 32 };
const ghost: React.CSSProperties = { ...btn, background: 'transparent', color: '#8FA0B5', border: '1px solid rgba(255,255,255,0.15)' };
const etiket: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#99F6E4', marginBottom: 6 };
const kucuk: React.CSSProperties = { fontSize: 11, color: '#8FA0B5', lineHeight: 1.45 };
const metin: React.CSSProperties = { fontSize: 12, color: '#EDF1F7', lineHeight: 1.5 };
const satir: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 };

const SEKMELER = ['Özet', 'Otoskopi', 'Odyometri', 'Vertigo', 'Risk', 'Görevler', 'SGK'] as const;
type Sekme = (typeof SEKMELER)[number];

const RENK: Record<string, string> = { iyi: '#34D399', dikkat: '#FBBF24', kotu: '#F87171', yok: '#64748B' };

function Cip({ ad, deger, durum, alt }: { ad: string; deger: string; durum: string; alt?: string }) {
  return (
    <span style={{ border: `1px solid ${durum === 'kotu' ? 'rgba(248,113,113,0.6)' : 'rgba(255,255,255,0.12)'}`, borderRadius: 999, padding: '3px 10px', fontSize: 11, color: RENK[durum] || '#EDF1F7', whiteSpace: 'nowrap' }}>
      <span style={{ color: '#8FA0B5' }}>{ad} </span>{deger}
      {alt && <span style={{ color: '#64748B' }}> · {alt}</span>}
    </span>
  );
}

function Kutucuk({ ad, secili, tikla }: { ad: string; secili: boolean; tikla: () => void }) {
  return (
    <label style={{ ...metin, display: 'flex', gap: 8, alignItems: 'flex-start', padding: '3px 0' }}>
      <input type="checkbox" checked={secili} onChange={tikla} style={{ marginTop: 3 }} />
      <span>{ad}</span>
    </label>
  );
}

export default function KbbHome({ patientId }: { patientId: string }) {
  const [v, setV] = useState<Veri | null>(null);
  const [sekme, setSekme] = useState<Sekme>('Özet');
  const [mesaj, setMesaj] = useState('');
  const [eklenenNot, setEklenenNot] = useState<string | null>(null);

  // Otoskopi
  const [sagDis, setSagDis] = useState<string[]>([]);
  const [sagTm, setSagTm] = useState<string[]>([]);
  const [solDis, setSolDis] = useState<string[]>([]);
  const [solTm, setSolTm] = useState<string[]>([]);
  const [otoEk, setOtoEk] = useState<string[]>([]);
  const [otoNot, setOtoNot] = useState('');

  // Odyometri
  const [odyoYan, setOdyoYan] = useState<'sag' | 'sol' | 'iki'>('sag');
  const [esikler, setEsikler] = useState<string[]>(['', '', '', '']);
  const [odyoTip, setOdyoTip] = useState('');

  // Vertigo
  const [manevralar, setManevralar] = useState<Record<string, string>>({});
  const [nistagmus, setNistagmus] = useState<string[]>([]);
  const [santral, setSantral] = useState<string[]>([]);
  const [kulakBelirtisi, setKulakBelirtisi] = useState(false);
  const [vertigoNot, setVertigoNot] = useState('');

  // Risk
  const [riskKodlari, setRiskKodlari] = useState<string[]>([]);
  const [riskEylem, setRiskEylem] = useState('');
  const [riskOnay, setRiskOnay] = useState(false);
  const [acilIsaretli, setAcilIsaretli] = useState<number[]>([]);

  const [kontrolTarih, setKontrolTarih] = useState('');
  const [raporSablon, setRaporSablon] = useState<KbbRaporSablon>('isitme_cihazi');
  const [raporIcd, setRaporIcd] = useState('');
  const [raporIcdAd, setRaporIcdAd] = useState('');
  const [raporNot, setRaporNot] = useState('');

  const api = useCallback(async (body: Record<string, unknown>) => {
    const token = await getAccessTokenAsync();
    const r = await fetch('/api/doktor/kulak-burun-bogaz', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId, ...body }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || 'Hata');
    return j as Record<string, unknown>;
  }, [patientId]);

  const yukle = useCallback(async () => {
    const token = await getAccessTokenAsync();
    const r = await fetch(`/api/doktor/kulak-burun-bogaz?patientId=${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if (r.ok) setV(await r.json());
  }, [patientId]);

  useEffect(() => { yukle(); }, [yukle]);

  const calistir = async (body: Record<string, unknown>, ok?: string) => {
    setMesaj(''); setEklenenNot(null);
    try { const j = await api(body); setMesaj(ok || 'Kaydedildi.'); setEklenenNot(eklenenNotId(j)); await yukle(); return j; }
    catch (e) { setMesaj(e instanceof Error ? e.message : 'Hata'); return null; }
  };

  const odyoSonuc = useMemo(() => odyoSkorla(esikler.map((x) => (x === '' ? null : Number(x))), odyoYan), [esikler, odyoYan]);
  const raporSonuc = useMemo(() => v ? kbbRaporTaslagi({
    sablon: raporSablon, hastaAdi: '',
    odyometriler: v.odyometriler.map((o) => ({ tarih: String(o.tarih).slice(0, 10), yan: o.yan as 'sag', pta: o.pta_db == null ? null : Number(o.pta_db), tip: o.tip })),
    tani: raporIcd.trim() ? { icd10: raporIcd.trim().toUpperCase(), aciklama: raporIcdAd.trim() } : null,
    hekimDegerlendirmesi: raporNot,
    bugun: new Date().toISOString().slice(0, 10),
  }) : null, [v, raporSablon, raporIcd, raporIcdAd, raporNot]);

  if (!v) return <div style={{ ...toolsCard, color: '#8FA0B5', fontSize: 12 }}>KBB yükleniyor…</div>;

  const bugun = new Date().toISOString().slice(0, 10);
  const cevir = (liste: string[], x: string) => (liste.includes(x) ? liste.filter((y) => y !== x) : [...liste, x]);

  return (
    <div style={toolsCard} data-chapter="kulak-burun-bogaz">
      {/* Sticky şerit */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
        {v.serit.chips.map((c) => <Cip key={c.ad} {...c} />)}
      </div>
      {v.serit.kirmizi.length > 0 && (
        <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.4)', color: '#FCA5A5', borderRadius: 8, padding: '8px 10px', fontSize: 12, marginBottom: 8 }}>
          {v.serit.kirmizi.map((k) => <div key={k}>⚑ {k}</div>)}
          <div style={{ ...kucuk, color: '#FCA5A5', marginTop: 4 }}>{v.kutuphane.acilYonlendirme}</div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {SEKMELER.map((x) => (
          <button key={x} type="button" onClick={() => setSekme(x)} style={{ ...ghost, borderRadius: 999, background: sekme === x ? 'rgba(79,70,229,0.22)' : 'transparent', color: sekme === x ? '#C7D2FE' : '#8FA0B5' }}>{x}</button>
        ))}
      </div>

      {mesaj && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: /amadı|zorunlu|eksik|Geçersiz|geçersiz|bayrak|Hata/.test(mesaj) ? '#F87171' : '#34D399' }}>{mesaj}</span>
          <MuayeneFormunaDon notId={eklenenNot} />
        </div>
      )}

      {sekme === 'Özet' && (
        <div>
          <div style={etiket}>Bu vizit</div>
          <div style={metin}>
            {v.sonOdyometri
              ? <>Son odyometri <b>{v.sonOdyometri.pta_db ?? '—'} dB</b> ({String(v.sonOdyometri.tarih).slice(0, 10)}) — {v.sonOdyometri.bantAd}. {v.sonOdyometri.degisim.not}</>
              : 'Odyometri kaydı yok — Odyometri sekmesinden girin.'}
          </div>
          {v.asimetri && <div style={{ ...metin, color: '#FBBF24' }}>{v.asimetri}</div>}
          <div style={{ ...etiket, marginTop: 12 }}>Kontrol tarihi <span style={kucuk}>· hasta portalında &quot;Kontrol randevusu&quot; olarak görünür</span></div>
          <div style={satir}>
            <input type="date" value={kontrolTarih || v.bolum.nextKontrol || ''} onChange={(e) => setKontrolTarih(e.target.value)} style={{ ...toolsInput, width: 160 }} />
            <button type="button" style={btn} onClick={() => calistir({ adim: 'kontrol', tarih: kontrolTarih || v.bolum.nextKontrol }, 'Kontrol tarihi kaydedildi.')}>Kaydet</button>
          </div>
          <div style={{ ...etiket, marginTop: 12 }}>Uyku tetkiki (OSAS) sevki <span style={kucuk}>· horlama + tanıklı apne değerlendirmesi hekimin</span></div>
          <div style={satir}>
            <button type="button" style={btn} onClick={() => calistir({ adim: 'osas', durum: 'planlandi' }, 'OSAS sevki planlandı.')}>Sevk planla</button>
            <button type="button" style={ghost} onClick={() => calistir({ adim: 'osas', durum: 'yok' }, 'OSAS sevk işareti kaldırıldı.')}>Gerekmiyor</button>
            {v.bolum.osas?.due && <span style={kucuk}>Planlanan: {v.bolum.osas.due}</span>}
          </div>
          {v.serit.planTaslagi.length > 0 && (
            <>
              <div style={{ ...etiket, marginTop: 12 }}>Plan taslağı <span style={kucuk}>· hekim onayıyla SOAP&apos;a kopyalanır</span></div>
              {v.serit.planTaslagi.map((p) => <div key={p} style={metin}>• {p}</div>)}
            </>
          )}
          <div style={{ ...kucuk, marginTop: 10 }}>{v.kutuphane.hekimKilidi}</div>
          <div style={kucuk}>{v.kutuphane.kapsam}</div>
        </div>
      )}

      {sekme === 'Otoskopi' && (
        <div>
          <div style={etiket}>Sağ kulak</div>
          {Object.entries(v.kutuphane.otoskopi.disKulak).map(([k, ad]) => <Kutucuk key={`sd${k}`} ad={ad} secili={sagDis.includes(k)} tikla={() => setSagDis((p) => cevir(p, k))} />)}
          {Object.entries(v.kutuphane.otoskopi.tm).map(([k, ad]) => <Kutucuk key={`st${k}`} ad={ad} secili={sagTm.includes(k)} tikla={() => setSagTm((p) => cevir(p, k))} />)}

          <div style={{ ...etiket, marginTop: 12 }}>Sol kulak</div>
          {Object.entries(v.kutuphane.otoskopi.disKulak).map(([k, ad]) => <Kutucuk key={`ld${k}`} ad={ad} secili={solDis.includes(k)} tikla={() => setSolDis((p) => cevir(p, k))} />)}
          {Object.entries(v.kutuphane.otoskopi.tm).map(([k, ad]) => <Kutucuk key={`lt${k}`} ad={ad} secili={solTm.includes(k)} tikla={() => setSolTm((p) => cevir(p, k))} />)}

          <div style={{ ...etiket, marginTop: 12 }}>Ek muayene</div>
          {v.kutuphane.otoskopi.ekBulgular.map((x) => <Kutucuk key={x} ad={x} secili={otoEk.includes(x)} tikla={() => setOtoEk((p) => cevir(p, x))} />)}

          <div style={satir}>
            <input value={otoNot} onChange={(e) => setOtoNot(e.target.value)} placeholder="Hekim notu" style={{ ...toolsInput, minWidth: 260, flex: '1 1 260px' }} />
          </div>
          <div style={satir}>
            <button type="button" style={btn} onClick={() => calistir({
              adim: 'otoskopi',
              kulaklar: [{ yan: 'sag', disKulak: sagDis, tm: sagTm }, { yan: 'sol', disKulak: solDis, tm: solTm }],
              ekBulgular: otoEk, hekimNotu: otoNot,
            }, 'Otoskopi notu muayene formuna eklendi.')}>Nota ekle</button>
            <button type="button" style={ghost} onClick={() => { setSagDis([]); setSagTm([]); setSolDis([]); setSolTm([]); setOtoEk([]); setOtoNot(''); }}>Temizle</button>
            <span style={{ ...kucuk, color: '#FBBF24', fontWeight: 700 }}>TASLAK · tanı hekimin</span>
          </div>
        </div>
      )}

      {sekme === 'Odyometri' && (
        <div>
          <div style={etiket}>Saf ses eşikleri (dB HL) <span style={kucuk}>· 0,5 / 1 / 2 / 4 kHz hava yolu</span></div>
          <div style={satir}>
            {(['sag', 'sol', 'iki'] as const).map((y) => (
              <button key={y} type="button" onClick={() => setOdyoYan(y)} style={{ ...ghost, background: odyoYan === y ? 'rgba(79,70,229,0.22)' : 'transparent', color: odyoYan === y ? '#C7D2FE' : '#8FA0B5' }}>
                {y === 'sag' ? 'Sağ' : y === 'sol' ? 'Sol' : 'İki'}
              </button>
            ))}
          </div>
          <div style={satir}>
            {PTA_FREKANSLARI.map((f, i) => (
              <label key={f} style={{ ...kucuk, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {f} kHz
                <input type="number" value={esikler[i]} onChange={(e) => setEsikler((p) => p.map((x, j) => (j === i ? e.target.value : x)))} style={{ ...toolsInput, width: 78 }} />
              </label>
            ))}
          </div>
          <div style={satir}>
            <span style={{ fontSize: 18, fontWeight: 800, color: odyoSonuc.tamamMi ? '#C7D2FE' : '#64748B' }}>{odyoSonuc.pta ?? '—'}</span>
            <span style={metin}>{odyoSonuc.tamamMi ? odyoSonuc.bantAd : `${odyoSonuc.eksikFrekans} frekans boş — ortalama yorumlanmaz`}</span>
            <span style={{ ...kucuk, color: '#FBBF24', fontWeight: 700 }}>KARAR DESTEĞİ</span>
          </div>
          <div style={satir}>
            <select aria-label="Kayıp tipi (hekim)" value={odyoTip} onChange={(e) => setOdyoTip(e.target.value)} style={{ ...toolsInput, width: 'auto' }}>
              <option value="">Kayıp tipi seç (hekim)</option>
              {Object.entries(v.kutuphane.odyometri.tipler).map(([k, ad]) => <option key={k} value={k} style={{ color: '#000' }}>{ad}</option>)}
            </select>
            <button type="button" style={btn} disabled={!odyoSonuc.tamamMi} onClick={() => calistir({ adim: 'odyometri', yan: odyoYan, esikler: esikler.map((x) => (x === '' ? null : Number(x))), tip: odyoTip || null, hekimKilit: true }, 'Odyometri kaydedildi.')}>Kaydet</button>
            <button type="button" style={ghost} onClick={() => { setEsikler(['', '', '', '']); setOdyoTip(''); }}>Temizle</button>
          </div>
          <div style={kucuk}>Kayıp tipini (iletim / sensorinöral / mikst) Notya atamaz; hekim seçer.</div>

          {v.odyometriler.length > 0 && (
            <>
              <div style={{ ...etiket, marginTop: 12 }}>Geçmiş ölçümler</div>
              {v.odyometriler.slice(0, 12).map((o) => (
                <div key={o.id} style={kucuk}>
                  {String(o.tarih).slice(0, 10)} · {o.yan === 'sag' ? 'Sağ' : o.yan === 'sol' ? 'Sol' : 'İki'} · {o.pta_db ?? '—'} dB
                  {(o.maddeler as { bant?: string } | null)?.bant ? ` — ${v.kutuphane.odyometri.bantlar[(o.maddeler as { bant: string }).bant]}` : ''}
                  {o.tip ? ` · ${v.kutuphane.odyometri.tipler[o.tip] || o.tip}` : ''}
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {sekme === 'Vertigo' && (
        <div>
          <div style={etiket}>Santral şüphesi işaretleri <span style={kucuk}>· işaretliyse repozisyon manevrası uygun değil</span></div>
          {v.kutuphane.vertigo.santral.map((x) => <Kutucuk key={x} ad={x} secili={santral.includes(x)} tikla={() => setSantral((p) => cevir(p, x))} />)}
          {santral.length > 0 && (
            <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.4)', color: '#FCA5A5', borderRadius: 8, padding: '8px 10px', fontSize: 12, marginTop: 8 }}>
              ⚑ Santral şüphesi işareti var — manevra yerine acil / nöroloji değerlendirmesi (112 veya en yakın acil).
            </div>
          )}

          <div style={{ ...etiket, marginTop: 12 }}>Manevralar ve testler</div>
          {Object.entries(v.kutuphane.vertigo.manevralar).map(([k, ad]) => (
            <div key={k} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', padding: '3px 0' }}>
              <span style={{ ...metin, flex: '1 1 220px' }}>{ad}</span>
              <select aria-label={ad} value={manevralar[k] || ''} onChange={(e) => setManevralar((p) => ({ ...p, [k]: e.target.value }))} style={{ ...toolsInput, width: 'auto' }}>
                <option value="">—</option>
                {Object.entries(v.kutuphane.vertigo.sonuclar).map(([s, sad]) => <option key={s} value={s} style={{ color: '#000' }}>{sad}</option>)}
              </select>
            </div>
          ))}

          <div style={{ ...etiket, marginTop: 12 }}>Nistagmus özellikleri</div>
          {v.kutuphane.vertigo.nistagmus.map((x) => <Kutucuk key={x} ad={x} secili={nistagmus.includes(x)} tikla={() => setNistagmus((p) => cevir(p, x))} />)}

          <Kutucuk ad="Eşlik eden kulak belirtisi (işitme kaybı / çınlama / dolgunluk)" secili={kulakBelirtisi} tikla={() => setKulakBelirtisi((p) => !p)} />
          <div style={satir}>
            <input value={vertigoNot} onChange={(e) => setVertigoNot(e.target.value)} placeholder="Hekim notu" style={{ ...toolsInput, minWidth: 260, flex: '1 1 260px' }} />
          </div>
          <div style={satir}>
            <button type="button" style={btn} onClick={() => calistir({
              adim: 'vertigo',
              manevralar: Object.entries(manevralar).filter(([, s]) => s).map(([manevra, sonuc]) => ({ manevra, sonuc })),
              nistagmus, santralIsaretleri: santral, kulakBelirtisi, hekimNotu: vertigoNot,
            }, 'Vestibüler muayene notu eklendi.')}>Nota ekle</button>
            <button type="button" style={ghost} onClick={() => { setManevralar({}); setNistagmus([]); setSantral([]); setKulakBelirtisi(false); setVertigoNot(''); }}>Temizle</button>
          </div>
        </div>
      )}

      {sekme === 'Risk' && (
        <div>
          <div style={etiket}>Kırmızı bayrak değerlendirmesi <span style={kucuk}>· ayaktan izlem yeterliliği hekim kararıdır</span></div>
          <div style={{ ...kucuk, marginBottom: 8 }}>{v.kutuphane.acilYonlendirme}</div>
          {v.kutuphane.acilKodlari.map((k) => (
            <Kutucuk key={k.kod} ad={k.ad} secili={riskKodlari.includes(k.kod)} tikla={() => setRiskKodlari((p) => cevir(p, k.kod))} />
          ))}

          <div style={{ ...etiket, marginTop: 12 }}>Kontrol listesi</div>
          {v.kutuphane.acilListesi.map((m, i) => (
            <Kutucuk key={m} ad={m} secili={acilIsaretli.includes(i)} tikla={() => setAcilIsaretli((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]))} />
          ))}

          <div style={satir}>
            <input value={riskEylem} onChange={(e) => setRiskEylem(e.target.value)} placeholder="Hekim eylemi (sevk, aynı gün randevu, acil yönlendirme…)" style={{ ...toolsInput, minWidth: 260, flex: '1 1 260px' }} />
          </div>
          <label style={{ ...metin, display: 'flex', gap: 8, alignItems: 'center', minHeight: 36 }}>
            <input type="checkbox" checked={riskOnay} onChange={(e) => setRiskOnay(e.target.checked)} />
            Gördüm ve eylemi yazdım (hekim onayı)
          </label>
          <div style={satir}>
            <button type="button" style={btn} onClick={() => calistir({ adim: 'risk', bayraklar: riskKodlari, eylem: [riskEylem, ...acilIsaretli.map((i) => v.kutuphane.acilListesi[i])].filter(Boolean).join(' | '), hekimOnay: riskOnay }, 'Kırmızı bayrak değerlendirmesi kaydedildi.')}>Kaydet</button>
          </div>

          {v.risk.gecmis.length > 0 && (
            <>
              <div style={{ ...etiket, marginTop: 12 }}>Kırmızı bayrak kayıtları</div>
              {v.risk.gecmis.map((r) => (
                <div key={r.id} style={{ ...kucuk, color: r.hekim_onay ? '#8FA0B5' : '#FCA5A5' }}>
                  {r.tarih} · {r.bayraklar.length ? r.bayraklar.join(', ') : 'bayrak yok'} · {r.hekim_onay ? 'hekim onaylı' : 'ONAY BEKLİYOR'}{r.eylem ? ` — ${r.eylem}` : ''}
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {sekme === 'Görevler' && (
        <div>
          <div style={etiket}>Açık görevler ({v.gorevler.length})</div>
          {!v.gorevler.length && <div style={kucuk}>Açık görev yok.</div>}
          {v.gorevler.map((g) => (
            <div key={g.id} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: g.due && g.due < bugun ? '#F87171' : '#EDF1F7', padding: '2px 0' }}>
              <span style={{ flex: 1 }}>{g.ad} <span style={kucuk}>{g.due || ''}{g.kaynak ? ` · ${g.kaynak}` : ''}</span></span>
              <button type="button" style={{ ...ghost, padding: '4px 10px', minWidth: 36, minHeight: 28, flexShrink: 0 }} onClick={() => calistir({ adim: 'gorev', gorevId: g.id, durum: 'tamam' })}>✓</button>
            </div>
          ))}
        </div>
      )}

      {sekme === 'SGK' && raporSonuc && (
        <div>
          <div style={etiket}>İşitme cihazı / KBB rapor taslağı <span style={kucuk}>· T.C. kimlik no yazılmaz · cihaz markası ve bedeli yoktur</span></div>
          <div style={satir}>
            <select aria-label="Şablon" value={raporSablon} onChange={(e) => setRaporSablon(e.target.value as KbbRaporSablon)} style={{ ...toolsInput, width: 'auto' }}>
              {KBB_RAPOR_SABLONLARI.map((s) => <option key={s.id} value={s.id} style={{ color: '#000' }}>{s.ad}</option>)}
            </select>
            <input value={raporIcd} onChange={(e) => setRaporIcd(e.target.value)} placeholder="ICD-10 (hekim seçer)" style={{ ...toolsInput, width: 150 }} />
            <input value={raporIcdAd} onChange={(e) => setRaporIcdAd(e.target.value)} placeholder="Tanı açıklaması" style={{ ...toolsInput, minWidth: 180 }} />
          </div>
          <div style={satir}>
            <input value={raporNot} onChange={(e) => setRaporNot(e.target.value)} placeholder="Hekim değerlendirmesi" style={{ ...toolsInput, minWidth: 280, flex: '1 1 280px' }} />
          </div>
          <div style={{ ...etiket, marginTop: 10 }}>Kayıtlı odyolojik değerlendirme</div>
          {raporSonuc.draft.odyolojikOzet.length
            ? raporSonuc.draft.odyolojikOzet.map((o, i) => <div key={i} style={kucuk}>{o.tarih} · {o.yan} · {o.pta ?? '—'} dB — {o.bant} · {o.tip}</div>)
            : <div style={kucuk}>Kayıtlı odyometri yok (Notya eşik uydurmaz)</div>}
          <div style={{ ...etiket, marginTop: 10 }}>Kontrol listesi</div>
          {raporSonuc.kontrolListesi.map((k) => <div key={k.madde} style={kucuk}>☐ {k.madde}</div>)}
          {raporSonuc.eksikler.length > 0 && (
            <>
              <div style={{ ...etiket, marginTop: 10, color: '#FBBF24' }}>Eksikler <span style={kucuk}>· hepsi kapanmadan rapor kilitlenmez</span></div>
              {raporSonuc.eksikler.map((e) => <div key={e} style={{ ...kucuk, color: '#FBBF24' }}>• {e}</div>)}
            </>
          )}
          <div style={{ ...kucuk, marginTop: 10 }}>Çıktı taslaktır. Medula girişi ve e-imza hekimindedir; Notya canlı gönderim yapmaz.</div>
        </div>
      )}
    </div>
  );
}
