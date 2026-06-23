import{NextRequest,NextResponse}from 'next/server'
import{createClient}from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import{buildDilekceSystemPrompt}from '@/lib/avukat/dilekceEngine'
const getSupabase=()=>createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!)
const getAnthropic=()=>new Anthropic({apiKey:process.env.ANTHROPIC_API_KEY!})
export async function POST(req:NextRequest){
  try{
    const auth=req.headers.get('Authorization')?.replace('Bearer ','')
    if(!auth) return NextResponse.json({error:'Unauthorized'},{status:401})
    const sb=getSupabase()
    const{data:{user},error:ae}=await sb.auth.getUser(auth)
    if(ae||!user) return NextResponse.json({error:'Unauthorized'},{status:401})
    const{data:u}=await sb.from('users').select('full_name,baro_no').eq('id',user.id).single()
    const{turId,muvekkil_bilgileri,ek_bilgiler}=await req.json()
    if(!turId) return NextResponse.json({error:'turId required'},{status:400})
    const avukat={name:u?.full_name||'Avukat',baro:u?.baro_no||''}
    const system=buildDilekceSystemPrompt(turId,avukat,muvekkil_bilgileri||null)
    const ai=getAnthropic()
    const resp=await ai.messages.create({model:'claude-sonnet-4-20250514',max_tokens:2000,system,messages:[{role:'user',content:ek_bilgiler||'Dilekceyi olustur.'}]})
    const raw=resp.content[0].type==='text'?resp.content[0].text:''
    let parsed:{dilekce_metni:string;eksik_bilgiler:string[];uyarilar:string[]}
    try{parsed=JSON.parse(raw.replace(/```json|```/g,'').trim())}
    catch{parsed={dilekce_metni:raw,eksik_bilgiler:[],uyarilar:[]}}
    await sb.from('dilekce_kuyrugu').insert({avukat_id:user.id,dilekce_turu:turId,icerik:parsed.dilekce_metni,durum:'taslak'})
    return NextResponse.json({success:true,data:parsed})
  }catch(e:unknown){return NextResponse.json({error:e instanceof Error?e.message:'Hata'},{status:500})}
}
