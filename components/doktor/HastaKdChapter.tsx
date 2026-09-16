'use client'

/**
 * Kadın-Doğum chapter cards — secondary depth on the gebelik tab.
 * Live gebelik_* CRUD is the visit-first primary UI (HastaGebelik).
 * SAT/EDD stay in the specialty payload mapped from /api/doktor/gebelik.
 */
import GebeKarti from '@/specialties/kadin-dogum/ui/GebeKarti'
import IzlemTimeline from '@/specialties/kadin-dogum/ui/IzlemTimeline'
import TaramaPencereleri from '@/specialties/kadin-dogum/ui/TaramaPencereleri'
import UsgGallery from '@/specialties/kadin-dogum/ui/UsgGallery'
import UsgCompare from '@/specialties/kadin-dogum/ui/UsgCompare'
import AsistanGorselPanel from '@/specialties/kadin-dogum/ui/AsistanGorselPanel'
import JinekolojiKart from '@/specialties/kadin-dogum/ui/JinekolojiKart'
import NstStrip from '@/specialties/kadin-dogum/ui/NstStrip'
import KolposkopiGaleri from '@/specialties/kadin-dogum/ui/KolposkopiGaleri'
import { nstShouldMount } from '@/specialties/kadin-dogum/engines/clinic-fit'
import {
  chapterCalendar,
  chapterDoneIds,
  chapterWindows,
  payloadFromGebelikApi,
  type LiveGebelikVeri,
} from '@/lib/specialties/kadin-dogum-live'

export default function HastaKdChapter({
  patientId,
  veri,
  jineLmp = null,
  sonServiks = null,
  sonServiksSonuc = null,
  kontrasepsiyon = null,
  goruntuUrl = {},
  showJine = false,
}: {
  patientId: string
  veri: LiveGebelikVeri
  jineLmp?: string | null
  sonServiks?: string | null
  sonServiksSonuc?: string | null
  kontrasepsiyon?: string | null
  goruntuUrl?: Record<string, string>
  showJine?: boolean
}) {
  const payload = payloadFromGebelikApi(patientId, veri)
  if (!payload) return null
  const booking = veri.yas?.hafta ?? 10
  const completedWeeks = (veri.izlemler || []).map((i) => i.hafta)
  const completedPpDays = (veri.lohusa?.izlemler || []).map((x) => x.dogum_sonrasi_gun)
  const visits = chapterCalendar(payload, Math.min(booking, 16), completedWeeks, completedPpDays)
  const doneIds = chapterDoneIds(veri)
  const windows = veri.yas ? chapterWindows(veri.yas.hafta, veri.yas.gun, doneIds) : []
  const series = payload.usg_series ?? {
    episodeId: payload.episode_id,
    datingMethod: payload.ga_locked,
    studies: [],
  }
  const nstList = payload.nst_studies ?? []
  const showNst = nstShouldMount({
    gaWeeks: veri.yas?.hafta ?? null,
    risk: payload.risk_class,
    nstCount: nstList.length,
  })

  return (
    <details style={{ border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12, padding: '10px 14px' }} data-chapter="kadin-dogum">
      <summary style={{ cursor: 'pointer', fontWeight: 700, color: '#EDF1F7', fontSize: 14 }}>
        Bölüm derinliği (ACOG / DÖBYR / Williams)
      </summary>
      <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
        <p style={{ margin: 0, fontSize: 12, color: '#8FA0B5' }}>
          TR pratik gold: ACOG. Yasal taban: DÖBYR 2026. Ders kitabı: Williams. Çelişince iki sütun — birleştirilmez.
        </p>
        <GebeKarti
          payload={payload}
          live={{
            D: veri.gebelik?.olu_dogum ?? null,
            E: veri.gebelik?.ektopik ?? null,
            idcKnown: payload.idc_history !== 'not_tested',
            pluralityKnown: Boolean(veri.gebelik?.cogul_gebelik_tipi),
            riskKnown: Boolean(veri.gebelik?.risk_sinifi || veri.gebelik?.risk_formu?.maddeler?.length),
          }}
        />
        <IzlemTimeline visits={visits} />
        {windows.length > 0 && <TaramaPencereleri windows={windows} />}
        {showNst && nstList[0] && <NstStrip nst={nstList[0]} />}
        {showNst && nstList.length === 0 && (
          <p style={{ fontSize: 13, color: '#8FA0B5' }} data-kd="nst-placeholder">
            NST izlemi endike (28. hafta veya yüksek risk). Aşağıdaki NST kaydından ekleyin.
          </p>
        )}
        <UsgGallery studies={series.studies} urls={goruntuUrl} />
        <UsgCompare series={series} />
        <AsistanGorselPanel
          reads={payload.vision_reads ?? []}
          studies={series.studies}
          nst={nstList[0] ?? null}
        />
        {showJine && (
          <JinekolojiKart
            lmp={jineLmp}
            today={new Date().toISOString().slice(0, 10)}
            sonServiks={sonServiks}
            sonServiksSonuc={sonServiksSonuc}
            kontrasepsiyon={kontrasepsiyon}
          />
        )}
        <KolposkopiGaleri images={payload.colpo_images ?? []} urls={goruntuUrl} />
      </div>
    </details>
  )
}
