/**
 * Türk çocuklarında büyüme persentilleri — Olcay Neyzi standartları.
 *
 * Kaynak: Neyzi O, Bundak R, Gökçay G, Günöz H, Furman A, Darendeliler F, Baş F.
 * "Reference Values for Weight, Height, Head Circumference, and Body Mass Index in
 * Turkish Children." J Clin Res Pediatr Endocrinol. 2015;7(4):280-293.
 * DOI: 10.4274/jcrpe.2183. LMS yöntemi (Cole 1988/1990): Z=[(X/M)^L-1]/(LS).
 * Tablolar 5-8 (LMS parametreleri) doğrudan makale PDF'inden alındı (2026-09-13).
 *
 * Kaan direktifi (2026-09-13): kız/erkek ayrı eğriler; kilo/boy/baş çevresi persentili;
 * 2 yaş sonrası VKİ eğrisi ve sağlıklı/kilolu/obez sınıflaması. BMI sınıflama eşiği
 * (<85p sağlıklı, 85-94p kilolu, ≥95p obez) literatürde Neyzi tablolarıyla birlikte
 * kullanılan standart eşiktir (bkz. Bereket & Atay 2012 ve sonraki Türk pediatri çalışmaları).
 *
 * Uygulanan düzeltmeler (kaynak PDF'e göre):
 * - Erkek kilo, 8 yaş: M 23.9 → 25.9 (yazarların resmi düzeltmesi, JCRPE 2026;18:368-369 —
 *   orijinal 2015 tablosunda basım hatası vardı, doğru medyan 25.9 kg).
 * - Erkek VKİ, 3.5 yaş: M 15.08 → 15.80 (kaynak PDF metne dönüştürmede bozulmuştu;
 *   Tablo 3'teki doğrudan belirtilen 50. persentil değeriyle (15.8) çapraz doğrulandı).
 * - Kız VKİ, 21 ay: kaynak PDF'te bu tek nokta okunaksızdı (komşu aylarla tutarsız,
 *   18 ay M=16.18 → 24 ay M=15.92 düz iniş beklenirken sıçrama görünüyordu);
 *   18 ve 24 ay arasından doğrusal enterpole edildi (M≈16.05). Diğer tüm VKİ M değerleri
 *   Tablo 3'ün 50. persentiliyle tek tek doğrulandı, fark bulunmadı.
 *
 * Kapsam: doğumdan 18 yaşa (216 ay), iki nokta arası doğrusal enterpolasyon.
 * Bu bir istatistiksel referanstır; klinik karar hekimindir.
 */

import { cmCoz, kiloCoz } from './olcumCoz'

export type Cinsiyet = 'male' | 'female'
export type BuyumeParametre = 'kilo' | 'boy' | 'basCevresi' | 'vki'

export interface LMSNokta { ay: number; L: number; M: number; S: number }

