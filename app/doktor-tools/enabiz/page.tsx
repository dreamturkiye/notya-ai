'use client'

import DoktorNav from '@/components/doktor/DoktorNav'
import { toolsCard, toolsPrimaryBtn, toolsShell } from '@/lib/doktor/toolsUi'
import { ENABIZ_ARTEFAKTLAR } from '@/lib/enabiz/paket'
import { useState } from 'react'

const steps = [
  {
    number: 1,
    title: 'e-Nabız Nedir?',
    content:
      "Sağlık Bakanlığı'nın resmi elektronik sağlık kayıt sistemidir. Muayene, reçete, tahlil, görüntüleme ve yatış geçmişine erişim sağlar.",
    tip: 'Tüm veriler SGK ve sağlık kurumlarından otomatik çekilir; güncel hasta bilgisi için en güvenilir kaynaktır.',
  },
  {
    number: 2,
    title: 'Kurumsal Şifre Alma',
    content:
      "SGK İl Müdürlüğü'ne yazılı başvuruda bulunun. Kurum kodu ve e-Nabız kurumsal şifresi talep edin. Süre genellikle 1–3 iş günüdür.",
    tip: 'Başvuruda kurum vergi numarası ve doktor sicil belgenizi hazır bulundurun.',
  },
  {
    number: 3,
    title: 'Sisteme Giriş',
    content:
      'www.enabiz.gov.tr adresine gidin. e-Devlet, e-İmza veya kurumsal kimlik bilgileriniz ile giriş yapın.',
    tip: 'İlk kez kullanıyorsanız e-Devlet üzerinden e-Nabız hesabını etkinleştirin. 2FA açıksa SMS doğrulaması gerekir.',
  },
  {
    number: 4,
    title: 'Hasta Verilerine Erişim',
    content: 'Ana ekranda TC Kimlik No ile hasta arayın. Kaydı seçerek sağlık geçmişini görüntüleyin.',
    tip: 'Sonuçlar anlık gelir; listede son muayene tarihi görünür.',
  },
  {
    number: 5,
    title: 'Görüntüleme İzinleri',
    content:
      'Hastanın açık rızası olmadan kayıtlara erişilemez. KVKK kapsamında bilgilendirme ve onay zorunludur.',
    tip: 'Sistemde hasta onayı dijital kaydedilir; tarih/saat loglanır.',
  },
  {
    number: 6,
    title: 'Mobil Uygulama',
    content: "Resmi 'e-Nabız Doktor' uygulamasını iOS/Android'e indirin. Kurumsal giriş ile hızlı erişim sağlayın.",
    tip: 'Acil durumlarda hasta özetine mobil üzerinden saniyeler içinde ulaşabilirsiniz.',
  },
]

export default function ENabizGuidePage() {
  const [copied, setCopied] = useState(false)
  const link = 'https://www.enabiz.gov.tr/'

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div style={toolsShell}>
      <DoktorNav />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px 48px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#14B8A6', letterSpacing: 1.2, marginBottom: 8 }}>
          ARAÇLAR
        </div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.25 }}>
          e-Nabız format hazırlığı
        </h1>
        <p style={{ marginTop: 8, color: '#94A3B8', fontSize: 14, lineHeight: 1.5 }}>
          Canlı e-Nabız / USS bağlantısı yok. Reçete, rapor, epikriz, USG ve gebe/e-Doğum çıktıları yine de
          doğru kanal formatında üretilir (FHIR R4, Medula XML, USS form JSON) — kopyala / indir hazır.
        </p>

        <div style={{ ...toolsCard, marginTop: 20, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#14B8A6', marginBottom: 10 }}>
            Notya’da üretilen e-Nabız artefaktları
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, color: '#E2E8F0', fontSize: 13, lineHeight: 1.55 }}>
            {ENABIZ_ARTEFAKTLAR.map((a) => (
              <li key={a.tur} style={{ marginBottom: 8 }}>
                <span style={{ color: '#2DD4BF', fontWeight: 600 }}>{a.ad}</span>
                <span style={{ color: '#94A3B8' }}> · {a.kanal}</span>
                <div style={{ color: '#64748B', fontSize: 12 }}>{a.ornek}</div>
              </li>
            ))}
          </ul>
          <p style={{ margin: '12px 0 0', color: '#FBBF24', fontSize: 12, lineHeight: 1.45 }}>
            live_write her zaman false. P4 (USS üretici kaydı + hekim şifresi) gelene kadar hekim MBYS/Medula/e-Nabız
            ekranına kendisi aktarır.
          </p>
        </div>

        <div
          style={{
            ...toolsCard,
            marginTop: 16,
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ color: '#FFFFFF', fontWeight: 600, fontSize: 14 }}>Resmi e-Nabız portalı</div>
            <div style={{ color: '#64748B', fontSize: 12, marginTop: 4 }}>{link}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={copyLink} style={toolsPrimaryBtn(false)}>
              {copied ? '✓ Kopyalandı' : 'Bağlantıyı kopyala'}
            </button>
            <a href={link} target="_blank" rel="noreferrer" style={{ ...toolsPrimaryBtn(false), textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
              Aç
            </a>
          </div>
        </div>

        <h2 style={{ margin: '28px 0 12px', fontSize: 16, color: '#E2E8F0' }}>Kurumsal erişim rehberi</h2>
        {steps.map((s) => (
          <div key={s.number} style={{ ...toolsCard, marginBottom: 10, padding: 14 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: 'rgba(20,184,166,0.15)',
                  color: '#14B8A6',
                  fontWeight: 800,
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {s.number}
              </div>
              <div>
                <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 14 }}>{s.title}</div>
                <div style={{ color: '#94A3B8', fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>{s.content}</div>
                <div style={{ color: '#64748B', fontSize: 12, marginTop: 6 }}>İpucu: {s.tip}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
