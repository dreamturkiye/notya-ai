#!/usr/bin/env python3
"""Score every role of every country build against the Pediatri gold checklist.

Input: <cc>.json from cikar.mts — run on each release branch from its root:
  NOTYA_COUNTRY=<cc> npx tsx scripts/derinlik/cikar.mts <out>/<cc>.json   (copy the two files there; release branches carry countries/)
Output (in the current directory): skor-<label>.json and one summary line per country (mean, roles >= 90, pills).
Usage: python3 skor.py <label> [ek.json]     CANLI_SONRASI=1 scores UZ K4 from the live assistant's full source block.
Checklist and rules: docs/ULKE-BRANS-ALTIN-STANDART.md (K9 not applicable: K9_YOK below, ULKE-BRANS-K9-MUTTEFIK).
"""
import json, re, sys, os

ETIKET = sys.argv[1] if len(sys.argv) > 1 else 'once'
import os
CANLI_SONRASI = os.environ.get('CANLI_SONRASI') == '1'
ULKELER = os.environ.get('ULKELER', 'us gb ca au nz uz').split()
PILL = {'S': 1.0, 'P': 0.6, 'T': 0.3, 'M': 0.0}
AD = {'S': 'Strong', 'P': 'Partial', 'T': 'Thin', 'M': 'Missing'}

# Gold checklist (docs/ULKE-BRANS-ALTIN-STANDART.md): id -> weight
AGIRLIK = {
    'K1': 15,  # muayene / SOAP sections, vocabulary, per-role SOAP lock
    'K2': 15,  # Doktor Araclari: specialty tools and calculators
    'K3': 10,  # scores and scales (deterministic, sourced)
    'K4': 12,  # national references and books feeding Ayse
    'K5': 8,   # intake-form questions
    'K6': 10,  # hasta portali module
    'K7': 6,   # specialty consent form
    'K8': 6,   # report / document types
    'K9': 5,   # prescription and order presets
    'K10': 5,  # patient-file specialty views
    'K11': 4,  # leak gate + tests both directions
    'K12': 4,  # specialist validation
}
assert sum(AGIRLIK.values()) == 100

SABLON_ARAC = re.compile(r'^au-[a-z-]+-(review|flags|care-plan|between-visit-log|care-goals|visit-prep|plan)$|^au-ref-|^au-review-cohort$')
RAPOR_ARAC = re.compile(r'ameliyat-notu|usg-|dogum-epikrizi|epikriz|op-protokol')
ONAM_ARAC = re.compile(r'onam|consent|rozilik')
# ULKE-BRANS-DERINLIK-05 (2026-11-08): a role's own specialty report/conclusion that prints with the BELGE-NO-01 document
# number and verification QR (print and share) = Strong
RAPOR_YAZDIR = re.compile(r'-report$|-xulosa$')
RECETE_ARAC = re.compile(r'doz-hesabi|rejim-karti|pbs-prescription|antikoagulan|antibiyotik-sure|infuzyon')

# commercial weight of a role among likely private-market buyers (3 = high, 2 = medium, 1 = low)
YUKSEK = {'family-medicine', 'aile-hekimligi', 'internal-medicine', 'dahiliye', 'paediatrics', 'pediatri', 'obstetrics-gynaecology', 'kadin-hastaliklari-dogum',
          'psychiatry', 'psikiyatri', 'dermatology', 'dermatoloji', 'cardiology', 'kardiyoloji', 'physiotherapy', 'fizyoterapi', 'clinical-psychology', 'klinik-psikolog',
          'aesthetic-medicine', 'medikal-estetik', 'orthopaedics', 'ortopedi', 'ophthalmology', 'goz-hastaliklari', 'otolaryngology', 'kulak-burun-bogaz',
          'dietetics', 'endocrinology', 'endokrinoloji', 'aesthetic-surgery', 'estetik-cerrahi', 'plastic-surgery', 'plastik-cerrahi', 'urgent-care-medicine',
          'psychotherapy', 'clinical-social-work', 'child-adolescent-psychiatry', 'clinic-dermatology', 'klinik-dermatoloji', 'sports-medicine', 'spor-hekimligi'}
