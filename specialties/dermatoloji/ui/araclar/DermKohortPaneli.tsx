'use client';
/**
 * DERM-EXCEPTIONAL-01 — Araçlar › Derm kohort paneli. /api/doktor/dermatoloji/kohort — yalnız hekimin kendi hastaları.
 * 1-tap hatırlatma: Sağlığım › Mesajlar (hasta-güvenli metin — skor, doz, tanı yok) + Hazır mesajlar bildirimi + dönüş görevi.
 * Satır başına: hasta dosyasını aç (Deri) veya kendi WhatsApp'ınızdan / e-postanızdan gönder (GonderDugmesi, NOTYA-ILETISIM-01).
 */
import React, { useCallback, useEffect, useState } from 'react';
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi';
import { hastaDosyaHref } from '@/lib/doktor/geriNavigasyon';
import { DERM_BAYRAK_AD, dermHatirlatmaMesaji, type DermKohortBayrak, type DermKohortSatir } from '../../engines/kohort';
import { dermStil, Istatistik, Rozet } from './DermAracKabugu';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';
import GonderDugmesi from '@/components/doktor/iletisim/GonderDugmesi';

const BAYRAKLAR = Object.keys(DERM_BAYRAK_AD) as DermKohortBayrak[];
const muted: React.CSSProperties = { fontSize: 14, color: CHROME_RENK.muted, lineHeight: 1.5 };
const chip = (on: boolean): React.CSSProperties => ({ background: on ? 'rgba(219,39,119,0.22)' : 'rgba(255,255,255,0.04)', color: on ? '#F9A8D4' : CHROME_RENK.muted, border: `1px solid ${on ? 'rgba(244,114,182,0.45)' : 'rgba(255,255,255,0.12)'}`, borderRadius: 999, padding: '10px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer', minHeight: 44 });
const btn: React.CSSProperties = { ...dermStil.btn, padding: '12px 18px', fontSize: 15 };
const ghost: React.CSSProperties = { ...dermStil.ghost, borderRadius: 10, padding: '8px 12px', minHeight: 40 };

