'use client'

/**
 * Live Kadın-Doğum chapter cards on the gebelik tab.
 * SAT/EDD stay in the specialty payload mapped from /api/doktor/gebelik.
 */
import GebeKarti from '@/specialties/kadin-dogum/ui/GebeKarti'
import IzlemTimeline from '@/specialties/kadin-dogum/ui/IzlemTimeline'
import TaramaPencereleri from '@/specialties/kadin-dogum/ui/TaramaPencereleri'
import UsgGallery from '@/specialties/kadin-dogum/ui/UsgGallery'
import UsgCompare from '@/specialties/kadin-dogum/ui/UsgCompare'
import AsistanGorselPanel from '@/specialties/kadin-dogum/ui/AsistanGorselPanel'
import JinekolojiKart from '@/specialties/kadin-dogum/ui/JinekolojiKart'
import {
  chapterCalendar,
  chapterWindows,
  payloadFromGebelikApi,
  type LiveGebelikVeri,
} from '@/lib/specialties/kadin-dogum-live'

export default function HastaKdChapter({ patientId, veri }: { patientId: string; veri: LiveGebelikVeri }) {
  const payload = payloadFromGebelikApi(patientId, veri)
  if (!payload) return null
  const booking = veri.yas?.hafta ?? 10
  const visits = chapterCalendar(payload, Math.min(booking, 16))
  const windows = veri.yas ? chapterWindows(veri.yas.hafta, veri.yas.gun) : []
  const series = payload.usg_series ?? {
    episodeId: payload.episode_id,
    datingMethod: payload.ga_locked,
    studies: [],
  }

  return (
    <div style={{ display: 'grid', gap: 12 }} data-chapter="kadin-dogum">
      <p style={{ margin: 0, fontSize: 12, color: '#8FA0B5' }}>
        TR pratik gold: ACOG. Yasal taban: DÖBYR 2026. Ders kitabı: Williams. Çelişince iki sütun — birleştirilmez.
      </p>
      <GebeKarti payload={payload} />
      <IzlemTimeline visits={visits} />
      {windows.length > 0 && <TaramaPencereleri windows={windows} />}
      <UsgGallery studies={series.studies} />
      <UsgCompare series={series} />
      <AsistanGorselPanel
        reads={payload.vision_reads ?? []}
        studies={series.studies}
        nst={payload.nst_studies?.[0] ?? null}
      />
      <JinekolojiKart lmp={payload.sat} today={new Date().toISOString().slice(0, 10)} />
    </div>
  )
}
