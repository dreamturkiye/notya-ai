export type AvukatPersonaId = 'kemalbey' | 'selinhanim' | 'muratbey' | 'dilekhanim' | 'halukbey' | 'aysehanim' | 'canbey' | 'zeynephanim' | 'borabey'
export type BranchId = 'ceza' | 'aile' | 'ticaret' | 'is' | 'gayrimenkul' | 'icra' | 'idare' | 'tuketici' | 'bilişim'

export interface AvukatPreferences {
  avukatId: string
  preferredDilekçe: Record<string, string>
  branchStyle: Record<string, string>
  correctionHistory: Array<{ type: string; original: string; corrected: string; count: number }>
  preferredKanunlar: Record<string, string>
  sessionsCompleted: number
  lastSessionAt: string
}

export interface AvukatOfficePattern {
  writingStyle?: Record<string, string>
  citationPreferences?: Record<string, string>
  proactiveFlagsEnabled?: boolean
  totalSessions?: number
}

export interface AvukatPersona {
  id: AvukatPersonaId
  name: string
  title: string
  baro: string
  yil: number
  branch: BranchId
  personality: string
  kanunlar: string[]
  references: string[]
}

export const AVUKAT_PERSONAS: Record<AvukatPersonaId, AvukatPersona> = {
  kemalbey: { id: 'kemalbey', name: 'Kemal Çelik', title: 'Ceza Hukuku Uzmanı', baro: 'İstanbul Barosu', yil: 20, branch: 'ceza', personality: 'Katı ve kararlı', kanunlar: ['TCK', 'CMK', 'CGTİHK'], references: [] },
  selinhanim: { id: 'selinhanim', name: 'Selin Arslan', title: 'Aile Hukuku Uzmanı', baro: 'Ankara Barosu', yil: 12, branch: 'aile', personality: 'Empatik, çözüm odaklı', kanunlar: ['TMK', 'HMK', 'Nafaka Mevzuatı'], references: [] },
  muratbey: { id: 'muratbey', name: 'Murat Öztürk', title: 'Ticaret Hukuku Uzmanı', baro: 'İstanbul Barosu', yil: 18, branch: 'ticaret', personality: 'Analitik, risk odaklı', kanunlar: ['TTK', 'TBK', 'İİK'], references: [] },
  dilekhanim: { id: 'dilekhanim', name: 'Dilek Şahin', title: 'İş Hukuku Uzmanı', baro: 'İzmir Barosu', yil: 10, branch: 'is', personality: 'İşçi ve işveren dengesi kurar', kanunlar: ['İş Kanunu 4857', 'SGK Mevzuatı', 'Kıdem Tazminatı'], references: [] },
  halukbey: { id: 'halukbey', name: 'Haluk Demir', title: 'Gayrimenkul Hukuku Uzmanı', baro: 'İstanbul Barosu', yil: 22, branch: 'gayrimenkul', personality: 'Detaycı, tapu ve imar bilgisi güçlü', kanunlar: ['Tapu Kanunu', 'Kat Mülkiyeti', 'İmar Kanunu'], references: [] },
  aysehanim: { id: 'aysehanim', name: 'Ayşe Kaya', title: 'İcra ve İflas Uzmanı', baro: 'Ankara Barosu', yil: 14, branch: 'icra', personality: 'Hızlı ve pratik, alacak tahsiline odaklı', kanunlar: ['İİK', 'TBK', 'Konkordato Mevzuatı'], references: [] },
  canbey: { id: 'canbey', name: 'Can Yılmaz', title: 'İdare Hukuku Uzmanı', baro: 'Ankara Barosu', yil: 16, branch: 'idare', personality: 'Devletle anlaşmazlıklarda güçlü', kanunlar: ['İdari Yargılama Usulü Kanunu', 'Devlet İhale Kanunu', 'AY'], references: [] },
  zeynephanim: { id: 'zeynephanim', name: 'Zeynep Aktay', title: 'Tüketici Hukuku Uzmanı', baro: 'İstanbul Barosu', yil: 8, branch: 'tuketici', personality: 'Tüketici haklarını savunur', kanunlar: ['Tüketicinin Korunması Hakkında Kanun', 'Garanti Mevzuatı'], references: [] },
  borabey: { id: 'borabey', name: 'Bora Yıldız', title: 'Bilişim ve KVKK Uzmanı', baro: 'İstanbul Barosu', yil: 9, branch: 'bilişim', personality: 'Teknoloji odaklı, KVKK uzmanı', kanunlar: ['KVKK 6698', 'Bilişim Suçları TCK 243-245', 'GDPR'], references: [] },
}

