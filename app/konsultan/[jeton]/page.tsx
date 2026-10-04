'use client'
/**
 * KONSULTASYONLAR-01 — konsültan portalı. Hesap / şifre / kayıt yok.
 * Jeton HMAC veya hash; UI components/konsultan/KonsultanPortal.
 */
import { useParams } from 'next/navigation'
import KonsultanPortal from '@/components/konsultan/KonsultanPortal'

export default function KonsultanPortalSayfasi() {
  const params = useParams()
  const jeton = String(params?.jeton || '')
  return <KonsultanPortal jeton={jeton} />
}
