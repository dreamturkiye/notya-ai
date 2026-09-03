'use client';

/**
 * NOTYA-DOSYA-01 — Hasta dosyası, ana sayfayla aynı birinci sınıf görsel dilde:
 * iki tonlu lacivert paneller (#0D1C33), ince rgba hatlar, teal vurgu, gradient kimlik
 * başlığı (baş harfli avatar + bilgi çipleri), yatay kaydırılabilir hap sekmeler.
 * Ek olarak: "Muayene Geçmişi" sekmesi artık gerçek bir zaman çizelgesi (eski yer tutucu
 * metin yerine) — vizitler, tanı, onay durumu ve tek tıkla Yazdır/PDF.
 */

import React, { useState, useEffect, useCallback } from 'react';
import HastaIlaclar from '@/components/doktor/HastaIlaclar';
import HastaIntake from '@/components/doktor/HastaIntake';
import HastaAsilar from '@/components/doktor/HastaAsilar';
import HastaKonsult from '@/components/doktor/HastaKonsult';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import DoktorNav from '@/components/doktor/DoktorNav';
import { ensureDoctorAccessToken, DOKTOR_GIRIS } from '@/lib/doktor/clientAuth';

export const dynamic = 'force-dynamic';

interface PatientData {
  id: string; ad_soyad: string; dogum_tarihi: string | null; cinsiyet: string | null;
  telefon: string | null; sehir: string | null; kan_grubu: string | null;
  kronik_hastaliklar: string[]; alerjiler: string | null; surekli_ilaclar: string | null;
  sigara_alkol: string | null;
}

interface SeansNotu { id?: string; content_tani?: string | null; content_subjektif?: string | null; approved_at?: string | null }
interface Seans { id: string; created_at: string; notes?: SeansNotu[] | SeansNotu | null }

const panel: React.CSSProperties = {
  background: '#0D1C33',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
};

function basHarfler(ad: string): string {
  return ad.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || 'H';
}