export default function DermKohortPaneli() {
  const [v, setV] = useState<{ satirlar: DermKohortSatir[]; toplamHasta: number } | null>(null);
  const [hata, setHata] = useState('');
  const [filtre, setFiltre] = useState<DermKohortBayrak[]>([]);
  const [secili, setSecili] = useState<string[]>([]);
  const [mesaj, setMesaj] = useState('');
  const [gonderiyor, setGonderiyor] = useState(false);

  const yukle = useCallback(async () => {
    setHata('');
    try {
      const t = await getAccessTokenAsync();
      const r = await fetch('/api/doktor/dermatoloji/kohort', { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' });
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
      const r = await fetch('/api/doktor/dermatoloji/kohort', { method: 'POST', headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ patientIds: secili }) });
      const j = await r.json().catch(() => ({}));
      setMesaj(r.ok ? `${j.gonderilen} hastaya hatırlatma gönderildi (Sağlığım › Mesajlar)${j.atlanan ? `; ${j.atlanan} atlandı (son 7 günde gönderilmiş veya listede değil)` : ''}.` : j.error || 'Gönderilemedi');
      setSecili([]);
      await yukle();
    } finally { setGonderiyor(false); }
  };

  return (
    <div style={{ background: '#0C1830', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, padding: '20px 18px 24px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#F472B6', marginBottom: 6 }}>Derm kohortu</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: CHROME_RENK.ink }}>Takip bayrakları</div>
          <div style={{ ...muted, marginTop: 6, maxWidth: 560 }}>{v ? `${v.toplamHasta} derm kaydı olan hasta · ${v.satirlar.length} bayraklı · yalnız hekimin girdiği tarih ve görevler` : hata || 'Yükleniyor…'}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', minWidth: 200 }}>
          <Istatistik deger={v?.toplamHasta ?? '—'} etiket="derm kaydı olan hasta" ton="iyi" />
          <Istatistik deger={v ? v.satirlar.length : '—'} etiket="bayraklı" ton={v && v.satirlar.length ? 'kirmizi' : 'notr'} />
        </div>
      </div>
      {hata && <div style={{ color: CHROME_RENK.warn, fontSize: 14, marginBottom: 12 }}>{hata} <button type="button" onClick={yukle} style={ghost}>Tekrar dene</button></div>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {BAYRAKLAR.map((b) => { const n = (v?.satirlar || []).filter((s) => s.bayraklar.includes(b)).length; const on = filtre.includes(b); return <button key={b} type="button" onClick={() => setFiltre(on ? filtre.filter((x) => x !== b) : [...filtre, b])} style={chip(on)}>{DERM_BAYRAK_AD[b]} <span style={{ fontWeight: 700 }}>({n})</span></button>; })}
      </div>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '12px 14px', marginBottom: 14 }}>
        <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 15, color: CHROME_RENK.muted, cursor: 'pointer', minHeight: 44 }}>
          <input type="checkbox" style={{ width: 20, height: 20 }} checked={gorunen.length > 0 && gorunen.every((s) => secili.includes(s.patientId))} onChange={(e) => setSecili(e.target.checked ? gorunen.map((s) => s.patientId) : [])} />
          Görünenleri seç
        </label>
        <button type="button" style={{ ...btn, opacity: secili.length && !gonderiyor ? 1 : 0.45, cursor: secili.length ? 'pointer' : 'not-allowed' }} disabled={!secili.length || gonderiyor} onClick={gonder}>{gonderiyor ? 'Gönderiliyor…' : `1-tap hatırlatma gönder (${secili.length})`}</button>
        <span style={{ ...muted, flex: '1 1 220px', fontSize: 13 }}>Mesaj tanı, skor ve ilaç adı içermez — kontrol / tetkik zamanı + acil durumda 112 yönlendirmesi.</span>
      </div>
      {mesaj && <div style={{ fontSize: 15, color: '#F9A8D4', marginBottom: 12 }}>{mesaj}</div>}
      <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
        {gorunen.map((s, i) => (
          <div key={s.patientId} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', fontSize: 15, color: CHROME_RENK.ink, background: i % 2 ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.15)', padding: '12px 14px', borderBottom: i === gorunen.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.06)' }}>
            <input type="checkbox" aria-label={`${s.ad} seç`} style={{ width: 20, height: 20 }} checked={secili.includes(s.patientId)} onChange={(e) => setSecili(e.target.checked ? [...secili, s.patientId] : secili.filter((x) => x !== s.patientId))} />
            <a href={hastaDosyaHref(s.patientId, 'deri')} style={{ color: '#F1F5F9', minWidth: 160, fontWeight: 700, fontSize: 16, textDecoration: 'none' }}>{s.ad}</a>
            <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: '1 1 200px' }}>
              {s.bayraklar.map((b) => <Rozet key={b} ton="kirmizi">{DERM_BAYRAK_AD[b]}</Rozet>)}
            </span>
            <span style={{ fontSize: 13, color: CHROME_RENK.muted, flex: '1 1 100%' }}>{s.detay.join(' · ')}{s.sonVizit ? ` · son vizit ${s.sonVizit}` : ''}{s.portalVar ? '' : ' · portal bağlantısı yok (mesaj portal açılınca görünür)'}</span>
            <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <a href={hastaDosyaHref(s.patientId, 'deri')} style={ghost}>Dosyayı aç</a>
              <GonderDugmesi sessiz tur="serbest" patientId={s.patientId} metin={dermHatirlatmaMesaji(s.bayraklar).metin} etiket="WhatsApp / e-posta ile gönder" />
            </span>
          </div>
        ))}
        {v && !gorunen.length && (
          <div style={{ padding: '32px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: CHROME_RENK.muted, marginBottom: 8 }}>{v.satirlar.length ? 'Bu filtrede hasta yok' : 'Geciken takip yok'}</div>
            <div style={muted}>{v.satirlar.length ? 'Başka bir bayrak seçin veya filtreleri temizleyin.' : 'Okuma penceresi, takip tarihi veya görevi geçen hasta bulunmuyor.'}</div>
          </div>
        )}
      </div>
    </div>
  );
}
