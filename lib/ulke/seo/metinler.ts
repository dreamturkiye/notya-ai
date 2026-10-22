/**
 * AU-SEO-01 — page titles and descriptions, per country, in that country's English. No pricing, no regulator or
 * product-approval claim, no "compliant". Countries without an entry (uz) keep their pack's own text.
 */
export type SeoSayfa = 'home' | 'forClinics' | 'catalogue' | 'privacy' | 'terms' | 'cookies' | 'data-request' | 'accessibility' | 'medical' | 'security' | 'refund' | 'copyright'

type Ulke = { kim: string; dilAdi: string; yer: string; vergiFatura: string }

const ULKELER: Record<string, Ulke> = {
  au: { kim: 'Australian doctors and clinics', dilAdi: 'Australian English', yer: 'Australia', vergiFatura: 'invoices with GST fields' },
  us: { kim: 'US doctors and clinics', dilAdi: 'American English', yer: 'the United States', vergiFatura: 'invoices' },
  gb: { kim: 'UK doctors and clinics', dilAdi: 'British English', yer: 'the United Kingdom', vergiFatura: 'invoices' },
  ca: { kim: 'Canadian doctors and clinics', dilAdi: 'Canadian English', yer: 'Canada', vergiFatura: 'invoices' },
  nz: { kim: 'New Zealand doctors and clinics', dilAdi: 'New Zealand English', yer: 'New Zealand', vergiFatura: 'invoices' },
}

export type SeoMetni = { baslik?: string; aciklama: string }

export function seoMetni(kod: string, s: SeoSayfa): SeoMetni | null {
  const u = ULKELER[kod]
  if (!u) return null
  switch (s) {
    case 'home':
      return { baslik: `Notya | AI medical scribe for ${u.kim}`, aciklama: `Records the consult with consent and drafts the note in ${u.dilAdi} for you to correct and approve. Calendar, patient pages and invoices too.` }
    case 'forClinics':
      return { baslik: `Notya for clinics | AI scribe and practice workflow`, aciklama: `Clinic accounts for ${u.yer}: shared calendar, pre-visit patient forms, visit notes drafted for each doctor to approve, and ${u.vergiFatura}.` }
    case 'catalogue':
      return { aciklama: `The clinical checklists and calculators in Notya, each with its source. Draft content, under clinical review.` }
    case 'privacy':
      return { aciklama: `How Notya handles personal and health information for ${u.kim}. Draft policy, under review.` }
    case 'terms':
      return { aciklama: `The draft terms for using Notya, the AI visit-note assistant for ${u.kim}. Under review.` }
    case 'cookies':
      return { aciklama: `Which cookies and similar storage Notya uses, and why. Draft, under review.` }
    case 'data-request':
      return { aciklama: `How to ask Notya for access to, or correction of, your personal information. Draft process, under review.` }
    case 'accessibility':
      return { aciklama: `Notya's accessibility statement and how to report a barrier. Draft, under review.` }
    case 'medical':
      return { aciklama: `Notya drafts notes; the doctor reads, corrects and approves every one. What Notya is and is not meant to do. Draft, under review.` }
    case 'security':
      return { aciklama: `How Notya protects data and how to report a security problem. Draft, under review.` }
    case 'refund':
      return { aciklama: `Notya's draft cancellation and refund terms. Under review.` }
    case 'copyright':
      return { aciklama: `Copyright and content notice for Notya, including sources of clinical reference material. Draft, under review.` }
  }
}
