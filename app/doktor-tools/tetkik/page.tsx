'use client';

import React, { useState, useEffect } from 'react';
import DoktorNav from '@/components/doktor/DoktorNav';

export const dynamic = 'force-dynamic';

interface Hasta {
  id: number;
  ad: string;
  soyad: string;
  tcKimlikNo: string;
}

interface LabTestGroups {
  [key: string]: string[];
}

const labTestGroups: LabTestGroups = {
  Hematoloji: ['Tam Kan Sayımı', 'PT/INR', 'APTT', 'Periferik Yayma'],
  Biyokimya: ['Glikoz', 'HbA1c', 'BUN', 'Kreatinin', 'ALT', 'AST', 'GGT', 'ALP', 'Total Protein', 'Albumin', 'Ürik Asit', 'CRP', 'ESR'],
  Hormon: ['TSH', 'sT3', 'sT4', 'İnsülin', 'Kortizol', 'Prolaktin'],
  Mikrobiyoloji: ['Tam İdrar Tetkiki', 'İdrar Kültürü', 'Boğaz Kültürü', 'Kan Kültürü'],
  Lipid: ['Total Kolesterol', 'LDL', 'HDL', 'Trigliserid'],
};

const vucutBolgeleri = ['Baş', 'Boyun', 'Göğüs', 'Karın', 'Pelvis', 'Omurga', 'Kol', 'Bacak'];
const modaliteler = ['X-Ray', 'USG', 'MRI', 'BT', 'PET-BT', 'EKO', 'EEG', 'EMG'];

interface PrintableFormData {
  hasta: Hasta | null;
  endikasyon: string;
  selectedTests: string[];
  vucutBolgesi: string;
  modalite: string;
  isLab: boolean;
  customTests: string;
}

