/**
 * NOTYA-FHIR-01 — FHIR R4 mapper (Hospital Integration Add-On, P1).
 * Pure function: an APPROVED Notya note (+ patient/doctor context) → one FHIR R4
 * transaction Bundle. Zero side effects; the existing Notya schema is read-only input.
 *
 * e-Nabız alignment (Kaan directive 2026-09-05): e-Nabız itself runs FHIR R4, so this
 * mapper emits R4 with Turkish national identifier/code systems — a hospital HBYS can
 * relay our bundle toward Sağlık.Net/e-Nabız without transformation, and the future
 * direct muayenehane→USS rail (P4) reuses this exact mapper.
 *
 * Turkish EMR block mapping (per integration spec):
 *   Anamnez ve Fizik Muayene ← basvuru_yakinmasi + subjektif/anamnez + objektif/fizik_muayene
 *   Tanılar (ICD-10)         ← degerlendirme/tani + icd10_codes → Condition[]
 *   İlaç / Tedavi Planı      ← plan/tedavi + recete_onerisi → CarePlan-style section + MedicationRequest(proposal)
 *   Vital bulgular           ← vitaller → Observation[] (LOINC)
 */

export interface FhirNotGirdisi {
  noteId: string
  createdAt: string // ISO
  specialty?: string | null
  basvuruYakinmasi?: string | null
  subjektif?: string | null
  objektif?: string | null
  degerlendirme?: string | null
  plan?: string | null
  anamnez?: string | null
  fizikMuayene?: string | null
  tani?: string | null
  tedavi?: string | null
  icd10?: { code?: string; kod?: string; description?: string; aciklama?: string; is_primary?: boolean; birincil?: boolean }[] | null
  vitaller?: Record<string, unknown> | null
  receteOnerisi?: { ad?: string; doz?: string; kullanim?: string; sure?: string }[] | null
  hasta: { id: string; adSoyad: string; tcKimlik?: string | null; dogumTarihi?: string | null; cinsiyet?: string | null; mrn?: string | null }
  doktor: { id: string; adSoyad: string; brans?: string | null }
  kurumAd: string
}

// Turkish national + international system URIs
const SIS = {
  tc: 'https://saglik.gov.tr/fhir/sid/tc-kimlik-no',
  mrn: 'urn:oid:2.16.840.1.113883.2.30.1', // kurum MRN namespace placeholder — per-kurum override in P3
  icd10: 'http://hl7.org/fhir/sid/icd-10',
  loinc: 'http://loinc.org',
  ucum: 'http://unitsofmeasure.org',
}

const cinsiyetHarita: Record<string, string> = { erkek: 'male', kadin: 'female', kadın: 'female', male: 'male', female: 'female' }

function ref(tip: string, id: string) { return { reference: `urn:uuid:${id}`, type: tip } }

function vitalObs(patientUrn: string, encUrn: string, tarih: string, kod: string, ad: string, deger: number, birim: string, id: string) {
  return {
    fullUrl: `urn:uuid:${id}`,
    resource: {
      resourceType: 'Observation', id, status: 'final',
      category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' }] }],
      code: { coding: [{ system: SIS.loinc, code: kod, display: ad }], text: ad },
      subject: { reference: patientUrn }, encounter: { reference: encUrn }, effectiveDateTime: tarih,
      valueQuantity: { value: deger, unit: birim, system: SIS.ucum, code: birim },
    },
    request: { method: 'POST', url: 'Observation' },
  }
}

