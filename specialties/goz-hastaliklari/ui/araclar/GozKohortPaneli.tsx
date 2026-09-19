'use client';
/**
 * GOZ-EXCEPTIONAL-01 — Araçlar › Göz kohort paneli (Dahiliye kohort kalitesi). /api/doktor/goz/kohort — yalnız hekimin kendi hastaları.
 * 1-tap hatırlatma: Sağlığım › Mesajlar (hasta-güvenli metin, klinik değer yok) + e-posta bildirimi + dönüş görevi.
 * Satır başına: hasta dosyasını aç (Göz) veya kendi WhatsApp'ınızdan gönder (mevcut /api/doktor/hatirlatma whatsapp_kisisel yolu).
 */
import React, { useCallback, useEffect, useState } from 'react';
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi';
import { hastaDosyaHref } from '@/lib/doktor/geriNavigasyon';
import { GOZ_BAYRAK_AD, gozHatirlatmaMesaji, type GozKohortBayrak, type GozKohortSatir } from '../../engines/kohort';
import { gozStil, Istatistik, Rozet } from './GozAracKabugu';

const BAYRAKLAR = Object.keys(GOZ_BAYRAK_AD) as GozKohortBayrak[];
const muted: React.CSSProperties = { fontSize: 14, color: '#9BB0C7', lineHeight: 1.5 };
const chip = (on: boolean): React.CSSProperties => ({ background: on ? 'rgba(15,155,142,0.22)' : 'rgba(255,255,255,0.04)', color: on ? '#5EEAD4' : '#C9D4E3', border: `1px solid ${on ? 'rgba(45,212,191,0.45)' : 'rgba(255,255,255,0.12)'}`, borderRadius: 999, padding: '10px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer', minHeight: 44 });
const btn: React.CSSProperties = { ...gozStil.btn, padding: '12px 18px', fontSize: 15 };
const ghost: React.CSSProperties = { ...gozStil.ghost, borderRadius: 10, padding: '8px 12px', minHeight: 40 };

