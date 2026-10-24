'use client'

import { useState } from 'react'
import type { PortalBundle, PortalMessage } from '@/lib/portal/types'
import { COMPOSE_DISCLAIMER } from '@/lib/portal/messageCopy'
import { MESAJ_EK_ACCEPT, MESAJ_EK_AZAMI } from '@/lib/portal/mesajEk'
import { formatTrDate } from './ui'
import { turkceHataMesaji } from '@/lib/turkce/dogrulamaMesaji'
import { PortalMesajlarGorunumu, type PortalMesajGonderimi, type PortalMesajSonucu, type PortalMesajSozleri } from '@/components/doktor/portal/PortalMesajlarGorunumu'

type Props = {
  data: PortalBundle
  /** Live portal token — enables real compose/send. Demo omits this. */
  token?: string
  onMessagesUpdated?: (messages: PortalMessage[]) => void
}

function boyutuYaz(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

const SOZLER: PortalMesajSozleri = {
  baslik: 'Mesajlar',
  altBaslik: 'Doktorunuz ve klinik ekibinizle güvenli yazışmalar. Tetkik, görüntü ve raporları buradan ekleyebilirsiniz.',
  yeniMesaj: 'Yeni mesaj',
  konuYer: 'Konu',
  mesajYer: 'Mesajınız…',
  dosyaEkle: 'Dosya ekle',
  ekBilgi: `PDF, Word, Excel, görüntü, ses, kısa video · en fazla ${MESAJ_EK_AZAMI} · 4 MB`,
  kaldir: 'Kaldır',
  uyari: COMPOSE_DISCLAIMER,
  gonder: 'Gönder',
  gonderiliyor: 'Gönderiliyor…',
  vazgec: 'Vazgeç',
  bosBaslik: 'Henüz mesaj yok',
  bosGovdeYazilabilir: 'Doktorunuza güvenli bir mesaj göndererek başlayabilirsiniz. Tetkik ve görüntüleri de buradan ekleyin.',
  bosGovdeSalt: 'Doktorunuz bir not paylaştığında veya size yazdığında burada görünecek.',
  klasorler: [
    { key: 'gelen', label: 'Gelen' },
    { key: 'gonderilen', label: 'Gönderilen' },
    { key: 'arsiv', label: 'Arşiv' },
  ],
  klasorBos: 'Bu klasör boş.',
  geri: '← Gelen kutusu',
  yanitYer: 'Yanıt yazın…',
  yanitla: 'Yanıtla',
  sec: 'Bir konuşma seçin.',
  yanitYokNotu: 'Demo önizleme — gerçek gönderim için hasta portal linkinizi kullanın.',
  ac: 'Aç',
}

export function MessagesView({ data, token, onMessagesUpdated }: Props) {
  const [localMessages, setLocalMessages] = useState<PortalMessage[] | null>(null)
  const messages = localMessages || data.messages
  const canSend = Boolean(token)

  function applyMessages(next: PortalMessage[]) {
    setLocalMessages(next)
    onMessagesUpdated?.(next)
  }

  async function markRead(konuId: string) {
    const current = (localMessages || data.messages).find((m) => m.id === konuId)
    if (!current || current.okundu) return

    const optimistic = (localMessages || data.messages).map((m) =>
      m.id === konuId ? { ...m, okundu: true } : m
    )
    applyMessages(optimistic)

    if (!token) return
    try {
      const res = await fetch(`/api/portal/hasta/${encodeURIComponent(token)}/mesajlar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ konuId, action: 'read' }),
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok && Array.isArray((json as { messages?: unknown }).messages)) {
        applyMessages((json as { messages: PortalMessage[] }).messages)
      }
    } catch {
      /* keep optimistic */
    }
  }

  async function postMessage(payload: PortalMesajGonderimi): Promise<PortalMesajSonucu> {
    if (!token) return null
    if (!payload.metin.trim() && !payload.ekler.length) return 'Mesaj yazın veya dosya ekleyin.'
    try {
      let res: Response
      if (payload.ekler.length) {
        const fd = new FormData()
        if (payload.konuId) fd.set('konuId', payload.konuId)
        if (payload.konu) fd.set('konu', payload.konu)
        fd.set('metin', payload.metin)
        for (const f of payload.ekler.slice(0, MESAJ_EK_AZAMI)) fd.append('ek', f)
        res = await fetch(`/api/portal/hasta/${encodeURIComponent(token)}/mesajlar`, {
          method: 'POST',
          credentials: 'include',
          body: fd,
        })
      } else {
        res = await fetch(`/api/portal/hasta/${encodeURIComponent(token)}/mesajlar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            konuId: payload.konuId,
            konu: payload.konu,
            metin: payload.metin,
          }),
        })
      }
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Gönderilemedi')
      const next = (json.messages || []) as PortalMessage[]
      applyMessages(next)
      return json.konuId ? { konuId: json.konuId as string } : null
    } catch (e) {
      return turkceHataMesaji(e instanceof Error ? e.message : '') || 'Mesajınız gönderilemedi. Lütfen tekrar deneyin.'
    }
  }

  return (
    <PortalMesajlarGorunumu
      s={SOZLER}
      mesajlar={messages.map((m) => ({
        id: m.id,
        klasor: m.klasor,
        konu: m.konu,
        gonderen: m.gonderen,
        ozet: m.ozet,
        tarih: formatTrDate(m.tarih, true),
        okundu: m.okundu,
        mesajlar: m.mesajlar.map((msg) => ({
          id: msg.id,
          kimden: msg.kimden,
          metin: msg.metin,
          tarih: formatTrDate(msg.tarih, true),
          taraf: msg.taraf,
          ekler: msg.ekler?.map((ek) => ({
            id: ek.id,
            ad: ek.fileName,
            boyut: boyutuYaz(ek.fileSize),
            href: token ? `/api/portal/hasta/${encodeURIComponent(token)}/mesajlar/ek/${encodeURIComponent(ek.id)}` : null,
          })),
        })),
      }))}
      yanitlayabilir={canSend}
      ekAzami={MESAJ_EK_AZAMI}
      ekAccept={MESAJ_EK_ACCEPT}
      onOku={(id) => void markRead(id)}
      onGonder={postMessage}
      onEkHata={(n) => `En fazla ${n} dosya ekleyebilirsiniz.`}
    />
  )
}
