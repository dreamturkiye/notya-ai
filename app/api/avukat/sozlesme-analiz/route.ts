import{NextRequest,NextResponse}from 'next/server'
import{createClient}from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import{buildSozlesmeAnalysisPrompt}from '@/lib/avukat/sozlesmeEngine'
import{aiCagir}from '@/lib/ai/cagir'
const getSupabase=()=>createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!, { global: { fetch: (u, o) => fetch(u, { ...o, cache: 'no-store' }) } })
const getAnthropic=()=>new Anthropic({apiKey:process.env.ANTHROPIC_API_KEY!})
export async function POST(req:NextRequest){
  try{
    const auth=req.headers.get('Authorization')?.replace('Bearer ','')
    if(!auth) return NextResponse.json({error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.'},{status:401})
    const sb=getSupabase()
    const{data:{user},error:ae}=await sb.auth.getUser(auth)
    if(ae||!user) return NextResponse.json({error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.'},{status:401})
    const{sozlesmeMetni,sozlesmeTuru}=await req.json()
    if(!sozlesmeMetni) return NextResponse.json({error:'sozlesmeMetni required'},{status:400})
    if(sozlesmeMetni.length>50000) return NextResponse.json({error:'Metin cok uzun (max 50000 karakter)'},{status:400})
    const system=buildSozlesmeAnalysisPrompt(sozlesmeMetni,sozlesmeTuru||'diger')
    const ai=getAnthropic()
    const resp=await aiCagir({istemci:ai,gorev:'uzman-analiz',doctorId:user.id,system,messages:[{role:'user',content:'Sozlesmeyi analiz et ve JSON formatinda yanit ver.'}]})
    const raw=resp.content[0].type==='text'?resp.content[0].text:''
    let parsed
    try{parsed=JSON.parse(raw.replace(/```json|```/g,'').trim())}
    catch{parsed={ozet:raw,riskler:[],eksik_maddeler:[],genel_puan:50,taraflar:[],anahtar_kosullar:{},tbk_uyumsuzluklar:[],oneri_degisiklikler:[]}}
    return NextResponse.json({success:true,data:parsed})
  }catch(e:unknown){return NextResponse.json({error:e instanceof Error?e.message:'Hata'},{status:500})}
}
