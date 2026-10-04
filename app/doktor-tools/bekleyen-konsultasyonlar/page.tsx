/**
 * KONSULTASYONLAR-01 — eski kapı. next.config.mjs 308 ile /doktor-tools/konsultasyonlar'a gider.
 * Bu dosya derin link / statik derleme için kalır; istemci de aynı yöne yönlendirir.
 */
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function Page() {
  redirect('/doktor-tools/konsultasyonlar')
}
