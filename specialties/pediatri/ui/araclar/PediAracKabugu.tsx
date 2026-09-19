'use client';
/**
 * PEDI-ARACLAR-01 — Araçlar › pediatri stüdyoları ortak kabuğu (GozAracKabugu ile aynı desen ve görsel dil).
 * Oturum + branş kapısı (doktorAraciBransaUygun) + yönlendirme, mobil düzen, isteğe bağlı hasta seçici (tr-TR arama).
 * Yalnız pediatri hekimi açar; başka branş /doktor-tools'a döner (specialty-doktor-araclari).
 *
 * ARACLAR-CILA-01: bu kabukta olgunlaşan ortak parçalar lib/doktor/aracUi.tsx'e taşındı (tek kaynak) ve
 * beş branş da oradan besleniyor. Buradaki dışa aktarımlar o kütüphaneye delege eden ince sarmalayıcılar.
 */
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DoktorNav from '@/components/doktor/DoktorNav';
import { toolsShell } from '@/lib/doktor/toolsUi';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import { doktorAraciBransaUygun } from '@/lib/doktor/doktorAraclari';
import { AracVurguSaglayici, aracStil, HastaSecici, useHastaVerisi, VURGU_TEAL } from '@/lib/doktor/aracUi';

export const PEDI_VURGU = VURGU_TEAL;
export const pediStil = aracStil(PEDI_VURGU);

export {
  Alan, Segment, Secim, Etiketli, Kutu, Onay, Sayi, Katlanir, TaslakNotu, Rozet, OneriRozet,
  Istatistik, KopyalaButonu, MuayeneFormunaEkle, KayitButonu, OncekiVizit, panoyaKopyala, useUrlHasta, useHastaVerisi,
} from '@/lib/doktor/aracUi';

/** Hekimin kendi hasta listesi (/api/doktor/hastalar — doctor_id kapsamlı). Seçim isteğe bağlıdır. */
export function PediHastaSecici({ secili, sec }: { secili: string; sec: (id: string, ad: string) => void }) {
  return <HastaSecici secili={secili} sec={sec} bosEtiket="Hasta seçilmedi — elle hesap" />;
}

export interface PediHastaOzet {
  dogumIso: string | null; cinsiyet: 'male' | 'female' | null; yasAy: number | null
  /** PEDI-ARACLAR-02: KD taburcu paketinden bebek kartı (varsa) — gebelik haftası ve doğum ağırlığı. */
  dogumBilgisi?: { gebelikHaftasi: number | null; kiloGram: number | null } | null
}

/** Seçili hastanın doğum tarihi / cinsiyeti (/api/doktor/pediatri — sahiplik sunucuda doğrulanır). */
export function usePediHasta(patientId: string): { ozet: PediHastaOzet | null; hata: string; yukleniyor: boolean } {
  const { veri, hata, yukleniyor } = useHastaVerisi<PediHastaOzet>(
    patientId,
    (id) => `/api/doktor/pediatri?patientId=${encodeURIComponent(id)}`,
  );
  return { ozet: veri, hata, yukleniyor };
}

export default function PediAracKabugu({ route, baslik, aciklama, children }: { route: string; baslik: string; aciklama: string; children: React.ReactNode }) {
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
    <AracVurguSaglayici vurgu={PEDI_VURGU}>
      <div style={{ ...toolsShell, overflowX: 'hidden' }}>
        <DoktorNav />
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px 56px', boxSizing: 'border-box' }}>
          {!izin ? (
            <div style={{ color: '#9BB0C7', fontSize: 15, padding: '12px 0' }}>{izin === null ? 'Yükleniyor…' : 'Bu araç yalnızca pediatri için.'}</div>
          ) : (
            <>
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: PEDI_VURGU.baslik, letterSpacing: '1.4px', textTransform: 'uppercase', marginBottom: 8 }}>Araçlar · Pediatri</div>
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
