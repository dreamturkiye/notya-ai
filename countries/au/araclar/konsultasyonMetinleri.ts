/**
 * NOTYA-ULKE-ARACLAR-DENETIM-02-AU — Australia: every sentence of CONSULTATION BETWEEN DOCTORS (feature
 * `konsultasyon`), English (Australian spelling, en-AU). The tile's own name and description are beside it.
 *
 *   kod     the account's own consultation code         iste    asking, on the patient's file
 *   giden   what this doctor asked                      gelen   what this doctor was asked
 *
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * WHY THIS WAS OFF, AND WHY IT IS ON NOW. The audit of 2026-10-10 (docs/araclar-denetim/AU.md, "Still unverified,
 * and why") left this feature off because its consent sentence was never drafted — "a lawyer, not a web page" was
 * the right answer to who should write the LEGAL wording, but nobody was ever asked to draft a plain, sensible
 * sentence for a lawyer to START FROM, so the feature sat off indefinitely on a drafting gap, not a real block.
 * The owner's instruction of 2026-10-13 (NOTYA-ARACLAR-DENETIM-02) is explicit: draft a sensible sentence, switch
 * the feature on, and flag it for a lawyer's actual review before the business relies on it. That is what this
 * file does. `iste.riza` below is THAT DRAFT. It is not legal advice and HAS NOT BEEN READ BY A LAWYER
 * (`../klinik/index.ts` → `konsultasyonRizasi.hukukcuInceledi: false`). It says, in plain language: what asking a
 * colleague for a consultation means, that the patient's data (what the asking doctor chooses to share) is shared
 * WITH THAT NAMED COLLEAGUE, and the basic scope of what can be shared and for how long. CHANGE THE STAMP
 * (`konsultasyonRizasi.surum`) WHENEVER THIS SENTENCE CHANGES.
 *
 * MACHINE-WRITTEN AND UNREAD BY A NATIVE EDITOR OR A CLINICIAN OF AUSTRALIA, every line but this note. Australian
 * spelling; used AS WRITTEN. No sentence promises that the colleague is told anything beyond what this screen
 * shows, names a state system, or claims the sharing meets Australian privacy law — that is exactly the lawyer's
 * question this file defers (docs/OPEN-COMMITMENTS.md, NOTYA-ARACLAR-DENETIM-02-AU).
 * ────────────────────────────────────────────────────────────────────────────────────────────────────────────
 *
 * PLACEHOLDERS: '%' one value; '%1' and '%2' two (each key of the type says which; `lib/ulke/konsultasyon/denetim.ts`
 * checks every one is present). The consent sentence (`iste.riza`) carries none: it is ticked as it stands.
 */
import type { KonsultasyonMetni } from '@/lib/ulke/arayuz/metinTipleri'

/** The stamp of `iste.riza` below (`../klinik/index.ts`). Change this whenever the sentence's words change. */
export const AU_KONSULTASYON_RIZA_SURUMU = 'au-konsultasyon-riza-v1'