// ay: Birth=0, 1..33 ay noktaları, sonra yıl bazlı (3y=36 ... 18y=216)
const KILO_ERKEK: LMSNokta[] = [
  { ay: 0, L: 1.09, M: 3.4, S: 0.131 }, { ay: 1, L: 1.00, M: 4.4, S: 0.154 }, { ay: 2, L: 0.90, M: 5.5, S: 0.145 },
  { ay: 3, L: 0.80, M: 6.4, S: 0.140 }, { ay: 6, L: 0.54, M: 8.1, S: 0.132 }, { ay: 9, L: 0.35, M: 9.3, S: 0.124 },
  { ay: 12, L: 0.19, M: 10.2, S: 0.127 }, { ay: 15, L: 0.06, M: 10.9, S: 0.124 }, { ay: 18, L: -0.05, M: 11.5, S: 0.123 },
  { ay: 21, L: -0.16, M: 12.1, S: 0.122 }, { ay: 24, L: -0.26, M: 12.7, S: 0.122 }, { ay: 27, L: -0.37, M: 13.3, S: 0.124 },
  { ay: 30, L: -0.47, M: 13.8, S: 0.124 }, { ay: 33, L: -0.56, M: 14.3, S: 0.126 }, { ay: 36, L: -0.66, M: 14.8, S: 0.131 },
  { ay: 42, L: -0.47, M: 15.9, S: 0.131 }, { ay: 48, L: -0.51, M: 16.8, S: 0.133 }, { ay: 54, L: -0.55, M: 17.7, S: 0.135 },
  { ay: 60, L: -0.59, M: 18.6, S: 0.137 }, { ay: 66, L: -0.63, M: 19.6, S: 0.139 }, { ay: 72, L: -0.67, M: 20.7, S: 0.141 },
  { ay: 84, L: -0.74, M: 23.2, S: 0.147 }, { ay: 96, L: -0.78, M: 25.9, S: 0.155 }, { ay: 108, L: -0.78, M: 28.8, S: 0.167 },
  { ay: 120, L: -0.69, M: 32.2, S: 0.183 }, { ay: 132, L: -0.46, M: 37.8, S: 0.204 }, { ay: 144, L: -0.13, M: 44.3, S: 0.215 },
  { ay: 156, L: 0.08, M: 49.8, S: 0.209 }, { ay: 168, L: 0.06, M: 56.2, S: 0.191 }, { ay: 180, L: -0.09, M: 62.1, S: 0.170 },
  { ay: 192, L: -0.23, M: 66.2, S: 0.155 }, { ay: 204, L: -0.34, M: 69.2, S: 0.146 }, { ay: 216, L: -0.43, M: 71.8, S: 0.139 },
]
const KILO_KIZ: LMSNokta[] = [
  { ay: 0, L: 0.83, M: 3.3, S: 0.128 }, { ay: 1, L: 1.22, M: 4.1, S: 0.134 }, { ay: 2, L: 1.17, M: 5.1, S: 0.132 },
  { ay: 3, L: 0.76, M: 5.8, S: 0.126 }, { ay: 6, L: 0.08, M: 7.4, S: 0.120 }, { ay: 9, L: 0.25, M: 8.6, S: 0.121 },
  { ay: 12, L: 0.25, M: 9.4, S: 0.121 }, { ay: 15, L: 0.21, M: 10.1, S: 0.120 }, { ay: 18, L: 0.22, M: 10.7, S: 0.122 },
  { ay: 21, L: 0.23, M: 11.3, S: 0.123 }, { ay: 24, L: 0.15, M: 11.9, S: 0.124 }, { ay: 27, L: 0.00, M: 12.5, S: 0.124 },
  { ay: 30, L: 0.17, M: 13.1, S: 0.123 }, { ay: 33, L: 0.27, M: 13.7, S: 0.123 }, { ay: 36, L: 0.30, M: 14.2, S: 0.122 },
  { ay: 42, L: -0.16, M: 15.1, S: 0.13 }, { ay: 48, L: -0.20, M: 16.1, S: 0.13 }, { ay: 54, L: -0.24, M: 17.3, S: 0.14 },
  { ay: 60, L: -0.28, M: 18.4, S: 0.14 }, { ay: 66, L: -0.33, M: 19.5, S: 0.15 }, { ay: 72, L: -0.36, M: 20.6, S: 0.15 },
  { ay: 84, L: -0.42, M: 22.9, S: 0.16 }, { ay: 96, L: -0.44, M: 25.7, S: 0.17 }, { ay: 108, L: -0.40, M: 28.9, S: 0.18 },
  { ay: 120, L: -0.26, M: 32.6, S: 0.20 }, { ay: 132, L: -0.07, M: 38.2, S: 0.20 }, { ay: 144, L: 0.06, M: 45.1, S: 0.18 },
  { ay: 156, L: 0.04, M: 50.0, S: 0.15 }, { ay: 168, L: -0.06, M: 53.3, S: 0.13 }, { ay: 180, L: -0.13, M: 55.3, S: 0.12 },
  { ay: 192, L: -0.17, M: 56.3, S: 0.12 }, { ay: 204, L: -0.20, M: 57.2, S: 0.12 }, { ay: 216, L: -0.24, M: 58.1, S: 0.11 },
]
const BOY_ERKEK: LMSNokta[] = [
  { ay: 0, L: 1, M: 50.0, S: 0.044 }, { ay: 1, L: 1, M: 54.0, S: 0.050 }, { ay: 2, L: 1, M: 57.9, S: 0.048 },
  { ay: 3, L: 1, M: 61.3, S: 0.044 }, { ay: 6, L: 1, M: 68.0, S: 0.041 }, { ay: 9, L: 1, M: 72.8, S: 0.039 },
  { ay: 12, L: 1, M: 76.9, S: 0.042 }, { ay: 15, L: 1, M: 80.2, S: 0.042 }, { ay: 18, L: 1, M: 83.1, S: 0.043 },
  { ay: 21, L: 1, M: 85.7, S: 0.044 }, { ay: 24, L: 1, M: 88.2, S: 0.044 }, { ay: 27, L: 1, M: 90.5, S: 0.043 },
  { ay: 30, L: 1, M: 92.6, S: 0.042 }, { ay: 33, L: 1, M: 94.8, S: 0.041 }, { ay: 36, L: 1, M: 96.8, S: 0.041 },
  { ay: 42, L: 1, M: 100.5, S: 0.041 }, { ay: 48, L: 1, M: 104.0, S: 0.041 }, { ay: 54, L: 1, M: 107.3, S: 0.041 },
  { ay: 60, L: 1, M: 110.4, S: 0.041 }, { ay: 66, L: 1, M: 113.3, S: 0.041 }, { ay: 72, L: 1, M: 116.1, S: 0.041 },
  { ay: 84, L: 1, M: 121.5, S: 0.041 }, { ay: 96, L: 1, M: 126.9, S: 0.042 }, { ay: 108, L: 1, M: 132.1, S: 0.042 },
  { ay: 120, L: 1, M: 137.6, S: 0.043 }, { ay: 132, L: 1, M: 143.8, S: 0.045 }, { ay: 144, L: 1, M: 150.6, S: 0.048 },
  { ay: 156, L: 1, M: 157.7, S: 0.050 }, { ay: 168, L: 1, M: 164.9, S: 0.047 }, { ay: 180, L: 1, M: 170.3, S: 0.042 },
  { ay: 192, L: 1, M: 173.4, S: 0.038 }, { ay: 204, L: 1, M: 175.0, S: 0.037 }, { ay: 216, L: 1, M: 176.2, S: 0.035 },
]
const BOY_KIZ: LMSNokta[] = [
  { ay: 0, L: 1, M: 49.4, S: 0.043 }, { ay: 1, L: 1, M: 53.1, S: 0.043 }, { ay: 2, L: 1, M: 56.8, S: 0.042 },
  { ay: 3, L: 1, M: 59.9, S: 0.041 }, { ay: 6, L: 1, M: 66.4, S: 0.039 }, { ay: 9, L: 1, M: 71.2, S: 0.038 },
  { ay: 12, L: 1, M: 75.1, S: 0.038 }, { ay: 15, L: 1, M: 78.5, S: 0.039 }, { ay: 18, L: 1, M: 81.5, S: 0.040 },
  { ay: 21, L: 1, M: 84.3, S: 0.040 }, { ay: 24, L: 1, M: 86.8, S: 0.041 }, { ay: 27, L: 1, M: 89.1, S: 0.041 },
  { ay: 30, L: 1, M: 91.2, S: 0.042 }, { ay: 33, L: 1, M: 93.4, S: 0.042 }, { ay: 36, L: 1, M: 95.4, S: 0.042 },
  { ay: 42, L: 1, M: 99.0, S: 0.043 }, { ay: 48, L: 1, M: 102.5, S: 0.043 }, { ay: 54, L: 1, M: 105.9, S: 0.042 },
  { ay: 60, L: 1, M: 109.1, S: 0.042 }, { ay: 66, L: 1, M: 112.1, S: 0.042 }, { ay: 72, L: 1, M: 115.1, S: 0.041 },
  { ay: 84, L: 1, M: 121.1, S: 0.041 }, { ay: 96, L: 1, M: 126.7, S: 0.042 }, { ay: 108, L: 1, M: 132.1, S: 0.044 },
  { ay: 120, L: 1, M: 137.9, S: 0.047 }, { ay: 132, L: 1, M: 145.4, S: 0.047 }, { ay: 144, L: 1, M: 153.1, S: 0.042 },
  { ay: 156, L: 1, M: 157.8, S: 0.038 }, { ay: 168, L: 1, M: 160.4, S: 0.037 }, { ay: 180, L: 1, M: 161.7, S: 0.036 },
  { ay: 192, L: 1, M: 162.4, S: 0.036 }, { ay: 204, L: 1, M: 162.7, S: 0.036 }, { ay: 216, L: 1, M: 163.1, S: 0.036 },
]
const BAS_ERKEK: LMSNokta[] = [
  { ay: 0, L: 1, M: 34.9, S: 0.040 }, { ay: 1, L: 1, M: 37.9, S: 0.037 }, { ay: 2, L: 1, M: 39.7, S: 0.035 },
  { ay: 3, L: 1, M: 41.1, S: 0.033 }, { ay: 6, L: 1, M: 44.0, S: 0.033 }, { ay: 9, L: 1, M: 45.8, S: 0.032 },
  { ay: 12, L: 1, M: 47.1, S: 0.031 }, { ay: 15, L: 1, M: 47.8, S: 0.031 }, { ay: 18, L: 1, M: 48.4, S: 0.031 },
  { ay: 21, L: 1, M: 48.9, S: 0.031 }, { ay: 24, L: 1, M: 49.3, S: 0.031 }, { ay: 27, L: 1, M: 49.6, S: 0.031 },
  { ay: 30, L: 1, M: 49.8, S: 0.031 }, { ay: 33, L: 1, M: 49.9, S: 0.031 }, { ay: 36, L: 1, M: 50.0, S: 0.031 },
  { ay: 42, L: 1, M: 50.8, S: 0.030 }, { ay: 48, L: 1, M: 51.1, S: 0.030 }, { ay: 54, L: 1, M: 51.4, S: 0.029 },
  { ay: 60, L: 1, M: 51.6, S: 0.029 }, { ay: 66, L: 1, M: 51.7, S: 0.028 }, { ay: 72, L: 1, M: 51.8, S: 0.028 },
  { ay: 84, L: 1, M: 52.0, S: 0.028 }, { ay: 96, L: 1, M: 52.5, S: 0.027 }, { ay: 108, L: 1, M: 53.0, S: 0.027 },
  { ay: 120, L: 1, M: 53.5, S: 0.027 }, { ay: 132, L: 1, M: 54.0, S: 0.027 }, { ay: 144, L: 1, M: 54.7, S: 0.027 },
  { ay: 156, L: 1, M: 55.2, S: 0.027 }, { ay: 168, L: 1, M: 55.9, S: 0.027 }, { ay: 180, L: 1, M: 56.7, S: 0.027 },
  { ay: 192, L: 1, M: 57.2, S: 0.026 }, { ay: 204, L: 1, M: 57.5, S: 0.026 }, { ay: 216, L: 1, M: 57.7, S: 0.026 },
]
const BAS_KIZ: LMSNokta[] = [
  { ay: 0, L: 1, M: 34.5, S: 0.040 }, { ay: 1, L: 1, M: 37.1, S: 0.033 }, { ay: 2, L: 1, M: 38.8, S: 0.031 },
  { ay: 3, L: 1, M: 40.0, S: 0.031 }, { ay: 6, L: 1, M: 42.9, S: 0.031 }, { ay: 9, L: 1, M: 44.6, S: 0.030 },
  { ay: 12, L: 1, M: 45.8, S: 0.028 }, { ay: 15, L: 1, M: 46.6, S: 0.028 }, { ay: 18, L: 1, M: 47.2, S: 0.028 },
  { ay: 21, L: 1, M: 47.6, S: 0.029 }, { ay: 24, L: 1, M: 48.0, S: 0.030 }, { ay: 27, L: 1, M: 48.2, S: 0.030 },
  { ay: 30, L: 1, M: 48.4, S: 0.031 }, { ay: 33, L: 1, M: 48.5, S: 0.031 }, { ay: 36, L: 1, M: 48.7, S: 0.031 },
  { ay: 42, L: 1, M: 49.6, S: 0.030 }, { ay: 48, L: 1, M: 50.1, S: 0.029 }, { ay: 54, L: 1, M: 50.4, S: 0.029 },
  { ay: 60, L: 1, M: 50.7, S: 0.029 }, { ay: 66, L: 1, M: 50.9, S: 0.029 }, { ay: 72, L: 1, M: 51.1, S: 0.028 },
  { ay: 84, L: 1, M: 51.4, S: 0.028 }, { ay: 96, L: 1, M: 51.8, S: 0.028 }, { ay: 108, L: 1, M: 52.3, S: 0.028 },
  { ay: 120, L: 1, M: 52.9, S: 0.029 }, { ay: 132, L: 1, M: 53.4, S: 0.028 }, { ay: 144, L: 1, M: 54.1, S: 0.027 },
  { ay: 156, L: 1, M: 54.7, S: 0.025 }, { ay: 168, L: 1, M: 55.2, S: 0.024 }, { ay: 180, L: 1, M: 55.5, S: 0.024 },
  { ay: 192, L: 1, M: 55.8, S: 0.023 }, { ay: 204, L: 1, M: 55.9, S: 0.023 }, { ay: 216, L: 1, M: 56.1, S: 0.022 },
]
const VKI_ERKEK: LMSNokta[] = [
  { ay: 0, L: 0.53, M: 13.66, S: 0.103 }, { ay: 1, L: 0.48, M: 15.07, S: 0.100 }, { ay: 2, L: 0.42, M: 16.24, S: 0.097 },
  { ay: 3, L: 0.35, M: 16.90, S: 0.095 }, { ay: 6, L: 0.13, M: 17.52, S: 0.091 }, { ay: 9, L: -0.13, M: 17.51, S: 0.091 },
  { ay: 12, L: -0.34, M: 17.20, S: 0.090 }, { ay: 15, L: -0.48, M: 16.97, S: 0.089 }, { ay: 18, L: -0.57, M: 16.67, S: 0.086 },
  { ay: 21, L: -0.67, M: 16.71, S: 0.085 }, { ay: 24, L: -0.78, M: 16.33, S: 0.086 }, { ay: 27, L: -0.93, M: 16.25, S: 0.086 },
  { ay: 30, L: -1.06, M: 16.16, S: 0.086 }, { ay: 33, L: -1.13, M: 15.98, S: 0.087 }, { ay: 36, L: -1.15, M: 15.94, S: 0.089 },
  { ay: 42, L: -1.16, M: 15.80, S: 0.089 }, // düzeltildi: kaynak 15.08 (OCR), Tablo3 50p=15.8 ile doğrulandı
  { ay: 48, L: -1.26, M: 15.7, S: 0.089 }, { ay: 54, L: -1.35, M: 15.6, S: 0.090 }, { ay: 60, L: -1.44, M: 15.5, S: 0.092 },
  { ay: 66, L: -1.55, M: 15.4, S: 0.094 }, { ay: 72, L: -1.66, M: 15.4, S: 0.095 }, { ay: 84, L: -1.83, M: 15.7, S: 0.099 },
  { ay: 96, L: -1.89, M: 16.1, S: 0.107 }, { ay: 108, L: -1.80, M: 16.5, S: 0.119 }, { ay: 120, L: -1.53, M: 17.1, S: 0.136 },
  { ay: 132, L: -1.14, M: 18.2, S: 0.153 }, { ay: 144, L: -0.78, M: 19.3, S: 0.162 }, { ay: 156, L: -0.64, M: 19.9, S: 0.159 },
  { ay: 168, L: -0.77, M: 20.5, S: 0.150 }, { ay: 180, L: -1.00, M: 21.2, S: 0.141 }, { ay: 192, L: -1.18, M: 21.9, S: 0.133 },
  { ay: 204, L: -1.29, M: 22.5, S: 0.129 }, { ay: 216, L: -1.36, M: 23.1, S: 0.126 },
]
const VKI_KIZ: LMSNokta[] = [
  { ay: 0, L: 0.70, M: 13.52, S: 0.098 }, { ay: 1, L: 0.52, M: 14.66, S: 0.096 }, { ay: 2, L: 0.33, M: 15.67, S: 0.094 },
  { ay: 3, L: 0.14, M: 16.26, S: 0.092 }, { ay: 6, L: -0.41, M: 16.91, S: 0.089 }, { ay: 9, L: -0.82, M: 16.96, S: 0.087 },
  { ay: 12, L: -1.01, M: 16.63, S: 0.085 }, { ay: 15, L: -1.06, M: 16.45, S: 0.084 }, { ay: 18, L: -1.05, M: 16.18, S: 0.084 },
  { ay: 21, L: -1.03, M: 16.05, S: 0.084 }, // enterpole edildi: kaynak noktası okunaksızdı, 18/24 ay arası
  { ay: 24, L: -0.99, M: 15.92, S: 0.084 }, { ay: 27, L: -1.00, M: 15.90, S: 0.083 }, { ay: 30, L: -1.06, M: 15.80, S: 0.083 },
  { ay: 33, L: -1.16, M: 15.72, S: 0.081 }, { ay: 36, L: -1.29, M: 15.55, S: 0.079 }, { ay: 42, L: -1.29, M: 15.5, S: 0.083 },
  { ay: 48, L: -1.41, M: 15.4, S: 0.086 }, { ay: 54, L: -1.53, M: 15.4, S: 0.090 }, { ay: 60, L: -1.65, M: 15.4, S: 0.095 },
  { ay: 66, L: -1.75, M: 15.5, S: 0.100 }, { ay: 72, L: -1.83, M: 15.5, S: 0.106 }, { ay: 84, L: -1.87, M: 15.6, S: 0.114 },
  { ay: 96, L: -1.73, M: 15.9, S: 0.123 }, { ay: 108, L: -1.47, M: 16.4, S: 0.134 }, { ay: 120, L: -1.18, M: 17.1, S: 0.144 },
  { ay: 132, L: -0.95, M: 18.0, S: 0.148 }, { ay: 144, L: -0.83, M: 19.0, S: 0.144 }, { ay: 156, L: -0.84, M: 19.9, S: 0.134 },
  { ay: 168, L: -0.97, M: 20.6, S: 0.123 }, { ay: 180, L: -1.16, M: 21.0, S: 0.114 }, { ay: 192, L: -1.34, M: 21.2, S: 0.109 },
  { ay: 204, L: -1.50, M: 21.5, S: 0.104 }, { ay: 216, L: -1.65, M: 21.8, S: 0.095 },
]

