'use client';
/**
 * PSIK-EXCEPTIONAL-01 — Araçlar › psikiyatri stüdyoları ortak kabuğu. Oturum + branş kapısı
 * (doktorAraciBransaUygun) + yönlendirme, mobil düzen, hasta seçici. Yalnız psikiyatri hekimi açar;
 * başka branş /doktor-tools'a döner (specialty-doktor-araclari).
 *
 * ARACLAR-CILA-01: ortak parçalar lib/doktor/aracUi.tsx'te (tek kaynak). Buradaki dışa aktarımlar
 * o kütüphaneye delege eden ince sarmalayıcılar; branşa özel olan yalnız vurgu (indigo) ve
 * PHQ-9 / GAD-7 madde satırı.
 */
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DoktorNav from '@/components/doktor/DoktorNav';
import { toolsShell } from '@/lib/doktor/toolsUi';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import { doktorAraciBransaUygun } from '@/lib/doktor/doktorAraclari';
import { AracVurguSaglayici, aracStil, HastaSecici, KopyalaButonu, Secim, Segment, Onay, VURGU_PSIK } from '@/lib/doktor/aracUi';

export const PSIK_VURGU = VURGU_PSIK;
export const psikStil = aracStil(PSIK_VURGU);

export {
  Alan, Etiketli, Secim, Segment, Onay, Kutu, Sayi, Katlanir, TaslakNotu, Rozet, OneriRozet,
  Istatistik, KopyalaButonu, panoyaKopyala, useUrlHasta, useHastaVerisi,
} from '@/lib/doktor/aracUi';

/** Hekimin kendi hasta listesi (/api/doktor/hastalar — doctor_id kapsamlı). Seçim isteğe bağlıdır. */
export function PsikHastaSecici({ secili, sec }: { secili: string; sec: (id: string, ad: string) => void }) {
  return <HastaSecici secili={secili} sec={sec} />;
}

export function PsikSecim(p: React.ComponentProps<typeof Secim>) { return <Secim {...p} />; }
export function PsikOnay(p: React.ComponentProps<typeof Onay>) { return <Onay {...p} />; }
export function PsikKopyala(p: React.ComponentProps<typeof KopyalaButonu>) { return <KopyalaButonu {...p} />; }

/** 0–3 sıklık satırı — PHQ-9 / GAD-7 maddeleri. Madde metni uzun olduğu için segment altta, tam genişlikte. */
export function PsikMadde({
  no, metin, secenekler, deger, set,
}: { no: number; metin: string; secenekler: ReadonlyArray<{ deger: 0 | 1 | 2 | 3; etiket: string }>; deger: number | null; set: (v: number | null) => void }) {
  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
      <div style={psikStil.metin}>{no}. {metin}</div>
      <div style={{ marginTop: 8 }}>
        <Segment
          etiket={`${no}. madde sıklığı`}
          deger={deger ?? -1}
          set={(v) => set(v === deger ? null : v)}
          secenekler={secenekler.map((s) => [s.deger as number, `${s.deger} · ${s.etiket}`])}
        />
      </div>
    </div>
  );
}

export default function PsikAracKabugu({ route, baslik, aciklama, children }: { route: string; baslik: string; aciklama: string; children: React.ReactNode }) {
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
    <AracVurguSaglayici vurgu={PSIK_VURGU}>
      <div style={{ ...toolsShell, overflowX: 'hidden' }}>
        <DoktorNav />
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px 56px', boxSizing: 'border-box' }}>
          {!izin ? (
            <div style={{ color: '#9BB0C7', fontSize: 15, padding: '12px 0' }}>{izin === null ? 'Yükleniyor…' : 'Bu araç yalnızca psikiyatri için.'}</div>
          ) : (
            <>
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: PSIK_VURGU.baslik, letterSpacing: '1.4px', textTransform: 'uppercase', marginBottom: 8 }}>Araçlar · Psikiyatri</div>
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
