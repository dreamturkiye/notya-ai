'use client';
/**
 * PEDI-ARACLAR-02 — Araçlar › Pediatri kohort paneli (Göz / KD kohort kalıbı). /api/doktor/pediatri/kohort — yalnız hekimin
 * kendi 18 yaş altı hastaları. 1-tap hatırlatma: Sağlığım › Mesajlar (hasta-güvenli metin, klinik değer yok) + e-posta bildirimi.
 * Satır başına: dosyayı aç (ilgili sekme), aşı planı / gelişim paneli derin bağlantısı, kendi WhatsApp'ınızdan gönder
 * (mevcut /api/doktor/hatirlatma whatsapp_kisisel yolu).
 */
import React, { useCallback, useEffect, useState } from 'react';
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi';
import { hastaDosyaHref } from '@/lib/doktor/geriNavigasyon';
import { PEDI_BAYRAK_AD, pediHatirlatmaMesaji, type PediKohortBayrak, type PediKohortSatir } from '../../engines/kohort';
import { tarihGoster } from '../../engines/girdi';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

const BAYRAKLAR = Object.keys(PEDI_BAYRAK_AD) as PediKohortBayrak[];
const muted: React.CSSProperties = { fontSize: 14, color: CHROME_RENK.muted, lineHeight: 1.5 };
const chip = (on: boolean): React.CSSProperties => ({ background: on ? 'rgba(15,155,142,0.22)' : 'rgba(255,255,255,0.04)', color: on ? '#5EEAD4' : CHROME_RENK.muted, border: `1px solid ${on ? 'rgba(45,212,191,0.45)' : 'rgba(255,255,255,0.12)'}`, borderRadius: 999, padding: '10px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer', minHeight: 44 });
const btn: React.CSSProperties = { background: '#0F9B8E', color: '#041016', border: 'none', borderRadius: 12, padding: '12px 18px', fontSize: 15, fontWeight: 700, cursor: 'pointer', minHeight: 44 };
const ghost: React.CSSProperties = { background: 'transparent', color: CHROME_RENK.muted, border: '1px solid rgba(255,255,255,0.16)', borderRadius: 10, padding: '8px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer', minHeight: 44, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' };

export default function PediKohortPaneli() {
  const [v, setV] = useState<{ satirlar: PediKohortSatir[]; toplamCocuk: number; taramaTablosu?: boolean } | null>(null);
  const [hata, setHata] = useState('');
  const [filtre, setFiltre] = useState<PediKohortBayrak[]>([]);
  const [secili, setSecili] = useState<string[]>([]);
  const [mesaj, setMesaj] = useState('');
  const [gonderiyor, setGonderiyor] = useState(false);
  const [onizleme, setOnizleme] = useState(false);

  const yukle = useCallback(async () => {
    setHata('');
    try {
      const t = await getAccessTokenAsync();
      const r = await fetch('/api/doktor/pediatri/kohort', { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' });
      const j = await r.json().catch(() => ({}));
      if (r.ok) setV(j); else setHata(j.error || 'Kohort yüklenemedi');
    } catch { setHata('Kohort yüklenemedi — bağlantıyı kontrol edin.'); }
  }, []);
  useEffect(() => { yukle(); }, [yukle]);

  const gorunen = (v?.satirlar || []).filter((s) => !filtre.length || filtre.some((b) => s.bayraklar.includes(b)));
  const seciliBayraklar = [...new Set((v?.satirlar || []).filter((s) => secili.includes(s.patientId)).flatMap((s) => s.bayraklar))];
  const gonder = async () => {
    if (!secili.length || gonderiyor) return;
    setMesaj(''); setGonderiyor(true);
    try {
      const t = await getAccessTokenAsync();
      const r = await fetch('/api/doktor/pediatri/kohort', { method: 'POST', headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ patientIds: secili }) });
      const j = await r.json().catch(() => ({}));
      setMesaj(r.ok ? `${j.gonderilen} aileye hatırlatma gönderildi (Sağlığım › Mesajlar)${j.atlanan ? `; ${j.atlanan} atlandı (son 7 günde gönderilmiş veya listede değil)` : ''}.` : j.error || 'Gönderilemedi');
      setSecili([]);
      await yukle();
    } catch { setMesaj('Gönderilemedi — bağlantıyı kontrol edin.'); }
    finally { setGonderiyor(false); }
  };
  const whatsapp = async (s: PediKohortSatir) => {
    setMesaj('');
    try {
      const t = await getAccessTokenAsync();
      const m = pediHatirlatmaMesaji(s.bayraklar);
      const r = await fetch('/api/doktor/hatirlatma', { method: 'POST', headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ hastaId: s.patientId, mesaj: m.metin, tarih: new Date().toISOString().slice(0, 10), kanal: 'whatsapp_kisisel' }) });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.waLink) window.open(j.waLink, '_blank', 'noopener'); else setMesaj(j.error || 'WhatsApp bağlantısı oluşturulamadı');
    } catch { setMesaj('WhatsApp bağlantısı oluşturulamadı — bağlantıyı kontrol edin.'); }
  };

  return (
    <div style={{ background: '#0C1830', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, padding: '20px 18px 24px', minWidth: 0 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2DD4BF', marginBottom: 6 }}>Pediatri kohortu</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: CHROME_RENK.ink }}>Takip bayrakları</div>
          <div style={{ ...muted, marginTop: 6, maxWidth: 600 }}>{v ? `${v.toplamCocuk} çocuk (18 yaş altı) · ${v.satirlar.length} bayraklı · yalnız sizin kayıtlarınız` : hata || 'Yükleniyor…'}</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ background: 'rgba(15,155,142,0.12)', border: '1px solid rgba(45,212,191,0.25)', borderRadius: 14, padding: '12px 16px', minWidth: 88, textAlign: 'center' }}><div style={{ fontSize: 22, fontWeight: 800, color: '#5EEAD4' }}>{v?.toplamCocuk ?? '—'}</div><div style={{ fontSize: 12, color: CHROME_RENK.muted }}>çocuk</div></div>
          <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.28)', borderRadius: 14, padding: '12px 16px', minWidth: 88, textAlign: 'center' }}><div style={{ fontSize: 22, fontWeight: 800, color: CHROME_RENK.warn }}>{v ? v.satirlar.length : '—'}</div><div style={{ fontSize: 12, color: CHROME_RENK.muted }}>bayraklı</div></div>
        </div>
      </div>
      {hata && <div style={{ color: CHROME_RENK.warn, fontSize: 14, marginBottom: 12, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>{hata} <button type="button" onClick={yukle} style={ghost}>Tekrar dene</button></div>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {BAYRAKLAR.map((b) => { const n = (v?.satirlar || []).filter((s) => s.bayraklar.includes(b)).length; const on = filtre.includes(b); return <button key={b} type="button" aria-pressed={on} onClick={() => setFiltre(on ? filtre.filter((x) => x !== b) : [...filtre, b])} style={chip(on)}>{PEDI_BAYRAK_AD[b]} <span style={{ fontWeight: 700 }}>({n})</span></button>; })}
      </div>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '12px 14px', marginBottom: 14 }}>
        <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 15, color: CHROME_RENK.muted, cursor: 'pointer', minHeight: 44 }}>
          <input type="checkbox" style={{ width: 20, height: 20 }} checked={gorunen.length > 0 && gorunen.every((s) => secili.includes(s.patientId))} onChange={(e) => setSecili(e.target.checked ? gorunen.map((s) => s.patientId) : [])} />
          Görünenleri seç
        </label>
        <button type="button" style={{ ...btn, opacity: secili.length && !gonderiyor ? 1 : 0.45, cursor: secili.length ? 'pointer' : 'not-allowed' }} disabled={!secili.length || gonderiyor} onClick={gonder}>{gonderiyor ? 'Gönderiliyor…' : `1-tap hatırlatma gönder (${secili.length})`}</button>
        <button type="button" style={ghost} aria-expanded={onizleme} onClick={() => setOnizleme(!onizleme)}>{onizleme ? 'Önizlemeyi kapat' : 'Mesajı önizle'}</button>
        <span style={{ ...muted, flex: '1 1 220px', fontSize: 13 }}>Veliye giden mesaj tanı, ölçüm ya da ilaç adı içermez — yalnız kontrol zamanı ve acil durumda 112.</span>
      </div>
      {onizleme && <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, color: CHROME_RENK.muted, background: 'rgba(0,0,0,0.25)', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 12, padding: 12, marginBottom: 14 }}>{pediHatirlatmaMesaji(seciliBayraklar.length ? seciliBayraklar : ['asi_gecikti']).metin}</div>}
      {mesaj && <div style={{ fontSize: 15, color: '#5EEAD4', marginBottom: 12 }}>{mesaj}</div>}
      <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
        {gorunen.map((s, i) => (
          <div key={s.patientId} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', fontSize: 15, color: CHROME_RENK.ink, background: i % 2 ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.15)', padding: '12px 14px', borderBottom: i === gorunen.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.06)' }}>
            <input type="checkbox" aria-label={`${s.ad} seç`} style={{ width: 20, height: 20 }} checked={secili.includes(s.patientId)} onChange={(e) => setSecili(e.target.checked ? [...secili, s.patientId] : secili.filter((x) => x !== s.patientId))} />
            <a href={hastaDosyaHref(s.patientId, s.sekme === 'ozet' ? null : s.sekme)} style={{ color: '#F1F5F9', minWidth: 150, fontWeight: 700, fontSize: 16, textDecoration: 'none', overflowWrap: 'anywhere' }}>{s.ad} <span style={{ fontWeight: 500, fontSize: 13, color: CHROME_RENK.muted }}>· {s.yas}</span></a>
            <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: '1 1 200px' }}>
              {s.bayraklar.map((b) => <span key={b} style={{ border: '1px solid rgba(248,113,113,0.45)', borderRadius: 999, padding: '4px 10px', fontSize: 13, fontWeight: 600, color: CHROME_RENK.warn, background: 'rgba(248,113,113,0.08)' }}>{PEDI_BAYRAK_AD[b]}</span>)}
            </span>
            <span style={{ fontSize: 13, color: CHROME_RENK.muted, flex: '1 1 100%', overflowWrap: 'anywhere' }}>{s.detay.join(' · ')}{s.sonVizit ? ` · son muayene ${tarihGoster(s.sonVizit)}` : ''}{s.portalVar ? '' : ' · portal bağlantısı yok (mesaj portal açılınca görünür)'}</span>
            <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <a href={hastaDosyaHref(s.patientId, s.sekme === 'ozet' ? null : s.sekme)} style={ghost}>Dosyayı aç</a>
              {(s.bayraklar.includes('asi_gecikti') || s.bayraklar.includes('asi_kayit_tutarsiz')) && <a href={`/doktor-tools/pedi-asi?hasta=${encodeURIComponent(s.patientId)}`} style={ghost}>Aşı planı</a>}
              {(s.bayraklar.includes('tarama_gecikti') || s.bayraklar.includes('izlem_kacti') || s.bayraklar.includes('profilaksi')) && <a href={`/doktor-tools/pedi-gelisim?hasta=${encodeURIComponent(s.patientId)}`} style={ghost}>Gelişim paneli</a>}
              <button type="button" onClick={() => whatsapp(s)} style={ghost}>WhatsApp&apos;tan gönder</button>
            </span>
          </div>
        ))}
        {v && !gorunen.length && (
          <div style={{ padding: '32px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: CHROME_RENK.muted, marginBottom: 8 }}>{v.satirlar.length ? 'Bu filtrede çocuk yok' : v.toplamCocuk ? 'Takip gecikmesi yok' : 'Kayıtlı çocuk hastanız yok'}</div>
            <div style={muted}>{v.satirlar.length ? 'Başka bir bayrak seçin veya filtreleri temizleyin.' : v.toplamCocuk ? 'Aşı, izlem, büyüme, profilaksi ve tarama bayrağı taşıyan çocuk bulunmuyor.' : 'Doğum tarihi kayıtlı 18 yaş altı hastanız olduğunda burada listelenir.'}</div>
          </div>
        )}
      </div>
      <div style={{ ...muted, fontSize: 12, marginTop: 12 }}>
        Aşı bayrağı yalnız kaydı tutulan serilerde (seri başlamış, sıradaki doz gecikmiş) hesaplanır — aile hekimliğinde yapılan dozlar kayda girilmediyse aşı planından kartı işleyin. İzlem bayrağı son 180 günde penceresi kapanmış ve muayenesi olmayan vizitler içindir. Kaynak: SB Ulusal Aşı Takvimi · SB İzlem Protokolleri 2018 · Neyzi 2015. Bayraklar karar desteğidir; klinik değerlendirme hekimindir.
      </div>
    </div>
  );
}