function tabloSec(param: BuyumeParametre, cinsiyet: Cinsiyet): LMSNokta[] {
  const map: Record<BuyumeParametre, { erkek: LMSNokta[]; kiz: LMSNokta[] }> = {
    kilo: { erkek: KILO_ERKEK, kiz: KILO_KIZ },
    boy: { erkek: BOY_ERKEK, kiz: BOY_KIZ },
    basCevresi: { erkek: BAS_ERKEK, kiz: BAS_KIZ },
    vki: { erkek: VKI_ERKEK, kiz: VKI_KIZ },
  }
  return cinsiyet === 'male' ? map[param].erkek : map[param].kiz
}

/** İki komşu yaş noktası arasında L, M, S doğrusal enterpolasyonu. */
function lmsAra(tablo: LMSNokta[], ayYas: number): LMSNokta | null {
  if (ayYas < 0) return null
  if (ayYas <= tablo[0].ay) return tablo[0]
  if (ayYas >= tablo[tablo.length - 1].ay) return tablo[tablo.length - 1]
  for (let i = 0; i < tablo.length - 1; i++) {
    const a = tablo[i], b = tablo[i + 1]
    if (ayYas >= a.ay && ayYas <= b.ay) {
      const t = (ayYas - a.ay) / (b.ay - a.ay)
      return { ay: ayYas, L: a.L + t * (b.L - a.L), M: a.M + t * (b.M - a.M), S: a.S + t * (b.S - a.S) }
    }
  }
  return null
}