DUSUK = {'radiology', 'radyoloji', 'anaesthesia', 'anestezi', 'neurosurgery', 'beyin-cerrahisi', 'thoracic-surgery', 'gogus-cerrahisi', 'cardiovascular-surgery',
         'kalp-damar-cerrahisi', 'cardio-thoracic-surgery', 'paediatric-surgery', 'cocuk-cerrahisi', 'radiation-oncology', 'clinical-oncology', 'emergency-medicine',
         'acil-tip', 'rural-hospital-medicine', 'hospice-palliative-medicine', 'palliative-medicine', 'damar-cerrahisi', 'vascular-surgery', 'audio-vestibular-medicine',
         'occupational-medicine', 'longevity', 'hair-transplant'}

# ULKE-BRANS-K9-MUTTEFIK (Kaan's written decision, 2026-11-08: "Go ahead with 1 and 2"): K9 (prescription / dose engine) is
# NOT APPLICABLE for a profession that cannot prescribe in that country; the role is scored over the other 95 points and
# rescaled to 100. Each country's list was checked against a source opened on 2026-11-08 (docs/ULKE-BRANS-ALTIN-STANDART.md).
# AU podiatry is NOT on the list (endorsement for scheduled medicines); GB physiotherapy, podiatry and dietetics, NZ
# physiotherapy (nicotine replacement), dietetics and podiatry, and US clinical psychology (prescribing psychologists in six
# states) stay scored.
K9_YOK = {
    'au': {'physiotherapy', 'clinical-psychology', 'dietetics', 'occupational-therapy', 'audiology', 'speech-pathology'},
    'uz': {'fizyoterapi', 'klinik-psikolog'},
    'gb': {'clinical-psychology', 'occupational-therapy', 'audiology', 'speech-language-therapy'},
    'ca': {'physiotherapy', 'clinical-psychology', 'dietetics', 'occupational-therapy', 'audiology', 'psychotherapy'},
    'nz': {'clinical-psychology', 'occupational-therapy', 'audiology', 'osteopathy', 'chiropractic', 'psychotherapy'},
    'us': {'physiotherapy', 'dietetics', 'occupational-therapy', 'audiology', 'speech-language-pathology', 'clinical-social-work'},
}

def ticari(rol):
    return 3 if rol in YUKSEK else 1 if rol in DUSUK else 2

