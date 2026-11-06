'use client';
/**
 * GENITAL-ESTETIK-01 — the PATIENT INSTRUCTION SHEET of a genital-aesthetic operation or session, on the doctor's letterhead
 * (KD only: the letterhead comes from the KD-gated route). `?talimat=<template code | enerji | enjeksiyon | beyazlatma>`.
 * Every "__" is the clinician's to fill by hand; the sheet carries the evidence line and its sources.
 */
import React, { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import { AntetliKagit, KAGIT, type Antet } from '@/components/doktor/yazdir/AntetliKagit';
import { GE_KANIT, GE_KAYNAKLAR, GE_TALIMATLAR } from '@/specialties/kadin-dogum/engines/genitalEstetikMetinleri';

function Sayfa() {
  const p = useParams<{ id: string }>();
  const anahtar = useSearchParams().get('talimat') || '';
  const [antet, setAntet] = useState<Antet | null>(null);
  const [hata, setHata] = useState('');
  useEffect(() => {
    (async () => {
      try {
        const t = await ensureDoctorAccessToken();
        const r = await fetch(`/api/doktor/genital-estetik?patientId=${encodeURIComponent(p.id)}&baslik=1`, { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' });
        const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Yüklenemedi'); setAntet(d.baslik);
      } catch (e) { setHata(e instanceof Error ? e.message : 'Yüklenemedi'); }
    })();
  }, [p.id]);
  const s = GE_TALIMATLAR[anahtar];
  if (!s) return <div style={{ padding: 24, fontFamily: 'system-ui' }}>Talimat bulunamadı.</div>;
  if (hata) return <div style={{ padding: 24, fontFamily: 'system-ui' }}>{hata}</div>;
  if (!antet) return <div style={{ padding: 24, fontFamily: 'system-ui', color: '#666' }}>Yükleniyor…</div>;
  const tur = anahtar === 'enerji' || anahtar === 'enjeksiyon' || anahtar === 'beyazlatma' ? anahtar : 'cerrahi';
  return (
    <AntetliKagit baslik={s.baslik.toLocaleUpperCase('tr-TR')} antet={antet} geriHref={`/dashboard/doktor/hastalar/${p.id}?tab=genital-estetik`} geriEtiket="Genital Estetik" tarih={new Date().toISOString().slice(0, 10)}>
      <div style={KAGIT.H}>Yapmanız gerekenler</div>
      <ul style={{ ...KAGIT.P, paddingLeft: 18 }}>{s.maddeler.map((m, i) => <li key={i} style={{ marginBottom: 4 }}>{m}</li>)}</ul>
      <div style={KAGIT.H}>Hemen başvurun</div>
      <ul style={{ ...KAGIT.P, paddingLeft: 18 }}>{s.acil.map((m, i) => <li key={i} style={{ marginBottom: 4 }}>{m}</li>)}</ul>
      <div style={KAGIT.H}>Bilmeniz gerekenler</div>
      <p style={KAGIT.P}>{GE_KANIT[tur]}</p>
      <p style={{ fontSize: 10, color: '#777', marginTop: 16 }}>Kaynak: {[...GE_KAYNAKLAR[tur], ...GE_KAYNAKLAR.genel].map((k) => `${k.kurum}, ${k.belge} (${k.yil}${k.tur === 'uluslararasi' ? ', uluslararası kaynak' : ''})`).join('; ')}.</p>
      <p style={{ fontSize: 12, marginTop: 24 }}>Hekim imzası / kaşe: ______________________</p>
    </AntetliKagit>
  );
}

export default function GenitalEstetikTalimatYazdir() { return <Suspense fallback={null}><Sayfa /></Suspense>; }
