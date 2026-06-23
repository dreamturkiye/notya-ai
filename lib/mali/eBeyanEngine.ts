// FILE 1: /Users/kaan/notya-ai/lib/mali/eBeyanEngine.ts
export interface EBeyanConfig {
  gibApiKey: string
  vergiNo: string
  donem: string
}

export interface KdvBeyan {
  vergiNo: string
  donem: string
  hesaplananKdv: number
  indirilecekKdv: number
  odenmesiGerekenKdv: number
  tevkifatliIslemler?: number
  istisnaIslemler?: number
}

export interface BeyanSonuc {
  basarili: boolean
  mesaj: string
  referansNo?: string
  tahakkukNo?: string
  ödenecekTutar?: number
  sonOdemeTarihi?: string
  pdfUrl?: string
  hata?: string
}

const GIB_EBEYAN_BASE = 'https://ebeyan.gib.gov.tr'

export async function gibTokenDogrula(apiKey: string): Promise<{ gecerli: boolean; mesaj: string }> {
  try {
    const res = await fetch(GIB_EBEYAN_BASE + '/entegrator/api/token/dogrula', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    })
    if (res.status === 200) {
      return { gecerli: true, mesaj: 'Token gecerli' }
    }
    const error = await res.text()
    return { gecerli: false, mesaj: error || 'Token dogrulama basarisiz' }
  } catch (err: any) {
    return { gecerli: false, mesaj: err.message || 'Bağlantı hatası' }
  }
}

export async function kdvBeyanGönder(config: EBeyanConfig, beyan: KdvBeyan): Promise<BeyanSonuc> {
  try {
    const body = {
      vergiNo: beyan.vergiNo,
      donem: beyan.donem,
      beyanname: {
        hesaplananKdv: beyan.hesaplananKdv,
        indirilecekKdv: beyan.indirilecekKdv,
        odenmesiGerekenKdv: beyan.odenmesiGerekenKdv,
        tevkifatliIslemler: beyan.tevkifatliIslemler,
        istisnaIslemler: beyan.istisnaIslemler
      }
    }
    const res = await fetch(GIB_EBEYAN_BASE + '/entegrator/api/beyanname/kdv/gönder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.gibApiKey}`
      },
      body: JSON.stringify(body)
    })
    const data = await res.json()
    if (!res.ok) {
      return { basarili: false, mesaj: data.mesaj || 'Gönderim basarisiz', hata: data.hata }
    }
    return {
      basarili: true,
      mesaj: 'Beyanname basariyla gönderildi',
      referansNo: data.referansNo,
      tahakkukNo: data.tahakkukNo,
      ödenecekTutar: data.ödenecekTutar,
      sonOdemeTarihi: data.sonOdemeTarihi,
      pdfUrl: data.pdfUrl
    }
  } catch (err: any) {
    return { basarili: false, mesaj: 'Gönderim hatasi', hata: err.message }
  }
}

export async function beyanSorgula(config: EBeyanConfig, referansNo: string): Promise<BeyanSonuc> {
  try {
    const res = await fetch(
      `${GIB_EBEYAN_BASE}/entegrator/api/beyanname/sorgula?referansNo=${referansNo}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.gibApiKey}`
        }
      }
    )
    const data = await res.json()
    if (!res.ok) {
      return { basarili: false, mesaj: data.mesaj || 'Sorgulama basarisiz', hata: data.hata }
    }
    return {
      basarili: true,
      mesaj: 'Sorgulama basarili',
      referansNo: data.referansNo,
      tahakkukNo: data.tahakkukNo,
      ödenecekTutar: data.ödenecekTutar,
      sonOdemeTarihi: data.sonOdemeTarihi,
      pdfUrl: data.pdfUrl
    }
  } catch (err: any) {
    return { basarili: false, mesaj: 'Sorgulama hatasi', hata: err.message }
  }
}

export function kdvHesapla(hesaplanan: number, indirilecek: number): { net: number; iadeMi: boolean; mesaj: string } {
  const net = hesaplanan - indirilecek
  if (net < 0) {
    return { net, iadeMi: true, mesaj: `KDV iadesi: ${Math.abs(net)} TL` }
  }
  return { net, iadeMi: false, mesaj: `Odenmesi gereken KDV: ${net} TL` }
}

// FILE 2: /Users/kaan/notya-ai/app/api/mali/ebeyan/route.ts