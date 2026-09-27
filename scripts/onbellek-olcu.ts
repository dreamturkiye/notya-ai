/**
 * Sıcak yol önek ölçüsü. Duvar saati SLO'su iddia etmez; cache_read ai_token_kullanim'dadır.
 * Hasta verisi yazılmaz. Çalıştır: npx tsx scripts/onbellek-olcu.ts
 */
import { PERSONAS, buildSystemPromptParcalari } from '@/lib/asistan/personaEngine'
import { asistanOnbellekBloklari } from '@/lib/asistan/onbellekBloklari'

const persona = Object.values(PERSONAS)[0]
const a = buildSystemPromptParcalari(persona, null, null, { firstName: 'Ayla', lastName: 'Deniz' })
const b = buildSystemPromptParcalari(persona, null, null, { firstName: 'Kerim', lastName: 'Yilmaz' })
const blok = asistanOnbellekBloklari({
  global: a.global,
  hekim: a.hekim,
  kararli: 'DOSYA',
  kuyruk: 'KANIT',
})
const paylasilan = a.global === b.global
console.log(JSON.stringify({
  persona: persona.id,
  globalKarakter: a.global.length,
  hekimKarakter: a.hekim.length,
  globalIkiHekimAyni: paylasilan,
  onbellekKirilmasi: blok.filter((x) => x.onbellek).length,
  kuyrukOnbelleksiz: blok.some((x) => !x.onbellek && x.metin === 'KANIT'),
  not: 'Yüzde iddiası yok. Ses tur 2+ için cache_read / input oranına bak.',
}))