function zSkorHesapla(deger: number, lms: LMSNokta): number {
  if (Math.abs(lms.L) < 1e-6) return Math.log(deger / lms.M) / lms.S
  return (Math.pow(deger / lms.M, lms.L) - 1) / (lms.L * lms.S)
}

/** Standart normal dağılım CDF — Abramowitz-Stegun yaklaşımı (yeterli hassasiyet). */
function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z))
  const d = 0.3989423 * Math.exp((-z * z) / 2)
  let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
  if (z > 0) p = 1 - p
  return p
}

export interface PersentilSonuc { persentil: number; zSkor: number }

/** ayYas: hastanın ölçüm anındaki yaşı (ay, ondalıklı olabilir, ör. 4 yaş 3 ay = 51). */
export function persentilHesapla(param: BuyumeParametre, cinsiyet: Cinsiyet, ayYas: number, deger: number): PersentilSonuc | null {
  if (!Number.isFinite(deger) || deger <= 0 || !Number.isFinite(ayYas) || ayYas < 0 || ayYas > 216) return null
  return lmsDegerlendir(tabloSec(param, cinsiyet), ayYas, deger)
}

/**
 * PEDI-ARACLAR-01 — aynı LMS matematiği başka bir referans tablosu için (Büyüme stüdyosu WHO seçeneği).
 * Kapsam denetimi çağıranındır; burada tablo uçlarında sabitlenir (lmsAra ile aynı).
 */
