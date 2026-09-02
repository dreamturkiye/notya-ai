'use client';

import React, { useState, useEffect } from 'react';
import HastaIlaclar from '@/components/doktor/HastaIlaclar';
import HastaIntake from '@/components/doktor/HastaIntake';
import HastaAsilar from '@/components/doktor/HastaAsilar';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import DoktorNav from '@/components/doktor/DoktorNav';
import { ensureDoctorAccessToken, DOKTOR_GIRIS } from '@/lib/doktor/clientAuth';

export const dynamic = 'force-dynamic';

interface PatientData {
  id: string; ad_soyad: string; dogum_tarihi: string | null; cinsiyet: string | null;
  telefon: string | null; sehir: string | null; kan_grubu: string | null;
  kronik_hastaliklar: string[]; alerjiler: string | null; surekli_ilaclar: string | null;
  sigara_alkol: string | null;
}

export default function HastaProfilPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params?.id as string;
  const [activeTab, setActiveTab] = useState(1);
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const tabs = ['Özet', 'Muayene Geçmişi', 'Belgeler', 'Görüntüleme', 'İlaçlar', 'Hasta Formu', 'Aşılar'];

  useEffect(() => {
    if (!patientId) return;
    (async () => {
      try {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
        // NOTYA-AUTH-01: one convention, with refresh. Also: this page sent doctors to '/giris'
        // (the generic chooser) while every other doctor page uses '/giris/doktor'.
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

  return (
    <div style={{ backgroundColor: '#0A1628', minHeight: '100vh', color: 'white' }}>
      <DoktorNav />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 26, margin: 0 }}>{loading ? 'Hasta Profili' : patient?.ad_soyad || 'Hasta Profili'}</h1>
            {patient && <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>{[patient.cinsiyet, patient.dogum_tarihi, patient.telefon, patient.sehir].filter(Boolean).join(' · ')}</div>}
          </div>
          {patient && (
            <button
              onClick={() => router.push(`/session/new?patientId=${patient.id}`)}
              style={{ padding: '14px 24px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
            >
              🎤 Muayeneyi Başlat
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #334155', marginBottom: 24 }}>
          {tabs.map((tab, i) => (
            <button key={i} onClick={() => setActiveTab(i + 1)} style={{ padding: '12px 20px', background: activeTab === i + 1 ? '#0F9B8E' : 'transparent', border: 'none', color: 'white', borderRadius: 8, cursor: 'pointer' }}>{tab}</button>
          ))}
        </div>

        {loading && <div style={{ color: '#94A3B8' }}>Yükleniyor...</div>}
        {error && <div style={{ color: '#F87171' }}>{error}</div>}

        {!loading && !error && patient && activeTab === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: '#111C33', borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Demografik Bilgiler</div>
              <div style={{ fontSize: 14, lineHeight: 1.9 }}>
                <div>Ad Soyad: {patient.ad_soyad}</div>
                <div>Doğum Tarihi: {patient.dogum_tarihi || '—'}</div>
                <div>Cinsiyet: {patient.cinsiyet || '—'}</div>
                <div>Telefon: {patient.telefon || '—'}</div>
                <div>Şehir: {patient.sehir || '—'}</div>
                <div>Kan Grubu: {patient.kan_grubu || '—'}</div>
              </div>
            </div>
            <div style={{ background: '#111C33', borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sağlık Geçmişi</div>
              <div style={{ fontSize: 14, lineHeight: 1.9 }}>
                <div>Kronik Hastalıklar: {patient.kronik_hastaliklar?.length ? patient.kronik_hastaliklar.join(', ') : '—'}</div>
                <div>Alerjiler: {patient.alerjiler || '—'}</div>
                <div>Sürekli İlaçlar: {patient.surekli_ilaclar || '—'}</div>
                <div>Sigara / Alkol: {patient.sigara_alkol || '—'}</div>
              </div>
            </div>
          </div>
        )}
        {!loading && !error && activeTab === 2 && <div>Muayene ve SOAP notları timeline olarak listelenir.</div>}
        {!loading && !error && activeTab === 3 && <div>Belge listesi ve yükleme butonu.</div>}
        {!loading && !error && activeTab === 4 && <div>Görüntüleme kayıtları ve thumbnail'lar.</div>}
        {!loading && !error && activeTab === 5 && <HastaIlaclar patientId={patientId} />}
        {!loading && !error && activeTab === 6 && <HastaIntake patientId={patientId} />}
        {!loading && !error && activeTab === 7 && <HastaAsilar patientId={patientId} />}
      </div>
    </div>
  );
}
