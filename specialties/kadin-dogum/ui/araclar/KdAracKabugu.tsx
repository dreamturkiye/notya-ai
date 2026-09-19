'use client';
/**
 * Araçlar › Kadın Hastalıkları ve Doğum stüdyoları ortak kabuğu (GozAracKabugu ile aynı kalıp). Oturum + branş kapısı (doktorAraciBransaUygun)
 * + yönlendirme, mobil düzen, isteğe bağlı hasta seçici (tr-TR arama). Yalnız kadın hastalıkları ve doğum hekimi açar;
 * başka branş /doktor-tools'a döner (specialty-doktor-araclari).
 *
 * ARACLAR-CILA-01: ortak parçalar artık lib/doktor/aracUi.tsx'te (tek kaynak). Buradaki dışa aktarımlar
 * o kütüphaneye delege eden ince sarmalayıcılar; yalnız branşa özel olanlar (pencere durum renkleri,
 * çift sütun, gebelik özeti) burada kalır.
 */
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DoktorNav from '@/components/doktor/DoktorNav';
import { toolsShell, getAccessTokenAsync } from '@/lib/doktor/toolsUi';
import { ensureDoctorAccessToken } from '@/lib/doktor/clientAuth';
import { doktorAraciBransaUygun } from '@/lib/doktor/doktorAraclari';
import { KADIN_HASTALIKLARI_DOGUM_KISA_ETIKETI } from '@/lib/doktor/specialties';
import { AracVurguSaglayici, aracStil, HastaSecici, panoyaKopyala, VURGU_KD } from '@/lib/doktor/aracUi';
import { doneWindowIdsFromClinic } from '../../engines/clinic-fit';
import type { WindowId } from '../../engines/test-windows';
import type { PencereDurum } from '../../engines/araclar';

export const KD_VURGU = VURGU_KD;
export const kdStil = aracStil(KD_VURGU);

export {
  Alan, Segment, Secim, Etiketli, Kutu, Onay, Sayi, Katlanir, TaslakNotu, Rozet, OneriRozet,
  Istatistik, KopyalaButonu, MuayeneFormunaEkle, panoyaKopyala, useUrlHasta, useHastaVerisi,
} from '@/lib/doktor/aracUi';

/** Pencere durum renkleri — "kapanmak üzere" en baskın (geri alınamaz). */
export const DURUM_RENK: Record<PencereDurum, { fg: string; bg: string; kenar: string }> = {
  kapaniyor: { fg: '#FFFFFF', bg: '#C2410C', kenar: '#FB923C' },
  kacirildi: { fg: '#FCA5A5', bg: 'rgba(248,113,113,0.12)', kenar: 'rgba(248,113,113,0.45)' },
  gecti: { fg: '#8FA0B5', bg: 'rgba(255,255,255,0.03)', kenar: 'rgba(255,255,255,0.1)' },
  acik: { fg: '#6EE7B7', bg: 'rgba(16,185,129,0.12)', kenar: 'rgba(16,185,129,0.4)' },
  yaklasiyor: { fg: '#93C5FD', bg: 'rgba(59,130,246,0.12)', kenar: 'rgba(59,130,246,0.35)' },
  yapildi: { fg: '#8FA0B5', bg: 'rgba(255,255,255,0.03)', kenar: 'rgba(255,255,255,0.1)' },
  ileride: { fg: '#8FA0B5', bg: 'rgba(255,255,255,0.03)', kenar: 'rgba(255,255,255,0.08)' },
};

/** Çift sütun (yasal asgari vs klinik öneri) — çakışma asla tek öneriye indirgenmez. */
export function CiftSutun({ baslik, sb, klinik }: { baslik: string; sb: string; klinik: string }) {
  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '10px 0' }}>
      <div style={{ ...kdStil.metin, fontWeight: 700, marginBottom: 6 }}>{baslik}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 10 }}><div style={{ ...kdStil.kucuk, fontWeight: 700, color: '#F9A8D4' }}>Yasal asgari (SB / SUT)</div><div style={kdStil.metin}>{sb}</div></div>
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 10 }}><div style={{ ...kdStil.kucuk, fontWeight: 700, color: '#93C5FD' }}>Klinik öneri (uluslararası)</div><div style={kdStil.metin}>{klinik}</div></div>
      </div>
    </div>
  );
}

/** Hekimin kendi hasta listesi (/api/doktor/hastalar — doctor_id kapsamlı). Seçim isteğe bağlıdır. */
export function KdHastaSecici({ secili, sec }: { secili: string; sec: (id: string, ad: string) => void }) {
  return <HastaSecici secili={secili} sec={sec} />;
}

