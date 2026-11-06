/**
 * GENITAL-ESTETIK-01 — WHO HAS THE PACKAGE: obstetrics and gynaecology only (any stored spelling of the branch). Client-safe:
 * the patient file's tab button, its mount and every server route read this ONE decision.
 *
 * Why only KD (brans-alan-sizmasi): the package's records (energy sessions on the vaginal canal, G-spot fillers, vaginal
 * tightening, FSFI / VLQ) are gynaecological chapter content. Estetik & plastik cerrahi (Özel Branş) and plastik cerrahi
 * also perform labiaplasty in Türkiye; whether they get the package is the owner's decision (docs/OPEN-COMMITMENTS.md
 * GENITAL-ESTETIK-01) — until then they see nothing of it.
 */
import { kadinDogumBransi } from '@/lib/doktor/hastaDosyaSekmeleri'

export const genitalEstetikBransi = (specialtyHam: string | null | undefined): boolean => kadinDogumBransi(specialtyHam)
