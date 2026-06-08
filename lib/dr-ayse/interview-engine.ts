import { buildPatientSystemPrompt } from './persona'
import { groqChat, type GroqMessage } from './groq'

export type InterviewBranch = {
  id: string
  keywords: string[]
  questions: string[]
}

export const INTERVIEW_BRANCHES: InterviewBranch[] = [
  {
    id: 'pain',
    keywords: ['ağrı', 'agrı', 'sızı', 'acı', 'zonklama'],
    questions: [
      'Ağrınız ne zaman başladı?',
      'Ağrı sürekli mi yoksa aralıklı mı?',
      'Ağrıyı 1-10 arası puanlasanız kaç verirdiniz?',
      'Ağrıyı başka bir yere yayılıyor mu?',
      'Ağrıyı hafifleten veya artıran bir şey var mı?',
    ],
  },
  {
    id: 'fever',
    keywords: ['ateş', 'titreme', 'terleme', 'halsizlik'],
    questions: [
      'Ateşiniz kaç derece ölçtünüz?',
      'Ne kadar süredir ateşiniz var?',
      'Titreme veya terleme eşlik ediyor mu?',
      'Son günlerde kilo kaybı fark ettiniz mi?',
    ],
  },
  {
    id: 'respiratory',
    keywords: ['öksürük', 'nefes', 'balgam', 'boğaz', 'burun'],
    questions: [
      'Öksürüğünüz kuru mu yoksa balgamlı mı?',
      'Nefes darlığı yaşıyor musunuz?',
      'Göğsünüzde ağrı veya baskı hissediyor musunuz?',
      'Son zamanlarda seyahat ettiniz mi?',
    ],
  },
  {
    id: 'gi',
    keywords: ['mide', 'bulantı', 'kusma', 'ishal', 'kabız', 'karın'],
    questions: [
      'Karın ağrınız nerede, nasıl tarif edersiniz?',
      'Bulantı veya kusma var mı?',
      'Son dışkılama alışkanlığınızda değişiklik oldu mu?',
      'Son yemeklerinizde farklı bir şey yediniz mi?',
    ],
  },
  {
    id: 'general',
    keywords: [],
    questions: [
      'Şikayetiniz ne zaman başladı?',
      'Daha önce benzer bir şikayet yaşadınız mı?',
      'Kullandığınız düzenli ilaçlar var mı?',
      'Bilinen bir alerjiniz var mı?',
      'Son zamanlarda stresli bir dönem geçirdiniz mi?',
    ],
  },
]

export type TranscriptEntry = {
  role: 'patient' | 'dr_ayse'
  text: string
  timestamp: string
}

export function detectBranch(chiefComplaint: string): InterviewBranch {
  const lower = chiefComplaint.toLowerCase()
  for (const branch of INTERVIEW_BRANCHES) {
    if (branch.id === 'general') continue
    if (branch.keywords.some((kw) => lower.includes(kw))) {
      return branch
    }
  }
  return INTERVIEW_BRANCHES.find((b) => b.id === 'general')!
}

export function buildInterviewPrompt(
  patientName: string,
  chiefComplaint: string,
  transcript: TranscriptEntry[],
  branch: InterviewBranch
): GroqMessage[] {
  const system = buildPatientSystemPrompt(patientName, chiefComplaint)
  const history: GroqMessage[] = transcript.map((t) => ({
    role: t.role === 'patient' ? 'user' : 'assistant',
    content: t.text,
  }))

  const remainingHints = branch.questions
    .filter((q) => !transcript.some((t) => t.text.includes(q.slice(0, 15))))
    .slice(0, 3)
    .join('; ')

  const contextNote =
    remainingHints.length > 0
      ? `\nHenüz sorulmamış konular: ${remainingHints}`
      : ''

  return [
    { role: 'system', content: system + contextNote },
    ...history,
  ]
}

export function nextQuestionFallback(
  branch: InterviewBranch,
  exchangeCount: number
): string {
  const idx = Math.min(exchangeCount, branch.questions.length - 1)
  return branch.questions[idx] || 'Başka eklemek istediğiniz bir şikayet var mı?'
}

export function shouldCompleteInterview(
  transcript: TranscriptEntry[],
  minExchanges = 8,
  maxExchanges = 15
): boolean {
  const patientTurns = transcript.filter((t) => t.role === 'patient').length
  if (patientTurns >= maxExchanges) return true
  if (patientTurns >= minExchanges) {
    const lastPatient = [...transcript].reverse().find((t) => t.role === 'patient')
    if (lastPatient?.text.match(/hayır|yok|teşekkür|tamam|başka/i)) return true
  }
  return false
}

export async function generateDrAyseReply(
  patientName: string,
  chiefComplaint: string,
  transcript: TranscriptEntry[]
): Promise<string> {
  const branch = detectBranch(chiefComplaint)
  const messages = buildInterviewPrompt(patientName, chiefComplaint, transcript, branch)

  try {
    const reply = await groqChat(messages, { temperature: 0.5, maxTokens: 256 })
    return reply.trim()
  } catch {
    const exchangeCount = transcript.filter((t) => t.role === 'patient').length
    return nextQuestionFallback(branch, exchangeCount)
  }
}

export function getWelcomeMessage(
  patientName: string,
  chiefComplaint?: string | null,
  appointmentTime?: string | null
): string {
  const first = patientName.trim().split(/\s+/)[0]
  const when = appointmentTime
    ? new Date(appointmentTime).toLocaleString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
    : null
  const schedule = when ? `${when} tarihli randevunuz için ` : ''
  const complaint = chiefComplaint
    ? `Kayıtlarımızda başvuru nedeniniz "${chiefComplaint}" görünüyor. `
    : ''
  return `Merhaba ${first} Bey/Hanım, ben Dr. Ayşe. Dr. Gökhan Hocam'ın ${schedule}birkaç dakikalık ön görüşmesini yapacağız. ${complaint}Bu bilgileri Hocam ile paylaşacağım. Hazırsanız başlayalım — bugün sizi en çok rahatsız eden şikayetiniz nedir?`
}
