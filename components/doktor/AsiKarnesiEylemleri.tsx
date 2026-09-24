'use client';

/**
 * ASI-KARNESI-01 (C7) — hasta dosyası › Aşılar: aile poliklinikte isterse hekim karneyi basıp verir / gönderir.
 * Sağlığım'daki karneyle AYNI PDF (GET /api/doktor/asilar/karne/pdf → lib/asi/karnePdf.tsx) — ikinci şablon yok.
 * Üç eylem (Kaan): PDF indir · Paylaş (yalnız cihazın paylaşım sayfası; destek yoksa gösterilmez) · Yazdır.
 * Notya e-posta göndermez, adres sormaz.
 */

import React, { useEffect, useState } from 'react';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import { dosyaPaylasimiVar, pdfYazdir } from '@/lib/asi/karnePaylasim';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

const DOSYA_ADI = 'asi-karnesi.pdf';
const dugme: React.CSSProperties = { background: 'rgba(255,255,255,0.08)', color: CHROME_RENK.muted, border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 12px', fontSize: 13, cursor: 'pointer', minHeight: 40 };

export default function AsiKarnesiEylemleri({ patientId, kayitSayisi }: { patientId: string; kayitSayisi: number }) {
  const [paylasimVar, setPaylasimVar] = useState(false);
  const [hazirPdf, setHazirPdf] = useState<Blob | null>(null);
  const [mesgul, setMesgul] = useState(false);
  const [hata, setHata] = useState('');

  async function pdfAl(): Promise<Blob | null> {
    const t = await ensureDoctorAccessToken();
    if (!t) { setHata('Oturum bulunamadı.'); return null; }
    const r = await fetch(`/api/doktor/asilar/karne/pdf?patientId=${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' });
    if (!r.ok) { const j = await r.json().catch(() => ({})); setHata(j.error || 'PDF oluşturulamadı.'); return null; }
    return r.blob();
  }

  // Paylaşım sayfası (iOS) dokunuştan hemen sonra açılmalı — destek varsa PDF önceden hazırlanır.
  useEffect(() => {
    setHazirPdf(null);
    const destek = kayitSayisi > 0 && dosyaPaylasimiVar(DOSYA_ADI);
    setPaylasimVar(destek);
    if (!destek) return;
    let iptal = false;
    pdfAl().then((b) => { if (!iptal && b) setHazirPdf(b); }).catch(() => undefined);
    return () => { iptal = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, kayitSayisi]);

  async function eylem(tur: 'indir' | 'yazdir') {
    setHata(''); setMesgul(true);
    try {
      const b = tur === 'yazdir' && hazirPdf ? hazirPdf : await pdfAl();
      if (!b) return;
      const url = URL.createObjectURL(b);
      if (tur === 'yazdir') { pdfYazdir(url); return; }
      const a = document.createElement('a');
      a.href = url; a.download = DOSYA_ADI;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      setHata('PDF oluşturulamadı.');
    } finally {
      setMesgul(false);
    }
  }

  async function paylas() {
    if (!hazirPdf) return;
    setHata('');
    try {
      await navigator.share({ files: [new File([hazirPdf], DOSYA_ADI, { type: 'application/pdf' })], title: 'Aşı Karnesi' });
    } catch (e) {
      if ((e as { name?: string })?.name !== 'AbortError') setHata('Paylaşım sayfası açılamadı; PDF\'i indirip gönderebilirsiniz.');
    }
  }

  if (kayitSayisi === 0) return null;
  return (
    <div data-asi-karnesi-eylemleri="" style={{ background: '#111C33', borderRadius: 12, padding: 12, marginBottom: 16, display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>Aşı karnesi (Sağlığım'dakiyle aynı)</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" disabled={mesgul} onClick={() => eylem('indir')} style={dugme}>PDF indir</button>
          {paylasimVar && <button type="button" disabled={!hazirPdf} onClick={paylas} style={{ ...dugme, opacity: hazirPdf ? 1 : 0.6 }}>Paylaş</button>}
          <button type="button" disabled={mesgul} onClick={() => eylem('yazdir')} style={dugme}>Yazdır</button>
        </div>
      </div>
      {!paylasimVar && <div style={{ fontSize: 12, color: '#94A3B8' }}>Göndermek için PDF'i indirip kendi e-postanızdan ya da mesaj uygulamanızdan iletebilirsiniz.</div>}
      {hata && <div role="alert" style={{ fontSize: 12, color: CHROME_RENK.warn }}>{hata}</div>}
    </div>
  );
}
