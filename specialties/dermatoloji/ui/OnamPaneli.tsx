'use client'

import type { PhotoAsset } from '../schema'
import { etiketS, kutu } from './clinic-styles'
import { genitalOrChildBlocked } from '../imaging/consent-kvkk'
import { bolgeEtiketi } from './labels'

export type FotoOnamPatch = {
  coreImageId: string
  genital_consent: boolean
  pediatric_consent: boolean
  education_anonymized: boolean
  patient_share: boolean
}

export function OnamPaneli({
  photos,
  pediatric,
  onKaydet,
}: {
  photos: PhotoAsset[]
  pediatric?: boolean
  onKaydet?: (p: FotoOnamPatch) => void
}) {
  const genital = photos.filter((p) => /genital|vulva|penis|scrot|perianal/i.test(p.region))
  const kilitli = photos.filter(genitalOrChildBlocked)
  return (
    <section style={kutu} data-derm="onam-paneli">
      <h2 style={{ margin: 0, fontSize: 16 }}>KVKK görüntü onamı</h2>
      <p style={{ fontSize: 12, color: '#8FA0B5' }}>
        Genital görüntü onamsız açılmaz / dışa aktarılmaz. 18 yaş altı, eğitim anonim ve hasta paylaşımı ayrı işaretlenir.
      </p>
      {kilitli.length > 0 && (
        <p style={{ fontSize: 13, color: '#FCA5A5' }}>{kilitli.length} görüntü genital onam olmadan kilitli.</p>
      )}
      {photos.length === 0 && <p style={{ fontSize: 13, color: '#8FA0B5' }}>Onam bağlanacak görüntü yok.</p>}
      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 8 }}>
        {photos.map((p) => (
          <li key={p.id} style={{ fontSize: 12.5, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 8 }}>
            <div style={{ marginBottom: 6 }}>{bolgeEtiketi(p.region)} · {p.capturedAt}</div>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                type="checkbox"
                defaultChecked={p.genital_consent}
                disabled={!onKaydet}
                onChange={(e) => onKaydet?.({
                  coreImageId: p.coreImageId,
                  genital_consent: e.target.checked,
                  pediatric_consent: p.pediatric_consent,
                  education_anonymized: p.education_anonymized,
                  patient_share: p.patient_share,
                })}
              />
              <span style={etiketS}>Genital bölge onamı</span>
            </label>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                type="checkbox"
                defaultChecked={p.pediatric_consent}
                disabled={!onKaydet}
                onChange={(e) => onKaydet?.({
                  coreImageId: p.coreImageId,
                  genital_consent: p.genital_consent,
                  pediatric_consent: e.target.checked,
                  education_anonymized: p.education_anonymized,
                  patient_share: p.patient_share,
                })}
              />
              <span style={etiketS}>{pediatric ? '18 yaş altı onamı (zorunlu)' : '18 yaş altı onamı'}</span>
            </label>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                type="checkbox"
                defaultChecked={p.education_anonymized}
                disabled={!onKaydet}
                onChange={(e) => onKaydet?.({
                  coreImageId: p.coreImageId,
                  genital_consent: p.genital_consent,
                  pediatric_consent: p.pediatric_consent,
                  education_anonymized: e.target.checked,
                  patient_share: p.patient_share,
                })}
              />
              <span style={etiketS}>Eğitim için anonim</span>
            </label>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                type="checkbox"
                defaultChecked={p.patient_share}
                disabled={!onKaydet}
                onChange={(e) => onKaydet?.({
                  coreImageId: p.coreImageId,
                  genital_consent: p.genital_consent,
                  pediatric_consent: p.pediatric_consent,
                  education_anonymized: p.education_anonymized,
                  patient_share: e.target.checked,
                })}
              />
              <span style={etiketS}>Hasta ile paylaşım</span>
            </label>
          </li>
        ))}
      </ul>
      {genital.length > 0 && !onKaydet && (
        <p style={{ fontSize: 12, color: '#FCA5A5' }}>Onam kaydı için klinik API gerekir.</p>
      )}
    </section>
  )
}

export default OnamPaneli
