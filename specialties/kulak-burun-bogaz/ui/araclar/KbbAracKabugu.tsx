'use client';
/**
 * KBB-EXCEPTIONAL-01 — Araçlar › KBB stüdyoları ortak kabuğu. Oturum + branş kapısı
 * (doktorAraciBransaUygun) + yönlendirme, mobil düzen, hasta seçici. Yalnız kulak burun boğaz
 * hekimi açar; başka branş /doktor-tools'a döner (specialty-doktor-araclari).
 *
 * ARACLAR-CILA-01: ortak parçalar lib/doktor/aracUi.tsx'te (tek kaynak). Buradaki dışa aktarımlar
 * o kütüphaneye delege eden ince sarmalayıcılar; branşa özel olan yalnız vurgu (indigo/teal KBB)
 * ve kulak (sağ/sol) satırı.
 */
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DoktorNav from '@/components/doktor/DoktorNav';
import { toolsShell } from '@/lib/doktor/toolsUi';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import { doktorAraciBransaUygun } from '@/lib/doktor/doktorAraclari';
import { AracVurguSaglayici, aracStil, HastaSecici, Segment, type AracVurgu } from '@/lib/doktor/aracUi';

/** KBB vurgusu — indigo gövde, teal başlık (psikiyatri indigo'sundan ayrışır). */
export const KBB_VURGU: AracVurgu = { ana: '#4F46E5', anaMetin: '#EEF2FF', yumusak: '#99F6E4', baslik: '#2DD4BF' };
export const kbbStil = aracStil(KBB_VURGU);

export {
  Alan, Etiketli, Secim, Segment, Onay, Kutu, Sayi, Katlanir, TaslakNotu, Rozet, OneriRozet,
  Istatistik, KopyalaButonu, MuayeneFormunaEkle, panoyaKopyala, useUrlHasta, useHastaVerisi,
} from '@/lib/doktor/aracUi';

/** Hekimin kendi hasta listesi (/api/doktor/hastalar — doctor_id kapsamlı). Seçim isteğe bağlıdır. */
export function KbbHastaSecici({ secili, sec }: { secili: string; sec: (id: string, ad: string) => void }) {
  return <HastaSecici secili={secili} sec={sec} />;
}

/** Sağ / sol / iki kulak seçimi — KBB araçlarının hemen hepsinde ilk satır. */
export function KulakSecimi({ deger, set, ikiVar = true }: { deger: 'sag' | 'sol' | 'iki'; set: (x: 'sag' | 'sol' | 'iki') => void; ikiVar?: boolean }) {
  const secenekler: Array<['sag' | 'sol' | 'iki', string]> = [['sag', 'Sağ kulak'], ['sol', 'Sol kulak']];
  if (ikiVar) secenekler.push(['iki', 'İki kulak']);
  return <Segment etiket="Kulak" deger={deger} set={set} secenekler={secenekler} />;
}

export default function KbbAracKabugu({ route, baslik, aciklama, children }: { route: string; baslik: string; aciklama: string; children: React.ReactNode }) {
  const router = useRouter();
  const [izin, setIzin] = useState<boolean | null>(null);
  useEffect(() => {
    let iptal = false;
    (async () => {
      try {
        const t = await ensureDoctorAccessToken();
        if (!t) { if (!iptal) { setIzin(false); router.replace('/doktor-tools'); } return; }
        const r = await fetch('/api/users/me', { headers: { Authorization: `Bearer ${t}` } });
        const j = r.ok ? await r.json() : null;
        const ok = doktorAraciBransaUygun(route, j?.data?.specialty);
        if (!iptal) { setIzin(ok); if (!ok) router.replace('/doktor-tools'); }
      } catch { if (!iptal) { setIzin(false); router.replace('/doktor-tools'); } }
    })();
    return () => { iptal = true; };
  }, [router, route]);

  return (
    <AracVurguSaglayici vurgu={KBB_VURGU}>
      <div style={{ ...toolsShell, overflowX: 'hidden' }}>
        <DoktorNav />
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px 56px', boxSizing: 'border-box' }}>
          {!izin ? (
            <div style={{ color: '#9BB0C7', fontSize: 15, padding: '12px 0' }}>{izin === null ? 'Yükleniyor…' : 'Bu araç yalnızca kulak burun boğaz için.'}</div>
          ) : (
            <>
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: KBB_VURGU.baslik, letterSpacing: '1.4px', textTransform: 'uppercase', marginBottom: 8 }}>Araçlar · KBB</div>
                <h1 style={{ fontSize: 26, fontWeight: 800, color: '#EDF1F7', margin: 0, letterSpacing: '-0.4px', lineHeight: 1.2 }}>{baslik}</h1>
                <p style={{ margin: '8px 0 0', fontSize: 15, color: '#9BB0C7', lineHeight: 1.5, maxWidth: 680 }}>{aciklama}</p>
              </div>
              {children}
            </>
          )}
        </div>
      </div>
    </AracVurguSaglayici>
  );
}