export function lmsDegerlendir(tablo: LMSNokta[], ayYas: number, deger: number): PersentilSonuc | null {
  if (!tablo.length || !Number.isFinite(deger) || deger <= 0 || !Number.isFinite(ayYas) || ayYas < 0) return null
  const lms = lmsAra(tablo, ayYas)
  if (!lms) return null
  const z = zSkorHesapla(deger, lms)
  const p = Math.max(0.1, Math.min(99.9, normalCdf(z) * 100))
  return { persentil: p, zSkor: z }
}

export type VkiSinif = 'saglikli' | 'kilolu' | 'obez'

/** Kaan (2026-09-13): yalnız 2 yaş (24 ay) ve üzerinde sınıflandırma yapılır. */
export function vkiSiniflandir(persentil: number): VkiSinif {
  if (persentil >= 95) return 'obez'
  if (persentil >= 85) return 'kilolu'
  return 'saglikli'
}

export function vkiSinifEtiket(s: VkiSinif): string {
  return s === 'obez' ? 'Obez' : s === 'kilolu' ? 'Kilolu' : 'Sağlıklı'
}

export function ayFarki(dogumIso: string, olcumIso?: string): number | null {
  const d = new Date(dogumIso)
  if (isNaN(d.getTime())) return null
  const o = olcumIso ? new Date(olcumIso) : new Date()
  if (isNaN(o.getTime())) return null
  const ay = (o.getFullYear() - d.getFullYear()) * 12 + (o.getMonth() - d.getMonth()) + (o.getDate() - d.getDate()) / 30.44
  return ay < 0 ? null : ay
}

