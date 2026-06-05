
"use client"
import { useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

export default function Root() {
  const router = useRouter()
  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    supabase.auth.getUser().then(({ data: { user } }) => {
      router.replace(user ? "/dashboard" : "/home")
    })
  }, [])
  return (
    <div style={{minHeight:"100vh",background:"#060910",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{fontSize:"24px",fontFamily:"Georgia,serif",color:"rgba(255,255,255,.3)",letterSpacing:"0.15em"}}>
        NOTYA<span style={{color:"#2563EB"}}>.</span>AI
      </div>
    </div>
  )
}
