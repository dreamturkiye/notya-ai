'use client';

/**
 * NOTYA-ASI-GOZLEM-01 — Aşı karnesi gözlem sayfası.
 *
 * Muayene notu yazdırma sayfası gibi: salt-okunur, kâğıt benzeri rapor. Düzenleme yok
 * (Aşılar sekmesindeki tablo ayrı). PDF indir / Paylaş / Yazdır burada.
 * İçerik: GET /api/doktor/asilar/karne → asiKarnesiVerisi (Sağlığım / PDF ile aynı).
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import {
  ASI_KARNESI_BASLIK,
  asiKarnesiDosyaAdi,
  dozMetni,
  HASTA_KAYNAK_ETIKETI,
  KAYNAK_ACIKLAMASI,
  KAYNAK_SIRASI,
  PAYLAS_IPUCU,
  tarihMetni,
  yasMetni,
  type AsiKarnesi,
} from '@/lib/asi/karneBelgesi';
import { lotYerTemizle, LOT_AZAMI, YER_AZAMI } from '@/lib/asi/asiLotYeri';
import { trTarih, type AsiKaynakTuru } from '@/lib/asi/karneOkuma';
import { dosyaPaylasimiVar, pdfYazdir } from '@/lib/asi/karnePaylasim';
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

const DOSYA_ADI_YEDEK = 'asi-karnesi.pdf';

const ROZET: Record<AsiKaynakTuru, { bg: string; fg: string; bd: string }> = {
  karne: { bg: 'rgba(96,165,250,0.15)', fg: '#1D4ED8', bd: 'rgba(96,165,250,0.55)' },
  klinik: { bg: 'rgba(15,155,142,0.12)', fg: '#0F9B8E', bd: 'rgba(15,155,142,0.45)' },
  beyan: { bg: 'rgba(58,44,34,0.06)', fg: '#8b7d70', bd: 'rgba(58,44,34,0.18)' },
};

const dugme: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid rgba(58,44,34,0.16)',
  color: CHROME_RENK.ink,
  borderRadius: 8,
  padding: '8px 14px',
  fontFamily: 'system-ui, sans-serif',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  minHeight: 40,
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
};

export default function AsiKarnesiGozlemSayfasi() {
  const params = useParams<{ id: string }>();
  const patientId = params.id;
  const [karne, setKarne] = useState<AsiKarnesi | null>(null);
  const [hata, setHata] = useState('');
  const [yukleniyor, setYukleniyor] = useState(true);
  const [mesgul, setMesgul] = useState(false);
  const [eylemHata, setEylemHata] = useState('');
  const [hazirPdf, setHazirPdf] = useState<Blob | null>(null);
  const [paylasimVar, setPaylasimVar] = useState(false);

  useEffect(() => {
    let iptal = false;
    (async () => {
      setYukleniyor(true);
      setHata('');
      try {
        const t = await ensureDoctorAccessToken();
        if (!t) { setHata('Oturum bulunamadı.'); return; }
        const r = await fetch(`/api/doktor/asilar/karne?patientId=${encodeURIComponent(patientId)}`, {
          headers: { Authorization: `Bearer ${t}` },
          cache: 'no-store',
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || 'Aşı karnesi yüklenemedi.');
        if (!iptal) setKarne(j.karne as AsiKarnesi);
      } catch (e) {
        if (!iptal) setHata(e instanceof Error ? e.message : 'Aşı karnesi yüklenemedi.');
      } finally {
        if (!iptal) setYukleniyor(false);
      }
    })();
    return () => { iptal = true; };
  }, [patientId]);

  const dosyaAdi = karne ? asiKarnesiDosyaAdi(karne) : DOSYA_ADI_YEDEK;

  useEffect(() => {
    setHazirPdf(null);
    if (!karne) { setPaylasimVar(false); return; }
    const destek = dosyaPaylasimiVar(dosyaAdi);
    setPaylasimVar(destek);
    if (!destek) return;
    let iptal = false;
    (async () => {
      try {
        const t = await ensureDoctorAccessToken();
        if (!t || iptal) return;
        const r = await fetch(`/api/doktor/asilar/karne/pdf?patientId=${encodeURIComponent(patientId)}`, {
          headers: { Authorization: `Bearer ${t}` },
          cache: 'no-store',
        });
        if (!r.ok || iptal) return;
        const b = await r.blob();
        if (!iptal) setHazirPdf(b);
      } catch { /* paylaşım opsiyonel */ }
    })();
    return () => { iptal = true; };
  }, [karne, patientId, dosyaAdi]);

  async function pdfAl(): Promise<Blob | null> {
    if (hazirPdf) return hazirPdf;
    const t = await ensureDoctorAccessToken();
    if (!t) { setEylemHata('Oturum bulunamadı.'); return null; }
    const r = await fetch(`/api/doktor/asilar/karne/pdf?patientId=${encodeURIComponent(patientId)}`, {
      headers: { Authorization: `Bearer ${t}` },
      cache: 'no-store',
    });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      setEylemHata(j.error || 'PDF oluşturulamadı.');
      return null;
    }
    const b = await r.blob();
    setHazirPdf(b);
    return b;
  }

  async function pdfIndir() {
    setEylemHata('');
    setMesgul(true);
    try {
      const b = await pdfAl();
      if (!b) return;
      const url = URL.createObjectURL(b);
      const a = document.createElement('a');
      a.href = url;
      a.download = dosyaAdi;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      setEylemHata('PDF oluşturulamadı.');
    } finally {
      setMesgul(false);
    }
  }

  async function yazdir() {
    setEylemHata('');
    setMesgul(true);
    try {
      const b = await pdfAl();
      if (!b) return;
      pdfYazdir(URL.createObjectURL(b));
    } catch {
      setEylemHata('PDF oluşturulamadı.');
    } finally {
      setMesgul(false);
    }
  }

  async function paylas() {
    if (!hazirPdf) return;
    setEylemHata('');
    try {
      await navigator.share({
        files: [new File([hazirPdf], dosyaAdi, { type: 'application/pdf' })],
        title: ASI_KARNESI_BASLIK,
      });
    } catch (e) {
      if ((e as { name?: string })?.name !== 'AbortError') {
        setEylemHata(`Paylaşım sayfası açılamadı. ${PAYLAS_IPUCU}`);
      }
    }
  }

  if (yukleniyor) {
    return <div style={{ padding: 40, fontFamily: 'system-ui', color: '#666', background: CHROME_RENK.cream, minHeight: '100dvh' }}>Aşı karnesi hazırlanıyor…</div>;
  }
  if (hata || !karne) {
    return (
      <div style={{ padding: 40, fontFamily: 'system-ui', background: CHROME_RENK.cream, minHeight: '100dvh' }}>
        <p style={{ color: '#B45309', marginBottom: 16 }}>{hata || 'Kayıtlı aşı yok.'}</p>
        <Link href={`/dashboard/doktor/hastalar/${encodeURIComponent(patientId)}?tab=asilar`} style={{ color: CHROME_RENK.pine }}>
          ← Aşılar sekmesine dön
        </Link>
      </div>
    );
  }

  const [ilk, ...diger] = karne.siradakiler;
  const kaynaklar = KAYNAK_SIRASI.filter((k) => karne.yapilanlar.some((a) => a.kaynak === k));
  const geriHref = `/dashboard/doktor/hastalar/${encodeURIComponent(patientId)}?tab=asilar`;

  return (
    <div data-asi-karnesi-gozlem="" style={{ background: 'white', color: '#111', minHeight: '100dvh', fontFamily: 'Georgia, "Times New Roman", serif' }}>
      <style>{`
        @media print {
          .yazdirma-gizle { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        .karne-bolum { margin-bottom: 16px; break-inside: avoid; page-break-inside: avoid; }
        .karne-etiket { font: 700 11px/1.4 system-ui, sans-serif; letter-spacing: 0.06em; color: ${CHROME_RENK.pine}; text-transform: uppercase; margin-bottom: 6px; }
      `}</style>

      <div className="yazdirma-gizle" style={{ background: '#F6F0E4', borderBottom: '1px solid rgba(58,44,34,0.1)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <span style={{ color: '#2e251d', fontFamily: 'system-ui, sans-serif', fontSize: 14, fontWeight: 700 }}>
          Aşı Karnesi — Gözlem (revize edilemez)
        </span>
        <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href={geriHref} style={{ ...dugme, background: 'transparent', border: 'none', color: CHROME_RENK.muted }}>
            ← Aşılar
          </Link>
          <button type="button" disabled={mesgul} onClick={() => void pdfIndir()} data-eylem="pdf" style={{ ...dugme, background: CHROME_RENK.pine, border: 'none', color: '#FAF8F4', fontWeight: 700 }}>
            {mesgul ? 'Hazırlanıyor…' : 'PDF indir'}
          </button>
          {paylasimVar && (
            <button type="button" disabled={!hazirPdf} onClick={() => void paylas()} data-eylem="paylas" style={{ ...dugme, opacity: hazirPdf ? 1 : 0.6 }}>
              Paylaş
            </button>
          )}
          <button type="button" disabled={mesgul} onClick={() => void yazdir()} data-eylem="yazdir" style={dugme}>
            Yazdır
          </button>
        </span>
      </div>
      {eylemHata && (
        <div className="yazdirma-gizle" role="alert" style={{ maxWidth: 760, margin: '12px auto 0', padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, fontFamily: 'system-ui', fontSize: 13, color: '#B91C1C' }}>
          {eylemHata}
        </div>
      )}
      {!paylasimVar && (
        <div className="yazdirma-gizle" style={{ maxWidth: 760, margin: '12px auto 0', padding: '0 16px', fontFamily: 'system-ui', fontSize: 12, color: '#8b7d70' }}>
          {PAYLAS_IPUCU}
        </div>
      )}

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '28px 20px 48px' }}>
        <div style={{ borderBottom: '2px solid #111', paddingBottom: 10, marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M8 19c1.6-5.8 3.4-9.6 7.2-14.2.8 3.4.8 6.4-.2 9.2-1.5 2.4-4 4-7 5z" stroke="#6a7563" strokeWidth="1.3" />
              </svg>
              <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12, color: '#6d6055' }}>Notya</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 500 }}>{ASI_KARNESI_BASLIK}</div>
            <div style={{ font: '12px system-ui, sans-serif', color: '#444' }}>
              Salt okunur rapor · {trTarih(karne.uretimTarihi)}
            </div>
          </div>
          <div style={{ textAlign: 'right', font: '12px system-ui, sans-serif', color: '#444' }}>
            {karne.hekim.ad && <div style={{ fontWeight: 700, color: '#111' }}>{karne.hekim.ad}</div>}
            {karne.hekim.klinik && <div>{karne.hekim.klinik}</div>}
          </div>
        </div>

        <div role="note" className="karne-bolum" data-e-nabiz="" style={{ padding: '12px 14px', borderRadius: 8, background: '#FFF7E6', border: '1.5px solid #F5C36A', marginBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4, fontFamily: 'system-ui, sans-serif' }}>{karne.uyari.baslik}</div>
          <div style={{ fontSize: 13, lineHeight: 1.5, fontFamily: 'system-ui, sans-serif', color: '#5C3D00' }}>{karne.uyari.metin}</div>
        </div>

        <table style={{ width: '100%', font: '12.5px system-ui, sans-serif', borderCollapse: 'collapse', marginBottom: 18 }}>
          <tbody>
            <tr>
              <td style={{ padding: '3px 0', width: '50%' }}><strong>Hasta:</strong> {karne.hasta.adSoyad || '—'}</td>
              <td style={{ padding: '3px 0' }}><strong>Doğum:</strong> {karne.hasta.dogumTarihi ? trTarih(karne.hasta.dogumTarihi) : '—'}</td>
            </tr>
            <tr>
              <td style={{ padding: '3px 0' }}><strong>Hekim:</strong> {karne.hekim.ad || '—'}</td>
              <td style={{ padding: '3px 0' }}><strong>Klinik:</strong> {karne.hekim.klinik || '—'}</td>
            </tr>
          </tbody>
        </table>

        <div className="karne-bolum">
          <div className="karne-etiket">Sıradaki aşı</div>
          {ilk ? (
            <div style={{ font: '13.5px/1.55 system-ui, sans-serif' }}>
              <div style={{ fontWeight: 700 }}>{ilk.ad}</div>
              <div style={{ color: '#444' }}>{trTarih(ilk.tarih)}</div>
              {diger.length > 0 && (
                <ul style={{ margin: '8px 0 0', paddingLeft: 18, color: '#555' }}>
                  {diger.map((d) => (
                    <li key={`${d.ad}${d.tarih}`}>{d.ad} · {trTarih(d.tarih)}</li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div style={{ font: '13px system-ui, sans-serif', color: '#666' }}>Kayıtlı bir sonraki aşı tarihi yok.</div>
          )}
        </div>

        <div className="karne-bolum">
          <div className="karne-etiket">Yapılan aşılar ({karne.yapilanlar.length})</div>
          {karne.yapilanlar.length === 0 ? (
            <div style={{ font: '13px system-ui, sans-serif', color: '#666' }}>Kayıtlı aşı yok.</div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {karne.yapilanlar.map((a, i) => {
                const r = ROZET[a.kaynak];
                const yas = yasMetni(karne.hasta.dogumTarihi, a.tarih);
                const lot = lotYerTemizle(a.lotNo, LOT_AZAMI);
                const yer = lotYerTemizle(a.uygulamaYeri, YER_AZAMI);
                return (
                  <div
                    key={i}
                    data-kaynak={a.kaynak}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid rgba(58,44,34,0.12)',
                      borderLeft: `4px solid ${r.bd}`,
                      fontFamily: 'system-ui, sans-serif',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 14.5, overflowWrap: 'anywhere' }}>{a.ad}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 4, fontSize: 13, color: '#333' }}>
                      <span>
                        {a.doz ? `${dozMetni(a.doz)} · ` : ''}
                        {tarihMetni(a.tarih)}
                        {yas ? ` · ${yas}` : ''}
                      </span>
                      <span style={{ background: r.bg, color: r.fg, border: `1px solid ${r.bd}`, borderRadius: 999, padding: '2px 8px', fontSize: 11.5, fontWeight: 700 }}>
                        {HASTA_KAYNAK_ETIKETI[a.kaynak]}
                      </span>
                    </div>
                    {(lot || yer) && (
                      <div style={{ fontSize: 12.5, color: '#666', marginTop: 4 }}>
                        {[lot ? `Lot: ${lot}` : '', yer ? `Uygulama yeri: ${yer}` : ''].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {kaynaklar.length > 0 && (
            <div style={{ marginTop: 12, font: '12px/1.5 system-ui, sans-serif', color: '#666', display: 'grid', gap: 4 }}>
              {kaynaklar.map((k) => (
                <div key={k}><strong>{HASTA_KAYNAK_ETIKETI[k]}:</strong> {KAYNAK_ACIKLAMASI[k]}</div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: 28, paddingTop: 12, borderTop: '1px solid #ddd', font: '11.5px system-ui, sans-serif', color: '#777' }}>
          Bu belge bilgilendirme amaçlıdır; düzenlenemez. Resmî işlemlerde e-Nabız kayıtları geçerlidir.
        </div>
      </div>
    </div>
  );
}