/** "46. persentil" biçiminde Türkçe metin. */
export function persentilMetni(p: number): string {
  const yuvarlak = Math.round(p)
  return `${yuvarlak}. persentil`
}

export type BuyumePersentilleri = { kilo?: string; boy?: string; basCevresi?: string; vki?: string; vkiSinif?: string }

/**
 * Not vitallerinden Neyzi persentili. Gram ("3180 gr") kg'a, "50.50 cm" cm'e çevrilir;
 * birim süzülmeden 3180 kg sanılırsa 100. persentil + sahte obez çıkar.
 */
export function buyumePersentilleriniHesapla(
  vitaller: unknown,
  dogumIso: string | null,
  cinsiyet: Cinsiyet | null,
  olcumIso: string | null,
): BuyumePersentilleri | null {
  if (!vitaller || typeof vitaller !== 'object' || !dogumIso || !cinsiyet) return null
  const ayYas = ayFarki(dogumIso, olcumIso || undefined)
  if (ayYas === null || ayYas > 216) return null
  const v = vitaller as Record<string, unknown>
  const kilo = kiloCoz(v.kilo as string | number | null | undefined)
  const boy = cmCoz(v.boy as string | number | null | undefined)
  const bas = cmCoz(v.basCevresi as string | number | null | undefined)
  const out: BuyumePersentilleri = {}
  if (kilo != null) { const r = persentilHesapla('kilo', cinsiyet, ayYas, kilo); if (r) out.kilo = persentilMetni(r.persentil) }
  if (boy != null) { const r = persentilHesapla('boy', cinsiyet, ayYas, boy); if (r) out.boy = persentilMetni(r.persentil) }
  if (bas != null) { const r = persentilHesapla('basCevresi', cinsiyet, ayYas, bas); if (r) out.basCevresi = persentilMetni(r.persentil) }
  if (kilo != null && boy != null && ayYas >= 24) {
    const vki = kilo / Math.pow(boy / 100, 2)
    const r = persentilHesapla('vki', cinsiyet, ayYas, vki)
    if (r) { out.vki = persentilMetni(r.persentil); out.vkiSinif = vkiSinifEtiket(vkiSiniflandir(r.persentil)) }
  }
  return Object.keys(out).length ? out : null
}

