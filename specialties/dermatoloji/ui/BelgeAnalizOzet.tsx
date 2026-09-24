'use client'

import { useState } from 'react'
import { getAccessTokenAsync } from '@/lib/doktor/toolsUi'
import { kutu, btn, giris } from './clinic-styles'
import { belgeAnalizHref, belgeDurumEtiket, belgeHekimOnayli, belgelerTabHref, type DermBelgeOzet } from '../engines/clinic-fit'
import { CHROME_RENK } from '@/lib/doktor/chromeTheme';

/** DERM-EXCEPTIONAL-01 — köprüden geçen modaliteler (imaging/belgeKopru ile aynı liste). */
const KOPRU_MODALITELERI = ['dermatoskopi', 'derm', 'yara']

const BOLGELER = [
  'saçlı deri', 'yüz', 'boyun', 'gövde ön', 'sırt', 'sağ kol', 'sol kol', 'sağ el', 'sol el',
  'sağ bacak', 'sol bacak', 'sağ ayak', 'sol ayak', 'tırnak', 'mukoza',
]

export function BelgeAnalizOzet({
  patientId,
  analizler,
  fitzpatrick,
  onAktarildi,
}: {
  patientId: string
  analizler: DermBelgeOzet[]
  fitzpatrick?: string
  onAktarildi?: () => void
}) {
  const [bolge, setBolge] = useState<Record<string, string>>({})
  const [mesaj, setMesaj] = useState<Record<string, string>>({})
  const [calisiyor, setCalisiyor] = useState('')

  async function okumayaAktar(analizId: string) {
    setCalisiyor(analizId)
    setMesaj((m) => ({ ...m, [analizId]: '' }))
    try {
      const token = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/dermatoloji', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'goruntu-okuma', eylem: 'belge_taslak', patientId, analizId, bolge: bolge[analizId] || '' }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j.error || 'Aktarılamadı.')
      setMesaj((m) => ({ ...m, [analizId]: `Taslak gönderildi — uzman onayı bekliyor (güven ≤%${j.guvenUst}).` }))
      onAktarildi?.()
    } catch (e) {
      setMesaj((m) => ({ ...m, [analizId]: e instanceof Error ? e.message : 'Aktarılamadı.' }))
    } finally {
      setCalisiyor('')
    }
  }

  return (
    <section style={kutu} data-derm="belge-analiz">
      <h2 style={{ margin: 0, fontSize: 16 }}>Belgeler AI — deri analizleri</h2>
      <p style={{ fontSize: 12, color: '#C4B5FD', margin: '6px 0 10px' }}>
        Tarama desteği, tanı değildir. Doktor onayı gerekir.
      </p>
      {analizler.length === 0 && (
        <p style={{ fontSize: 13, color: CHROME_RENK.muted }}>
          Bu hastada dermatoskopi / deri / yara belgesi analizi yok. Önce belge yükleyip Asistana raporlayın.
        </p>
      )}
      <datalist id="derm-kopru-bolgeler">
        {BOLGELER.map((b) => <option key={b} value={b} />)}
      </datalist>
      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 8, margin: 0 }}>
        {analizler.map((a) => (
          <li key={a.id} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 10 }}>
            <div style={{ fontSize: 12, color: belgeHekimOnayli(a.durum) ? '#86EFAC' : '#7A5B1E' }}>
              {belgeDurumEtiket(a.durum)} · {a.modality}
              {belgeHekimOnayli(a.durum) ? '' : ' — tanı değildir'}
            </div>
            <div style={{ fontSize: 13, marginTop: 4 }}>{a.ozet || 'Özet yok'}</div>
            {a.tanilar.length > 0 && (
              <div style={{ fontSize: 12, color: CHROME_RENK.muted, marginTop: 4 }}>
                {belgeHekimOnayli(a.durum) ? 'Hekim tanısı' : 'Taslak ayırıcı'}: {a.tanilar.join(', ')}
              </div>
            )}
            <a href={belgeAnalizHref(patientId, a.belgeId, (a.modality === 'derm' || a.modality === 'yara' ? a.modality : 'dermatoskopi'), fitzpatrick)} style={{ ...btn(), display: 'inline-block', marginTop: 8, textDecoration: 'none' }}>
              Asistana raporla
            </a>
            {KOPRU_MODALITELERI.includes(a.modality) && a.durum !== 'kalite_dusuk' && a.durum !== 'hata' && (
              <div style={{ marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8 }}>
                <div style={{ fontSize: 11, color: CHROME_RENK.muted, marginBottom: 6 }}>
                  Dual-sign taslak — uzman onayı Deri › Görüntü okumalarında. Tanı aktarılmaz; resmî tanı lezyon kartında hekim kilididir.
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <input
                    list="derm-kopru-bolgeler"
                    value={bolge[a.id] || ''}
                    onChange={(e) => setBolge((s) => ({ ...s, [a.id]: e.target.value }))}
                    placeholder="Vücut bölgesi (zorunlu)"
                    aria-label="Aktarılacak lezyonun vücut bölgesi"
                    style={{ ...giris, width: 'auto', minWidth: 180 }}
                  />
                  <button
                    type="button"
                    onClick={() => void okumayaAktar(a.id)}
                    disabled={!(bolge[a.id] || '').trim() || calisiyor === a.id}
                    style={{ ...btn(true), opacity: (bolge[a.id] || '').trim() && calisiyor !== a.id ? 1 : 0.5 }}
                  >
                    {calisiyor === a.id ? 'Gönderiliyor…' : 'Görüntü okumasına aktar'}
                  </button>
                </div>
                {mesaj[a.id] && (
                  <div style={{ fontSize: 12, marginTop: 6, color: /gönderildi/.test(mesaj[a.id]) ? '#2DD4BF' : '#F87171' }}>{mesaj[a.id]}</div>
                )}
                {!fitzpatrick && (
                  <div style={{ fontSize: 11, color: CHROME_RENK.muted, marginTop: 6 }}>
                    Deri tipi (Fitzpatrick) kayıtlı değil — taslak güven üst sınırı %70.
                  </div>
                )}
              </div>
            )}
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
