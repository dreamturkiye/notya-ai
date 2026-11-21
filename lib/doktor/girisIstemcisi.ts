/**
 * NOTYA-OTURUM-01 (Kaan, 2026-11-20) — the Supabase client the doctor / Notya Klinik / invitation / signup pages use
 * to SIGN IN (or sign up). It never stores the session and never runs the SDK's auto-refresh: the page hands the
 * returned session to `saveDoctorSession()` and clientAuth is its only refresher from then on.
 * (A default client here kept ticking after the client-side navigation to the dashboard and spent the refresh
 * token behind clientAuth's back — the "logged out after one hour" bug.)
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const URL_VARSAYILAN = 'https://anjayzospuurymjmmtim.supabase.co'
const ANON_VARSAYILAN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuamF5em9zcHV1cnltam1tdGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NDc5NzIsImV4cCI6MjA5NjIyMzk3Mn0.J4qRde2QJxxErFIWsO6Zb2TPN8GEIFXloLRpdac4GxE'

export function girisIstemcisi(): SupabaseClient {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || URL_VARSAYILAN, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ANON_VARSAYILAN, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) },
  })
}