export function notuFhirBundleYap(g: FhirNotGirdisi): Record<string, unknown> {
  const pid = `pt-${g.hasta.id}`
  const did = `pr-${g.doktor.id}`
  const eid = `enc-${g.noteId}`
  const patientUrn = `urn:uuid:${pid}`
  const encUrn = `urn:uuid:${eid}`
  const tarih = g.createdAt

  const entries: Record<string, unknown>[] = []

  // Patient — TC kimlik as national identifier (e-Nabız keys patients on TC)
  const kimlikler: Record<string, unknown>[] = [{ system: 'https://notya.ai/fhir/sid/hasta-id', value: g.hasta.id }]
  if (g.hasta.tcKimlik) kimlikler.push({ system: SIS.tc, value: g.hasta.tcKimlik })
  if (g.hasta.mrn) kimlikler.push({ system: SIS.mrn, value: g.hasta.mrn })
  entries.push({
    fullUrl: patientUrn,
    resource: {
      resourceType: 'Patient', id: pid, identifier: kimlikler,
      name: [{ text: g.hasta.adSoyad }],
      ...(g.hasta.dogumTarihi ? { birthDate: String(g.hasta.dogumTarihi).slice(0, 10) } : {}),
      ...(g.hasta.cinsiyet && cinsiyetHarita[g.hasta.cinsiyet.toLowerCase()] ? { gender: cinsiyetHarita[g.hasta.cinsiyet.toLowerCase()] } : {}),
    },
    request: { method: 'POST', url: 'Patient' },
  })

  // Practitioner
  entries.push({
    fullUrl: `urn:uuid:${did}`,
    resource: { resourceType: 'Practitioner', id: did, name: [{ text: g.doktor.adSoyad }] },
    request: { method: 'POST', url: 'Practitioner' },
  })

  // Encounter (muayene)
  entries.push({
    fullUrl: encUrn,
    resource: {
      resourceType: 'Encounter', id: eid, status: 'finished',
      class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB', display: 'ambulatory' },
      subject: { reference: patientUrn },
      participant: [{ individual: ref('Practitioner', did) }],
      period: { start: tarih, end: tarih },
    },
    request: { method: 'POST', url: 'Encounter' },
  })

  // Conditions — Tanılar (ICD-10)
  const kosullar: string[] = []
  for (let i = 0; i < (g.icd10?.length || 0); i++) {
    const t = g.icd10![i]
    const kod = t.code || t.kod
    if (!kod) continue
    const cid = `cond-${g.noteId}-${i}`
    kosullar.push(`urn:uuid:${cid}`)
    entries.push({
      fullUrl: `urn:uuid:${cid}`,
      resource: {
        resourceType: 'Condition', id: cid,
        clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }] },
        verificationStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status', code: (t.is_primary ?? t.birincil) ? 'confirmed' : 'provisional' }] },
        code: { coding: [{ system: SIS.icd10, code: kod, display: t.description || t.aciklama || kod }], text: t.description || t.aciklama || kod },
        subject: { reference: patientUrn }, encounter: { reference: encUrn }, recordedDate: tarih,
      },
      request: { method: 'POST', url: 'Condition' },
    })
  }

  // Vitals — Observations (LOINC)
  const v = (g.vitaller || {}) as Record<string, unknown>
  const num = (x: unknown): number | null => { const n = Number(x); return Number.isFinite(n) && n > 0 ? n : null }
  const vitalTanimlar: [string, string, string, string][] = [
    ['ates', '8310-5', 'Body temperature', 'Cel'],
    ['nabiz', '8867-4', 'Heart rate', '/min'],
    ['spo2', '2708-6', 'Oxygen saturation', '%'],
    ['kilo', '29463-7', 'Body weight', 'kg'],
    ['boy', '8302-2', 'Body height', 'cm'],
    ['solunum', '9279-1', 'Respiratory rate', '/min'],
  ]
  let vi = 0
  for (const [alan, kod, ad, birim] of vitalTanimlar) {
    const d = num(v[alan])
    if (d !== null) { entries.push(vitalObs(patientUrn, encUrn, tarih, kod, ad, d, birim, `obs-${g.noteId}-${vi++}`)) }
  }

  // MedicationRequests — intent=proposal (öneri; hukuken asla order değil)
  const ilacRefleri: string[] = []
  for (let i = 0; i < (g.receteOnerisi?.length || 0); i++) {
    const il = g.receteOnerisi![i]
    if (!il?.ad) continue
    const mid = `med-${g.noteId}-${i}`
    ilacRefleri.push(`urn:uuid:${mid}`)
    entries.push({
      fullUrl: `urn:uuid:${mid}`,
      resource: {
        resourceType: 'MedicationRequest', id: mid, status: 'draft', intent: 'proposal',
        medicationCodeableConcept: { text: [il.ad, il.doz, il.kullanim, il.sure].filter(Boolean).join(' — ') },
        subject: { reference: patientUrn }, encounter: { reference: encUrn }, authoredOn: tarih,
        requester: ref('Practitioner', did),
      },
      request: { method: 'POST', url: 'MedicationRequest' },
    })
  }

  // Composition — the Turkish EMR block structure itself
  const bolum = (baslik: string, metin: string) => ({
    title: baslik,
    text: { status: 'generated', div: `<div xmlns="http://www.w3.org/1999/xhtml"><p>${metin.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br/>')}</p></div>` },
  })
  const anamnezMetin = [
    g.basvuruYakinmasi ? `Başvuru Yakınması: ${g.basvuruYakinmasi}` : '',
    g.anamnez || g.subjektif || '',
    g.fizikMuayene || g.objektif || '',
  ].filter(Boolean).join('\n\n')
  const taniMetin = g.tani || g.degerlendirme || ''
  const tedaviMetin = g.tedavi || g.plan || ''

  entries.push({
    fullUrl: `urn:uuid:comp-${g.noteId}`,
    resource: {
      resourceType: 'Composition', id: `comp-${g.noteId}`, status: 'final',
      type: { coding: [{ system: SIS.loinc, code: '11488-4', display: 'Consult note' }], text: 'Muayene Notu' },
      subject: { reference: patientUrn }, encounter: { reference: encUrn }, date: tarih,
      author: [ref('Practitioner', did)],
      title: `Muayene Notu — ${g.kurumAd}`,
      section: [
        bolum('Anamnez ve Fizik Muayene', anamnezMetin || '—'),
        { ...bolum('Tanılar', taniMetin || '—'), entry: kosullar.map((r) => ({ reference: r })) },
        { ...bolum('İlaç / Tedavi Planı', tedaviMetin || '—'), entry: ilacRefleri.map((r) => ({ reference: r })) },
      ],
    },
    request: { method: 'POST', url: 'Composition' },
  })

  return { resourceType: 'Bundle', type: 'transaction', entry: entries }
}
