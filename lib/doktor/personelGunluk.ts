/**
 * MOBIL-PERSONEL-01 — append-only log of staff invites, role changes, (de)activations and removals
 * (personel_rol_gecmisi, migration 172). Best effort: the log must never block the action it records,
 * and it does not exist before migration 172 is applied (the insert then simply fails and is ignored).
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export type PersonelOlayi = 'davet' | 'rol_degisti' | 'aktiflik_degisti' | 'kaldirildi'

export async function personelGunlugeYaz(
  supabase: SupabaseClient,
  g: {
    doktorId: string
    personelId: string
    email?: string | null
    olay: PersonelOlayi
    eskiRol?: string | null
    yeniRol?: string | null
    eskiAktif?: boolean | null
    yeniAktif?: boolean | null
    yapanId: string
  },
): Promise<void> {
  try {
    await supabase.from('personel_rol_gecmisi').insert({
      doktor_id: g.doktorId,
      personel_id: g.personelId,
      personel_email: g.email ?? null,
      olay: g.olay,
      eski_rol: g.eskiRol ?? null,
      yeni_rol: g.yeniRol ?? null,
      eski_aktif: g.eskiAktif ?? null,
      yeni_aktif: g.yeniAktif ?? null,
      yapan_id: g.yapanId,
      kaynak: 'api',
    })
  } catch {
    /* table missing (172 not applied yet) or transient — never block the action */
  }
}
