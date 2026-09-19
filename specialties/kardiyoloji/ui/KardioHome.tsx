'use client';
/**
 * KARDIO-EXCEPTIONAL-01 — Kardiyoloji bölüm ana ekranı (hasta dosyası › Kardiyoloji).
 * Sticky şerit + sekmeler: Özet | SCORE2 | HT/KKY | Risk | Görevler | SGK.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { getAccessTokenAsync, toolsCard, toolsInput } from '@/lib/doktor/toolsUi';
import MuayeneFormunaDon from '@/components/doktor/MuayeneFormunaDon';
import { eklenenNotId } from '@/lib/doktor/muayeneFormuYolu';
import { kardioScore2Hesapla, type Cinsiyet } from '../engines/score2';
import { kardioRaporTaslagi, KARDIO_RAPOR_SABLONLARI, type KardioRaporSablon } from '../engines/sgkRapor';
import type { KardioSerit } from '../engines/serit';
import type { IzlemTip, NyhaSinif } from '../engines/htKky';

type Veri = {
  serit: KardioSerit;
  bolum: { nextKontrol: string | null };
  sonScore2: { risk_pct: number | null; maddeler: Record<string, unknown> | null; tarih: string } | null;
  risk: { son: { tarih: string; bayraklar: string[]; eylem: string | null; hekim_onay: boolean } | null; acik: Array<{ tarih: string; bayraklar: string[] }> };
  gorevler: Array<{ id: string; kod: string; ad: string; due: string | null }>;
  kutuphane: {
    acilKodlari: Array<{ kod: string; ad: string }>;
    acilListesi: string[];
    raporSablonlari: Array<{ id: KardioRaporSablon; ad: string }>;
    hekimKilidi: string;
    acilYonlendirme: string;
    kapsam: string;
  };
};

const ACCENT = '#DC2626';
const btn: React.CSSProperties = { background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', minHeight: 32 };
const ghost: React.CSSProperties = { ...btn, background: 'transparent', color: '#8FA0B5', border: '1px solid rgba(255,255,255,0.15)' };
const etiket: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#FCA5A5', marginBottom: 6 };
const kucuk: React.CSSProperties = { fontSize: 11, color: '#8FA0B5', lineHeight: 1.45 };
const metin: React.CSSProperties = { fontSize: 12, color: '#EDF1F7', lineHeight: 1.5 };
const SEKMELER = ['Özet', 'SCORE2', 'HT/KKY', 'Risk', 'Görevler', 'SGK'] as const;
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

export default function KardioHome({ patientId }: { patientId: string }) {
  const [v, setV] = useState<Veri | null>(null);
  const [sekme, setSekme] = useState<Sekme>('Özet');
  const [mesaj, setMesaj] = useState('');
  const [eklenenNot, setEklenenNot] = useState<string | null>(null);

  const [yas, setYas] = useState('55');
  const [cinsiyet, setCinsiyet] = useState<Cinsiyet>('erkek');
  const [sigara, setSigara] = useState(false);
  const [sbp, setSbp] = useState('140');
  const [tchol, setTchol] = useState('220');
  const [hdl, setHdl] = useState('45');

  const [izlemTip, setIzlemTip] = useState<IzlemTip>('ht');
  const [izlemSbp, setIzlemSbp] = useState('');
  const [izlemDbp, setIzlemDbp] = useState('');
  const [nyha, setNyha] = useState<NyhaSinif | ''>('');
  const [izlemNot, setIzlemNot] = useState('');
  const [ekgBelge, setEkgBelge] = useState(false);

  const [riskKodlari, setRiskKodlari] = useState<string[]>([]);
  const [riskEylem, setRiskEylem] = useState('');
  const [riskOnay, setRiskOnay] = useState(false);
  const [kontrolTarih, setKontrolTarih] = useState('');

  const [raporSablon, setRaporSablon] = useState<KardioRaporSablon>('hipertansiyon');
  const [raporIcd, setRaporIcd] = useState('');
  const [raporIcdAd, setRaporIcdAd] = useState('');
  const [raporNot, setRaporNot] = useState('');

  const api = useCallback(async (body: Record<string, unknown>) => {
    const token = await getAccessTokenAsync();
    const r = await fetch('/api/doktor/kardiyoloji', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId, ...body }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || 'Hata');
    return j as Record<string, unknown>;
  }, [patientId]);

  const yukle = useCallback(async () => {
    const token = await getAccessTokenAsync();
    const r = await fetch(`/api/doktor/kardiyoloji?patientId=${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    const j = await r.json().catch(() => null);
    if (r.ok && j) setV(j as Veri);
  }, [patientId]);

  useEffect(() => { yukle(); }, [yukle]);

  const scoreOnizleme = kardioScore2Hesapla({
    yas: Number(yas), cinsiyet, sigara, sbp: Number(sbp), tcholMgdl: Number(tchol), hdlMgdl: Number(hdl), bolge: 'high',
  });

  return (
    <div style={{ ...toolsCard, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#EDF1F7' }}>Kardiyoloji</div>
          <div style={kucuk}>{v?.kutuphane.kapsam || 'Ayaktan kardiyoloji'}</div>
        </div>
        {eklenenNot && <MuayeneFormunaDon notId={eklenenNot} />}
      </div>

      {v && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12, position: 'sticky', top: 0, background: '#0D1526', padding: '8px 0', zIndex: 2 }}>
          {v.serit.chips.map((c, i) => <Cip key={i} {...c} />)}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {SEKMELER.map((s) => (
          <button key={s} type="button" onClick={() => setSekme(s)} style={sekme === s ? btn : ghost}>{s}</button>
        ))}
      </div>
      {mesaj && <div style={{ ...kucuk, color: '#FBBF24', marginBottom: 8 }}>{mesaj}</div>}

      {sekme === 'Özet' && v && (
        <div>
          <div style={etiket}>Plan taslağı</div>
          {(v.serit.planTaslagi.length ? v.serit.planTaslagi : ['Bugün için ek plan yok — SCORE2 veya izlem girin.']).map((p, i) => (
            <div key={i} style={metin}>• {p}</div>
          ))}
          <div style={{ ...kucuk, marginTop: 10 }}>{v.kutuphane.hekimKilidi}</div>
          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input type="date" value={kontrolTarih} onChange={(e) => setKontrolTarih(e.target.value)} style={toolsInput} />
            <button type="button" style={btn} onClick={async () => {
              try { await api({ adim: 'kontrol', tarih: kontrolTarih }); setMesaj('Kontrol tarihi kaydedildi'); await yukle(); }
              catch (e) { setMesaj(e instanceof Error ? e.message : 'Hata'); }
            }}>Kontrol kaydet</button>
          </div>
        </div>
      )}

      {sekme === 'SCORE2' && (
        <div>
          <div style={etiket}>SCORE2 girdileri (Notya uydurmaz)</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input placeholder="Yaş" value={yas} onChange={(e) => setYas(e.target.value)} style={{ ...toolsInput, width: 70 }} />
            <select value={cinsiyet} onChange={(e) => setCinsiyet(e.target.value as Cinsiyet)} style={toolsInput}><option value="erkek">Erkek</option><option value="kadin">Kadın</option></select>
            <label style={metin}><input type="checkbox" checked={sigara} onChange={(e) => setSigara(e.target.checked)} /> Sigara</label>
            <input placeholder="SBP" value={sbp} onChange={(e) => setSbp(e.target.value)} style={{ ...toolsInput, width: 70 }} />
            <input placeholder="TChol" value={tchol} onChange={(e) => setTchol(e.target.value)} style={{ ...toolsInput, width: 80 }} />
            <input placeholder="HDL" value={hdl} onChange={(e) => setHdl(e.target.value)} style={{ ...toolsInput, width: 70 }} />
          </div>
          <div style={{ ...metin, marginTop: 8 }}>{scoreOnizleme.ozet}</div>
          <button type="button" style={{ ...btn, marginTop: 8 }} onClick={async () => {
            try {
              const j = await api({ adim: 'score2', yas: Number(yas), cinsiyet, sigara, sbp: Number(sbp), tcholMgdl: Number(tchol), hdlMgdl: Number(hdl), hekimKilit: true });
              setEklenenNot(eklenenNotId(j)); setMesaj('SCORE2 kaydedildi'); await yukle();
            } catch (e) { setMesaj(e instanceof Error ? e.message : 'Hata'); }
          }}>Kaydet (karar desteği)</button>
        </div>
      )}

      {sekme === 'HT/KKY' && (
        <div>
          <select value={izlemTip} onChange={(e) => setIzlemTip(e.target.value as IzlemTip)} style={toolsInput}>
            <option value="ht">Hipertansiyon</option><option value="kky">KKY</option><option value="af">AF</option><option value="diger">Diğer</option>
          </select>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            <input placeholder="SBP" value={izlemSbp} onChange={(e) => setIzlemSbp(e.target.value)} style={{ ...toolsInput, width: 70 }} />
            <input placeholder="DBP" value={izlemDbp} onChange={(e) => setIzlemDbp(e.target.value)} style={{ ...toolsInput, width: 70 }} />
            {izlemTip === 'kky' && (
              <select value={nyha} onChange={(e) => setNyha(e.target.value as NyhaSinif | '')} style={toolsInput}>
                <option value="">NYHA (hekim)</option>
                {(['I', 'II', 'III', 'IV'] as NyhaSinif[]).map((n) => <option key={n} value={n}>NYHA {n}</option>)}
              </select>
            )}
          </div>
          <label style={{ ...metin, display: 'flex', gap: 8, marginTop: 8 }}>
            <input type="checkbox" checked={ekgBelge} onChange={(e) => setEkgBelge(e.target.checked)} /> EKG / belge köprüsü
          </label>
          <textarea value={izlemNot} onChange={(e) => setIzlemNot(e.target.value)} rows={2} style={{ ...toolsInput, width: '100%', marginTop: 8 }} placeholder="Hekim notu" />
          <button type="button" style={{ ...btn, marginTop: 8 }} onClick={async () => {
            try {
              const j = await api({ adim: 'izlem', tip: izlemTip, sbp: izlemSbp ? Number(izlemSbp) : null, dbp: izlemDbp ? Number(izlemDbp) : null, nyha: nyha || null, hekimNotu: izlemNot, ekgBelge, hekimKilit: true });
              setEklenenNot(eklenenNotId(j)); setMesaj('İzlem kaydedildi'); await yukle();
            } catch (e) { setMesaj(e instanceof Error ? e.message : 'Hata'); }
          }}>İzlem kaydet</button>
        </div>
      )}

      {sekme === 'Risk' && v && (
        <div>
          <div style={etiket}>Kırmızı bayrak</div>
          {v.kutuphane.acilKodlari.map((k) => (
            <label key={k.kod} style={{ ...metin, display: 'flex', gap: 8 }}>
              <input type="checkbox" checked={riskKodlari.includes(k.kod)} onChange={(e) => setRiskKodlari((p) => e.target.checked ? [...p, k.kod] : p.filter((x) => x !== k.kod))} />
              {k.ad}
            </label>
          ))}
          <textarea value={riskEylem} onChange={(e) => setRiskEylem(e.target.value)} rows={2} style={{ ...toolsInput, width: '100%', marginTop: 8 }} placeholder="Hekim eylemi" />
          <label style={{ ...metin, display: 'flex', gap: 8, marginTop: 8 }}>
            <input type="checkbox" checked={riskOnay} onChange={(e) => setRiskOnay(e.target.checked)} /> Hekim gördü ve eylemi yazdı
          </label>
          <div style={{ ...kucuk, marginTop: 6 }}>{v.kutuphane.acilYonlendirme}</div>
          <button type="button" style={{ ...btn, marginTop: 8 }} onClick={async () => {
            try {
              const j = await api({ adim: 'risk', bayraklar: riskKodlari, eylem: riskEylem, hekimOnay: riskOnay });
              setEklenenNot(eklenenNotId(j)); setMesaj('Risk kaydedildi'); await yukle();
            } catch (e) { setMesaj(e instanceof Error ? e.message : 'Hata'); }
          }}>Risk kaydet</button>
        </div>
      )}

      {sekme === 'Görevler' && v && (
        <div>
          {(v.gorevler.length ? v.gorevler : [{ id: '', kod: '', ad: 'Açık görev yok', due: null }]).map((g) => (
            <div key={g.id || 'bos'} style={{ ...metin, display: 'flex', justifyContent: 'space-between', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span>{g.ad}{g.due ? ` · ${g.due}` : ''}</span>
              {g.id && <button type="button" style={ghost} onClick={async () => { await api({ adim: 'gorev', gorevId: g.id, durum: 'tamam' }); await yukle(); }}>Tamam</button>}
            </div>
          ))}
        </div>
      )}

      {sekme === 'SGK' && (
        <div>
          <select value={raporSablon} onChange={(e) => setRaporSablon(e.target.value as KardioRaporSablon)} style={toolsInput}>
            {KARDIO_RAPOR_SABLONLARI.map((s) => <option key={s.id} value={s.id}>{s.ad}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input placeholder="ICD-10" value={raporIcd} onChange={(e) => setRaporIcd(e.target.value)} style={{ ...toolsInput, width: 100 }} />
            <input placeholder="Tanı" value={raporIcdAd} onChange={(e) => setRaporIcdAd(e.target.value)} style={{ ...toolsInput, flex: 1 }} />
          </div>
          <textarea value={raporNot} onChange={(e) => setRaporNot(e.target.value)} rows={3} style={{ ...toolsInput, width: '100%', marginTop: 8 }} placeholder="Hekim değerlendirmesi" />
          <div style={{ ...kucuk, marginTop: 8 }}>
            Önizleme eksik: {kardioRaporTaslagi({ sablon: raporSablon, hastaAdi: '', bugun: new Date().toISOString().slice(0, 10), tani: raporIcd ? { icd10: raporIcd, aciklama: raporIcdAd || raporIcd } : null, hekimDegerlendirmesi: raporNot }).eksikler.length} madde
            — T.C. yazılmaz; taslak.
          </div>
        </div>
      )}
    </div>
  );
}
