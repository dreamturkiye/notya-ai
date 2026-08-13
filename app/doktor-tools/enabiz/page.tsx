'use client'

import DoktorNav from '@/components/doktor/DoktorNav'
import { toolsCard, toolsPrimaryBtn, toolsShell } from '@/lib/doktor/toolsUi'
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
    content: 'nabiz.saglik.gov.tr/kurumsal adresine gidin. TC Kimlik No ve kurumsal şifreniz ile giriş yapın.',
    tip: 'İlk girişte şifreyi değiştirin. 2FA açıksa SMS doğrulaması gerekir.',
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
  const link = 'https://nabiz.saglik.gov.tr/kurumsal'

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
          e-Nabız Kurumsal Erişim Rehberi
        </h1>
        <p style={{ marginTop: 8, color: '#94A3B8', fontSize: 14, lineHeight: 1.5 }}>
          Türk doktorları için adım adım hasta kayıtlarına erişim kılavuzu
        </p>

        <div
          style={{
            ...toolsCard,
            marginTop: 16,
            background: 'rgba(15,155,142,0.14)',
            border: '1px solid rgba(15,155,142,0.4)',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6, color: '#99F6E4' }}>Hızlı Erişim</div>
          <div style={{ fontSize: 13, color: '#E2E8F0', wordBreak: 'break-all', marginBottom: 12 }}>{link}</div>
          <button type="button" onClick={() => void copyLink()} style={{ ...toolsPrimaryBtn(false), maxWidth: 220 }}>
            {copied ? 'Kopyalandı' : 'Linki Kopyala'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 18 }}>
          {steps.map((step) => (
            <div key={step.number} style={toolsCard}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: '#0F9B8E',
                    color: '#041016',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {step.number}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h3 style={{ margin: '0 0 8px', fontSize: 17, color: '#FFFFFF' }}>{step.title}</h3>
                  <p style={{ margin: '0 0 12px', fontSize: 14, color: '#CBD5E1', lineHeight: 1.55 }}>{step.content}</p>
                  <div
                    style={{
                      background: 'rgba(59,130,246,0.12)',
                      border: '1px solid rgba(96,165,250,0.35)',
                      borderRadius: 12,
                      padding: '10px 12px',
                      color: '#BFDBFE',
                      fontSize: 13,
                      lineHeight: 1.45,
                    }}
                  >
                    İpucu: {step.tip}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 18,
            borderRadius: 16,
            padding: 16,
            background: 'rgba(245,158,11,0.12)',
            border: '1px solid rgba(251,191,36,0.4)',
          }}
        >
          <div style={{ fontWeight: 700, color: '#FDE68A', marginBottom: 6 }}>KVKK ve Yasal Uyarı</div>
          <p style={{ margin: 0, fontSize: 13, color: '#FDE68A', lineHeight: 1.5 }}>
            Hasta verilerine erişim yalnızca tıbbi gereklilik ve hasta rızası ile mümkündür. Yetkisiz erişim cezai
            yaptırımlara tabidir. Tüm işlemler loglanır.
          </p>
        </div>
      </div>
    </div>
  )
}
