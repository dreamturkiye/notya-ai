/**
 * WHATSAPP-API-01 — the consent the doctor gives before connecting WhatsApp (shown as a required checkbox in the signup
 * flow; the timestamp and this version are stored on the connection row and in the audit log). Pure, client-safe.
 * Bump KVKK_ONAY_SURUM whenever the wording or the list of processors changes: a new version means a new consent.
 *
 * Who processes what: the doctor is the data controller for his patients' messages; Notya is the processor; Meta
 * Platforms (WhatsApp Business Platform) is a sub-processor that carries and stores the messages on its own
 * infrastructure outside Türkiye (KVKK m.9). The public wording lives in app/kvkk/page.tsx.
 */
export const KVKK_ONAY_SURUM = '2026-10-16'

export const KVKK_ONAY_METNI =
  'WhatsApp Business’ı bağlayarak hastalarıma gönderilen ve hastalarımdan gelen mesajların, Notya aracılığıyla Meta Platforms’un ' +
  'WhatsApp Business altyapısında (yurt dışı sunucular dâhil) işlenmesini ve Notya’nın bu mesajları şifreli olarak kayıt altında tutmasını ' +
  'kabul ediyorum. Hastalarımın iletişim izinlerinin bende bulunduğunu ve mesajlarda tanı ya da hastalık adı yer almayacağını biliyorum.'

export const KVKK_ONAY_KISA = 'Meta, bu mesajlar için alt işleyicidir (KVKK m.9). Ayrıntı: notya.io/kvkk'