function trTarih(iso: string): string {
  try { return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' }); } catch { return ''; }
}

export default function HastaProfilPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const patientId = params?.id as string;
  // NOTYA-RANDEVU-09: randevu takviminden hedefli linkler ?tab=formu / ?tab=asilar ile atlar.
  const tabParam = searchParams?.get('tab');
  const baslangicTab = tabParam === 'formu' ? 6 : tabParam === 'asilar' ? 7 : 1;
  const [activeTab, setActiveTab] = useState(baslangicTab);
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [seanslar, setSeanslar] = useState<Seans[] | null>(null);
  const [seansYukleniyor, setSeansYukleniyor] = useState(false);

  const tabs = ['Özet', 'Muayene Geçmişi', 'Belgeler', 'Görüntüleme', 'İlaçlar', 'Hasta Formu', 'Aşılar', "Ayşe'ye Danış"];

  useEffect(() => {
    if (!patientId) return;
    (async () => {
      try {
        // NOTYA-AUTH-01: one convention, with refresh.
        const token = await ensureDoctorAccessToken();
        if (!token) { router.push(DOKTOR_GIRIS); return; }
        const resp = await fetch(`/api/doktor/hastalar/${patientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await resp.json();
        if (!resp.ok) { setError(data.error || 'Hasta bilgisi alınamadı'); return; }
        setPatient(data.patient);
      } catch {
        setError('Bir hata oluştu');
      } finally {
        setLoading(false);
      }
    })();
  }, [patientId, router]);

  // Muayene Geçmişi: sekme ilk açıldığında tembel yüklenir
  const seansYukle = useCallback(async () => {
    if (seanslar !== null || seansYukleniyor) return;
    setSeansYukleniyor(true);
    try {
      const token = await ensureDoctorAccessToken();
      const r = await fetch(`/api/doktor/hastalar/${patientId}/sessions`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      const liste = Array.isArray(d.sessions) ? d.sessions : Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : [];
      setSeanslar(liste);
    } catch {
      setSeanslar([]);
    } finally {
      setSeansYukleniyor(false);
    }
  }, [patientId, seanslar, seansYukleniyor]);

  useEffect(() => { if (activeTab === 2) seansYukle(); }, [activeTab, seansYukle]);

  const kimlikCipleri = patient
    ? [
        patient.cinsiyet,
        patient.dogum_tarihi,
        patient.telefon,
        patient.sehir,
        patient.kan_grubu ? `Kan: ${patient.kan_grubu}` : null,
      ].filter(Boolean) as string[]
    : [];

  const bilgiSatiri = (etiket: string, deger: string | null | undefined) => (
    <div style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 14 }}>
      <span style={{ color: '#8FA0B5', minWidth: 128, flexShrink: 0 }}>{etiket}</span>
      <span style={{ color: '#EDF1F7' }}>{deger || '—'}</span>
    </div>
  );

  const notCek = (s: Seans): SeansNotu | null => {
    if (!s.notes) return null;
    return Array.isArray(s.notes) ? s.notes[0] || null : s.notes;
  };

  return (
    <div style={{ backgroundColor: '#0A1628', minHeight: '100vh', color: '#EDF1F7', fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
      <style>{`
        .dosya-sekmeler::-webkit-scrollbar { display: none; }
        .dosya-satir:hover { background: rgba(255,255,255,0.04); }
      `}</style>
      <DoktorNav />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 20px 40px' }}>

        {/* Kimlik başlığı — ana sayfa karşılama paneliyle aynı dil */}
        <div style={{ ...panel, background: 'linear-gradient(135deg, #10223D 0%, #0C1830 100%)', padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'rgba(15,155,142,0.18)', border: '1px solid rgba(15,155,142,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, fontWeight: 800, color: '#2DD4BF', flexShrink: 0 }}>
            {loading ? '·' : basHarfler(patient?.ad_soyad || 'H')}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.3 }}>{loading ? 'Hasta Dosyası' : patient?.ad_soyad || 'Hasta Dosyası'}</div>
            {kimlikCipleri.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 7 }}>
                {kimlikCipleri.map((c, i) => (
                  <span key={i} style={{ fontSize: 11.5, color: '#C9D4E3', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 999, padding: '3px 10px' }}>{c}</span>
                ))}
              </div>
            )}
          </div>
          {patient && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={() => router.push(`/session/new?patientId=${patient.id}`)}
                style={{ padding: '10px 18px', background: '#0F9B8E', color: '#fff', border: 'none', borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                🩺 Muayeneyi Başlat
              </button>
              <button
                onClick={() => setActiveTab(8)}
                style={{ padding: '10px 18px', background: 'rgba(255,255,255,0.07)', color: '#C9D4E3', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Ayşe&apos;ye Danış
              </button>
            </div>
          )}
        </div>

        {/* Hap sekmeler — mobilde yatay kaydırma */}
        <div className="dosya-sekmeler" style={{ display: 'flex', gap: 6, margin: '16px 0 18px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
          {tabs.map((tab, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i + 1)}
              style={{
                flexShrink: 0,
                padding: '8px 16px',
                background: activeTab === i + 1 ? '#0F9B8E' : 'rgba(255,255,255,0.06)',
                border: activeTab === i + 1 ? '1px solid #0F9B8E' : '1px solid rgba(255,255,255,0.1)',
                color: activeTab === i + 1 ? 'white' : '#C9D4E3',
                fontWeight: activeTab === i + 1 ? 700 : 500,
                borderRadius: 999,
                fontSize: 13,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'background .15s ease',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading && <div style={{ ...panel, padding: 18, color: '#8FA0B5', fontSize: 14 }}>Dosya yükleniyor…</div>}
        {error && <div style={{ ...panel, padding: 18, color: '#FCA5A5', fontSize: 14, borderColor: 'rgba(239,68,68,0.4)' }}>{error}</div>}

        {!loading && !error && patient && activeTab === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            <div style={{ ...panel, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 20, right: 20, height: 2, borderRadius: 2, background: 'linear-gradient(90deg, #0F9B8E, transparent)' }} />
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Demografik bilgiler</div>
              {bilgiSatiri('Ad Soyad', patient.ad_soyad)}
              {bilgiSatiri('Doğum tarihi', patient.dogum_tarihi)}
              {bilgiSatiri('Cinsiyet', patient.cinsiyet)}
              {bilgiSatiri('Telefon', patient.telefon)}
              {bilgiSatiri('Şehir', patient.sehir)}
              {bilgiSatiri('Kan grubu', patient.kan_grubu)}
            </div>
            <div style={{ ...panel, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 20, right: 20, height: 2, borderRadius: 2, background: 'linear-gradient(90deg, #F59E0B, transparent)' }} />
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Sağlık geçmişi</div>
              {bilgiSatiri('Kronik hastalıklar', patient.kronik_hastaliklar?.length ? patient.kronik_hastaliklar.join(', ') : null)}
              {bilgiSatiri('Alerjiler', patient.alerjiler)}
              {bilgiSatiri('Sürekli ilaçlar', patient.surekli_ilaclar)}
              {bilgiSatiri('Sigara / Alkol', patient.sigara_alkol)}
            </div>
          </div>
        )}

        {!loading && !error && activeTab === 2 && (
          <div style={{ ...panel, padding: '10px 20px' }}>
            {seansYukleniyor && <div style={{ padding: '14px 0', color: '#8FA0B5', fontSize: 14 }}>Vizitler yükleniyor…</div>}
            {!seansYukleniyor && seanslar !== null && seanslar.length === 0 && (
              <div style={{ padding: '18px 0', color: '#8FA0B5', fontSize: 14 }}>Henüz muayene kaydı yok — ilk muayeneyle birlikte burada görünecek.</div>
            )}
            {!seansYukleniyor && (seanslar || []).map((s, idx) => {
              const n = notCek(s);
              const onaylandi = Boolean(n?.approved_at);
              const ozet = String(n?.content_tani || n?.content_subjektif || 'Not bulunamadı').slice(0, 110);
              return (
                <div key={s.id} className="dosya-satir" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 6px', borderBottom: idx < (seanslar?.length || 0) - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', borderRadius: 8 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', flexShrink: 0, background: onaylandi ? '#22C55E' : '#F59E0B' }} title={onaylandi ? 'Onaylı not' : 'Onay bekliyor'} />
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ display: 'block', fontSize: 12, color: '#5F7189' }}>{trTarih(s.created_at)}</span>
                    <span style={{ display: 'block', fontSize: 13.5, color: '#C9D4E3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ozet}</span>
                  </span>
                  {n?.id && (
                    <button
                      type="button"
                      onClick={() => window.open(`/dashboard/doktor/notlar/${n.id}/yazdir`, '_blank')}
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#C9D4E3', borderRadius: 999, padding: '5px 12px', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}
                    >
                      🖨️ Yazdır / PDF
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!loading && !error && activeTab === 3 && (
          <div style={{ ...panel, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, color: '#8FA0B5' }}>Hastanın belgeleri, belge merkezinde görüntülenir ve yüklenir.</span>
            <button type="button" onClick={() => router.push('/dashboard/doktor/belgeler')} style={{ background: '#0F9B8E', border: 'none', color: 'white', borderRadius: 999, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Belgeleri aç ›</button>
          </div>
        )}
        {!loading && !error && activeTab === 4 && (
          <div style={{ ...panel, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, color: '#8FA0B5' }}>Röntgen, EKG ve diğer görüntüleme kayıtları görüntüleme merkezinde.</span>
            <button type="button" onClick={() => router.push('/dashboard/doktor/goruntuleme')} style={{ background: '#0F9B8E', border: 'none', color: 'white', borderRadius: 999, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Görüntülemeyi aç ›</button>
          </div>
        )}
        {!loading && !error && activeTab === 5 && <HastaIlaclar patientId={patientId} />}
        {!loading && !error && activeTab === 6 && <HastaIntake patientId={patientId} />}
        {!loading && !error && activeTab === 7 && <HastaAsilar patientId={patientId} />}
        {!loading && !error && activeTab === 8 && <HastaKonsult patientId={patientId} />}
      </div>
    </div>
  );
}
