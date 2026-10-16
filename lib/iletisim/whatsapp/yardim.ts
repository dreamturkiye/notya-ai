/**
 * WHATSAPP-API-01 — the small guided assistant on the WhatsApp connection card ("Meta hesabı nedir?", "Numaramı nasıl
 * doğrularım?" …). Pure and client-safe: the FAQ and the keyword matcher run in the browser with no network.
 *
 * Free questions the FAQ does not cover go to the server route, which uses the approved LLM gateway (task 'sohbet',
 * lib/ai/cagir.ts — no model name here) with a fixed system prompt: setup help only, never a medical answer, never patient
 * data. If the model is unreachable the doctor still gets the closest FAQ answer plus the support route.
 */
import { katla } from './niyet'

export interface SssMaddesi {
  id: string
  soru: string
  cevap: string
  /** Folded (katla) keywords; the entry with the most hits wins. */
  anahtar: string[]
}

export const DESTEK_NOTU = 'Hâlâ takıldıysanız Notya destek hattına yazın; bağlantı sırasında hesabınızda hiçbir şey silinmez.'

export const SSS: SssMaddesi[] = [
  {
    id: 'meta',
    soru: 'Meta hesabı nedir?',
    cevap:
      'Meta, Facebook ve WhatsApp’ın bağlı olduğu şirkettir. WhatsApp’ı Notya’ya bağlamak için açılan pencerede kendi Facebook hesabınızla (ya da yeni bir Meta hesabıyla) giriş yaparsınız. ' +
      'Bu hesap yalnızca bağlantıyı onaylamak içindir: profiliniz ya da sayfanız hastalarınıza görünmez, kimseye arkadaşlık isteği gitmez.',
    anahtar: ['meta', 'facebook', 'hesap', 'giris', 'hesabi'],
  },
  {
    id: 'dogrula',
    soru: 'Numaramı nasıl doğrularım?',
    cevap:
      'WhatsApp numaranızın sizin olduğunu doğrulamak için bir kod ister. Kod, numaranıza SMS ile ya da sesli arama ile gelir; gelen 6 haneli kodu açılan pencereye yazarsınız. ' +
      'WhatsApp Business uygulaması zaten bu numarada kuruluysa kodu telefonunuzdaki uygulama gösterir. Sabit hatlar kod alamadığı için kullanılamaz; cep numarası gerekir.',
    anahtar: ['dogrula', 'dogrulama', 'kod', 'sms', 'arama', 'numara', 'numarami', 'onay'],
  },
  {
    id: 'business',
    soru: 'WhatsApp Business uygulaması nedir?',
    cevap:
      'WhatsApp Business, işletmeler için ücretsiz olan WhatsApp uygulamasıdır (normal WhatsApp’ın yanındaki yeşil “B” simgeli uygulama). Numaranız ve sohbetleriniz aynen kalır. ' +
      'Notya, bu uygulamayla aynı numarayı birlikte kullanır: otomatik hatırlatmalar Notya’dan, kendi yazışmalarınız telefonunuzdaki uygulamadan gider. Normal WhatsApp kullanıyorsanız önce ücretsiz WhatsApp Business uygulamasına geçmeniz gerekir.',
    anahtar: ['business', 'uygulama', 'uygulamasi', 'whatsapp', 'ucretsiz', 'gecis', 'coexistence', 'ayni numara'],
  },
  {
    id: 'sabit',
    soru: 'Sabit hat ya da ofis numarası kullanabilir miyim?',
    cevap:
      'Hayır. Bağlantı sırasında numaraya SMS ya da sesli arama ile kod gönderilir; sabit hatlar bunu alamaz. SMS veya sesli arama alabilen bir cep numarası kullanın.',
    anahtar: ['sabit', 'hat', 'ofis', 'telefon', 'fix', 'landline'],
  },
  {
    id: 'takildim',
    soru: 'Kod gelmiyor / takıldım, ne yapmalıyım?',
    cevap:
      '1) Telefonunuzun sinyal aldığından emin olun ve 1-2 dakika bekleyin. 2) Pencerede “Sesli arama ile gönder” seçeneği varsa onu deneyin. 3) Pencereyi kapatıp “WhatsApp’ı bağla”ya yeniden dokunun; her deneme sıfırdan başlar. ' +
      '4) Hâlâ olmuyorsa telefonunuzda WhatsApp Business’ı açıp güncel olduğundan emin olun. Hiçbir adımda sohbetleriniz silinmez.',
    anahtar: ['takildim', 'gelmiyor', 'olmuyor', 'hata', 'calismiyor', 'yardim', 'sorun', 'kurtar', 'bekliyor', 'donuyor'],
  },
  {
    id: 'koptu',
    soru: 'Bağlantı koptu ya da “süresi dolmuş” diyor',
    cevap:
      '“WhatsApp’ı bağla” düğmesine yeniden dokunup aynı adımları tekrarlayın. Yeniden bağlamak hiçbir veriyi silmez: gelen yanıtlarınız ve mesaj kayıtlarınız olduğu gibi kalır.',
    anahtar: ['koptu', 'suresi', 'dolmus', 'yeniden', 'baglanti', 'kaldir', 'kesildi', 'tekrar'],
  },
  {
    id: 'ne-gider',
    soru: 'Hastalarım ne görecek?',
    cevap:
      'Mesajlar sizin kendi numaranızdan gider ve yalnızca randevu bilgisini ya da “bildiriminiz hazır” cümlesini içerir; tanı, hastalık adı ya da sonuç değeri yazmaz. ' +
      'Hasta EVET yazarsa randevusu onaylanır, İPTAL yazarsa iptal edilir ve size bildirilir; bütün yanıtlar “Gelen Yanıtlar”da görünür.',
    anahtar: ['hasta', 'hastalarim', 'gorecek', 'mesaj', 'ne gider', 'evet', 'iptal', 'yanit'],
  },
  {
    id: 'ucret',
    soru: 'Ücret var mı?',
    cevap:
      'WhatsApp Business uygulaması ücretsizdir. Notya’dan gönderilen şablon mesajlar için Meta, kendi tarifesine göre mesaj başına çok küçük bir ücret alır (Türkiye’de yaklaşık 0,0009 ABD doları; güncel tarifeyi Meta belirler). ' +
      'Klinik ve Hastane planlarında kartta kullanımınız ve tahmini tutar görünür.',
    anahtar: ['ucret', 'para', 'fiyat', 'maliyet', 'tutar', 'odeme', 'kac'],
  },
  {
    id: 'sinir',
    soru: 'Günde kaç mesaj gönderebilirim?',
    cevap:
      'Yeni bir numara günde 250 mesajla başlar; Meta, işletme doğrulaması ve iyi bir kalite puanıyla sınırı yükseltir (1.000, 10.000…). Notya Meta’nın verdiği sınırı aşmaz; dolduğunda hatırlatma, e-postanızı bağladıysanız e-postayla gider. Kartta güncel sınırınızı görürsünüz.',
    anahtar: ['sinir', 'gunde', 'limit', 'kac mesaj', 'kota', '250'],
  },
]

