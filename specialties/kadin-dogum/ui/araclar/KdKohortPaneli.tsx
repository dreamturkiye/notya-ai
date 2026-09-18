'use client';
/**
 * Araçlar › KD kohort paneli (Dahiliye / Göz kohort kalitesi). /api/doktor/gebelik/kohort — yalnız hekimin kendi hastaları.
 * Lohusa 1. ve 6. hafta kontrolü kaçıranlar en üstte ve ayrı vurgulu: doğum sonu kontrol en sık atlanan vizittir.
 * 1-tap hatırlatma: Sağlığım › Mesajlar (hasta-güvenli metin, klinik değer yok) + e-posta bildirimi; satır başına dosyayı aç
 * veya kendi WhatsApp'ınızdan gönder (mevcut /api/doktor/hatirlatma whatsapp_kisisel yolu).
 */
import React, { useCallback, useEffect, useState } from 'react';
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi';
import { hastaDosyaHref } from '@/lib/doktor/geriNavigasyon';
import { KD_BAYRAK_AD, LOHUSA_BAYRAKLARI, kdHatirlatmaMesaji, type KdKohortBayrak, type KdKohortSatir } from '../../engines/kd-kohort';

const BAYRAKLAR = Object.keys(KD_BAYRAK_AD) as KdKohortBayrak[];
const muted: React.CSSProperties = { fontSize: 14, color: '#9BB0C7', lineHeight: 1.5 };
const chip = (on: boolean, lohusa: boolean): React.CSSProperties => ({ background: on ? (lohusa ? 'rgba(234,88,12,0.25)' : 'rgba(219,39,119,0.22)') : 'rgba(255,255,255,0.04)', color: on ? '#FFFFFF' : lohusa ? '#FDBA74' : '#C9D4E3', border: `1px solid ${on ? (lohusa ? '#FB923C' : 'rgba(244,114,182,0.55)') : lohusa ? 'rgba(251,146,60,0.45)' : 'rgba(255,255,255,0.12)'}`, borderRadius: 999, padding: '10px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer', minHeight: 44 });
const btn: React.CSSProperties = { background: '#DB2777', color: '#FFFFFF', border: 'none', borderRadius: 12, padding: '12px 18px', fontSize: 15, fontWeight: 700, cursor: 'pointer', minHeight: 44 };
const ghost: React.CSSProperties = { background: 'transparent', color: '#C9D4E3', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 10, padding: '8px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer', minHeight: 44, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' };

export default function KdKohortPaneli() {
  const [v, setV] = useState<{ satirlar: KdKohortSatir[]; toplamHasta: number } | null>(null);
  const [hata, setHata] = useState('');
  const [filtre, setFiltre] = useState<KdKohortBayrak[]>([]);
  const [secili, setSecili] = useState<string[]>([]);
  const [mesaj, setMesaj] = useState('');
  const [gonderiyor, setGonderiyor] = useState(false);

  const yukle = useCallback(async () => {
    setHata('');
    try {
      const t = await getAccessTokenAsync();
      const r = await fetch('/api/doktor/gebelik/kohort', { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' });
      const j = await r.json().catch(() => ({}));
      if (r.ok) setV(j); else setHata(j.error || 'Kohort yüklenemedi');
    } catch { setHata('Kohort yüklenemedi — bağlantıyı kontrol edin.'); }
  }, []);
  useEffect(() => { yukle(); }, [yukle]);

  const gorunen = (v?.satirlar || []).filter((s) => !filtre.length || filtre.some((b) => s.bayraklar.includes(b)));
  const lohusaSayisi = (v?.satirlar || []).filter((s) => s.lohusa).length;
  const gonder = async () => {
    if (!secili.length || gonderiyor) return;
    setMesaj(''); setGonderiyor(true);
    try {
      const t = await getAccessTokenAsync();
      const r = await fetch('/api/doktor/gebelik/kohort', { method: 'POST', headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ patientIds: secili }) });
      const j = await r.json().catch(() => ({}));
      setMesaj(r.ok ? `${j.gonderilen} hastaya hatırlatma gönderildi (Sağlığım › Mesajlar)${j.atlanan ? `; ${j.atlanan} atlandı (son 7 günde gönderilmiş veya listede değil)` : ''}.` : j.error || 'Gönderilemedi');
      setSecili([]);
      await yukle();
    } catch { setMesaj('Gönderilemedi — bağlantıyı kontrol edin.'); } finally { setGonderiyor(false); }
  };
  const whatsapp = async (s: KdKohortSatir) => {
    setMesaj('');
    try {
      const t = await getAccessTokenAsync();
      const m = kdHatirlatmaMesaji(s.bayraklar);
      const r = await fetch('/api/doktor/hatirlatma', { method: 'POST', headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ hastaId: s.patientId, mesaj: m.metin, tarih: new Date().toISOString().slice(0, 10), kanal: 'whatsapp_kisisel' }) });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.waLink) window.open(j.waLink, '_blank', 'noopener'); else setMesaj(j.error || 'WhatsApp bağlantısı oluşturulamadı');
    } catch { setMesaj('WhatsApp bağlantısı oluşturulamadı.'); }
  };

  const satir = (s: KdKohortSatir, i: number, son: boolean) => (
    <div key={s.patientId} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', fontSize: 15, color: '#EDF1F7', background: s.lohusa ? 'rgba(234,88,12,0.10)' : i % 2 ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.15)', padding: '12px 14px', borderLeft: s.lohusa ? '4px solid #FB923C' : '4px solid transparent', borderBottom: son ? 'none' : '1px solid rgba(255,255,255,0.06)' }}>
      <input type="checkbox" aria-label={`${s.ad} seç`} style={{ width: 22, height: 22 }} checked={secili.includes(s.patientId)} onChange={(e) => setSecili(e.target.checked ? [...secili, s.patientId] : secili.filter((x) => x !== s.patientId))} />
      <a href={hastaDosyaHref(s.patientId, 'gebelik')} style={{ color: '#F1F5F9', minWidth: 160, fontWeight: 700, fontSize: 16, textDecoration: 'none' }}>{s.ad}</a>
      <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: '1 1 200px' }}>
        {s.bayraklar.map((b) => { const l = LOHUSA_BAYRAKLARI.includes(b), k = b === 'tarama_kapaniyor'; return <span key={b} style={{ border: `1px solid ${l || k ? '#FB923C' : 'rgba(248,113,113,0.45)'}`, borderRadius: 999, padding: '4px 10px', fontSize: 13, fontWeight: 700, color: l || k ? '#FFEDD5' : '#FCA5A5', background: l || k ? 'rgba(234,88,12,0.28)' : 'rgba(248,113,113,0.08)' }}>{KD_BAYRAK_AD[b]}</span>; })}
      </span>
      <span style={{ fontSize: 13, color: '#8FA0B5', flex: '1 1 100%' }}>{s.detay.join(' · ')}{s.sonVizit ? ` · son vizit ${s.sonVizit.split('-').reverse().join('.')}` : ''}{s.portalVar ? '' : ' · portal bağlantısı yok (mesaj portal açılınca görünür)'}</span>
      <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <a href={hastaDosyaHref(s.patientId, 'gebelik')} style={ghost}>Dosyayı aç</a>
        <button type="button" onClick={() => whatsapp(s)} style={ghost}>WhatsApp&apos;tan gönder</button>
      </span>
    </div>
  );
  const lohusalar = gorunen.filter((s) => s.lohusa), digerleri = gorunen.filter((s) => !s.lohusa);

  return (
    <div style={{ background: '#0C1830', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, padding: '20px 18px 24px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#F472B6', marginBottom: 6 }}>Kadın doğum kohortu</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#EDF1F7' }}>Takip bayrakları</div>
          <div style={{ ...muted, marginTop: 6, maxWidth: 560 }}>{v ? `${v.toplamHasta} gebelik / lohusa / kadın sağlığı kaydı olan hasta · ${v.satirlar.length} bayraklı · yalnız sizin girdiğiniz kayıtlar` : hata || 'Yükleniyor…'}</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ background: 'rgba(234,88,12,0.14)', border: '1px solid rgba(251,146,60,0.45)', borderRadius: 14, padding: '12px 16px', minWidth: 88, textAlign: 'center' }}><div style={{ fontSize: 22, fontWeight: 800, color: '#FDBA74' }}>{v ? lohusaSayisi : '—'}</div><div style={{ fontSize: 12, color: '#8FA0B5' }}>lohusa</div></div>
          <div style={{ background: 'rgba(219,39,119,0.12)', border: '1px solid rgba(244,114,182,0.3)', borderRadius: 14, padding: '12px 16px', minWidth: 88, textAlign: 'center' }}><div style={{ fontSize: 22, fontWeight: 800, color: '#F9A8D4' }}>{v ? v.satirlar.length : '—'}</div><div style={{ fontSize: 12, color: '#8FA0B5' }}>bayraklı</div></div>
        </div>
      </div>
      {hata && <div style={{ color: '#FCA5A5', fontSize: 14, marginBottom: 12 }}>{hata} <button type="button" onClick={yukle} style={ghost}>Tekrar dene</button></div>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {BAYRAKLAR.map((b) => { const n = (v?.satirlar || []).filter((s) => s.bayraklar.includes(b)).length; const on = filtre.includes(b); return <button key={b} type="button" aria-pressed={on} onClick={() => setFiltre(on ? filtre.filter((x) => x !== b) : [...filtre, b])} style={chip(on, LOHUSA_BAYRAKLARI.includes(b))}>{KD_BAYRAK_AD[b]} <span style={{ fontWeight: 700 }}>({n})</span></button>; })}
      </div>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '12px 14px', marginBottom: 14 }}>
        <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 15, color: '#C9D4E3', cursor: 'pointer', minHeight: 44 }}>
          <input type="checkbox" style={{ width: 22, height: 22 }} checked={gorunen.length > 0 && gorunen.every((s) => secili.includes(s.patientId))} onChange={(e) => setSecili(e.target.checked ? gorunen.map((s) => s.patientId) : [])} />
          Görünenleri seç
        </label>
        <button type="button" style={{ ...btn, opacity: secili.length && !gonderiyor ? 1 : 0.45, cursor: secili.length ? 'pointer' : 'not-allowed' }} disabled={!secili.length || gonderiyor} onClick={gonder}>{gonderiyor ? 'Gönderiliyor…' : `1-tap hatırlatma gönder (${secili.length})`}</button>
        <span style={{ ...muted, flex: '1 1 220px', fontSize: 13 }}>Mesaj tanı ve klinik değer içermez — kontrol / test zamanı + acil durumda 112 yönlendirmesi.</span>
      </div>
      {mesaj && <div style={{ fontSize: 15, color: '#F9A8D4', marginBottom: 12 }}>{mesaj}</div>}

      {lohusalar.length > 0 && (
        <div style={{ borderRadius: 14, overflow: 'hidden', border: '2px solid rgba(251,146,60,0.6)', marginBottom: 14 }}>
          <div style={{ background: 'rgba(234,88,12,0.22)', padding: '10px 14px' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#FFEDD5', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Lohusa — öncelikli ({lohusalar.length})</div>
            <div style={{ fontSize: 13, color: '#FED7AA', marginTop: 2 }}>Doğum sonu kontroller sık atlanır; doğum sonrası haftalar ağır komplikasyonların görülebildiği dönemdir. 1. hafta (2–5. gün) ve 6. hafta (30–40. gün) izlemleri — Doğum Sonu Bakım Yönetim Rehberi.</div>
          </div>
          {lohusalar.map((s, i) => satir(s, i, i === lohusalar.length - 1))}
        </div>
      )}
      <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
        {digerleri.map((s, i) => satir(s, i, i === digerleri.length - 1))}
        {v && !gorunen.length && (
          <div style={{ padding: '32px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#C9D4E3', marginBottom: 8 }}>{v.satirlar.length ? 'Bu filtrede hasta yok' : v.toplamHasta ? 'Geciken takip yok' : 'Henüz gebelik veya kadın sağlığı kaydı yok'}</div>
            <div style={muted}>{v.satirlar.length ? 'Başka bir bayrak seçin veya filtreleri temizleyin.' : v.toplamHasta ? 'Lohusa kontrolü, tarama penceresi, izlem veya serviks taraması geciken hasta bulunmuyor.' : 'Hasta dosyasında Kadın Sağlığı & Gebelik sekmesinden kayıt açtıkça hastalar burada izlenir.'}</div>
          </div>
        )}
        {v && gorunen.length > 0 && !digerleri.length && <div style={{ ...muted, padding: '14px', fontSize: 13 }}>Lohusa dışında bayraklı hasta yok.</div>}
      </div>
    </div>
  );
}
