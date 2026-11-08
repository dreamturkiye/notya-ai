// Per-role depth extraction for one country build (run with NOTYA_COUNTRY=<cc> from the worktree root).
import { writeFileSync } from 'node:fs'
import { AKTIF_ARAYUZ } from '@/countries/active/arayuz'
import { AKTIF_KLINIK } from '@/countries/active/klinik'
import { hesabinAraclari, paketinTanimi } from '@/lib/ulke/araclar/paket'
import { icerikAnahtari } from '@/lib/ulke/arayuz/rolIcerigi'
import { existsSync } from 'node:fs'
import { ulkePaketi } from '@/lib/ulke/ulke'
import { araclarMetni } from '@/lib/ulke/arayuz'

const cc = process.env.NOTYA_COUNTRY!
const a: any = AKTIF_ARAYUZ
const k: any = AKTIF_KLINIK
const roller: any[] = a?.roller ?? []
const dil = (a?.roller?.[0] && Object.keys(a.roller[0].ad)[0]) || 'en'
const sab = a?.notSablonlari
const form = k?.hastaFormu
const canli = k?.canliAsistan
const ar = a?.araclar
const out: any[] = []
const kok = process.cwd()
const varMi = (p: string) => existsSync(`${kok}/${p}`)
const sekme = varMi('lib/ulke/araclar/uzmanlikSekmesi.ts') ? await import('@/lib/ulke/araclar/uzmanlikSekmesi' as any) : null
const demo = varMi('lib/ulke/portal/demo.ts') ? await import('@/lib/ulke/portal/demo' as any) : null
const bolumMod = varMi('lib/ulke/portal/bolum.ts') ? await import('@/lib/ulke/portal/bolum' as any) : null
let uzCanli: any = null
if (cc === 'uz' && varMi('countries/uz/klinik/canli.ts')) uzCanli = (await import('@/countries/uz/klinik/canli' as any)).UZ_CANLI_ASISTAN
const portal: any = (ulkePaketi() as any).uygulama?.portal
let sekmeSoz = false
try { sekmeSoz = Boolean((araclarMetni(dil) as any)?.kayit?.uzmanlikSekmesi) } catch { sekmeSoz = false }
for (const r of roller) {
  const rol = r.anahtar
  const tk = sab ? icerikAnahtari(roller, rol, sab.rolAlanlari) : null
  const fk = form ? icerikAnahtari(roller, rol, form.roller) : null
  const alanlar = tk ? sab.rolAlanlari[tk] : []
  const sorular = fk ? (form.roller[fk]?.bolumler ?? [form.roller[fk]]).flatMap((b: any) => b?.sorular ?? []) : []
  const t = hesabinAraclari(ar, rol)
  const rolAraclari = t.rol.map((x: any) => ({ k: x.tanim.anahtar, tur: x.tanim.tur, kaynak: x.tanim.kaynak, baglanti: !!x.paket.baglanti, roller: x.paket.roller?.length, yazdir: !!x.tanim.yazdirilir }))
  let kb: string | null = null
  try { kb = canli?.kaynakBlogu ? canli.kaynakBlogu(rol) : null } catch { kb = null }
  let kim: any = null
  try { kim = a.asistan?.(rol, dil) } catch { kim = null }
  let talimat = ''
  try { talimat = k?.notTalimati?.(dil, rol) ?? '' } catch { talimat = '' }
  out.push({
    cc, rol, taraf: r.taraf, ad: r.ad?.[dil] ?? Object.values(r.ad ?? {})[0], gibi: r.gibi ?? null,
    sablon: tk === rol ? 'own' : tk ? `gibi:${tk}` : 'general', alanSayisi: alanlar.length,
    form: fk === rol ? 'own' : fk ? `gibi:${fk}` : 'none', soruSayisi: sorular.length,
    temelArac: t.temel.length, rolArac: rolAraclari.length,
    rolAracOzel: rolAraclari.filter((x) => (x.roller ?? 99) <= 3).length,
    rolAracKaynakli: rolAraclari.filter((x) => x.kaynak).length,
    araclar: rolAraclari,
    kaynakBlogu: kb ? kb.length : 0, kaynakIlk: kb ? kb.split('\n').slice(0, 8).join(' | ').slice(0, 400) : '',
    kimlikKaynak: kim?.kaynaklar ? (kim.kaynaklar.yetki?.length ?? 0) + (kim.kaynaklar.kitaplar?.length ?? 0) : 0,
    talimatUzunluk: talimat.length,
    soapKilidi: /SOAP|QULFI|ҚУЛФИ|ЗАМОК ЗАПИСИ/.test(talimat),
    portalBolum: bolumMod?.bolumVarMi ? bolumMod.bolumVarMi(portal, rol) : Boolean(portal?.bolumler?.[rol]),
    portalDemo: demo ? Boolean(demo.portalDemoIcerigi({ rol, dil, hekimAdi: 'x', rolAdi: 'x', bugun: '2026-11-08' })?.bolum) : false,
    sekmeSoz,
    sekmeArac: sekme ? sekme.uzmanlikAraclari(ar, rol).length : 0,
    kbHazir: uzCanli ? (uzCanli.kaynakBlogu(rol) ?? '').length : 0,
    kbHazirIlk: uzCanli ? (uzCanli.kaynakBlogu(rol) ?? '').slice(0, 2000) : '',
  })
}
writeFileSync(process.argv[2], JSON.stringify({ cc, dil, canli: !!canli, portal: Object.keys(a?.portalMetinleri ?? {}), out }, null, 1))
console.log(cc, roller.length, 'roles; canli', !!canli)
