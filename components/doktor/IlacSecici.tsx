'use client';

/**
 * İlaç seçici — the one drug picker for every form that asks for a drug.
 *
 * Two dropdowns, in the order a doctor thinks: first the brand (progressive search over the
 * 8.649-record SGK list via /api/doktor/ilac-ara — responds from the first character, typo
 * tolerant, brand and etken madde both searchable), then the SUNUM: the exact pack as it sits
 * on the pharmacy shelf ("PAROL 500 MG 20 TABLET"). Picking a pack fills brand, etken madde,
 * dose and barcode in one go. The doctor never spells a drug name out.
 *
 * Dose is parsed from the pack name ("500 MG", "%5", "1000 MG/5 ML", "20 MCG"); if nothing
 * parses the field stays editable.
 */
import React, { useEffect, useRef, useState } from 'react';
import type { GruplanmisIlac, SunumSecenegi } from '@/app/api/doktor/ilac-ara/route';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';

export interface IlacSecim {
  ad: string;
  marka: string;
  etkenMadde: string;
  doz: string;
  barkod: string;
}

export function dozCikar(sunumAdi: string): string {
  const m = sunumAdi.match(/(\d+(?:[.,]\d+)?\s*(?:MG|MCG|G|IU|ME|ML)(?:\s*\/\s*\d+(?:[.,]\d+)?\s*(?:ML|MG|G|DOZ))?|%\s*\d+(?:[.,]\d+)?)/i);
  return m ? m[1].replace(/\s+/g, ' ').trim() : '';
}

interface Props {
  onSelect: (secim: IlacSecim) => void;
  inputStyle?: React.CSSProperties;
  labelStyle?: React.CSSProperties;
}

export default function IlacSecici({ onSelect, inputStyle, labelStyle }: Props) {
  const [q, setQ] = useState('');
  const [sonuclar, setSonuclar] = useState<GruplanmisIlac[]>([]);
  const [acik, setAcik] = useState(false);
  const [araniyor, setAraniyor] = useState(false);
  const [secili, setSecili] = useState<GruplanmisIlac | null>(null);
  const [sunum, setSunum] = useState<SunumSecenegi | null>(null);
  const kutu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const s = q.trim();
    if (!s || (secili && s === secili.marka)) { setSonuclar([]); return; }
    let iptal = false;
    const t = setTimeout(async () => {
      setAraniyor(true);
      try {
        const token = await ensureDoctorAccessToken();
        const r = await fetch(`/api/doktor/ilac-ara?q=${encodeURIComponent(s)}`, { headers: { Authorization: `Bearer ${token}` } });
        const d = await r.json();
        if (!iptal) { setSonuclar(d.sonuclar || []); setAcik(true); }
      } catch { if (!iptal) setSonuclar([]); }
      finally { if (!iptal) setAraniyor(false); }
    }, 120);
    return () => { iptal = true; clearTimeout(t); };
  }, [q, secili]);

  useEffect(() => {
    const kapat = (e: MouseEvent) => { if (kutu.current && !kutu.current.contains(e.target as Node)) setAcik(false); };
    document.addEventListener('mousedown', kapat);
    return () => document.removeEventListener('mousedown', kapat);
  }, []);

  function markaSec(g: GruplanmisIlac) {
    setSecili(g); setQ(g.marka); setAcik(false); setSonuclar([]);
    if (g.sunumlar.length === 1) sunumSec(g.sunumlar[0], g);
    else setSunum(null);
  }

  function sunumSec(su: SunumSecenegi, g?: GruplanmisIlac) {
    const grup = g || secili;
    setSunum(su);
    onSelect({
      ad: su.ad,
      marka: grup?.marka || '',
      etkenMadde: su.etkenMadde || grup?.etkenMadde || '',
      doz: dozCikar(su.ad),
      barkod: su.barkod,
    });
  }

  const dd: React.CSSProperties = { position: 'absolute', zIndex: 30, left: 0, right: 0, top: '100%', marginTop: 4, background: '#fff', border: '1px solid #CBD5E1', borderRadius: 10, boxShadow: '0 10px 30px -12px rgba(15,23,42,.25)', maxHeight: 280, overflowY: 'auto' };
  const satir: React.CSSProperties = { padding: '10px 12px', cursor: 'pointer', borderTop: '1px solid #F1F5F9', fontSize: 14 };

  return (
    <div ref={kutu} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
      <div style={{ position: 'relative' }}>
        <label style={labelStyle}>İlaç Adı *</label>
        <input
          type="text"
          value={q}
          onChange={(e) => { setQ(e.target.value); setSecili(null); setSunum(null); }}
          onFocus={() => sonuclar.length && setAcik(true)}
          placeholder="Yazmaya başlayın: par… → Parol"
          autoComplete="off"
          style={inputStyle}
        />
        {acik && (sonuclar.length > 0 || araniyor) && (
          <div style={dd}>
            {araniyor && sonuclar.length === 0 && <div style={{ ...satir, color: '#64748B', cursor: 'default', borderTop: 'none' }}>Aranıyor…</div>}
            {sonuclar.map((g, i) => (
              <div key={g.marka} onMouseDown={() => markaSec(g)} style={{ ...satir, borderTop: i === 0 ? 'none' : '1px solid #F1F5F9' }}>
                <div style={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span>{g.marka}</span>
                  <span style={{ fontSize: 11, color: g.ruhsatAskida ? '#DC2626' : g.sgk ? '#059669' : '#94A3B8', fontWeight: g.ruhsatAskida ? 700 : 500 }}>{g.ruhsatAskida ? 'RUHSAT ASKIDA · ' : ''}{g.sgk ? 'SGK' : ''} · {g.sunumlar.length} sunum</span>
                </div>
                {g.etkenMadde && <div style={{ fontSize: 12, color: '#64748B' }}>{g.etkenMadde}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label style={labelStyle}>Doz / Sunum *</label>
        <select
          value={sunum?.barkod || ''}
          disabled={!secili}
          onChange={(e) => { const su = secili?.sunumlar.find((s) => s.barkod === e.target.value); if (su) sunumSec(su); }}
          style={{ ...inputStyle, opacity: secili ? 1 : 0.6, cursor: secili ? 'pointer' : 'not-allowed' }}
        >
          <option value="">{secili ? 'Eczanedeki sunumu seçin' : 'Önce ilacı seçin'}</option>
          {secili?.sunumlar.map((su) => (
            <option key={su.barkod} value={su.barkod}>{su.ad}{su.ruhsatAskida ? ' — RUHSAT ASKIDA' : ''}</option>
          ))}
        </select>
        {/* NOTYA-ILAC-09: suspension is a property of the chosen PACK. Warn at the moment of
            choice, in the one shared picker, so every form (reçete, interaksiyon) gets it free. */}
        {sunum?.ruhsatAskida && (
          <div style={{ marginTop: 6, fontSize: 12, color: '#DC2626', fontWeight: 600 }}>
            TİTCK ruhsatı askıda — reçete etmeden önce güncel durumu kontrol edin.
          </div>
        )}
      </div>
    </div>
  );
}
