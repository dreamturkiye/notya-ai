
"use client"
import { useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.push("/dashboard")
      else router.push("/giris")
    })
  }, [])

  return (
    <div style={{minHeight:"100vh",background:"#0A1628",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui"}}>
      <div style={{textAlign:"center",color:"white"}}>
        <div style={{fontSize:"32px",fontWeight:"600",marginBottom:"8px"}}>
          <span style={{color:"#2563EB"}}>Notya</span> AI
        </div>
        <div style={{fontSize:"14px",opacity:.6}}>Yükleniyor...</div>
      </div>
    </div>
  )
}