/** Seçilen hastanın gebelik özeti — mevcut /api/doktor/gebelik GET (hastaSahibiMi + doctor_id kapsamlı); yeni uç yok. */
export type KdHastaOzeti = {
  gebelikVar: boolean
  sat: string | null
  tdt: string | null
  tdtKaynak: string | null
  rhNegatif: boolean | null
  cogul: boolean
  oncekiSezaryen: number | null
  kesiTipi: string | null
  gravida: number | null
  para: number | null
  dogumTarihi: string | null
  hastaDogum: string | null
  izlemHaftalari: number[]
  yapilanlar: WindowId[]
  vki: number | null
  riskSinifi: 'dusuk' | 'orta' | 'yuksek'
}

const isoGun = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : null);

export async function kdHastaOzeti(patientId: string): Promise<KdHastaOzeti> {
  const t = await getAccessTokenAsync();
  const r = await fetch(`/api/doktor/gebelik?patientId=${encodeURIComponent(patientId)}`, { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Hasta verisi yüklenemedi');
  const g = j.gebelik as Record<string, unknown> | null;
  const iz = (j.izlemler || []) as Array<{ hafta: number; usg?: Record<string, string | number> | null; ogtt?: unknown; gbs_kultur?: string | null }>;
  const n = (v: unknown) => (v == null || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));
  const kilo = n(g?.gebelik_oncesi_kilo), boy = n(g?.boy);
  const risk = g?.risk_sinifi === 'orta' || g?.risk_sinifi === 'yuksek' ? g.risk_sinifi : 'dusuk';
  return {
    gebelikVar: !!g,
    sat: isoGun(g?.sat), tdt: isoGun(g?.tdt), tdtKaynak: (g?.tdt_kaynak as string) || null,
    rhNegatif: g ? !!g.rh_negatif : null,
    cogul: !!g?.cogul_gebelik_tipi && g.cogul_gebelik_tipi !== 'tekil',
    oncekiSezaryen: n(g?.onceki_sezaryen_sayisi), kesiTipi: (g?.onceki_sezaryen_kesi_tipi as string) || null,
    gravida: n(g?.gravida), para: n(g?.para),
    dogumTarihi: isoGun(g?.dogum_tarihi), hastaDogum: isoGun(j.baslik?.dogumTarihi),
    izlemHaftalari: iz.map((x) => Number(x.hafta)).filter((x) => Number.isFinite(x)),
    yapilanlar: g ? doneWindowIdsFromClinic({
      labs: (g.lab_panel || null) as never, kanGrubu: (g.kan_grubu as string) || null,
      izlemler: iz.map((x) => ({ hafta: Number(x.hafta), usg: x.usg || null, ogtt: x.ogtt, gbs_kultur: x.gbs_kultur ?? null })),
      genetik: ((j.genetikTaramalar || []) as Array<{ tur: string }>).map((x) => ({ tur: String(x.tur) })),
      destekAsi: (g.destek_asi || null) as never,
      antiD: Array.isArray(g.anti_d_uygulamalari) ? g.anti_d_uygulamalari : [],
    }) : [],
    vki: kilo && boy ? Math.round((kilo / Math.pow(boy / 100, 2)) * 10) / 10 : null,
    riskSinifi: risk as KdHastaOzeti['riskSinifi'],
  };
}

/** Geriye dönük ad — ortak panoyaKopyala'ya delege eder. */
export const panoya = panoyaKopyala;

export default function KdAracKabugu({ route, baslik, aciklama, children }: { route: string; baslik: string; aciklama: string; children: React.ReactNode }) {
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
    <AracVurguSaglayici vurgu={KD_VURGU}>
      <div style={{ ...toolsShell, overflowX: 'hidden' }}>
        <DoktorNav />
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px 56px', boxSizing: 'border-box' }}>
          {!izin ? (
            <div style={{ color: '#9BB0C7', fontSize: 15, padding: '12px 0' }}>{izin === null ? 'Yükleniyor…' : 'Bu araç yalnızca kadın hastalıkları ve doğum için.'}</div>
          ) : (
            <>
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: KD_VURGU.baslik, letterSpacing: '1.4px', textTransform: 'uppercase', marginBottom: 8 }}>Araçlar · {KADIN_HASTALIKLARI_DOGUM_KISA_ETIKETI}</div>
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
