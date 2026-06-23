// app/api/notes/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { AccountingNoteV2 } from '@/lib/ai/noteGenerator'

const getSupabase = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function getUser(req: NextRequest) {
  const h = req.headers.get('Authorization')
  if (!h?.startsWith('Bearer ')) return null
  const { data: { user } } = await getSupabase().auth.getUser(h.split(' ')[1])
  return user
}

export async function POST(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })

  const { note_data, müşavir_name, müşteri_name, tarih } = await req.json() as {
    note_data: AccountingNoteV2; müşavir_name: string; müşteri_name: string; tarih?: string
  }

  if (!note_data || !müşavir_name || !müşteri_name) {
    return NextResponse.json({ success: false, error: 'Eksik parametreler' }, { status: 400 })
  }

  const today = tarih || new Date().toLocaleDateString('tr-TR', {timeZone: 'Europe/Istanbul', day:'2-digit', month:'2-digit', year:'numeric' })
  const dosyaNo = today.replace(/\./g, '') + '-' + müşteri_name.substring(0,4).toUpperCase()

  const riskColor = note_data.vergi_risk_skoru <= 3 ? '#16A34A' : note_data.vergi_risk_skoru <= 6 ? '#D97706' : '#DC2626'

  const severityColor = (s: string) => s === 'yuksek' ? '#DC2626' : s === 'orta' ? '#D97706' : '#16A34A'

  const html = `<!DOCTYPE html>
<html lang="tr"><head><meta charset="UTF-8">
<title>Danismanlik Notu - ${müşteri_name}</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1a1a1a; font-size: 14px; line-height: 1.6; }
  .header { border-bottom: 3px solid #1e3a5f; padding-bottom: 20px; margin-bottom: 30px; }
  .doc-title { font-size: 24px; font-weight: bold; color: #1e3a5f; letter-spacing: 2px; text-align: center; }
  .müşavir-info { text-align: center; margin-top: 8px; color: #444; }
  .meta-row { display: flex; justify-content: space-between; margin-top: 12px; font-size: 12px; color: #555; }
  h2 { font-size: 13px; font-weight: bold; color: #1e3a5f; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-top: 24px; }
  .risk-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-weight: bold; color: white; font-size: 18px; }
  .pill { display: inline-block; background: #EFF6FF; border: 1px solid #BFDBFE; color: #1D4ED8; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin: 2px; }
  ul { padding-left: 20px; margin: 8px 0; }
  li { margin: 4px 0; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 13px; }
  th { background: #1e3a5f; color: white; padding: 6px 8px; text-align: left; font-size: 12px; }
  td { padding: 5px 8px; border-bottom: 1px solid #eee; }
  .alert { background: #FEF2F2; border-left: 4px solid #DC2626; padding: 8px 12px; margin: 6px 0; font-size: 13px; }
  .footer { margin-top: 40px; border-top: 1px solid #ccc; padding-top: 20px; font-size: 11px; color: #666; }
  .sig-line { border-bottom: 1px solid #333; width: 200px; margin-top: 40px; }
  .no-print { position: fixed; top: 20px; right: 20px; background: #2563EB; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; }
  @media print { .no-print { display: none; } body { padding: 1.5cm 2cm; } }
</style></head><body>
<button class="no-print" onclick="window.print()">Yazdir / PDF Kaydet</button>
<div class="header">
  <div class="doc-title">DANISMANLIK NOTU</div>
  <div class="müşavir-info">${müşavir_name} &nbsp;|&nbsp; SMMM</div>
  <div class="meta-row"><span>Dosya No: ${dosyaNo}</span><span>Tarih: ${today}</span><span>Müşteri: ${müşteri_name}</span></div>
</div>
<h2>Konu ve Görüşme Ozeti</h2>
<p><strong>${note_data.konu}</strong></p><p>${note_data.müşteri_ozeti}</p>
<p><em>Görüşme Turu: ${note_data.görüşme_turu}</em></p>
<h2>Yasal Dayanak</h2><ol>
${(note_data.yasal_dayanak||[]).map((y: {kanun:string;madde:string;aciklama:string}) => 
  '<li><strong>' + y.kanun + ' ' + y.madde + '</strong> - ' + y.aciklama + '</li>').join('')}
</ol>
<h2>Tespitler</h2><ul>
${(note_data.tespitler||[]).map((t: string) => '<li>' + t + '</li>').join('')}
</ul>
<h2>Tavsiyeler</h2><ul>
${(note_data.tavsiyeler||[]).map((t: string) => '<li>&#x2713; ' + t + '</li>').join('')}
</ul>
<h2>Riskler</h2>
<table><tr><th>Risk</th><th>Oneri</th><th>Seviye</th></tr>
${(note_data.riskler||[]).map((r: {risk:string;oneri:string;seviye:string}) => 
  '<tr><td>' + r.risk + '</td><td>' + r.oneri + '</td><td style="color:' + severityColor(r.seviye) + ';font-weight:bold">' + r.seviye.toUpperCase() + '</td></tr>').join('')}
</table>
<h2>Eylem Maddeleri</h2>
<table><tr><th>Gorev</th><th>Sorumlu</th><th>Son Tarih</th><th>Oncelik</th></tr>
${(note_data.eylem_maddeleri||[]).map((e: {gorev:string;sorumlu:string;son_tarih?:string;oncelik:string}) => 
  '<tr><td>' + e.gorev + '</td><td>' + e.sorumlu + '</td><td>' + (e.son_tarih||'-') + '</td><td>' + e.oncelik + '</td></tr>').join('')}
</table>
<h2>Beyan Tarihleri</h2><ul>
${(note_data.beyan_tarihleri||[]).map((b: {beyan:string;tarih:string}) => '<li>&#128197; ' + b.beyan + ' - ' + b.tarih + '</li>').join('')}
</ul>
<h2>Vergi Risk Degerlendirmesi</h2>
<p><span class="risk-badge" style="background:${riskColor}">${note_data.vergi_risk_skoru}/10</span></p>
<p>${note_data.vergi_risk_aciklama}</p>
<h2>Onemli Uyarilar</h2>
${(note_data.onemli_uyarilar||[]).map((u: string) => '<div class="alert">&#9888; ' + u + '</div>').join('')}
<div class="footer">
  <p>Bu danismanlik notu <strong>${müşavir_name}</strong> (SMMM) tarafindan Notya AI destegiyle hazırlanmistir.</p>
  <p>Mesleki sorumluluk sigortasi kapsamindadir. Tarih: ${today}</p>
  <div class="sig-line"></div><p style="margin-top:4px;font-size:11px">${müşavir_name} - SMMM Imzasi</p>
</div></body></html>`

  return NextResponse.json({ success: true, html })
}