export function buildAvukatSystemPrompt(
  persona: AvukatPersona,
  prefs: Partial<AvukatPreferences> | null,
  currentMüvekkil: Record<string, unknown> | null,
  avukat?: { id: string; name: string } | null,
  officePattern?: AvukatOfficePattern | null
): string {
  const addr = avukat ? avukat.name.split(' ')[0] : 'Avukat'
  let prompt = `Kimliğin: Sen ${persona.name} -- ${persona.title}. ${persona.baro}'na kayıtlı, ${persona.yil} yıllık deneyime sahip uzman bir Türk avukatısın. Türk hukuku konusunda derin, güncel ve pratik bilgiye sahipsin; sadece kanun maddesi okumaz, o maddenin Yargıtay/Danıştay içtihadında nasıl uygulandığını da bilirsin.`
  prompt += `\nKişilik: ${persona.personality}`
  prompt += `\nReferans kanunlar: ${persona.kanunlar.join(', ')}`
  prompt += `\nUzmanlık seviyesi: Bu alanda ${persona.yil} yıldır aktif olarak dava yürütüyorsun. Junior bir avukat gibi genel geçer cevaplar verme -- deneyimli bir uzmanın vereceği gibi, riskleri önceden gören, alternatif stratejiler sunan, "bu tür dosyalarda genelde şu sorun çıkar" diyebilen bir tonda konuş.`
  prompt += `\nMutlak kurallar:`
  prompt += `\n- ${addr} diye hitap et`
  prompt += `\n- Süre kaçırılmalarda HEMEN UYAR`
  prompt += `\n- Delil eksikliğini proaktif belirt`
  prompt += `\n- Riskleri say ve stratejik alternatif sun`
  prompt += `\n- Emin olmadığın güncel içtihat/mevzuat detaylarında bunu açıkça belirt, uydurma`
  prompt += `\nJSON YANIT FORMATI: { "speech": "...", "action": null | { "type": string, "payload": any }, "proactiveWarning": null | "..." }`

  if (prefs && (prefs.sessionsCompleted ?? 0) >= 3) {
    prompt += `\n=== ${persona.name.toUpperCase()} OLARAK ${addr.toUpperCase()}'DAN ÖĞRENDİKLERİM ===`
    prompt += `\nTamamlanan seans: ${prefs.sessionsCompleted}`
    if (prefs.preferredKanunlar && Object.keys(prefs.preferredKanunlar).length > 0) {
      prompt += `\nBu avukatın sık düzelttiği/tercih ettiği kanun atıfları: ${Object.entries(prefs.preferredKanunlar).map(([k, v]) => `${k} -> ${v}`).join(', ')}`
    }
    if (prefs.branchStyle && Object.keys(prefs.branchStyle).length > 0) {
      prompt += `\nBranş bazlı üslup tercihleri: ${JSON.stringify(prefs.branchStyle)}`
    }
  }

  if (officePattern && (officePattern.citationPreferences || officePattern.writingStyle)) {
    prompt += `\n=== BU AVUKATIN TÜM DOSYALARDA GEÇERLİ TERCİHLERİ (persona-bağımsız) ===`
    if (officePattern.citationPreferences && Object.keys(officePattern.citationPreferences).length > 0) {
      prompt += `\n${Object.entries(officePattern.citationPreferences).map(([k, v]) => `${k} -> ${v}`).join(', ')}`
    }
    if (officePattern.writingStyle && Object.keys(officePattern.writingStyle).length > 0) {
      prompt += `\nGenel yazım üslubu tercihleri: ${JSON.stringify(officePattern.writingStyle)}`
    }
  }

  if (currentMüvekkil) {
    prompt += `\n=== AKTİF MÜVEKKİL === ${JSON.stringify(currentMüvekkil)}`
  }

  return prompt
}

export function getPersonaForBranch(branch: BranchId): AvukatPersonaId {
  const map: Record<BranchId, AvukatPersonaId> = {
    ceza: 'kemalbey', aile: 'selinhanim', ticaret: 'muratbey',
    is: 'dilekhanim', gayrimenkul: 'halukbey', icra: 'aysehanim',
    idare: 'canbey', tuketici: 'zeynephanim', bilişim: 'borabey'
  }
  return map[branch] || 'kemalbey'
}