export const AU_KONSULTASYON_METNI: KonsultasyonMetni = {
  defter: {
    sekmeBekleyen: 'Waiting',
    sekmeIstem: 'Request',
    sekmeDefter: 'Contacts',
    sekmeAria: 'Consultation sections',
    aciklama: 'The colleagues you trust to consult. Add their details, edit or remove them; only you see this list.',
    ekle: 'Add a colleague',
    duzenle: 'Edit colleague',
    ad: 'Full name',
    adYer: 'e.g. Dr Sam Taylor',
    brans: 'Speciality',
    bransYer: 'e.g. ENT',
    ofisTelefon: 'Office phone',
    telefon: 'Mobile phone',
    whatsapp: 'WhatsApp',
    eposta: 'Email',
    adres: 'Address',
    not: 'Notes',
    notIpucu: 'e.g. does not work Saturdays; office 9–4 on weekdays.',
    kurumIci: 'Same practice',
    kurumIciEtiket: 'same practice',
    disarida: 'outside',
    kaydet: 'Add to contacts',
    degisiklikKaydet: 'Save changes',
    kaydediliyor: 'Saving…',
    vazgec: 'Cancel',
    duzenleniyor: 'editing',
    duzenleBtn: 'Edit',
    sil: 'Delete',
    silOnay: 'Delete this colleague from your contacts?',
    eklendi: 'Colleague added.',
    guncellendi: 'Colleague updated.',
    silindi: 'Colleague deleted.',
    bos: 'Your contacts are empty. Start with a colleague you trust, for example an ENT doctor.',
    yuklenemedi: 'Could not load your contacts. Try again.',
    kaydedilemedi: 'That could not be saved. Try again.',
    dolu: 'Your contacts are full. Delete one to add another.',
    adHata: 'Enter the colleague\'s name.',
    epostaHata: 'That email address is not valid.',
    telefonHata: 'That is not a valid phone number for this country.',
    iletisimYok: 'No contact details',
    istemBaslik: 'Ask from the patient\'s file',
    istemAciklama: 'A consultation is asked from the patient\'s file: you share only what you choose — one approved note or its summary — with a colleague who gives you their consultation code. Your contacts are your own address book to reach colleagues outside Notya.',
    hastaSec: 'Choose a patient',
    defterSayisi: 'Your contacts (%)',
  },
  kod: {
    baslik: 'My consultation code',
    aciklama: 'A colleague who wants your opinion types this code. You give it to them yourself — there is no directory of doctors, and nobody can find your account any other way.',
    yok: 'You do not have a code yet: nobody can ask you for a consultation until you make one.',
    uret: 'Make a code',
    yenile: 'New code',
    yenileUyari: 'The old code stops working immediately. Consultations already asked are not affected.',
    yenileOnay: 'Yes, make a new code',
    vazgec: 'Cancel',
    kopyala: 'Copy',
    kopyalandi: 'Copied.',
    kopyalanamadi: 'Could not copy. Select the code and copy it by hand.',
    yapilamadi: 'That could not be done. Try again.',
  },
  iste: {
    baslik: 'Ask a colleague',
    aciklama: 'Your colleague sees your question and only what you choose to share below — nothing else of this patient\'s file.',
    kodEtiketi: 'Colleague\'s consultation code',
    bul: 'Find',
    bulunamadi: 'No account with that code was found. Check the code with your colleague.',
    bulundu: 'Found: %',
    soruEtiketi: 'Your question',
    soruIpucu: 'Write the clinical question. The patient is not named to your colleague unless you name them yourself.',
    paylasimEtiketi: 'What to share with this colleague',
    secenekYok: 'Nothing beyond the question',
    secenekNot: 'One approved visit note',
    secenekOzet: 'That note\'s summary for the patient',
    notSec: 'Choose the visit',
    onayliNotYok: 'This patient has no approved note to share.',
    ozetYok: 'This visit has no summary for the patient.',
    rizaBaslik: 'Before you send this',
    riza: 'I am asking a named colleague of my own choosing for a clinical opinion on this patient\'s care. I understand that what I choose to share above — nothing, one approved visit note, or that note\'s summary for the patient — is copied and shown to that colleague, who is a doctor of this country like me. I am satisfied that sharing this is a reasonable and necessary part of this patient\'s care, and I take responsibility for that decision and for what I have chosen to share.',
    rizaGerekli: 'You must tick this before you can send the consultation.',
    soruBos: 'Write your question first.',
    cokUzun: 'Your question holds at most % characters.',
    meslektasGerekli: 'Find your colleague by their code first.',
    gonder: 'Send',
    gonderiliyor: 'Sending…',
    gonderildi: 'Sent. Your colleague can read and answer it.',
    gonderilemedi: 'That could not be sent. Try again.',
    limit: 'You have reached today\'s limit of consultations.',
    bildirimYok: 'Nothing tells your colleague that this is waiting: let them know yourself if it is urgent.',
    tumu: 'See every consultation',
  },
  giden: {
    baslik: 'Consultations you have asked',
    bos: 'You have not asked a consultation yet.',
    meslektas: 'Asked of: %',
    soru: 'Your question',
    paylasilan: 'What you shared',
    okunmadi: 'Not yet opened by your colleague.',
    okundu: 'First opened on %.',
    cevapYok: 'No answer yet.',
    cevap: 'Answered on %.',
    durumAcik: 'Open until % — your colleague can still answer.',
    durumSuresiDoldu: 'This consultation is still open, but the time to answer it has passed: your colleague can no longer read or answer it.',
    durumKapali: 'Closed on %1. Your colleague can still read it until %2.',
    kapat: 'Close this consultation',
    kapatUyari: 'Your colleague will still be able to read it for % more days, then not at all. This cannot be undone.',
    kapatOnay: 'Yes, close it',
    vazgec: 'Cancel',
    kapatildi: 'Closed.',
    yapilamadi: 'That could not be done. Try again.',
    yuklenemedi: 'Could not load your consultations. Try again.',
  },
  gelen: {
    baslik: 'Consultations you have been asked',
    aciklama: 'Only what your colleague chose to share, as a copy — nothing else of their patient\'s file is open to you.',
    bos: 'Nobody has asked you a consultation yet.',
    isteyen: 'Asked by: %',
    yeni: 'New',
    soru: 'The question',
    paylasilan: 'What was shared with you',
    paylasimYok: 'Nothing beyond the question.',
    paylasimNot: 'One visit note, from the visit of %.',
    paylasimOzet: 'That visit\'s summary for the patient, from the visit of %.',
    kopyaNotu: 'This copy was made the moment the consultation was asked: it will not change if your colleague\'s patient file changes afterwards.',
    okunabilir: 'You can read this until %.',
    kapali: 'Your colleague has closed this consultation.',
    cevapEtiketi: 'Your answer',
    cevapUyari: 'Once you send your answer it cannot be changed. You can send one answer to each consultation.',
    cevapGonder: 'Send your answer',
    cevapGonderiliyor: 'Sending…',
    cevapBos: 'Write your answer first.',
    cokUzun: 'Your answer holds at most % characters.',
    cevapGonderilemedi: 'That could not be sent. Try again.',
    cevabiniz: 'You answered on %.',
    bekleyen: '% consultation(s) waiting for your answer.',
    ac: 'Open',
  },
}