def puanla(cc, r, ek):
    """One role: per-item pill, the score 0-100, the overall pill, and how its content is provided."""
    araclar = r['araclar']
    oz = [a for a in araclar if (a['roller'] or 99) <= 3]
    klinik = [a for a in oz if not SABLON_ARAC.search(a['k'])]
    yapisal = [a for a in oz if SABLON_ARAC.search(a['k'])]
    olcek = [a for a in klinik if a['tur'] in ('olcek', 'hesap') and a['kaynak']]
    p = {}
    own_t = r['sablon'] == 'own'
    gibi_t = r['sablon'].startswith('gibi')
    au = cc == 'au'
    o = ek.get(f"{cc}:{r['rol']}", {})
    # K1 note template (+ AU per-role SOAP lock)
    p['K1'] = 'S' if (own_t and (au or r.get('soapKilidi'))) else 'P' if own_t or (gibi_t and au) else 'T' if gibi_t else 'M'
    # K2 specialty tools (clinical, not the templated per-role trio)
    n = len(klinik)
    p['K2'] = 'S' if n >= 6 else 'P' if n >= 3 or (n >= 1 and len(yapisal) >= 4) else 'T' if n >= 1 or yapisal else 'M'
    # K3 scores and scales
    p['K3'] = 'S' if len(olcek) >= 4 else 'P' if len(olcek) >= 2 else 'T' if len(olcek) == 1 else 'M'
    # K4 national references feeding the assistant
    kb, kbi = r['kaynakBlogu'], r['kaynakIlk']
    if CANLI_SONRASI and r.get('kbHazir'):
        kb, kbi = r['kbHazir'], r.get('kbHazirIlk', '')
    if cc == 'uz' and kb > 0:
        # 2026-11-08: Uzbekistan counts books only (no length shortcut): Strong needs a BOOKS section
        p['K4'] = 'S' if 'BOOKS' in kbi else 'P'
    elif kb > 0:
        p['K4'] = 'S' if 'BOOKS' in kbi or kb > 900 else 'P'
    else:
        p['K4'] = 'T' if any(a['kaynak'] for a in klinik) else 'M'
    # K5 intake
    kopya = o.get('formKopya', False)
    p['K5'] = ('P' if r['soruSayisi'] >= 6 else 'T') if r['form'] == 'own' and not kopya else 'T' if r['form'] != 'none' else 'M'
    # K6 portal: AU has per-role portal chapters + coaching; others the shared shell only
    p['K6'] = 'S' if (r.get('portalBolum') and r.get('portalDemo')) else 'P' if (au or r.get('portalBolum')) else 'T'
    # K7 specialty consent
    p['K7'] = 'P' if any(ONAM_ARAC.search(a['k']) for a in oz) else 'M'
    # K8 report / document types
    p['K8'] = 'S' if any(RAPOR_YAZDIR.search(a['k']) and a.get('yazdir') for a in oz) else 'P' if any(RAPOR_ARAC.search(a['k']) for a in oz) else 'T'
    # K9 prescription / order presets
    dz = any(re.search(r'-(doz|dose)$', a['k']) for a in oz)
    sp = any(re.search(r'-(buyurtma|orders)$', a['k']) for a in oz)
    p['K9'] = 'S' if (dz and sp) else 'P' if sp else 'T' if any(RECETE_ARAC.search(a['k']) for a in oz) else 'M'
    # K10 patient-file specialty views
    sek = r.get('sekmeArac', 0) if r.get('sekmeSoz') else 0
    eski = 'P' if (au and r['rol'] in ('paediatrics', 'family-medicine', 'dietetics')) else 'T' if au else 'M'
    p['K10'] = 'S' if sek >= 2 else 'P' if sek == 1 else eski
    # K11 leak gate: the kit gates every role field and tool; role-specific leak tests where written
    p['K11'] = 'S' if o.get('sizintiTesti') else 'P'
    # K12 specialist validation: no clinician of any country has signed off country content
    p['K12'] = 'M'
    for k, v in o.get('pill', {}).items():
        p[k] = v
    if r['rol'] in K9_YOK.get(cc, set()):
        p['K9'] = 'NA'
        skor = round(sum(AGIRLIK[k] * PILL[v] for k, v in p.items() if v != 'NA') / (100 - AGIRLIK['K9']) * 100)
    else:
        skor = round(sum(AGIRLIK[k] * PILL[v] for k, v in p.items()))
    genel = 'S' if skor >= 85 else 'P' if skor >= 55 else 'T' if skor >= 20 else 'M'
    kaynak = 'own' if own_t else (f"mapped to {r['sablon'][5:]}" if gibi_t else 'generic')
    return {'rol': r['rol'], 'ad': r['ad'], 'taraf': r['taraf'], 'p': p, 'skor': skor, 'genel': genel, 'icerik': kaynak,
            'form': r['form'], 'klinikArac': [a['k'] for a in klinik], 'yapisalArac': len(yapisal), 'ticari': ticari(r['rol'])}

def main():
    ek = json.load(open(sys.argv[2])) if len(sys.argv) > 2 else {}
    sonuc = {}
    for cc in ULKELER:
        d = json.load(open(f'{cc}.json'))
        sonuc[cc] = [puanla(cc, r, ek) for r in d['out']]
    json.dump(sonuc, open(f'skor-{ETIKET}.json', 'w'), indent=1, ensure_ascii=False)
    for cc in ULKELER:
        say = {k: sum(1 for x in sonuc[cc] if x['genel'] == k) for k in 'SPTM'}
        ort = round(sum(x['skor'] for x in sonuc[cc]) / len(sonuc[cc]))
        ort1 = round(sum(x['skor'] for x in sonuc[cc]) / len(sonuc[cc]), 1)
        print(cc, len(sonuc[cc]), 'mean', ort1, '>=90', sum(1 for x in sonuc[cc] if x['skor'] >= 90), ' '.join(f'{AD[k]}={v}' for k, v in say.items()))

if __name__ == '__main__':
    main()
