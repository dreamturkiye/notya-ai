'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import DoktorNav from '@/components/doktor/DoktorNav'

interface Hasta {
  id: number
  ad: string
  soyad: string
}

interface Goruntuleme {
  id: number
  modalite: string
  vucut_bolgesi: string
  tarih: string
  dosya_tipi: string
  rapor_metni: string
  dosya_url: string
}

const modaliteler = ['X-Ray', 'MRI', 'BT', 'Ultrason', 'EKO', 'PET-BT']
const vucutBolgeListesi = ['Kafa/Boyun', 'Gogus', 'Karin', 'Pelvis', 'Omurga', 'Ust Ekstremite', 'Alt Ekstremite', 'Tam Vucut']

export default function GoruntulemePage() {
  const [hastalar, setHastalar] = useState<Hasta[]>([])
  const [selectedHastaId, setSelectedHastaId] = useState<number | ''>('')
  const [goruntulemeListesi, setGoruntulemeListesi] = useState<Goruntuleme[]>([])
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [modalite, setModalite] = useState('')
  const [vucut_bolgesi, setVucutBolgesi] = useState('')
  const [rapor_metni, setRaporMetni] = useState('')
  const [tarih, setTarih] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')
  const [listLoading, setListLoading] = useState(false)
  const [filterHastaId, setFilterHastaId] = useState<number | ''>('')

  // Auth + Hastaları çek
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/doktor/hastalar', {
          credentials: 'include',
        })
        if (!res.ok) {
          if (res.status === 401) {
            window.location.href = '/giris'
            return
          }
          throw new Error('Hasta listesi alınamadı')
        }
        const data = await res.json()
        setHastalar(data.hastalar || [])
      } catch (err) {
        setError('Hasta listesi yüklenirken hata oluştu')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Görüntüleme listesini çek
  const fetchGoruntulemeler = async (hastaId: number) => {
    if (!hastaId) return
    setListLoading(true)
    try {
      const res = await fetch(`/api/doktor/goruntuleme?hastaId=${hastaId}`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setGoruntulemeListesi(data.goruntulemeler || [])
    } catch {
      setError('Görüntüleme listesi yüklenemedi')
    } finally {
      setListLoading(false)
    }
  }

  // Hasta seçildiğinde listeyi güncelle
  const handleHastaChange = (id: number | '') => {
    setSelectedHastaId(id)
    if (id) {
      fetchGoruntulemeler(id as number)
    } else {
      setGoruntulemeListesi([])
    }
  }

  // Filtre için hasta değişimi
  const handleFilterChange = (id: number | '') => {
    setFilterHastaId(id)
    if (id) {
      fetchGoruntulemeler(id as number)
    } else {
      setGoruntulemeListesi([])
    }
  }

  // Dosya seçimi
  const handleFileSelect = (file: File | null) => {
    if (!file) return
    const allowed = ['.dcm', '.jpg', '.png', '.pdf']
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!allowed.includes(ext)) {
      setError('Sadece .dcm, .jpg, .png, .pdf dosyaları kabul edilir')
      return
    }
    setSelectedFile(file)
    setError('')
  }

  // Drag & Drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  // Yükleme
  const handleUpload = async () => {
    if (!selectedHastaId || !selectedFile || !modalite || !vucut_bolgesi || !tarih) {
      setError('Lütfen tüm alanları doldurun')
      return
    }

    setUploading(true)
    setUploadProgress(0)
    setError('')

    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('hasta_id', selectedHastaId.toString())
    formData.append('modalite', modalite)
    formData.append('vucut_bolgesi', vucut_bolgesi)
    formData.append('tarih', tarih)
    formData.append('rapor_metni', rapor_metni)

    try {
      // Basit progress simülasyonu (gerçek progress için XHR kullanılabilir)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 15, 90))
      }, 200)

      const res = await fetch('/api/doktor/goruntuleme/yukle', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!res.ok) throw new Error('Yükleme başarısız')

      // Başarılı → listeyi yenile
      await fetchGoruntulemeler(selectedHastaId as number)

      // Formu temizle
      setSelectedFile(null)
      setModalite('')
      setVucutBolgesi('')
      setRaporMetni('')
      setTarih('')
      setUploadProgress(0)
    } catch (err) {
      setError('Dosya yüklenirken hata oluştu')
    } finally {
      setUploading(false)
      setTimeout(() => setUploadProgress(0), 800)
    }
  }

  // Dosya görüntüle
  const handleGoruntule = (url: string) => {
    window.open(url, '_blank')
  }

  // Sil
  const handleSil = async (id: number) => {
    if (!confirm('Bu görüntüyü silmek istediğinize emin misiniz?')) return

    try {
      const res = await fetch(`/api/doktor/goruntuleme/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error()
      
      setGoruntulemeListesi(prev => prev.filter(g => g.id !== id))
    } catch {
      setError('Silme işlemi başarısız')
    }
  }

  const filteredList = filterHastaId ? goruntulemeListesi : goruntulemeListesi

  return (
    <div className="min-h-screen bg-[#0A1628] text-white">
      <DoktorNav />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-semibold mb-8">Görüntüleme Yönetimi</h1>

        {error && (
          <div className="mb-6 bg-red-600/90 text-white px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* SOL PANEL - YÜKLEME FORMU */}
          <div className="bg-white text-gray-900 rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-semibold mb-6">Görüntüleme Ekle</h2>

            <div className="space-y-5">
              {/* Hasta Seç */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Hasta</label>
                <select
                  value={selectedHastaId}
                  onChange={(e) => handleHastaChange(Number(e.target.value) || '')}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  <option value="">Hasta seçiniz</option>
                  {hastalar.map(h => (
                    <option key={h.id} value={h.id}>
                      {h.ad} {h.soyad}
                    </option>
                  ))}
                </select>
              </div>

              {/* Modalite */}
              <div>
                <label className="block text-sm font-medium mb-2">Modalite</label>
                <div className="grid grid-cols-3 gap-2">
                  {modaliteler.map(m => (
                    <label key={m} className="flex items-center gap-2 border rounded-xl px-4 py-2.5 cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="modalite"
                        value={m}
                        checked={modalite === m}
                        onChange={(e) => setModalite(e.target.value)}
                      />
                      <span className="text-sm">{m}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Vücut Bölgesi */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Vücut Bölgesi</label>
                <select
                  value={vucut_bolgesi}
                  onChange={(e) => setVucutBolgesi(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3"
                >
                  <option value="">Bölge seçiniz</option>
                  {vucutBolgeListesi.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Tarih */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Tarih</label>
                <input
                  type="date"
                  value={tarih}
                  onChange={(e) => setTarih(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3"
                />
              </div>

              {/* Rapor Metni */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Rapor Metni</label>
                <textarea
                  value={rapor_metni}
                  onChange={(e) => setRaporMetni(e.target.value)}
                  rows={4}
                  placeholder="Radyoloji raporunu buraya yapıştırın..."
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 resize-y"
                />
              </div>

              {/* Dosya Yükleme */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Dosya</label>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => document.getElementById('file-input')?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
                >
                  <input
                    id="file-input"
                    type="file"
                    accept=".dcm,.jpg,.png,.pdf"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                  />
                  {selectedFile ? (
                    <p className="text-green-600 font-medium">{selectedFile.name}</p>
                  ) : (
                    <p className="text-gray-500">Dosyayı sürükleyin veya tıklayın (.dcm, .jpg, .png, .pdf)</p>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {uploading && uploadProgress > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={uploading || !selectedHastaId}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3.5 rounded-2xl transition-colors"
              >
                {uploading ? 'Yükleniyor...' : 'Yükle'}
              </button>
            </div>
          </div>

          {/* SAĞ PANEL - LİSTE */}
          <div className="bg-white text-gray-900 rounded-2xl shadow-xl p-8 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Görüntüleme Listesi</h2>
            </div>

            {/* Filtre */}
            <div className="mb-6">
              <select
                value={filterHastaId}
                onChange={(e) => handleFilterChange(Number(e.target.value) || '')}
                className="w-full border border-gray-300 rounded-xl px-4 py-3"
              >
                <option value="">Tüm hastalar</option>
                {hastalar.map(h => (
                  <option key={h.id} value={h.id}>{h.ad} {h.soyad}</option>
                ))}
              </select>
            </div>

            {listLoading ? (
              <div className="flex-1 flex items-center justify-center text-gray-400">Yükleniyor...</div>
            ) : filteredList.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-400">Görüntüleme bulunamadı</div>
            ) : (
              <div className="space-y-4 overflow-auto max-h-[560px] pr-2">
                {filteredList.map((g) => (
                  <div key={g.id} className="border border-gray-200 rounded-2xl p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                          {g.modalite}
                        </span>
                        <span className="text-sm text-gray-600">{g.vucut_bolgesi}</span>
                      </div>
                      <span className="text-xs text-gray-500">{new Date(g.tarih).toLocaleDateString('tr-TR')}</span>
                    </div>

                    <div className="text-sm text-gray-700 mb-4">
                      {g.rapor_metni ? g.rapor_metni.slice(0, 100) + (g.rapor_metni.length > 100 ? '...' : '') : 'Rapor yok'}
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleGoruntule(g.dosya_url)}
                        className="px-4 py-2 text-sm bg-gray-900 text-white rounded-xl hover:bg-black transition"
                      >
                        Görüntüle
                      </button>
                      <button
                        onClick={() => handleSil(g.id)}
                        className="px-4 py-2 text-sm border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition"
                      >
                        Sil
                      </button>
                      <span className="ml-auto text-xs text-gray-400">{g.dosya_tipi}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
