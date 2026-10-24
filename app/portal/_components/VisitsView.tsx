'use client'

import { PortalZiyaretDetayGorunumu, PortalZiyaretListesiGorunumu, PortalZiyaretYokGorunumu } from '@/components/doktor/portal/PortalZiyaretlerGorunumu'
import type { PortalBundle, PortalVisit } from '@/lib/portal/types'
import {
  YASAMSAL_BULGULAR_BASLIK,
  hasYasamsalBulgular,
  yasamsalBulguSatirlari,
} from '@/lib/clinical/yasamsalBulgular'
import { EmptyState, ListRow, SectionHeader, SoftPanel, formatTrDate } from './ui'
import { portalYonlendirmeMetni } from '@/lib/doktor/konsultasyon'

/**
 * KONSULTASYON-01 — "Yönlendirmeleriniz": doktorunuzun sizi yönlendirdiği uzmanlık alanları ve sonucun gelip
 * gelmediği. Yalnız branş + tarih + durum; klinik içerik doktorunuzda kalır (KVKK m.10 aydınlatma).
 */
export function YonlendirmelerView({ data }: { data: PortalBundle }) {
  const liste = data.yonlendirmeler || []
  if (!liste.length) return null
  return (
    <div style={{ marginTop: 20 }}>
      <SectionHeader title="Yönlendirmeleriniz" subtitle="Doktorunuzun görüşünü istediği uzmanlık alanları ve sonucun ulaşıp ulaşmadığı." />
      <SoftPanel className="sg-list-panel">
        {liste.map((y) => (
          <ListRow
            key={y.id}
            // YYYY-AA-GG gün değeri: öğlen UTC ile biçimlenir ki tarayıcı saat dilimi günü kaydırmasın
            meta={formatTrDate(`${y.tarih}T12:00:00Z`)}
            title={portalYonlendirmeMetni(y)}
            badge={
              <span style={{ fontWeight: 700, color: y.durum === 'sonuc_alindi' ? 'var(--sg-accent)' : 'inherit', opacity: y.durum === 'kapandi' ? 0.7 : 1 }}>
                {y.durum === 'sonuc_alindi' ? 'Sonuç alındı' : y.durum === 'kapandi' ? 'Kapatıldı' : 'Bekleniyor'}
              </span>
            }
          />
        ))}
      </SoftPanel>
      <p style={{ fontSize: 12.5, opacity: 0.75, margin: '10px 20px 0', lineHeight: 1.5 }}>
        Görüşmenin ayrıntılarını ve sonucunu doktorunuz sizinle muayenede konuşur. Randevu almadıysanız lütfen yönlendirildiğiniz uzmanlık alanından randevu alın.
      </p>
    </div>
  )
}

export function VisitsListView({ basePath, data }: { basePath: string; data: PortalBundle }) {
  return (
    <PortalZiyaretListesiGorunumu
      baslik="Ziyaretler"
      altBaslik="Muayene kayıtları ve ziyaret özetleri."
      bos={{ baslik: 'Ziyaret bulunamadı', govde: 'Doktorunuz paylaştığında ziyaretleriniz burada listelenir.' }}
      satirlar={data.visits.map((v) => ({
        id: v.id,
        href: `${basePath}/ziyaretler/${v.id}`,
        meta: formatTrDate(v.tarih),
        baslik: `${v.brans} · ${v.hekim}`,
        detay: v.basvuruNedeni,
        rozet: <span style={{ color: 'var(--sg-accent)', fontWeight: 700 }}>Özet →</span>,
      }))}
      ek={<YonlendirmelerView data={data} />}
    />
  )
}

export function VisitDetailView({
  basePath,
  visit,
}: {
  basePath: string
  visit: PortalVisit | null
}) {
  if (!visit) {
    return (
      <PortalZiyaretYokGorunumu
        baslik={{ ust: 'Ziyaret özeti', bos: 'Ziyaret bulunamadı' }}
        govde="Bu kayda erişilemiyor veya süresi dolmuş olabilir."
        geriHref={`${basePath}/ziyaretler`}
        geriEtiket="← Ziyaretlere dön"
      />
    )
  }

  const vitalLines = yasamsalBulguSatirlari(visit.vitaller)

  return (
    <PortalZiyaretDetayGorunumu
      geriHref={`${basePath}/ziyaretler`}
      geriEtiket="← Ziyaretler"
      baslik="Ziyaret özeti"
      altBaslik={`${formatTrDate(visit.tarih, true)} · ${visit.brans} · ${visit.hekim}`}
      vitaller={hasYasamsalBulgular(visit.vitaller) ? { baslik: YASAMSAL_BULGULAR_BASLIK, satirlar: vitalLines } : null}
      bloklar={[
        { label: 'Başvuru nedeni', text: visit.basvuruNedeni },
        { label: 'Anamnez', text: visit.subjektif },
        { label: 'Fizik muayene', text: visit.objektif },
        { label: 'Değerlendirme', text: visit.degerlendirme },
        { label: 'Plan', text: visit.plan },
        { label: 'Takip', text: visit.takip },
      ]}
      ilac={visit.ilacDegisiklikleri && visit.ilacDegisiklikleri.length > 0 ? { baslik: 'İLAÇ DEĞİŞİKLİKLERİ', satirlar: visit.ilacDegisiklikleri } : null}
    />
  )
}
