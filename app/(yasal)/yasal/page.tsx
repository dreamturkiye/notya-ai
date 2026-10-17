import React from 'react'
import Link from 'next/link'
import { YASAL_SAYFALAR, YS, YasalKabuk } from '@/components/yasal/YasalKabuk'

export const metadata = {
  title: 'Yasal Metinler — Notya',
  description: 'Notya’nın kullanım koşulları, gizlilik ve KVKK metinleri, çerez, iade ve telif politikaları — tek sayfada.',
}

const ACIKLAMALAR: Record<string, string> = {
  '/kullanim-kosullari': 'Hesaplar, roller, beta dönemi, kabul edilebilir kullanım ve sorumluluk.',
  '/gizlilik': 'Verilerinizle ne yaptığımızın sade anlatımı.',
  '/kvkk': '6698 sayılı KVKK uyarınca resmî aydınlatma metni.',
  '/veri-isleme': 'Hekim (veri sorumlusu) — Notya (veri işleyen) ilişkisi ve alt işleyiciler.',
  '/cerez-politikasi': 'Çerezler ve yerel depolama; reklam çerezi yok.',
  '/klinik-karar-destegi': 'Ayşe karar desteğidir, tanı koymaz; klinik sorumluluk hekimdedir.',
  '/iade-ve-iptal': 'Her an iptal; ödenmiş dönem sonuna kadar hizmet; yasal haklar saklı.',
  '/telif-hakki': 'Yazılım ve marka hakları, hekimin kendi kayıtları, ihlal bildirimi.',
}

/** HUKUK-01 — yasal metinlerin merkez sayfası; Ayarlar ve altbilgiler buraya bağlanır. */
export default function YasalPage() {
  return (
    <YasalKabuk baslik="Yasal Metinler" aktifYol="/yasal">
      <p style={YS.p}>
        Notya&apos;nın yürürlükteki yasal ve politika metinleri aşağıdadır. Tümü 2026-10-17 tarihinde güncellenmiştir
        ve hukuki incelemeden geçmektedir.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
        {YASAL_SAYFALAR.map((s) => (
          <Link
            key={s.yol}
            href={s.yol}
            style={{ ...YS.box, display: 'block', textDecoration: 'none', color: 'inherit', marginBottom: 0 }}
          >
            <span style={{ display: 'block', fontSize: 15, fontWeight: 600, color: '#2f4334' }}>{s.baslik}</span>
            <span style={{ display: 'block', fontSize: 13, marginTop: 4 }}>{ACIKLAMALAR[s.yol]}</span>
          </Link>
        ))}
      </div>
    </YasalKabuk>
  )
}