/**
 * NOTYA-BUYUME-EGRISI-02 (Kaan 2026-09-14): "Büyüme Eğrileri" sekmesi — Neyzi standart
 * persentil çizgileri + hastanın kendi ölçümleri aynı grafikte. Aşağıdaki fonksiyonlar bunun
 * için eklendi; yukarıdaki tablolar ve LMS enterpolasyonu (lmsAra) değişmedi.
 */

/** Standart normal dağılımın ters CDF'i (persentil → Z) — Acklam'ın rasyonel yaklaşımı. */
function normalInvCdf(p: number): number {
  if (p <= 0) return -8
  if (p >= 1) return 8
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00]
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01]
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00]
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00]
  const pLow = 0.02425
  const pHigh = 1 - pLow
  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p))
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  }
  if (p <= pHigh) {
    const q = p - 0.5
    const r = q * q
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
  }
  const q = Math.sqrt(-2 * Math.log(1 - p))
  return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
    ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
}

/** LMS ters dönüşüm: verilen persentildeki değeri döndürür (Cole 1990). */
function degerdenPersentil(lms: LMSNokta, persentil: number): number {
  const z = normalInvCdf(persentil / 100)
  if (Math.abs(lms.L) < 1e-6) return lms.M * Math.exp(z * lms.S)
  return lms.M * Math.pow(1 + lms.L * lms.S * z, 1 / lms.L)
}

