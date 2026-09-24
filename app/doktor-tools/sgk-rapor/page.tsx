'use client'
import HafifMarkdown from '@/components/asistan/HafifMarkdown';
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
import { CHROME_RENK, CHROME_FONT } from '@/lib/doktor/chromeTheme'

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
  const [enabiz, setEnabiz] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onTipChange = (id: typeof raporTipiId) => {
    const t = RAPOR_TIPLERI.find((x) => x.id === id) || RAPOR_TIPLERI[0]
    setRaporTipiId(t.id)
    setSure(t.sureVarsayilan)
    setRapor(null)
    setEnabiz(null)
  }

  const handleUret = async () => {
    if (!hastaId) {
      setError('Lütfen hasta seçin.')
      return
    }
    setLoading(true)
    setError('')
    setRapor(null)
    setEnabiz(null)
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
      setEnabiz((data as { enabiz?: Record<string, unknown> }).enabiz || null)
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
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px 48px' }}>
        <div style={{ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 15, color: '#6d6055', marginBottom: 4 }}>
          Araçlar
        </div>
        <h1 style={{ margin: 0, fontFamily: CHROME_FONT.serif, fontWeight: 500, fontSize: 32, color: '#2e251d', letterSpacing: '-0.02em' }}>Hasta Raporu Oluştur</h1>
        <p style={{ marginTop: 8, color: CHROME_RENK.muted, fontSize: 14, lineHeight: 1.5 }}>
          SGK Medula taslakları ile özel muayenehane belgelerini ayrı tutun. Canlı Medula gönderimi değildir.
        </p>

        {error && <div style={toolsErrorBox}>{error}</div>}

        <div style={{ ...toolsCard, marginTop: 20 }} className="no-print">
          <label style={toolsLabel}>Rapor Tipi</label>

          <div style={{ fontSize: 12, fontWeight: 800, color: CHROME_RENK.pine, letterSpacing: 0.6, margin: '4px 0 8px' }}>
            SGK / MEDULA
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {RAPOR_TIPLERI.filter((t) => t.kanal === 'sgk_medula').map((tip) => (
              <label
                key={tip.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: `1px solid ${raporTipiId === tip.id ? CHROME_RENK.pine + '88' : CHROME_RENK.border}`,
                  background: raporTipiId === tip.id ? '#E4F3F1' : '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="raporTipi"
                  value={tip.id}
                  checked={raporTipiId === tip.id}
                  onChange={() => onTipChange(tip.id)}
                  style={{ marginTop: 3, accentColor: CHROME_RENK.pine, flexShrink: 0 }}
                />
                <span>
                  <span style={{ display: 'block', color: CHROME_RENK.ink, fontSize: 14, fontWeight: 650, lineHeight: 1.35 }}>
                    {tip.label}
                  </span>
                  <span style={{ display: 'block', marginTop: 4, color: CHROME_RENK.muted, fontSize: 12, lineHeight: 1.4 }}>
                    {tip.aciklama}
                  </span>
                </span>
              </label>
            ))}
          </div>

          <div style={{ fontSize: 12, fontWeight: 800, color: '#B4832F', letterSpacing: 0.6, margin: '4px 0 8px' }}>
            ÖZEL MUAYENEHANE / PRIVATE PRACTICE
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
            {RAPOR_TIPLERI.filter((t) => t.kanal === 'ozel_muayenehane').map((tip) => (
              <label
                key={tip.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: `1px solid ${raporTipiId === tip.id ? '#B4832F88' : CHROME_RENK.border}`,
                  background: raporTipiId === tip.id ? '#FBF3DE' : '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="raporTipi"
                  value={tip.id}
                  checked={raporTipiId === tip.id}
                  onChange={() => onTipChange(tip.id)}
                  style={{ marginTop: 3, accentColor: '#B4832F', flexShrink: 0 }}
                />
                <span>
                  <span style={{ display: 'block', color: CHROME_RENK.ink, fontSize: 14, fontWeight: 650, lineHeight: 1.35 }}>
                    {tip.label}
                  </span>
                  <span style={{ display: 'block', marginTop: 4, color: CHROME_RENK.muted, fontSize: 12, lineHeight: 1.4 }}>
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
              color: CHROME_RENK.ink,
              borderRadius: 16,
              padding: 22,
              border: '1px solid #E5DFD0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 6 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M8 19c1.6-5.8 3.4-9.6 7.2-14.2.8 3.4.8 6.4-.2 9.2-1.5 2.4-4 4-7 5z" stroke="#6a7563" strokeWidth="1.3"/></svg>
              <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12, color: '#6d6055' }}>Notya</span>
            </div>
            <div style={{ textAlign: 'center', borderBottom: `2px solid ${CHROME_RENK.ink}`, paddingBottom: 12, marginBottom: 16 }}>
              <div style={{ fontWeight: 800, letterSpacing: 1.2 }}>
                {draftTip.kanal === 'sgk_medula' ? 'SGK / MEDULA RAPOR TASLAĞI' : 'MUAYENEHANE İSTİRAHAT BELGESİ'}
              </div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                {draftTip.kanal === 'sgk_medula'
                  ? 'Medula veri girişi için hazırlanmış taslak — canlı gönderim değildir'
                  : 'Özel hasta / işveren için klinik belge taslağı'}
              </div>
              <div style={{ fontSize: 12, color: CHROME_RENK.muted, marginTop: 4 }}>
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
                <div><HafifMarkdown metin={rapor.isGoremezlikGerekcesi || rapor.mevcutDurum || '—'} /></div>
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
                  <div><HafifMarkdown metin={rapor.hekim_degerlendirmesi || rapor.mevcutDurum || '—'} /></div>
                </section>
              </>
            )}

            {show('sure') && tipMeta.sureBirimi === 'ay' && (
              <section style={sec}>
                <div style={secHead}>RAPOR SÜRESİ</div>
                <div>{rapor.onerilen_sure_ay ?? sure} ay</div>
                <div style={{ fontSize: 12, color: CHROME_RENK.muted, marginTop: 4 }}>
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
                      <span style={{ color: CHROME_RENK.muted }}>(Medula)</span>
                    </div>
                  ) : null}
                </div>
                <div>
                  <div style={secHead}>
                    {draftTip.kanal === 'sgk_medula' ? 'e-İMZA (MEDULA)' : 'İMZA / KAŞE'}
                  </div>
                  <div style={{ height: 64, border: '1px dashed #CBD5E1', borderRadius: 6 }} />
                  <div style={{ fontSize: 11, color: CHROME_RENK.muted, marginTop: 4 }}>
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

            <div className="no-print" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={toolsPrimaryBtn(false)}
              >
                Yazdır
              </button>
              {enabiz && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(enabiz, null, 2)], { type: 'application/json;charset=utf-8' })
                      const a = document.createElement('a')
                      a.href = URL.createObjectURL(blob)
                      a.download = `enabiz-sgk_rapor-${new Date().toISOString().slice(0, 10)}.json`
                      a.click()
                      URL.revokeObjectURL(a.href)
                    }}
                    style={{ ...toolsPrimaryBtn(false), background: '#1F5F8B' }}
                  >
                    ⬇ Medula e-Rapor JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const t = String((enabiz as { kopya_metin?: string }).kopya_metin || '')
                      if (t) void navigator.clipboard.writeText(t)
                    }}
                    style={{ ...toolsPrimaryBtn(false), background: 'transparent', border: `1px solid ${CHROME_RENK.pine}`, color: CHROME_RENK.pine }}
                  >
                    📋 Medula alanlarını kopyala
                  </button>
                </>
              )}
            </div>
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
  borderBottom: `1px solid ${CHROME_RENK.border}`,
  marginBottom: 6,
}
const noteBox: React.CSSProperties = {
  marginTop: 16,
  padding: '10px 12px',
  background: '#F6F0E4',
  border: `1px solid ${CHROME_RENK.border}`,
  borderRadius: 8,
  fontSize: 11,
  lineHeight: 1.55,
  color: '#5a4e42',
}
