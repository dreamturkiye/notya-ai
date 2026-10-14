'use client';

/**
 * GORSEL-YAKALAMA-02 — KBB-specific wrapper around the universal capture widget, mounted on the
 * muayene notu screen (app/dashboard/doktor/notlar/[id]/page.tsx), gated by bransKapsami().brans
 * === 'kulak-burun-bogaz' (brans-alan-sizmasi). Uses KBB's OWN dual-sign bridge
 * (app/api/doktor/kulak-burun-bogaz/route.ts, adim: 'goruntu_okuma') — never dermatoloji's or
 * göz's fields, prompt, or table. Photo only for AI-assist; a PDF attach skips it (no image to read).
 */
import { useState } from 'react';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';
import GorselYakalaPaneli, { type GorselYakalamaSonucu } from '@/components/doktor/gorsel/GorselYakalaPaneli';

const KBB_MODALITELER = [
  { value: 'otoskopi', label: 'Otoskopi' },
  { value: 'nazoendoskopi', label: 'Nazoendoskopi' },
  { value: 'laringoskopi', label: 'Laringoskopi' },
];

type TaslakGorunumu = { visionReadId: string | null; taslak: string; uyari?: string | null; onayAsamasi: 'bekliyor' | 'onaylandi' | 'hata' };

const kutu: React.CSSProperties = { background: 'rgba(14,116,144,0.06)', border: '1px solid rgba(14,116,144,0.25)', borderRadius: 10, padding: 12, display: 'grid', gap: 8 };

async function dosyayiBase64Yap(url: string): Promise<{ mime: string; base64: string } | null> {
  try {
    const r = await fetch(url);
    const blob = await r.blob();
    const mime = ['image/jpeg', 'image/png', 'image/webp'].includes(blob.type) ? blob.type : 'image/jpeg';
    const base64 = await new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result).split(',')[1] || '');
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
    return base64 ? { mime, base64 } : null;
  } catch {
    return null;
  }
}

export default function KbbNotGorselYakala({ patientId, visitId }: { patientId: string; visitId: string | null }) {
  const [modalite, setModalite] = useState<'otoskopi' | 'nazoendoskopi' | 'laringoskopi'>('otoskopi');
  const [bekleyenGoruntu, setBekleyenGoruntu] = useState<GorselYakalamaSonucu | null>(null);
  const [kimlikYok, setKimlikYok] = useState(false);
  const [degerlendiriliyor, setDegerlendiriliyor] = useState(false);
  const [taslak, setTaslak] = useState<TaslakGorunumu | null>(null);
  const [hata, setHata] = useState('');

  function yuklendiginde(row: GorselYakalamaSonucu, tur: 'foto' | 'pdf') {
    setHata('');
    setTaslak(null);
    if (tur === 'foto') setBekleyenGoruntu(row);
  }

  async function aysedegerlendirsin() {
    if (!bekleyenGoruntu || !kimlikYok) return;
    setDegerlendiriliyor(true);
    setHata('');
    try {
      const t = await ensureDoctorAccessToken();
      if (!t) { setHata('Oturum bulunamadı.'); return; }
      const deid = await dosyayiBase64Yap(bekleyenGoruntu.dosya_url);
      if (!deid) { setHata('Görüntü okunamadı.'); return; }
      const r = await fetch('/api/doktor/kulak-burun-bogaz', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adim: 'goruntu_okuma', eylem: 'asistana_raporla', patientId,
          modalite, goruntuId: bekleyenGoruntu.id, deid, kimlikYok: true,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setHata(j.error || 'Değerlendirilemedi.'); return; }
      setTaslak({ visionReadId: j.visionReadId ?? null, taslak: j.taslak || '', uyari: j.uyari ?? null, onayAsamasi: 'bekliyor' });
    } finally {
      setDegerlendiriliyor(false);
    }
  }

  async function onayla() {
    if (!taslak?.visionReadId) return;
    const t = await ensureDoctorAccessToken();
    if (!t) return;
    const r = await fetch('/api/doktor/kulak-burun-bogaz', {
      method: 'POST',
      headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ adim: 'goruntu_okuma', eylem: 'onayla', patientId, id: taslak.visionReadId }),
    });
    setTaslak((s) => (s ? { ...s, onayAsamasi: r.ok ? 'onaylandi' : 'hata' } : s));
  }

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: CHROME_RENK.pine, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        KBB — fotoğraf / PDF ekle (bu muayeneye)
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {KBB_MODALITELER.map((m) => (
          <button key={m.value} type="button" onClick={() => setModalite(m.value as typeof modalite)}
            style={{ background: modalite === m.value ? '#0E7490' : '#F6F0E4', color: modalite === m.value ? 'white' : CHROME_RENK.muted, border: 'none', borderRadius: 8, padding: '7px 11px', fontSize: 12.5, cursor: 'pointer' }}>
            {m.label}
          </button>
        ))}
      </div>
      <GorselYakalaPaneli
        patientId={patientId}
        visitId={visitId}
        modaliteSecenekleri={KBB_MODALITELER}
        varsayilanModalite={modalite}
        pdfIzinli
        onYuklendi={yuklendiginde}
      />

      {bekleyenGoruntu && !taslak && (
        <div style={kutu}>
          <label style={{ fontSize: 12.5, display: 'flex', gap: 8, alignItems: 'flex-start', color: CHROME_RENK.ink }}>
            <input type="checkbox" checked={kimlikYok} onChange={(e) => setKimlikYok(e.target.checked)} />
            Görüntüde hasta adı / T.C. / doğum tarihi görünmüyor (KVKK) — Ayşe'ye göndermeden önce onaylayın.
          </label>
          <button type="button" onClick={() => { void aysedegerlendirsin(); }} disabled={!kimlikYok || degerlendiriliyor}
            style={{ background: '#0E7490', color: 'white', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: !kimlikYok ? 0.5 : 1, minHeight: 40 }}>
            {degerlendiriliyor ? 'Ayşe değerlendiriyor…' : 'Ayşe şimdi değerlendirsin (taslak)'}
          </button>
        </div>
      )}

      {taslak && (
        <div style={kutu}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#0E7490' }}>Asistan taslağı — doktor onayı bekliyor</div>
          <div style={{ fontSize: 13, whiteSpace: 'pre-wrap', color: CHROME_RENK.ink }}>{taslak.taslak}</div>
          {taslak.uyari && <div style={{ fontSize: 12, color: CHROME_RENK.warn }}>{taslak.uyari}</div>}
          {taslak.onayAsamasi === 'bekliyor' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => { void onayla(); }} style={{ background: '#2E6E4E', color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Onayla</button>
              <span style={{ fontSize: 11.5, color: CHROME_RENK.muted, alignSelf: 'center' }}>Düzeltmek için KBB sekmesini açın.</span>
            </div>
          )}
          {taslak.onayAsamasi === 'onaylandi' && <div style={{ fontSize: 12.5, color: '#2E6E4E' }}>Onaylandı.</div>}
          {taslak.onayAsamasi === 'hata' && <div style={{ fontSize: 12.5, color: CHROME_RENK.warn }}>Onaylanamadı — KBB sekmesinden deneyin.</div>}
        </div>
      )}

      {hata && <div role="alert" style={{ fontSize: 12.5, color: CHROME_RENK.warn }}>{hata}</div>}
    </div>
  );
}
