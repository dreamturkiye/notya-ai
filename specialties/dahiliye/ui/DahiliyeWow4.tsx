'use client';
/** NOTYA-DAH-WOW Wave 4 UI — NudgeBar (her sekmenin üstünde: KB ölçüm tekniği, FRAIL, düşme, PHQ-2) + KohortPanel (Araçlar › Dahiliye kohort). */
import React, { useCallback, useEffect, useState } from 'react';
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi';
import type { Wow4Veri } from '@/app/api/doktor/dahiliye/_wow4';
import type { KohortSatir, KohortBayrak } from '../engines/kohort';
import { BAYRAK_AD } from '../engines/kohort';
import { Kaynak } from './DahiliyeWow2';

const kucuk: React.CSSProperties = { fontSize: 11, color: '#8FA0B5' };
const btn: React.CSSProperties = { background: '#0F9B8E', color: '#fff', border: 'none', borderRadius: 8, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' };
const ghost: React.CSSProperties = { ...btn, background: 'transparent', color: '#8FA0B5', border: '1px solid rgba(255,255,255,0.15)' };

export function NudgeBar({ w4, kaynak, refler, calistir }: { w4: Wow4Veri; kaynak: boolean; refler: Record<string, string>; calistir: (body: Record<string, unknown>, ok?: string) => Promise<Record<string, unknown> | null> }) {
  const [acik, setAcik] = useState<string | null>(null);
  const [c, setC] = useState<Record<string, unknown>>({});
  const [liste, setListe] = useState<string[]>([]);
  if (!w4.nudgeler.length && !w4.son.frail && !w4.son.dusme && !w4.son.phq2) return null;
  const q = w4.sorular;
  return (
    <div style={{ border: '1px dashed rgba(251,191,36,0.4)', borderRadius: 10, padding: '6px 10px', marginBottom: 8 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ ...kucuk, fontWeight: 700, color: '#FBBF24' }}>BAKIM KALİTESİ</span>
        {w4.nudgeler.map((n) => <button key={n.kod} type="button" onClick={() => { setAcik(acik === n.kod ? null : n.kod); setC({}); }} title={n.neden} style={{ ...ghost, color: acik === n.kod ? '#FBBF24' : '#EDF1F7', padding: '2px 8px' }}>{n.ad}</button>)}
      </div>
      {acik && (<div style={{ marginTop: 6, fontSize: 12, color: '#EDF1F7' }}>
        <div style={kucuk}>{w4.nudgeler.find((n) => n.kod === acik)?.neden}</div>
        {acik === 'kb_teknik' && (<>{q.kbTeknik.map((t) => <label key={t} style={{ display: 'flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={liste.includes(t)} onChange={(e) => setListe(e.target.checked ? [...liste, t] : liste.filter((x) => x !== t))} />{t}</label>)}
          <button type="button" style={{ ...btn, marginTop: 4 }} onClick={() => calistir({ adim: 'kbteknik', liste }, 'Ölçüm tekniği doğrulandı — KB hedef durumu şeritte gösteriliyor.')}>Tekniği doğrula</button></>)}
        {(acik === 'frail' || acik === 'dusme') && (<>{(acik === 'frail' ? q.frail : q.dusme).map((s) => <label key={s.kod} style={{ display: 'flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={!!c[s.kod]} onChange={(e) => setC({ ...c, [s.kod]: e.target.checked })} />{s.ad}</label>)}
          <button type="button" style={{ ...btn, marginTop: 4 }} onClick={() => calistir({ adim: 'nudge', tip: acik, cevaplar: c }, 'Tarama kaydedildi — nota eklemek için "Nota ekle".')}>Kaydet</button></>)}
        {acik === 'phq2' && (<>{q.phq2.map((s) => <div key={s.kod} style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}><span style={{ flex: 1 }}>{s.ad}</span><select value={String(c[s.kod] ?? '')} onChange={(e) => setC({ ...c, [s.kod]: Number(e.target.value) })} style={{ fontSize: 12 }}><option value="">seç</option>{q.phq2Secenek.map(([v, a]) => <option key={v} value={v}>{a} ({v})</option>)}</select></div>)}
          <button type="button" style={{ ...btn, marginTop: 4 }} onClick={() => calistir({ adim: 'nudge', tip: 'phq2', cevaplar: c }, 'PHQ-2 kaydedildi — nota eklemek için "Nota ekle".')}>Kaydet</button></>)}
        <Kaynak d={w4.nudgeler.filter((n) => n.kod === acik).map((n) => n.dipnot)} acik={kaynak} refler={refler} />
      </div>)}
      {([['frail', w4.son.frail], ['dusme', w4.son.dusme], ['phq2', w4.son.phq2]] as const).filter(([, x]) => x).map(([tip, x]) => <div key={tip} style={{ ...kucuk, marginTop: 4, display: 'flex', gap: 6, alignItems: 'center' }}><span style={{ color: x!.pozitif ? '#FBBF24' : '#8FA0B5' }}>{String(x!.created_at).slice(0, 10)} · {x!.not_metni}</span>{x!.nota_eklendi_at ? <span style={{ color: '#22C55E', fontSize: 10 }}>✓ notta</span> : <button type="button" style={{ ...ghost, padding: '4px 10px', fontSize: 11, minHeight: 28, flexShrink: 0, whiteSpace: 'nowrap' }} onClick={() => calistir({ adim: 'notaekle', tip }, 'Tarama sonucu bugünkü nota eklendi.')}>Nota ekle</button>}</div>)}
    </div>
  );
}

const BAYRAKLAR = Object.keys(BAYRAK_AD) as KohortBayrak[];

const kohortKutu: React.CSSProperties = {
  background: 'linear-gradient(165deg, #10223D 0%, #0C1830 55%, #0A1528 100%)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 18,
  padding: '22px 24px 26px',
  boxShadow: '0 12px 40px rgba(0,0,0,0.28)',
}
const kohortMuted: React.CSSProperties = { fontSize: 14, color: '#9BB0C7', lineHeight: 1.5 }
const kohortChip = (on: boolean): React.CSSProperties => ({
  background: on ? 'rgba(15,155,142,0.22)' : 'rgba(255,255,255,0.04)',
  color: on ? '#5EEAD4' : '#C9D4E3',
  border: `1px solid ${on ? 'rgba(45,212,191,0.45)' : 'rgba(255,255,255,0.12)'}`,
  borderRadius: 999,
  padding: '10px 16px',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  lineHeight: 1.3,
})
const kohortBtn: React.CSSProperties = {
  background: '#0F9B8E',
  color: '#041016',
  border: 'none',
  borderRadius: 12,
  padding: '12px 18px',
  fontSize: 15,
  fontWeight: 700,
  cursor: 'pointer',
}

export function KohortPanel() {
  const [v, setV] = useState<{ satirlar: KohortSatir[]; toplamHasta: number } | null>(null);
  const [filtre, setFiltre] = useState<KohortBayrak[]>([]);
  const [secili, setSecili] = useState<string[]>([]);
  const [mesaj, setMesaj] = useState('');
  const yukle = useCallback(async () => { const token = await getAccessTokenAsync(); const r = await fetch('/api/doktor/dahiliye/kohort', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }); const j = await r.json().catch(() => ({})); if (r.ok) setV(j); else setMesaj(j.error || 'Yüklenemedi'); }, []);
  useEffect(() => { yukle(); }, [yukle]);
  const gorunen = (v?.satirlar || []).filter((s) => !filtre.length || filtre.some((b) => s.bayraklar.includes(b)));
  const gonder = async () => {
    if (!secili.length) return;
    setMesaj('');
    const token = await getAccessTokenAsync();
    const r = await fetch('/api/doktor/dahiliye/kohort', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ patientIds: secili }) });
    const j = await r.json().catch(() => ({}));
    setMesaj(r.ok ? `${j.gonderilen} hastaya hatırlatma gönderildi (Sağlığım › Mesajlar)${j.atlanan ? `; ${j.atlanan} atlandı (son 7 günde gönderilmiş)` : ''}.` : j.error || 'Gönderilemedi');
    setSecili([]);
  };
  const bayrakli = v?.satirlar.length ?? 0;
  return (
    <div style={kohortKutu}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2DD4BF', marginBottom: 6 }}>Kronik kohort</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#EDF1F7', letterSpacing: -0.3 }}>Takip bayrakları</div>
          <div style={{ ...kohortMuted, marginTop: 6, maxWidth: 520 }}>
            {v
              ? `${v.toplamHasta} dahiliye hastası · ${bayrakli} bayraklı · yalnız kart tabloları ve onaylı lab`
              : 'Yükleniyor…'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ background: 'rgba(15,155,142,0.12)', border: '1px solid rgba(45,212,191,0.25)', borderRadius: 14, padding: '12px 16px', minWidth: 88, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#5EEAD4', fontVariantNumeric: 'tabular-nums' }}>{v?.toplamHasta ?? '—'}</div>
            <div style={{ fontSize: 12, color: '#8FA0B5', marginTop: 2 }}>hasta</div>
          </div>
          <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.28)', borderRadius: 14, padding: '12px 16px', minWidth: 88, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#FCA5A5', fontVariantNumeric: 'tabular-nums' }}>{bayrakli || '—'}</div>
            <div style={{ fontSize: 12, color: '#8FA0B5', marginTop: 2 }}>bayraklı</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        {BAYRAKLAR.map((b) => {
          const n = (v?.satirlar || []).filter((s) => s.bayraklar.includes(b)).length
          const on = filtre.includes(b)
          return (
            <button key={b} type="button" onClick={() => setFiltre(on ? filtre.filter((x) => x !== b) : [...filtre, b])} style={kohortChip(on)}>
              {BAYRAK_AD[b]} <span style={{ opacity: 0.85, fontWeight: 700 }}>({n})</span>
            </button>
          )
        })}
      </div>

      <div style={{
        display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap',
        background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 16px', marginBottom: 16,
      }}>
        <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 15, color: '#C9D4E3', cursor: 'pointer' }}>
          <input
            type="checkbox"
            style={{ width: 18, height: 18 }}
            checked={gorunen.length > 0 && gorunen.every((s) => secili.includes(s.patientId))}
            onChange={(e) => setSecili(e.target.checked ? gorunen.map((s) => s.patientId) : [])}
          />
          Görünenleri seç
        </label>
        <button type="button" style={{ ...kohortBtn, opacity: secili.length ? 1 : 0.45, cursor: secili.length ? 'pointer' : 'not-allowed' }} disabled={!secili.length} onClick={gonder}>
          1-tap hatırlatma gönder ({secili.length})
        </button>
        <span style={{ ...kohortMuted, flex: '1 1 220px' }}>Mesaj klinik değer içermez — kontrol / tahlil / aşı-tarama hatırlatması.</span>
      </div>

      {mesaj && <div style={{ fontSize: 15, color: '#5EEAD4', marginBottom: 14, lineHeight: 1.45 }}>{mesaj}</div>}

      <div style={{ display: 'grid', gap: 0, borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
        {gorunen.map((s, i) => (
          <div
            key={s.patientId}
            style={{
              display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center',
              fontSize: 15, color: '#EDF1F7',
              background: i % 2 ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.15)',
              padding: '14px 16px',
              borderBottom: i === gorunen.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <input
              type="checkbox"
              style={{ width: 18, height: 18 }}
              checked={secili.includes(s.patientId)}
              onChange={(e) => setSecili(e.target.checked ? [...secili, s.patientId] : secili.filter((x) => x !== s.patientId))}
            />
            <a href={`/dashboard/doktor/hastalar/${s.patientId}`} style={{ color: '#F1F5F9', minWidth: 170, fontWeight: 700, fontSize: 16, textDecoration: 'none' }}>{s.ad}</a>
            <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: '1 1 180px' }}>
              {s.bayraklar.map((b) => (
                <span key={b} style={{ border: '1px solid rgba(248,113,113,0.45)', borderRadius: 999, padding: '5px 12px', fontSize: 13, fontWeight: 600, color: '#FCA5A5', whiteSpace: 'nowrap', background: 'rgba(248,113,113,0.08)' }}>{BAYRAK_AD[b]}</span>
              ))}
            </span>
            <span style={{ fontSize: 14, color: '#8FA0B5' }}>son vizit {s.sonVizit || '—'}{s.portalVar ? '' : ' · portal yok'}</span>
          </div>
        ))}
        {v && !gorunen.length && (
          <div style={{ padding: '36px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#C9D4E3', marginBottom: 8 }}>Bu filtrede hasta yok</div>
            <div style={kohortMuted}>Başka bir bayrak seçin veya tüm kohortu görmek için filtreleri temizleyin.</div>
          </div>
        )}
      </div>
    </div>
  );
}