export interface EgriNoktasi { ay: number; deger: number }
export interface EgriSerisi { persentil: number; noktalar: EgriNoktasi[] }

/**
 * Standart persentil çizgileri (varsayılan 3/10/25/50/75/90/97), belirli bir yaş aralığında.
 * adimAy: örnekleme sıklığı (ay). Çağıran taraf hastanın yaşına göre maxAy'ı daraltabilir.
 */
export function persentilEgrileri(
  param: BuyumeParametre,
  cinsiyet: Cinsiyet,
  maxAy: number,
  persentiller: number[] = [3, 10, 25, 50, 75, 90, 97],
  adimAy = 1,
): EgriSerisi[] {
  return lmsEgrileri(tabloSec(param, cinsiyet), Math.min(216, Math.max(6, Math.ceil(maxAy))), persentiller, adimAy)
}

/** PEDI-ARACLAR-01 — persentilEgrileri'nin tablo bağımsız çekirdeği (0 → ustSinir ay). */
export function lmsEgrileri(tablo: LMSNokta[], ustSinir: number, persentiller: number[] = [3, 10, 25, 50, 75, 90, 97], adimAy = 1, altSinir = 0): EgriSerisi[] {
  const noktaSayisi = Math.ceil((ustSinir - altSinir) / adimAy) + 1
  return persentiller.map((p) => ({
    persentil: p,
    noktalar: Array.from({ length: noktaSayisi }, (_, i) => {
      const ay = Math.min(ustSinir, altSinir + i * adimAy)
      const lms = lmsAra(tablo, ay)
      return lms ? { ay, deger: Math.round(degerdenPersentil(lms, p) * 100) / 100 } : null
    }).filter((x): x is EgriNoktasi => x !== null),
  }))
}
