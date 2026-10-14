'use client';

/**
 * GORSEL-YAKALAMA-04 — göz-specific wrapper around the universal capture widget, mounted on the
 * muayene notu screen, gated by bransKapsami().brans === 'goz-hastaliklari' (brans-alan-sizmasi).
 * Göz already has its own independent, rule-based (not image-model) fundus/OCT dual-sign bridge
 * (app/api/doktor/goz/route.ts, adim: 'goruntu_okuma', eylem: 'ayse_taslak') — this wrapper only
 * wires the new universal visit-linked capture into it; no new clinical fields, no derm/KBB/plastik
 * vocabulary. No deid/base64 step here — göz's taslak is derived from modality + eye side, not an
 * image read, so there is nothing to de-identify before sending.
 */
import { useState } from 'react';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';
import GorselYakalaPaneli, { type GorselYakalamaSonucu } from '@/components/doktor/gorsel/GorselYakalaPaneli';

const GOZ_MODALITELER = [
  { value: 'fundus', label: 'Fundus fotoğrafı' },
  { value: 'oct', label: 'OCT' },
  { value: 'on_segment', label: 'Ön segment' },
];

type TaslakGorunumu = { taslak: string; uyari?: string | null };

const kutu: React.CSSProperties = { background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 10, padding: 12, display: 'grid', gap: 8 };

export default function GozNotGorselYakala({ patientId, visitId }: { patientId: string; visitId: string | null }) {
  const [goz, setGoz] = useState<'sag' | 'sol' | 'iki'>('sag');
  const [bekleyenGoruntu, setBekleyenGoruntu] = useState<GorselYakalamaSonucu | null>(null);
  const [degerlendiriliyor, setDegerlendiriliyor] = useState(false);
  const [taslak, setTaslak] = useState<TaslakGorunumu | null>(null);
  const [hata, setHata] = useState('');

  function yuklendiginde(row: GorselYakalamaSonucu, tur: 'foto' | 'pdf') {
    setHata('');
    setTaslak(null);
    if (tur === 'foto') setBekleyenGoruntu(row);
  }

  async function aysedegerlendirsin() {
    if (!bekleyenGoruntu) return;
    setDegerlendiriliyor(true);
    setHata('');
    try {
      const t = await ensureDoctorAccessToken();
      if (!t) { setHata('Oturum bulunamadı.'); return; }
      const r = await fetch('/api/doktor/goz', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ adim: 'goruntu_okuma', eylem: 'ayse_taslak', patientId, goruntuId: bekleyenGoruntu.id, goz }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setHata(j.error || 'Değerlendirilemedi.'); return; }
      setTaslak({ taslak: j.taslak || (Array.isArray(j.uyarilar) ? j.uyarilar.join(' ') : ''), uyari: j.uyari ?? null });
    } finally {
      setDegerlendiriliyor(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: CHROME_RENK.pine, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        Göz — fotoğraf / PDF ekle (bu muayeneye)
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {(['sag', 'sol', 'iki'] as const).map((g) => (
          <button key={g} type="button" onClick={() => setGoz(g)}
            style={{ background: goz === g ? '#DC2626' : '#F6F0E4', color: goz === g ? 'white' : CHROME_RENK.muted, border: 'none', borderRadius: 8, padding: '7px 11px', fontSize: 12.5, cursor: 'pointer' }}>
            {g === 'sag' ? 'Sağ' : g === 'sol' ? 'Sol' : 'İki göz'}
          </button>
        ))}
      </div>
      <GorselYakalaPaneli
        patientId={patientId}
        visitId={visitId}
        modaliteSecenekleri={GOZ_MODALITELER}
        varsayilanModalite="fundus"
        pdfIzinli
        onYuklendi={yuklendiginde}
      />

      {bekleyenGoruntu && !taslak && (
        <div style={kutu}>
          <button type="button" onClick={() => { void aysedegerlendirsin(); }} disabled={degerlendiriliyor}
            style={{ background: '#DC2626', color: 'white', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', minHeight: 40 }}>
            {degerlendiriliyor ? 'Ayşe hazırlıyor…' : 'Ayşe şimdi taslak hazırlasın'}
          </button>
        </div>
      )}

      {taslak && (
        <div style={kutu}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#DC2626' }}>Asistan taslağı</div>
          <div style={{ fontSize: 13, whiteSpace: 'pre-wrap', color: CHROME_RENK.ink }}>{taslak.taslak}</div>
          {taslak.uyari && <div style={{ fontSize: 12, color: CHROME_RENK.warn }}>{taslak.uyari}</div>}
          <span style={{ fontSize: 11.5, color: CHROME_RENK.muted }}>Onay/düzeltme için Göz sekmesini açın.</span>
        </div>
      )}

      {hata && <div role="alert" style={{ fontSize: 12.5, color: CHROME_RENK.warn }}>{hata}</div>}
    </div>
  );
}
