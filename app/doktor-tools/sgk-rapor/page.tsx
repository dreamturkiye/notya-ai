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
  UC_YILLIK_RAPOR,
  raporSureSiniri,
  type HekimKimlik,
  type RaporTipiMeta,
  type SgkRaporDraft,
} from '@/lib/sgk/raporTipleri'
import React, { useEffect, useMemo, useState } from 'react'
import { CHROME_RENK, CHROME_FONT } from '@/lib/doktor/chromeTheme'
import { cocukHastaRaporuBransiMi } from '@/lib/doktor/belgeTurleri'
import {
  COCUK_RAPOR_TIPLERI,
  cocukRaporTipiById,
  istirahatBitisTarihi,
  type CocukRaporTipiId,
} from '@/lib/doktor/cocukHastaRaporlari'
import {
  COZGER_DURUMLARI,
  COZGER_DUZEYLERI,
  COZGER_GECERLILIK_TIPLERI,
  COZGER_UYARI_METNI,
  cozgerYenilemeUyarisiGerekliMi,
  type CozgerDurum,
  type CozgerDuzey,
  type CozgerGecerlilikTipi,
} from '@/lib/doktor/cozgerTakip'

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
  // NOTYA-SUT-RAPOR-01 — SUT 4.2.16(2),(6): three-year reports (coeliac disease; special formulas in inborn
  // metabolic disease). Off by default: every other medicine report stays within SUT 4.1.3(5), two years.
  const [ucYil, setUcYil] = useState(false)
  const sinir = useMemo(() => raporSureSiniri(tipMeta, ucYil ? UC_YILLIK_RAPOR.id : null), [tipMeta, ucYil])
  const [rapor, setRapor] = useState<SgkRaporDraft | null>(null)
  const [hekim, setHekim] = useState<HekimKimlik | null>(null)
  const [aktifTip, setAktifTip] = useState<RaporTipiMeta | null>(null)
  const [tarih, setTarih] = useState('')
  const [enabiz, setEnabiz] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pdfIndiriliyor, setPdfIndiriliyor] = useState(false)

  // NOTYA-HASTA-RAPORLARI-UNIFIED-01 — Çocuk Hasta Raporları alt bölümü yalnız pediatri / çocuk
  // cerrahisi doktoruna görünür (brans-alan-sızması: doktorun KENDİ branşı, hasta değil).
  const [cocukBrans, setCocukBrans] = useState<boolean | null>(null)
  useEffect(() => {
    let iptal = false
    ;(async () => {
      try {
        const token = await getAccessTokenAsync()
        if (!token) return
        const r = await fetch('/api/users/me', { headers: { Authorization: `Bearer ${token}` } })
        const j = r.ok ? await r.json() : null
        if (!iptal) setCocukBrans(cocukHastaRaporuBransiMi(j?.data?.specialty ?? null))
      } catch { if (!iptal) setCocukBrans(false) }
    })()
    return () => { iptal = true }
  }, [])

  const onTipChange = (id: typeof raporTipiId) => {
    const t = RAPOR_TIPLERI.find((x) => x.id === id) || RAPOR_TIPLERI[0]
    setRaporTipiId(t.id)
    setSure(t.sureVarsayilan)
    setUcYil(false)
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
          ozelSure: tipMeta.id === 'ilac_kullanim' && ucYil ? UC_YILLIK_RAPOR.id : undefined,
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
            ÖZEL MUAYENEHANE
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
            min={sinir.min}
            max={sinir.max}
            value={sure}
            onChange={(e) => setSure(parseInt(e.target.value || String(tipMeta.sureVarsayilan), 10))}
            style={{ ...toolsInput, marginBottom: tipMeta.id === 'ilac_kullanim' ? 8 : 18 }}
          />
          {tipMeta.id === 'ilac_kullanim' && (
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: CHROME_RENK.ink, lineHeight: 1.4, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={ucYil}
                  onChange={(e) => {
                    setUcYil(e.target.checked)
                    setSure(e.target.checked ? UC_YILLIK_RAPOR.ay : tipMeta.sureVarsayilan)
                    setRapor(null)
                  }}
                  style={{ marginTop: 3, flexShrink: 0 }}
                />
                <span>{UC_YILLIK_RAPOR.etiket}</span>
              </label>
              <div style={{ fontSize: 12, color: CHROME_RENK.muted, marginTop: 4 }}>
                {ucYil
                  ? `En fazla ${UC_YILLIK_RAPOR.ay} ay (${UC_YILLIK_RAPOR.madde}).`
                  : 'En fazla 24 ay: sağlık raporu, özel düzenlemeler dışında en fazla iki yıl geçerlidir (SUT 4.1.3(5)).'}
              </div>
            </div>
          )}

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

            {/* NOTYA-SUT-RAPOR-01 — the notice used to say "SGK 01.02.2019’dan beri kâğıt nüshayı kabul etmez". That
                date and that statement are not in the text: SUT 4.1.3(2) has MEDULA users issue reports electronically,
                and 4.1.3(8) still describes a report not issued electronically. The notice now says what 4.1.3(2) says.
                Source: SGK güncel SUT, 02.10.2026 (RG 33388) işlenmiş hali. */}
            {show('medula_not') && (
              <section style={noteBox}>
                <strong>Yasal / Medula notu:</strong> Bu çıktı Medula’ya girilecek verinin taslağıdır. MEDULA’yı
                kullanan sağlık hizmeti sunucuları ilaç kullanım raporunu elektronik ortamda düzenler (SUT 4.1.3(2));
                geçerli rapor Medula’da e-Rapor kaydı + hekim <strong>güvenli elektronik imzası</strong> ile oluşur. Rapor teşhis kodu ve
                (varsa) etken madde / SUT kodları SGK Medula listelerinden seçilmelidir.
                {hekim && !hekim.medulaBagli
                  ? ' Medula hesabınız Notya’ya bağlı değil — Entegrasyonlar sayfasından bağlayın.'
                  : ''}
              </section>
            )}

            {show('ozel_uyari') && (
              <section style={{ ...noteBox, background: '#FFFBEB', borderColor: '#F59E0B' }}>
                <strong>Önemli:</strong> Bu belge <em>SGK e-İstirahat değildir</em>. Özel muayenehane
                raporları tek başına SGK geçici iş göremezlik ödeneğine esas kabul edilmez; ödenek için hastanın sözleşmeli /
                yetkili sağlık hizmet sunucusundan Medula e-İstirahat alması gerekir. İşverenin özel muayenehane
                belgesini kabul edip etmeyeceği işyeri uygulamasına bağlıdır.
              </section>
            )}

            <div className="no-print" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              {hastaId ? (
                <a href={`/doktor-tools/enabiz?hastaId=${encodeURIComponent(hastaId)}&tur=rapor`} style={{ ...toolsPrimaryBtn(false), textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  e-Nabız masası
                </a>
              ) : null}
              <button
                type="button"
                onClick={() => window.print()}
                style={toolsPrimaryBtn(false)}
              >
                Yazdır
              </button>
              <button
                type="button"
                disabled={pdfIndiriliyor}
                onClick={async () => {
                  setPdfIndiriliyor(true)
                  setError('')
                  try {
                    const token = await getAccessTokenAsync()
                    const res = await fetch('/api/doktor/araclar/sgk-rapor/pdf', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ hastaId, raporTipiId: draftTip.id, rapor, sure }),
                    })
                    if (!res.ok) {
                      const d = await res.json().catch(() => ({}))
                      setError(String((d as { error?: string }).error || 'PDF indirilemedi.'))
                      return
                    }
                    const blob = await res.blob()
                    const a = document.createElement('a')
                    a.href = URL.createObjectURL(blob)
                    a.download = `${draftTip.id}-rapor.pdf`
                    a.click()
                    URL.revokeObjectURL(a.href)
                  } catch {
                    setError('PDF indirilemedi. Tekrar deneyin.')
                  } finally {
                    setPdfIndiriliyor(false)
                  }
                }}
                style={{ ...toolsPrimaryBtn(pdfIndiriliyor), background: '#6D4C2B' }}
              >
                {pdfIndiriliyor ? 'Hazırlanıyor…' : '⬇ PDF indir'}
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

        {cocukBrans === true && (
          <CocukHastaRaporlariBolumu hastaId={hastaId} hastaLabel={hastaLabel} onError={setError} />
        )}

        {cocukBrans === true && (
          <CozgerTakipBolumu hastaId={hastaId} hastaLabel={hastaLabel} onError={setError} />
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

/**
 * NOTYA-HASTA-RAPORLARI-UNIFIED-01 — Çocuk Hasta Raporları (Pediatri / Çocuk Cerrahisi only).
 * Reuses the hasta already selected above (same Araçlar → Hasta Raporları screen, spec: "Do not
 * create a separate top-level section"); generates from that patient's most recent muayene,
 * stores the PDF in the Kasa linked to it, and gives the doctor İndir/Yazdır for the result.
 */
function CocukHastaRaporlariBolumu({
  hastaId,
  hastaLabel,
  onError,
}: {
  hastaId: string
  hastaLabel: string
  onError: (m: string) => void
}) {
  const [tipId, setTipId] = useState<CocukRaporTipiId>('istirahat')
  const tip = useMemo(() => cocukRaporTipiById(tipId) || COCUK_RAPOR_TIPLERI[0], [tipId])
  const bugun = new Date().toISOString().slice(0, 10)
  const [baslangic, setBaslangic] = useState(bugun)
  const [gun, setGun] = useState(tip.gunVarsayilan)
  const [tarih, setTarih] = useState(bugun)
  const [gerekce, setGerekce] = useState('')
  const [loading, setLoading] = useState(false)
  const [sonuc, setSonuc] = useState<{
    documentId: string
    belgeNo: string
    tarih: string
    klinikMetin: string
    bitisTarihi: string | null
  } | null>(null)
  const [indiriliyor, setIndiriliyor] = useState<'indir' | 'yazdir' | null>(null)

  const indirYaDaYazdir = async (mod: 'indir' | 'yazdir') => {
    if (!sonuc) return
    setIndiriliyor(mod)
    try {
      const token = await getAccessTokenAsync()
      const res = await fetch(`/api/doktor/documents/${sonuc.documentId}/download${mod === 'indir' ? '?download=1' : ''}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) { onError('Belge açılamadı.'); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      if (mod === 'indir') {
        const a = document.createElement('a')
        a.href = url
        a.download = `${tip.id}-rapor.pdf`
        a.click()
      } else {
        window.open(url, '_blank')
      }
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
    } catch {
      onError('Belge açılamadı.')
    } finally {
      setIndiriliyor(null)
    }
  }

  return (
    <div style={{ ...toolsCard, marginTop: 20 }} className="no-print">
      <div style={{ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 14, color: '#6d6055', marginBottom: 4 }}>
        Hasta Raporları
      </div>
      <h2 style={{ margin: '0 0 4px', fontSize: 20, color: CHROME_RENK.ink, fontWeight: 650 }}>Çocuk Hasta Raporları</h2>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: CHROME_RENK.muted, lineHeight: 1.5 }}>
        İstirahat, Spor Yapabilir, Kreşe Başlayabilir ve Okul raporları — hastanın en son muayenesinden üretilir ve o
        muayeneye bağlı olarak Kasa’da saklanır.
      </p>

      <label style={toolsLabel}>Rapor Tipi</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {COCUK_RAPOR_TIPLERI.map((t) => (
          <label
            key={t.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 12,
              border: `1px solid ${tipId === t.id ? CHROME_RENK.pine + '88' : CHROME_RENK.border}`,
              background: tipId === t.id ? '#E4F3F1' : '#FFFFFF',
              cursor: 'pointer',
            }}
          >
            <input
              type="radio"
              name="cocukRaporTipi"
              value={t.id}
              checked={tipId === t.id}
              onChange={() => { setTipId(t.id); setGun(t.gunVarsayilan); setSonuc(null) }}
              style={{ marginTop: 3, accentColor: CHROME_RENK.pine, flexShrink: 0 }}
            />
            <span>
              <span style={{ display: 'block', color: CHROME_RENK.ink, fontSize: 14, fontWeight: 650 }}>{t.label}</span>
              <span style={{ display: 'block', marginTop: 4, color: CHROME_RENK.muted, fontSize: 12, lineHeight: 1.4 }}>{t.aciklama}</span>
            </span>
          </label>
        ))}
      </div>

      {!hastaId ? (
        <div style={{ fontSize: 13, color: CHROME_RENK.muted, marginBottom: 14 }}>
          Önce yukarıdan bir hasta seçin.
        </div>
      ) : (
        <div style={{ fontSize: 13, color: CHROME_RENK.muted, marginBottom: 14 }}>
          Hasta: <strong style={{ color: CHROME_RENK.ink }}>{hastaLabel || '—'}</strong>
        </div>
      )}

      {tip.gunAyarlanabilir ? (
        <>
          <label style={toolsLabel}>Başlangıç Tarihi</label>
          <input
            type="date"
            value={baslangic}
            onChange={(e) => setBaslangic(e.target.value)}
            style={{ ...toolsInput, marginBottom: 14 }}
          />
          <label style={toolsLabel}>İstirahat Süresi (Gün)</label>
          <input
            type="number"
            min={tip.gunMin}
            max={tip.gunMax}
            value={gun}
            onChange={(e) => setGun(parseInt(e.target.value || String(tip.gunVarsayilan), 10))}
            style={{ ...toolsInput, marginBottom: 6 }}
          />
          <div style={{ fontSize: 12, color: CHROME_RENK.muted, marginBottom: 14 }}>
            Bitiş tarihi: {istirahatBitisTarihi(baslangic, gun)} ({tip.gunMin}–{tip.gunMax} gün aralığında)
          </div>
        </>
      ) : (
        <>
          <label style={toolsLabel}>Karar Tarihi</label>
          <input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} style={{ ...toolsInput, marginBottom: 14 }} />
        </>
      )}

      <label style={toolsLabel}>Hekim Gerekçesi / Ek Not (opsiyonel)</label>
      <textarea
        value={gerekce}
        onChange={(e) => setGerekce(e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder="Kararın raporda aynen yer alacak ek açıklaması…"
        style={{ ...toolsInput, width: '100%', boxSizing: 'border-box', minHeight: 72, resize: 'vertical', marginBottom: 14 }}
      />

      <button
        type="button"
        disabled={loading || !hastaId}
        onClick={async () => {
          setLoading(true)
          onError('')
          setSonuc(null)
          try {
            const token = await getAccessTokenAsync()
            const res = await fetch('/api/doktor/araclar/cocuk-rapor', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                hastaId,
                raporTipiId: tip.id,
                baslangicTarihi: tip.gunAyarlanabilir ? baslangic : undefined,
                gunSayisi: tip.gunAyarlanabilir ? gun : undefined,
                tarih: tip.gunAyarlanabilir ? undefined : tarih,
                hekimGerekcesi: gerekce,
              }),
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) {
              onError(String((data as { error?: string }).error || 'Rapor oluşturulamadı.'))
              return
            }
            setSonuc(data as typeof sonuc & object)
          } catch {
            onError('Sunucu hatası. Tekrar deneyin.')
          } finally {
            setLoading(false)
          }
        }}
        style={toolsPrimaryBtn(loading || !hastaId)}
      >
        {loading ? 'Oluşturuluyor...' : 'Oluştur'}
      </button>

      {sonuc && (
        <div style={{ marginTop: 18, padding: 16, background: '#FFFFFF', border: '1px solid #E5DFD0', borderRadius: 12 }}>
          <div style={{ fontSize: 12, color: CHROME_RENK.muted, marginBottom: 8 }}>
            Rapor tarihi: {sonuc.tarih} · Belge No: {sonuc.belgeNo}
          </div>
          <div style={{ fontSize: 14, color: CHROME_RENK.ink, whiteSpace: 'pre-wrap', lineHeight: 1.6, marginBottom: 14 }}>
            {sonuc.klinikMetin}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" disabled={indiriliyor !== null} onClick={() => void indirYaDaYazdir('indir')} style={{ ...toolsPrimaryBtn(indiriliyor !== null), background: '#6D4C2B' }}>
              {indiriliyor === 'indir' ? 'Hazırlanıyor…' : '⬇ PDF indir'}
            </button>
            <button type="button" disabled={indiriliyor !== null} onClick={() => void indirYaDaYazdir('yazdir')} style={toolsPrimaryBtn(indiriliyor !== null)}>
              {indiriliyor === 'yazdir' ? 'Hazırlanıyor…' : 'Yazdır'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

type CozgerTakipKaydi = {
  durum: CozgerDurum
  kurum_adi: string | null
  basvuru_tarihi: string | null
  heyet_tarihi: string | null
  sonuc_duzeyi: CozgerDuzey | null
  sonuc_tarihi: string | null
  gecerlilik_tipi: CozgerGecerlilikTipi | null
  gecerlilik_bitis_tarihi: string | null
  rapor_no: string | null
  not_metni: string | null
}

/**
 * NOTYA-COZGER-TAKIP-01 — ÇÖZGER sürecine takip (Pediatri / Çocuk Cerrahisi only, Çocuk Hasta
 * Raporları ile AYNI ekran — brief: "do not create a separate top-level section"). Notya resmi
 * ÇÖZGER raporu ÜRETMEZ; bu bölüm sadece bu hekimin kendi hastasının süreç durumunu takip eder ve
 * aileye verilecek bir yönlendirme notu üretir (COZGER_UYARI_METNI her zaman görünür).
 */
function CozgerTakipBolumu({
  hastaId,
  hastaLabel,
  onError,
}: {
  hastaId: string
  hastaLabel: string
  onError: (m: string) => void
}) {
  const [takip, setTakip] = useState<CozgerTakipKaydi | null>(null)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [kaydediliyor, setKaydediliyor] = useState(false)
  const [pdfIndiriliyor, setPdfIndiriliyor] = useState(false)
  const [kurumAdiTaslak, setKurumAdiTaslak] = useState('')
  const [basvuruTarihiTaslak, setBasvuruTarihiTaslak] = useState(new Date().toISOString().slice(0, 10))

  const yukle = async (id: string) => {
    setYukleniyor(true)
    try {
      const token = await getAccessTokenAsync()
      const r = await fetch(`/api/doktor/araclar/cozger-takip?hastaId=${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { onError(String(j.error || 'ÇÖZGER takip kaydı alınamadı.')); return }
      setTakip((j as { takip: CozgerTakipKaydi | null }).takip || null)
    } catch {
      onError('Sunucu hatası. Tekrar deneyin.')
    } finally {
      setYukleniyor(false)
    }
  }

  useEffect(() => {
    setTakip(null)
    if (hastaId) void yukle(hastaId)
  }, [hastaId])

  const basvuruBaslat = async () => {
    if (!hastaId) { onError('Lütfen hasta seçin.'); return }
    setKaydediliyor(true)
    onError('')
    try {
      const token = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/araclar/cozger-takip', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ hastaId, kurumAdi: kurumAdiTaslak, basvuruTarihi: basvuruTarihiTaslak }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { onError(String(j.error || 'Takip başlatılamadı.')); return }
      setTakip((j as { takip: CozgerTakipKaydi }).takip)
    } catch {
      onError('Sunucu hatası. Tekrar deneyin.')
    } finally {
      setKaydediliyor(false)
    }
  }

  const alanGuncelle = async (alanlar: Record<string, unknown>) => {
    if (!hastaId) return
    setKaydediliyor(true)
    onError('')
    try {
      const token = await getAccessTokenAsync()
      const r = await fetch('/api/doktor/araclar/cozger-takip', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ hastaId, ...alanlar }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { onError(String(j.error || 'Güncellenemedi.')); return }
      setTakip((j as { takip: CozgerTakipKaydi }).takip)
    } catch {
      onError('Sunucu hatası. Tekrar deneyin.')
    } finally {
      setKaydediliyor(false)
    }
  }

  const notuIndir = async () => {
    if (!hastaId) return
    setPdfIndiriliyor(true)
    onError('')
    try {
      const token = await getAccessTokenAsync()
      const res = await fetch('/api/doktor/araclar/cozger-takip/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ hastaId }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        onError(String((d as { error?: string }).error || 'Not indirilemedi.'))
        return
      }
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'cozger-yonlendirme-notu.pdf'
      a.click()
      URL.revokeObjectURL(a.href)
    } catch {
      onError('Not indirilemedi. Tekrar deneyin.')
    } finally {
      setPdfIndiriliyor(false)
    }
  }

  const yenilemeUyarisi =
    !!takip && cozgerYenilemeUyarisiGerekliMi(takip.gecerlilik_tipi, takip.gecerlilik_bitis_tarihi)

  return (
    <div style={{ ...toolsCard, marginTop: 20 }} className="no-print">
      <div style={{ fontFamily: CHROME_FONT.serif, fontStyle: 'italic', fontSize: 14, color: '#6d6055', marginBottom: 4 }}>
        Hasta Raporları
      </div>
      <h2 style={{ margin: '0 0 4px', fontSize: 20, color: CHROME_RENK.ink, fontWeight: 650 }}>ÇÖZGER Takip</h2>
      <div style={{ ...toolsErrorBox, background: '#FFF7E6', borderColor: '#D9B35C', color: CHROME_RENK.ink, marginBottom: 14, fontSize: 12.5, lineHeight: 1.5 }}>
        {COZGER_UYARI_METNI}
      </div>

      {!hastaId ? (
        <div style={{ fontSize: 13, color: CHROME_RENK.muted, marginBottom: 14 }}>
          Önce yukarıdan bir hasta seçin.
        </div>
      ) : (
        <div style={{ fontSize: 13, color: CHROME_RENK.muted, marginBottom: 14 }}>
          Hasta: <strong style={{ color: CHROME_RENK.ink }}>{hastaLabel || '—'}</strong>
        </div>
      )}

      {hastaId && yukleniyor && (
        <div style={{ fontSize: 13, color: CHROME_RENK.muted }}>Yükleniyor…</div>
      )}

      {hastaId && !yukleniyor && !takip && (
        <>
          <label style={toolsLabel}>Yönlendirilen Kurum (opsiyonel)</label>
          <input
            type="text"
            value={kurumAdiTaslak}
            onChange={(e) => setKurumAdiTaslak(e.target.value)}
            placeholder="Örn. … Devlet Hastanesi Çocuk Sağlık Kurulu"
            style={{ ...toolsInput, marginBottom: 14 }}
          />
          <label style={toolsLabel}>Başvuru Tarihi</label>
          <input
            type="date"
            value={basvuruTarihiTaslak}
            onChange={(e) => setBasvuruTarihiTaslak(e.target.value)}
            style={{ ...toolsInput, marginBottom: 14 }}
          />
          <button type="button" disabled={kaydediliyor} onClick={() => void basvuruBaslat()} style={toolsPrimaryBtn(kaydediliyor)}>
            {kaydediliyor ? 'Başlatılıyor…' : 'Takibi Başlat'}
          </button>
        </>
      )}

      {hastaId && !yukleniyor && takip && (
        <>
          {yenilemeUyarisi && (
            <div style={{ ...toolsErrorBox, background: '#FDEAEA', borderColor: '#D96C6C', color: '#7A2E2E', marginBottom: 14, fontSize: 12.5 }}>
              Geçerlilik süresi dolmuş veya 60 gün içinde doluyor — yenileme başvurusu için aileyi bilgilendirin.
            </div>
          )}

          <label style={toolsLabel}>Süreç Durumu</label>
          <select
            value={takip.durum}
            onChange={(e) => void alanGuncelle({ durum: e.target.value })}
            disabled={kaydediliyor}
            style={{ ...toolsInput, marginBottom: 14 }}
          >
            {COZGER_DURUMLARI.map((d) => (
              <option key={d.id} value={d.id}>{d.etiket}</option>
            ))}
          </select>

          <label style={toolsLabel}>Yönlendirilen Kurum</label>
          <input
            type="text"
            defaultValue={takip.kurum_adi || ''}
            onBlur={(e) => void alanGuncelle({ kurumAdi: e.target.value })}
            placeholder="Örn. … Devlet Hastanesi Çocuk Sağlık Kurulu"
            style={{ ...toolsInput, marginBottom: 14 }}
          />

          <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={toolsLabel}>Başvuru Tarihi</label>
              <input
                type="date"
                defaultValue={takip.basvuru_tarihi || ''}
                onBlur={(e) => void alanGuncelle({ basvuruTarihi: e.target.value })}
                style={{ ...toolsInput, width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={toolsLabel}>Heyet Tarihi</label>
              <input
                type="date"
                defaultValue={takip.heyet_tarihi || ''}
                onBlur={(e) => void alanGuncelle({ heyetTarihi: e.target.value })}
                style={{ ...toolsInput, width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <label style={toolsLabel}>Sonuç Düzeyi (oran YAZILMAZ — madde 8/f)</label>
          <select
            value={takip.sonuc_duzeyi || ''}
            onChange={(e) => void alanGuncelle({ sonucDuzeyi: e.target.value })}
            disabled={kaydediliyor}
            style={{ ...toolsInput, marginBottom: 14 }}
          >
            <option value="">— Henüz sonuçlanmadı —</option>
            {COZGER_DUZEYLERI.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {takip.sonuc_duzeyi && (
            <>
              <label style={toolsLabel}>Sonuç Tarihi</label>
              <input
                type="date"
                defaultValue={takip.sonuc_tarihi || ''}
                onBlur={(e) => void alanGuncelle({ sonucTarihi: e.target.value })}
                style={{ ...toolsInput, marginBottom: 14 }}
              />

              <label style={toolsLabel}>Rapor No (sistem numarası — madde 8/ğ)</label>
              <input
                type="text"
                defaultValue={takip.rapor_no || ''}
                onBlur={(e) => void alanGuncelle({ raporNo: e.target.value })}
                style={{ ...toolsInput, marginBottom: 14 }}
              />

              <label style={toolsLabel}>Geçerlilik</label>
              <select
                value={takip.gecerlilik_tipi || ''}
                onChange={(e) => void alanGuncelle({ gecerlilikTipi: e.target.value })}
                disabled={kaydediliyor}
                style={{ ...toolsInput, marginBottom: 14 }}
              >
                <option value="">— Belirtilmedi —</option>
                {COZGER_GECERLILIK_TIPLERI.map((t) => (
                  <option key={t} value={t}>{t === 'sureli' ? 'Süreli' : 'Sürekli'}</option>
                ))}
              </select>

              {takip.gecerlilik_tipi === 'sureli' && (
                <>
                  <label style={toolsLabel}>Geçerlilik Bitiş Tarihi</label>
                  <input
                    type="date"
                    defaultValue={takip.gecerlilik_bitis_tarihi || ''}
                    onBlur={(e) => void alanGuncelle({ gecerlilikBitisTarihi: e.target.value })}
                    style={{ ...toolsInput, marginBottom: 14 }}
                  />
                </>
              )}
            </>
          )}

          <label style={toolsLabel}>Not (opsiyonel)</label>
          <textarea
            defaultValue={takip.not_metni || ''}
            onBlur={(e) => void alanGuncelle({ notMetni: e.target.value })}
            rows={3}
            maxLength={2000}
            style={{ ...toolsInput, width: '100%', boxSizing: 'border-box', minHeight: 72, resize: 'vertical', marginBottom: 14 }}
          />

          <button type="button" disabled={pdfIndiriliyor} onClick={() => void notuIndir()} style={{ ...toolsPrimaryBtn(pdfIndiriliyor), background: '#6D4C2B' }}>
            {pdfIndiriliyor ? 'Hazırlanıyor…' : '⬇ Aileye Yönlendirme Notu (PDF)'}
          </button>
        </>
      )}
    </div>
  )
}
