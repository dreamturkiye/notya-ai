
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"

export default async function Root() {
  try {
    const cookieStore = await cookies()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    // Try to get auth cookie — if present, go to dashboard
    const authCookie = cookieStore.getAll().find(c => c.name.includes("auth-token") || c.name.includes("sb-"))
    if (authCookie) {
      redirect("/dashboard")
    }
  } catch {}
  redirect("/home")
}
