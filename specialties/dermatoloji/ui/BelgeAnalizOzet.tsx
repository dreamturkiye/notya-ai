'use client'

import { kutu, btn } from './clinic-styles'
import { belgeAnalizHref, belgeDurumEtiket, belgeHekimOnayli, belgelerTabHref, type DermBelgeOzet } from '../engines/clinic-fit'

export function BelgeAnalizOzet({
  patientId,
  analizler,
  fitzpatrick,
}: {
  patientId: string
  analizler: DermBelgeOzet[]
  fitzpatrick?: string
}) {
  return (
    <section style={kutu} data-derm="belge-analiz">
      <h2 style={{ margin: 0, fontSize: 16 }}>Belgeler AI — deri analizleri</h2>
      <p style={{ fontSize: 12, color: '#C4B5FD', margin: '6px 0 10px' }}>
        Tarama desteği, tanı değildir. Doktor onayı gerekir.
      </p>
      {analizler.length === 0 && (
        <p style={{ fontSize: 13, color: '#8FA0B5' }}>
          Bu hastada dermatoskopi / deri / yara belgesi analizi yok. Önce belge yükleyip Asistana raporlayın.
        </p>
      )}
      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 8, margin: 0 }}>
        {analizler.map((a) => (
          <li key={a.id} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 10 }}>
            <div style={{ fontSize: 12, color: belgeHekimOnayli(a.durum) ? '#86EFAC' : '#FDE68A' }}>
              {belgeDurumEtiket(a.durum)} · {a.modality}
              {belgeHekimOnayli(a.durum) ? '' : ' — tanı değildir'}
            </div>
            <div style={{ fontSize: 13, marginTop: 4 }}>{a.ozet || 'Özet yok'}</div>
            {a.tanilar.length > 0 && (
              <div style={{ fontSize: 12, color: '#8FA0B5', marginTop: 4 }}>
                {belgeHekimOnayli(a.durum) ? 'Hekim tanısı' : 'Taslak ayırıcı'}: {a.tanilar.join(', ')}
              </div>
            )}
            <a href={belgeAnalizHref(patientId, a.belgeId, (a.modality === 'derm' || a.modality === 'yara' ? a.modality : 'dermatoskopi'), fitzpatrick)} style={{ ...btn(), display: 'inline-block', marginTop: 8, textDecoration: 'none' }}>
              Asistana raporla
            </a>
          </li>
        ))}
      </ul>
      <a href={belgelerTabHref(patientId, 'dermatoskopi')} style={{ ...btn(true), display: 'inline-block', marginTop: 10, textDecoration: 'none' }}>
        Belgelerde analiz et
      </a>
    </section>
  )
}

export default BelgeAnalizOzet
