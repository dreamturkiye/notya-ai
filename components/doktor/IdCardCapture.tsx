'use client'

import React, { useEffect, useRef, useState } from 'react'

type Props = {
  onParsed: (fields: {
    tcKimlikNo: string
    adSoyad: string
    dogumTarihi: string
    cinsiyet: string
  }) => void
  onCancel: () => void
  getToken: () => string
}

/**
 * Mobile-first kimlik capture: camera frame + gallery upload.
 * OCR on-device when possible; always confirms via parent Review.
 */
export default function IdCardCapture({ onParsed, onCancel, getToken }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })
        if (!active) {
          s.getTracks().forEach((t) => t.stop())
          return
        }
        setStream(s)
        if (videoRef.current) {
          videoRef.current.srcObject = s
          await videoRef.current.play().catch(() => {})
        }
      } catch {
        setError('Kamera açılamadı — galeriden seçebilirsiniz.')
      }
    })()
    return () => {
      active = false
      stream?.getTracks().forEach((t) => t.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stopCamera = () => {
    stream?.getTracks().forEach((t) => t.stop())
    setStream(null)
  }

  const processBlob = async (blob: Blob) => {
    setBusy(true)
    setError('')
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(new Error('read failed'))
        reader.readAsDataURL(blob)
      })
      setPreview(dataUrl)

      let ocrText = ''
      try {
        const { createWorker } = await import('tesseract.js')
        const worker = await createWorker('tur+eng')
        const {
          data: { text },
        } = await worker.recognize(dataUrl)
        ocrText = text || ''
        await worker.terminate()
      } catch {
        // fall through — server may OCR
      }

      const token = getToken()
      const res = await fetch('/api/doktor/id-card/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ocrText: ocrText || undefined,
          imageBase64: ocrText ? undefined : dataUrl,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(String((data as { error?: string }).error || 'Okuma başarısız'))
        return
      }
      const fields = (data as { fields?: Record<string, string> }).fields || {}
      stopCamera()
      onParsed({
        tcKimlikNo: fields.tcKimlikNo || '',
        adSoyad: fields.adSoyad || '',
        dogumTarihi: fields.dogumTarihi || '',
        cinsiyet: fields.cinsiyet || '',
      })
    } catch {
      setError('İşlem başarısız. Tekrar deneyin veya manuel girin.')
    } finally {
      setBusy(false)
    }
  }

  const capture = async () => {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92)
    )
    if (blob) await processBlob(blob)
  }

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await processBlob(file)
  }

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Kimlik kartı</h2>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 16 }}>
        Kartı çerçeveye hizala (eski veya yeni kimlik). Fotoğraf kaydedilmez.
      </p>

      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '4 / 3',
          borderRadius: 16,
          overflow: 'hidden',
          background: '#000',
          border: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Önizleme" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <video
            ref={videoRef}
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
        <div
          style={{
            pointerEvents: 'none',
            position: 'absolute',
            inset: '12%',
            border: '2px dashed rgba(20,184,166,0.85)',
            borderRadius: 12,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 0,
            right: 0,
            textAlign: 'center',
            color: '#fff',
            fontSize: 13,
            textShadow: '0 1px 4px rgba(0,0,0,0.8)',
          }}
        >
          Kartı çerçeveye hizala
        </div>
      </div>

      {error ? (
        <div style={{ color: '#FBBF24', fontSize: 13, marginTop: 12 }}>{error}</div>
      ) : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
        <button
          type="button"
          disabled={busy}
          onClick={() => void capture()}
          style={{
            height: 48,
            border: 'none',
            borderRadius: 12,
            background: '#14B8A6',
            color: '#041016',
            fontWeight: 650,
            fontSize: 16,
            cursor: busy ? 'wait' : 'pointer',
          }}
        >
          {busy ? 'Okunuyor…' : 'Fotoğraf çek'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          style={{
            height: 44,
            borderRadius: 12,
            border: '1.5px solid rgba(255,255,255,0.25)',
            background: 'transparent',
            color: '#E2E8F0',
            fontSize: 15,
            cursor: 'pointer',
          }}
        >
          Galeriden seç
        </button>
        <button
          type="button"
          onClick={() => {
            stopCamera()
            onCancel()
          }}
          style={{
            height: 40,
            border: 'none',
            background: 'transparent',
            color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer',
          }}
        >
          Geri
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => void onFile(e)}
      />
    </div>
  )
}
