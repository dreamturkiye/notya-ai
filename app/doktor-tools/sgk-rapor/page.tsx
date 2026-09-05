'use client'

import DoktorNav from '@/components/doktor/DoktorNav'
import HastaTypeahead from '@/components/doktor/HastaTypeahead'
import {
  getAccessTokenAsync,
  toolsCard,
  toolsErrorBox,
  toolsInput,
  toolsLabel,
  toolsPrimaryBtn,
  toolsShell,
} from '@/lib/doktor/toolsUi'
import {
  RAPOR_TIPLERI,
  type HekimKimlik,
  type RaporTipiMeta,
  type SgkRaporDraft,
} from '@/lib/sgk/raporTipleri'
import React, { useMemo, useState } from 'react'

export default function SgkRaporPage() {
  const [hastaId, setHastaId] = useState('')
  const [hastaLabel, setHastaLabel] = useState('')
  const [raporTipiId, setRaporTipiId] = useState(RAPOR_TIPLERI[0].id)
  const [hekimNotu, setHekimNotu] = useState('')
  const tipMeta = useMemo(
    () => RAPOR_TIPLERI.find((t) => t.id === raporTipiId) || RAPOR_TIPLERI[0],
    [raporTipiId]
  )
  const [sure, setSure] = useState(RAPOR_TIPLERI[0].sureVarsayilan)
  const [rapor, setRapor] = useState<SgkRaporDraft | null>(null)
  const [hekim, setHekim] = useState<HekimKimlik | null>(null)
  const [aktifTip, setAktifTip] = useState<RaporTipiMeta | null>(null)
  const [tarih, setTarih] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onTipChange = (id: typeof raporTipiId) => {
    const t = RAPOR_TIPLERI.find((x) => x.id === id) || RAPOR_TIPLERI[0]
    setRaporTipiId(t.id)
    setSure(t.sureVarsayilan)
    setRapor(null)
  }

  const handleUret = async () => {
    if (!hastaId) {
      setError('Lütfen hasta seçin.')
      return
    }
    setLoading(true)
    setError('')
    setRapor(null)
    try {
      const token = await getAccessTokenAsync()
      if (!token) {
        setError('Oturum bulunamadı. Tekrar giriş yapın.')
        return
      }
      const res = await fetch('/api/doktor/araclar/sgk-rapor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          hastaId,
          raporTipiId,
          raporTipi: tipMeta.label,
          sure: Number(sure) || tipMeta.sureVarsayilan,
          hekimNotu,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(String((data as { hata?: string }).hata || 'Rapor oluşturulamadı.'))
        return
      }
      setRapor((data as { rapor: SgkRaporDraft }).rapor)
      setTarih(String((data as { tarih?: string }).tarih || new Date().toLocaleDateString('tr-TR')))
      setHekim((data as { hekim?: HekimKimlik }).hekim || null)
      setAktifTip((data as { raporTipi?: RaporTipiMeta }).raporTipi || tipMeta)
    } catch {
      setError('Sunucu hatası. Tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  const draftTip = aktifTip || tipMeta
  const show = (key: RaporTipiMeta['bolumler'][number]) => draftTip.bolumler.includes(key)

  return (
    <div style={toolsShell}>
      <DoktorNav />
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px 48px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#14B8A6', letterSpacing: 1.2, marginBottom: 8 }}>
          ARAÇLAR
        </div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#FFFFFF' }}>SGK Rapor Oluştur</h1>
        <p style={{ marginTop: 8, color: '#94A3B8', fontSize: 14, lineHeight: 1.5 }}>
          Medula e-Rapor / e-İstirahat veri girişi için klinik taslak. Canlı Medula gönderimi değildir.
        </p>

        {error && <div style={toolsErrorBox}>{error}</div>}

        <div style={{ ...toolsCard, marginTop: 20 }} className="no-print">
          <label style={toolsLabel}>Rapor Tipi</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
            {RAPOR_TIPLERI.map((tip) => (
              <label
                key={tip.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: `1px solid ${raporTipiId === tip.id ? 'rgba(15,155,142,0.55)' : 'rgba(255,255,255,0.12)'}`,
                  background: raporTipiId === tip.id ? 'rgba(15,155,142,0.12)' : 'rgba(255,255,255,0.03)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="raporTipi"
                  value={tip.id}
                  checked={raporTipiId === tip.id}
                  onChange={() => onTipChange(tip.id)}
                  style={{ marginTop: 3, accentColor: '#0F9B8E', flexShrink: 0 }}
                />
                <span>
                  <span style={{ display: 'block', color: '#F8FAFC', fontSize: 14, fontWeight: 650, lineHeight: 1.35 }}>
                    {tip.label}
                    {tip.kanal === 'ozel_muayenehane' ? (
                      <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: '#FBBF24' }}>ÖZEL</span>
                    ) : (
                      <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: '#5EEAD4' }}>SGK</span>
                    )}
                  </span>
                  <span style={{ display: 'block', marginTop: 4, color: '#94A3B8', fontSize: 12, lineHeight: 1.4 }}>
                    {tip.aciklama}
                  </span>
                </span>
              </label>
            ))}
          </div>

          <label style={toolsLabel}>Hasta</label>
          <div style={{ marginBottom: 16 }}>
            <HastaTypeahead
              id="sgk-rapor-hasta"
              value={hastaId}
              placeholder="Ad veya soyad yazın / seçin…"
              onLoadError={(msg) => setError(msg)}
              onChange={(id, h) => {
                setHastaId(id)
                setHastaLabel(h?.label || '')
                setError('')
                setRapor(null)
              }}
            />
          </div>

          <label style={toolsLabel}>Hekim Notu / Açıklama</label>
          <textarea
            value={hekimNotu}
            onChange={(e) => setHekimNotu(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Raporda hekim açıklaması olarak aynen yer alır; Medula’daki Açıklama alanına da bu metni girin."
            style={{
              ...toolsInput,
              width: '100%',
              boxSizing: 'border-box',
              minHeight: 84,
              resize: 'vertical',
              marginBottom: 14,
            }}
          />

          <label style={toolsLabel}>
            {tipMeta.sureBirimi === 'gun' ? 'İstirahat Süresi (Gün)' : 'Rapor Süresi (Ay)'}
          </label>
          <input
            type="number"
            min={tipMeta.sureMin}
            max={tipMeta.sureMax}
            value={sure}
            onChange={(e) => setSure(parseInt(e.target.value || String(tipMeta.sureVarsayilan), 10))}
            style={{ ...toolsInput, marginBottom: 18 }}
          />

          <button
            type="button"
            onClick={() => void handleUret()}
            disabled={loading || !hastaId}
            style={toolsPrimaryBtn(loading || !hastaId)}
          >
            {loading ? 'Oluşturuluyor...' : 'Üret'}
          </button>
        </div>

        {rapor && (
          <div
            id="rapor-card"
            style={{
              marginTop: 20,
              background: '#FFFFFF',
              color: '#0F172A',
              borderRadius: 16,
              padding: 22,
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <div style={{ textAlign: 'center', borderBottom: '2px solid #0F172A', paddingBottom: 12, marginBottom: 16 }}>
              <div style={{ fontWeight: 800, letterSpacing: 1.2 }}>
                {draftTip.kanal === 'sgk_medula' ? 'SGK / MEDULA RAPOR TASLAĞI' : 'MUAYENEHANE İSTİRAHAT BELGESİ'}
              </div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                {draftTip.kanal === 'sgk_medula'
                  ? 'Medula veri girişi için hazırlanmış taslak — canlı gönderim değildir'
                  : 'Özel hasta / işveren için klinik belge taslağı'}
              </div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                Rapor tarihi: {tarih}
                {hekim?.tesisKodu ? ` · Tesis Kodu: ${hekim.tesisKodu}` : ''}
                {draftTip.kanal === 'sgk_medula' ? ' · Rapor No: Medula tarafından atanır' : ''}
              </div>
            </div>

            <h2 style={{ textAlign: 'center', fontSize: 17, margin: '0 0 18px' }}>
              {rapor.raporBasligi || draftTip.label}
            </h2>

            {show('hasta') && (
              <section style={sec}>
                <div style={secHead}>HASTA BİLGİLERİ</div>
                <div>
                  <strong>Ad Soyad:</strong> {rapor.hastaAdi || hastaLabel || '—'}
                </div>
                <div>
                  <strong>T.C. Kimlik No:</strong>{' '}
                  {draftTip.kanal === 'sgk_medula'
                    ? 'Medula kaydında (Notya T.C. saklamaz)'
                    : 'Belgede elle tamamlanır / hasta kimliği'}
                </div>
                {draftTip.id === 'is_goremezlik' && (
                  <div>
                    <strong>Sigortalılık durumu:</strong> Medula tarafından alınır
                  </div>
                )}
              </section>
            )}

            {show('rapor_meta') && (draftTip.id === 'is_goremezlik' || draftTip.id === 'muayenehane_istirahat') && (
              <section style={sec}>
                <div style={secHead}>RAPOR BİLGİLERİ</div>
                {draftTip.id === 'is_goremezlik' && (
                  <div>
                    <strong>Rapor türü:</strong> {rapor.raporTuru || 'İlk'} (İlk / Devam / Kontrol)
                  </div>
                )}
                <div>
                  <strong>Rapor tarihi:</strong> {tarih}
                </div>
                <div>
                  <strong>Başlangıç tarihi:</strong> {rapor.baslangicTarihi || tarih}
                </div>
                <div>
                  <strong>Bitiş tarihi:</strong> {rapor.bitisTarihi || '—'}
                </div>
                <div>
                  <strong>İstirahat süresi:</strong> {rapor.istirahat_suresi_gun ?? sure} gün
                </div>
                {draftTip.kanal === 'sgk_medula' && (
                  <div>
                    <strong>Rapor numarası:</strong> Medula tarafından üretilir
                  </div>
                )}
              </section>
            )}

            {show('tani') && (
              <section style={sec}>
                <div style={secHead}>TANI (ICD-10)</div>
                <div>
                  {rapor.tani?.icd10 ? `${rapor.tani.icd10} — ` : ''}
                  {rapor.tani?.aciklama || '—'}
                </div>
              </section>
            )}

            {show('gerekce') && (
              <section style={sec}>
                <div style={secHead}>İŞ GÖREMEZLİK GEREKÇESİ</div>
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {rapor.isGoremezlikGerekcesi || rapor.mevcutDurum || '—'}
                </div>
              </section>
            )}

            {show('klinik') && (
              <>
                {rapor.anamnez ? (
                  <section style={sec}>
                    <div style={secHead}>ANAMNEZ</div>
                    <div>{rapor.anamnez}</div>
                  </section>
                ) : null}
                <section style={sec}>
                  <div style={secHead}>
                    {draftTip.id === 'is_goremezlik' || draftTip.id === 'muayenehane_istirahat'
                      ? 'MUAYENE BULGULARI / KLİNİK DEĞERLENDİRME'
                      : 'MEVCUT DURUM / KLİNİK DEĞERLENDİRME'}
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {rapor.hekim_degerlendirmesi || rapor.mevcutDurum || '—'}
                  </div>
                </section>
              </>
            )}

            {show('sure') && tipMeta.sureBirimi === 'ay' && (
              <section style={sec}>
                <div style={secHead}>RAPOR SÜRESİ</div>
                <div>{rapor.onerilen_sure_ay ?? sure} ay</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                  Başlangıç: {rapor.baslangicTarihi || tarih} (bitiş Medula / SUT kurallarına göre)
                </div>
              </section>
            )}

            {show('etken') && Array.isArray(rapor.etkenMaddeler) && rapor.etkenMaddeler.length > 0 && (
              <section style={sec}>
                <div style={secHead}>ETKEN MADDELER (Medula listesiyle eşleştirin)</div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {rapor.etkenMaddeler.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </section>
            )}

            {show('malzeme') && Array.isArray(rapor.malzemeOnerileri) && rapor.malzemeOnerileri.length > 0 && (
              <section style={sec}>
                <div style={secHead}>TIBBİ MALZEME ÖNERİLERİ (SUT kodunu Medula’dan seçin)</div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {rapor.malzemeOnerileri.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </section>
            )}

            {show('tetkik') && Array.isArray(rapor.zorunluTetkikler) && rapor.zorunluTetkikler.length > 0 && (
              <section style={sec}>
                <div style={secHead}>ZORUNLU / DESTEKLEYİCİ TETKİKLER</div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {rapor.zorunluTetkikler.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </section>
            )}

            <section style={sec}>
              <div style={secHead}>HEKİM AÇIKLAMASI</div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{rapor.hekim_notu || '—'}</div>
            </section>

            {show('hekim') && (
              <section
                style={{
                  marginTop: 24,
                  fontSize: 13,
                  lineHeight: 1.55,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: 16,
                }}
              >
                <div>
                  <div style={secHead}>DÜZENLEYEN HEKİM</div>
                  <div>
                    <strong>Ad Soyad:</strong> {hekim?.adSoyad || '—'}
                  </div>
                  <div>
                    <strong>Uzmanlık Dalı:</strong> {hekim?.uzmanlik || '—'}
                  </div>
                  <div>
                    <strong>Diploma Tescil No:</strong> {hekim?.diplomaTescilNo || '— (profilde tamamlayın)'}
                  </div>
                  <div>
                    <strong>Çalıştığı Sağlık Kurumu:</strong>{' '}
                    {hekim?.saglikKurumu || '— (profilde / Medula tesisinde)'}
                  </div>
                  {hekim?.tesisKodu ? (
                    <div>
                      <strong>Sağlık tesisi kodu:</strong> {hekim.tesisKodu}{' '}
                      <span style={{ color: '#64748B' }}>(Medula)</span>
                    </div>
                  ) : null}
                </div>
                <div>
                  <div style={secHead}>
                    {draftTip.kanal === 'sgk_medula' ? 'e-İMZA (MEDULA)' : 'İMZA / KAŞE'}
                  </div>
                  <div style={{ height: 64, border: '1px dashed #CBD5E1', borderRadius: 6 }} />
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                    {draftTip.kanal === 'sgk_medula'
                      ? 'e-İmza Medula’da uygulanır. Rapor No Medula tarafından atanır.'
                      : 'Islak imza ve kaşe — işverene verilen nüsha için'}
                  </div>
                </div>
              </section>
            )}

            {show('medula_not') && (
              <section style={noteBox}>
                <strong>Yasal / Medula notu:</strong> Bu çıktı Medula’ya girilecek verinin taslağıdır. İlaç
                kullanım raporlarında SGK 01.02.2019’dan beri kâğıt nüshayı kabul etmez; geçerli rapor Medula’da
                e-Rapor kaydı + hekim <strong>güvenli elektronik imzası</strong> ile oluşur. Rapor teşhis kodu ve
                (varsa) etken madde / SUT kodları SGK Medula listelerinden seçilmelidir.
                {hekim && !hekim.medulaBagli
                  ? ' Medula hesabınız Notya’ya bağlı değil — Entegrasyonlar sayfasından bağlayın.'
                  : ''}
              </section>
            )}

            {show('ozel_uyari') && (
              <section style={{ ...noteBox, background: '#FFFBEB', borderColor: '#F59E0B' }}>
                <strong>Önemli:</strong> Bu belge <em>SGK e-İstirahat değildir</em>. Solo özel muayenehane
                raporları SGK geçici iş göremezlik ödeneğine esas kabul edilmez; ödenek için hastanın sözleşmeli /
                yetkili sağlık hizmet sunucusundan Medula e-İstirahat alması gerekir. İşverenin özel muayenehane
                belgesini kabul edip etmeyeceği işyeri uygulamasına bağlıdır.
              </section>
            )}

            <button
              type="button"
              className="no-print"
              onClick={() => window.print()}
              style={{ ...toolsPrimaryBtn(false), marginTop: 8 }}
            >
              Yazdır
            </button>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          .no-print, nav { display: none !important; }
          body { background: white !important; }
          #rapor-card { box-shadow: none !important; border: 2px solid black !important; }
        }
      `}</style>
    </div>
  )
}

const sec: React.CSSProperties = { marginBottom: 14, fontSize: 14, lineHeight: 1.55 }
const secHead: React.CSSProperties = {
  fontWeight: 700,
  borderBottom: '1px solid #CBD5E1',
  marginBottom: 6,
}
const noteBox: React.CSSProperties = {
  marginTop: 16,
  padding: '10px 12px',
  background: '#F8FAFC',
  border: '1px solid #E2E8F0',
  borderRadius: 8,
  fontSize: 11,
  lineHeight: 1.55,
  color: '#475569',
}
