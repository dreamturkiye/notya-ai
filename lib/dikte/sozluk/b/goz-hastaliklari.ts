/**
 * DIKTE-TIBBI-01 — Göz Hastalıkları dictation lexicon (seed, 2026-11-21). Correct spellings the corrector repairs a misheard
 * term towards, plus the recogniser's usual splits of them. KBB is the in-depth reference file; this one grows from the
 * branş's own corrections (the doctor's personal pairs stay personal). Data only.
 */
import type { Sozluk } from '../../duzelt'

const sozluk: Sozluk = {
  terimler: ["görme keskinliği", "tashihli görme", "tashihsiz görme", "göz içi basıncı", "biyomikroskopi", "fundus muayenesi", "fundoskopi", "optik disk", "cup disk oranı", "makula", "retina", "vitre", "kornea", "konjonktiva", "sklera", "ön kamara", "iris", "lens", "pupil", "direkt ışık refleksi", "indirekt ışık refleksi", "katarakt", "glokom", "açık açılı glokom", "dar açılı glokom", "diyabetik retinopati", "makula dejenerasyonu", "retina dekolmanı", "konjonktivit", "alerjik konjonktivit", "keratit", "üveit", "blefarit", "şalazyon", "hordeolum", "kuru göz", "miyopi", "hipermetropi", "astigmatizma", "presbiyopi", "şaşılık", "ambliyopi", "refraksiyon", "otorefraktometri", "optik koherens tomografi", "görme alanı", "tonometri", "intravitreal enjeksiyon", "fakoemülsifikasyon", "göz damlası", "suni gözyaşı", "latanoprost", "timolol", "brimonidin", "dorzolamid", "siklopentolat", "tropikamid"],
  hatalar: [{"duyulan": ["bio mikroskopi", "biyo mikroskopi"], "dogru": "biyomikroskopi", "ekli": true}, {"duyulan": ["fundos kopi"], "dogru": "fundoskopi", "ekli": true}, {"duyulan": ["kon jonktivit"], "dogru": "konjonktivit", "ekli": true}],
}

export default sozluk