export default function GozKohortPaneli() {
  const [v, setV] = useState<{ satirlar: GozKohortSatir[]; toplamHasta: number } | null>(null);
  const [hata, setHata] = useState('');
  const [filtre, setFiltre] = useState<GozKohortBayrak[]>([]);
  const [secili, setSecili] = useState<string[]>([]);
  const [mesaj, setMesaj] = useState('');
  const [gonderiyor, setGonderiyor] = useState(false);

  const yukle = useCallback(async () => {
    setHata('');
    try {
      const t = await getAccessTokenAsync();
      const r = await fetch('/api/doktor/goz/kohort', { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' });
      const j = await r.json().catch(() => ({}));
      if (r.ok) setV(j); else setHata(j.error || 'Kohort yüklenemedi');
    } catch { setHata('Kohort yüklenemedi — bağlantıyı kontrol edin.'); }
  }, []);
  useEffect(() => { yukle(); }, [yukle]);

  const gorunen = (v?.satirlar || []).filter((s) => !filtre.length || filtre.some((b) => s.bayraklar.includes(b)));
  const gonder = async () => {
    if (!secili.length || gonderiyor) return;
    setMesaj(''); setGonderiyor(true);
    try {
      const t = await getAccessTokenAsync();
      const r = await fetch('/api/doktor/goz/kohort', { method: 'POST', headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ patientIds: secili }) });
      const j = await r.json().catch(() => ({}));
      setMesaj(r.ok ? `${j.gonderilen} hastaya hatırlatma gönderildi (Sağlığım › Mesajlar)${j.atlanan ? `; ${j.atlanan} atlandı (son 7 günde gönderilmiş veya listede değil)` : ''}.` : j.error || 'Gönderilemedi');
      setSecili([]);
      await yukle();
    } finally { setGonderiyor(false); }
  };
  const whatsapp = async (s: GozKohortSatir) => {
    setMesaj('');
    const t = await getAccessTokenAsync();
    const m = gozHatirlatmaMesaji(s.bayraklar);
    const r = await fetch('/api/doktor/hatirlatma', { method: 'POST', headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ hastaId: s.patientId, mesaj: m.metin, tarih: new Date().toISOString().slice(0, 10), kanal: 'whatsapp_kisisel' }) });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.waLink) window.open(j.waLink, '_blank', 'noopener'); else setMesaj(j.error || 'WhatsApp bağlantısı oluşturulamadı');
  };

  return (
    <div style={{ background: '#0C1830', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, padding: '20px 18px 24px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2DD4BF', marginBottom: 6 }}>Göz kohortu</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#EDF1F7' }}>Takip bayrakları</div>
          <div style={{ ...muted, marginTop: 6, maxWidth: 560 }}>{v ? `${v.toplamHasta} göz kaydı olan hasta · ${v.satirlar.length} bayraklı · yalnız hekimin girdiği tarih ve görevler` : hata || 'Yükleniyor…'}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', minWidth: 200 }}>
          <Istatistik deger={v?.toplamHasta ?? '—'} etiket="göz kaydı olan hasta" ton="iyi" />
          <Istatistik deger={v ? v.satirlar.length : '—'} etiket="bayraklı" ton={v && v.satirlar.length ? 'kirmizi' : 'notr'} />
        </div>
      </div>
      {hata && <div style={{ color: '#FCA5A5', fontSize: 14, marginBottom: 12 }}>{hata} <button type="button" onClick={yukle} style={ghost}>Tekrar dene</button></div>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {BAYRAKLAR.map((b) => { const n = (v?.satirlar || []).filter((s) => s.bayraklar.includes(b)).length; const on = filtre.includes(b); return <button key={b} type="button" onClick={() => setFiltre(on ? filtre.filter((x) => x !== b) : [...filtre, b])} style={chip(on)}>{GOZ_BAYRAK_AD[b]} <span style={{ fontWeight: 700 }}>({n})</span></button>; })}
      </div>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '12px 14px', marginBottom: 14 }}>
        <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 15, color: '#C9D4E3', cursor: 'pointer', minHeight: 44 }}>
          <input type="checkbox" style={{ width: 20, height: 20 }} checked={gorunen.length > 0 && gorunen.every((s) => secili.includes(s.patientId))} onChange={(e) => setSecili(e.target.checked ? gorunen.map((s) => s.patientId) : [])} />
          Görünenleri seç
        </label>
        <button type="button" style={{ ...btn, opacity: secili.length && !gonderiyor ? 1 : 0.45, cursor: secili.length ? 'pointer' : 'not-allowed' }} disabled={!secili.length || gonderiyor} onClick={gonder}>{gonderiyor ? 'Gönderiliyor…' : `1-tap hatırlatma gönder (${secili.length})`}</button>
        <span style={{ ...muted, flex: '1 1 220px', fontSize: 13 }}>Mesaj tanı ve klinik değer içermez — kontrol / tetkik zamanı + acil durumda 112 yönlendirmesi.</span>
      </div>
      {mesaj && <div style={{ fontSize: 15, color: '#5EEAD4', marginBottom: 12 }}>{mesaj}</div>}
      <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
        {gorunen.map((s, i) => (
          <div key={s.patientId} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', fontSize: 15, color: '#EDF1F7', background: i % 2 ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.15)', padding: '12px 14px', borderBottom: i === gorunen.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.06)' }}>
            <input type="checkbox" aria-label={`${s.ad} seç`} style={{ width: 20, height: 20 }} checked={secili.includes(s.patientId)} onChange={(e) => setSecili(e.target.checked ? [...secili, s.patientId] : secili.filter((x) => x !== s.patientId))} />
            <a href={hastaDosyaHref(s.patientId, 'goz')} style={{ color: '#F1F5F9', minWidth: 160, fontWeight: 700, fontSize: 16, textDecoration: 'none' }}>{s.ad}</a>
            <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: '1 1 200px' }}>
              {s.bayraklar.map((b) => <Rozet key={b} ton="kirmizi">{GOZ_BAYRAK_AD[b]}</Rozet>)}
            </span>
            <span style={{ fontSize: 13, color: '#8FA0B5', flex: '1 1 100%' }}>{s.detay.join(' · ')}{s.sonVizit ? ` · son vizit ${s.sonVizit}` : ''}{s.portalVar ? '' : ' · portal bağlantısı yok (mesaj portal açılınca görünür)'}</span>
            <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <a href={hastaDosyaHref(s.patientId, 'goz')} style={ghost}>Dosyayı aç</a>
              <button type="button" onClick={() => whatsapp(s)} style={ghost}>WhatsApp'tan gönder</button>
            </span>
          </div>
        ))}
        {v && !gorunen.length && (
          <div style={{ padding: '32px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#C9D4E3', marginBottom: 8 }}>{v.satirlar.length ? 'Bu filtrede hasta yok' : 'Geciken takip yok'}</div>
            <div style={muted}>{v.satirlar.length ? 'Başka bir bayrak seçin veya filtreleri temizleyin.' : 'Görev, planlı enjeksiyon veya kontrol tarihi geçen hasta bulunmuyor.'}</div>
          </div>
        )}
      </div>
    </div>
  );
}