export default function TetkikPage() {
  const [activeTab, setActiveTab] = useState<'lab' | 'goruntuleme'>('lab');
  const [hastalar, setHastalar] = useState<Hasta[]>([]);
  const [selectedHastaId, setSelectedHastaId] = useState<number | null>(null);
  const [klinikEndikasyon, setKlinikEndikasyon] = useState('');
  const [selectedLabTests, setSelectedLabTests] = useState<Record<string, boolean>>({});
  const [customTests, setCustomTests] = useState('');
  const [vucutBolgesi, setVucutBolgesi] = useState('');
  const [modalite, setModalite] = useState('');
  const [showPrintable, setShowPrintable] = useState(false);
  const [printableData, setPrintableData] = useState<PrintableFormData | null>(null);

  useEffect(() => {
    const fetchHastalar = async () => {
      try {
        const res = await fetch('/api/doktor/hastalar');
        const data = await res.json();
        setHastalar(data);
      } catch (error) {
        console.error('Hasta listesi alınamadı');
      }
    };
    fetchHastalar();
  }, []);

  const selectedHasta = hastalar.find(h => h.id === selectedHastaId) || null;

  const toggleLabTest = (test: string) => {
    setSelectedLabTests(prev => ({
      ...prev,
      [test]: !prev[test],
    }));
  };

  const getSelectedLabTestsList = (): string[] => {
    return Object.keys(selectedLabTests).filter(test => selectedLabTests[test]);
  };

  const handleOlustur = () => {
    const selectedTests = activeTab === 'lab' 
      ? [...getSelectedLabTestsList(), ...(customTests ? [customTests] : [])]
      : [];

    const formData: PrintableFormData = {
      hasta: selectedHasta,
      endikasyon: klinikEndikasyon,
      selectedTests: activeTab === 'lab' ? selectedTests : [],
      vucutBolgesi: activeTab === 'goruntuleme' ? vucutBolgesi : '',
      modalite: activeTab === 'goruntuleme' ? modalite : '',
      isLab: activeTab === 'lab',
      customTests: activeTab === 'lab' ? customTests : '',
    };

    setPrintableData(formData);
    setShowPrintable(true);
  };

  const handleYazdir = () => {
    window.print();
  };

  const handleKapat = () => {
    setShowPrintable(false);
    setPrintableData(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DoktorNav />

      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Tetkik İstek Formu</h1>

        {/* Tab Toggle */}
        <div className="flex bg-white rounded-full p-1 shadow-sm border mb-8 w-fit">
          <button
            onClick={() => setActiveTab('lab')}
            className={`px-8 py-2.5 rounded-full font-medium transition-all ${
              activeTab === 'lab' 
                ? 'bg-teal-600 text-white shadow' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Lab İstekleri
          </button>
          <button
            onClick={() => setActiveTab('goruntuleme')}
            className={`px-8 py-2.5 rounded-full font-medium transition-all ${
              activeTab === 'goruntuleme' 
                ? 'bg-teal-600 text-white shadow' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Görüntüleme İstekleri
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow border p-8 space-y-8">
          {/* Hasta Seçimi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hasta</label>
            <select
              value={selectedHastaId || ''}
              onChange={(e) => setSelectedHastaId(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Hasta seçiniz...</option>
              {hastalar.map(hasta => (
                <option key={hasta.id} value={hasta.id}>
                  {hasta.ad} {hasta.soyad} ({hasta.tcKimlikNo})
                </option>
              ))}
            </select>
          </div>

          {/* Klinik Endikasyon */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Klinik Endikasyon</label>
            <textarea
              value={klinikEndikasyon}
              onChange={(e) => setKlinikEndikasyon(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-y"
              placeholder="Klinik endikasyon bilgilerini giriniz..."
            />
          </div>

          {/* Lab Tab */}
          {activeTab === 'lab' && (
            <div className="space-y-6">
              {Object.entries(labTestGroups).map(([groupName, tests]) => (
                <div key={groupName}>
                  <h3 className="font-semibold text-gray-800 mb-3">{groupName}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {tests.map(test => (
                      <label key={test} className="flex items-center gap-3 p-3 border rounded-xl hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!selectedLabTests[test]}
                          onChange={() => toggleLabTest(test)}
                          className="w-4 h-4 text-teal-600 accent-teal-600"
                        />
                        <span className="text-sm text-gray-700">{test}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {/* Ekstra Testler */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Ekstra Tetkikler</h3>
                <input
                  type="text"
                  value={customTests}
                  onChange={(e) => setCustomTests(e.target.value)}
                  placeholder="Özel tetkik isteklerini yazınız..."
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          )}

          {/* Görüntüleme Tab */}
          {activeTab === 'goruntuleme' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vücut Bölgesi</label>
                <select
                  value={vucutBolgesi}
                  onChange={(e) => setVucutBolgesi(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Bölge seçiniz...</option>
                  {vucutBolgeleri.map(bolge => (
                    <option key={bolge} value={bolge}>{bolge}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Modalite</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {modaliteler.map(modal => (
                    <label key={modal} className="flex items-center gap-3 p-3 border rounded-xl hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="modalite"
                        value={modal}
                        checked={modalite === modal}
                        onChange={(e) => setModalite(e.target.value)}
                        className="w-4 h-4 text-teal-600 accent-teal-600"
                      />
                      <span className="text-sm text-gray-700">{modal}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleOlustur}
            disabled={!selectedHastaId}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white font-semibold py-4 rounded-2xl transition-colors"
          >
            Form Oluştur
          </button>
        </div>
      </div>

      {/* Printable Form */}
      {showPrintable && printableData && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6 print:p-0 print:bg-white">
          <div className="bg-white w-full max-w-[900px] rounded-2xl shadow-xl p-10 print:shadow-none print:rounded-none print:p-8" id="print-area">
            {/* Header */}
            <div className="flex justify-between items-start border-b pb-6 mb-8">
              <div>
                <div className="text-2xl font-bold tracking-tight">TETKİK İSTEK FORMU</div>
                <div className="text-sm text-gray-500 mt-1">TC SAĞLIK BAKANLIĞI • HASTANE BİLGİ SİSTEMİ</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm text-gray-500">Tarih: {new Date().toLocaleDateString('tr-TR')}</div>
              </div>
            </div>

            {/* Doktor ve Hasta Bilgileri */}
            <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
              <div>
                <div className="font-semibold mb-2">Doktor Bilgileri</div>
                <div>Dr. Ahmet Yılmaz</div>
                <div>İç Hastalıkları Uzmanı</div>
                <div>Sicil No: 123456</div>
              </div>
              <div>
                <div className="font-semibold mb-2">Hasta Bilgileri</div>
                <div>{printableData.hasta?.ad} {printableData.hasta?.soyad}</div>
                <div>TC: {printableData.hasta?.tcKimlikNo}</div>
              </div>
            </div>

            {/* Tetkikler */}
            <div className="mb-8">
              <div className="font-semibold mb-3">İstenen Tetkikler</div>
              {printableData.isLab ? (
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  {printableData.selectedTests.length > 0 ? (
                    printableData.selectedTests.map((test, idx) => (
                      <li key={idx}>{test}</li>
                    ))
                  ) : <li>Seçili tetkik bulunmamaktadır.</li>}
                </ul>
              ) : (
                <div className="text-sm">
                  <div><span className="font-medium">Vücut Bölgesi:</span> {printableData.vucutBolgesi}</div>
                  <div><span className="font-medium">Modalite:</span> {printableData.modalite}</div>
                </div>
              )}
            </div>

            {/* Endikasyon */}
            <div className="mb-10">
              <div className="font-semibold mb-2">Klinik Endikasyon</div>
              <div className="text-sm border rounded-xl p-4 bg-gray-50 min-h-[80px]">
                {printableData.endikasyon || 'Belirtilmemiş'}
              </div>
            </div>

            {/* İmza */}
            <div className="pt-10 border-t flex justify-end">
              <div className="text-center">
                <div className="border-t border-gray-400 w-48 pt-1 text-sm">Doktor İmzası</div>
              </div>
            </div>

            <div className="flex gap-3 mt-8 print:hidden">
              <button onClick={handleYazdir} className="flex-1 bg-teal-600 text-white py-3 rounded-xl font-semibold">Yazdır</button>
              <button onClick={handleKapat} className="flex-1 border py-3 rounded-xl font-semibold">Kapat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