/** Closest FAQ entry for a free question, or null when nothing matches. */
export function sssBul(soru: string): SssMaddesi | null {
  const k = ` ${katla(soru)} `
  if (k.trim().length < 2) return null
  let en: { m: SssMaddesi; puan: number } | null = null
  for (const m of SSS) {
    let puan = 0
    for (const a of m.anahtar) if (k.includes(` ${a} `) || (a.length >= 5 && k.includes(a))) puan += a.length >= 5 ? 2 : 1
    if (puan > 0 && (!en || puan > en.puan)) en = { m, puan }
  }
  return en && en.puan >= 2 ? en.m : null
}

export const YARDIM_SISTEM =
  'Sen Notya’nın WhatsApp bağlantı yardımcısısın. Bir hekime, WhatsApp Business hesabını Notya’ya bağlarken yardım edersin. ' +
  'YALNIZCA şu konularda cevap ver: Meta hesabı, numara doğrulama (SMS/sesli arama kodu), WhatsApp Business uygulaması ve aynı numarayı birlikte kullanma, ' +
  'kurulum adımları, hata ve takılma durumları, mesaj sınırları ve ücret. Tıbbi soruya, hasta bilgisine ya da bu konular dışındakilere cevap verme; ' +
  'kibarca konuya dön. En çok 5 kısa cümle, sade Türkçe. Bilmediğin bir şeyi uydurma; “destek hattına yazın” de. ' +
  'Aşağıdaki bilgi tabanına dayan:\n\n' + SSS.map((m) => `S: ${m.soru}\nC: ${m.cevap}`).join('\n\n')

export type YardimLlm = (soru: string) => Promise<string>

export async function yardimCevabi(soru: string, llm?: YardimLlm): Promise<{ cevap: string; kaynak: 'sss' | 'yapay_zeka' | 'varsayilan' }> {
  const temiz = String(soru || '').trim().slice(0, 400)
  const sss = sssBul(temiz)
  if (sss) return { cevap: sss.cevap, kaynak: 'sss' }
  if (llm && temiz) {
    try {
      const c = (await llm(temiz)).trim()
      if (c) return { cevap: c.slice(0, 900), kaynak: 'yapay_zeka' }
    } catch { /* fall through to the safe default */ }
  }
  return { cevap: `Bu soruya hazır bir yanıtım yok. Yukarıdaki sık sorulan sorulara bakabilirsiniz. ${DESTEK_NOTU}`, kaynak: 'varsayilan' }
}

/** Server-side LLM call through the approved gateway; identifiers stripped first (KVKK m.9). */
export async function varsayilanYardimLlm(soru: string): Promise<string> {
  const { aiCagir } = await import('@/lib/ai/cagir')
  const { pseudonymize } = await import('@/lib/security/pseudonymize')
  const yanit = await aiCagir({
    gorev: 'sohbet',
    system: YARDIM_SISTEM,
    messages: [{ role: 'user', content: pseudonymize(soru.slice(0, 400)).text }],
    maxTokens: 350,
    temperature: 0.2,
    butceMs: 20_000,
  })
  return (yanit.content as Array<{ type: string; text?: string }>).filter((b) => b.type === 'text').map((b) => b.text || '').join(' ').trim()
}
