"use client";

import React, { useState, useEffect } from 'react';
import DoktorNav from '@/components/doktor/DoktorNav';

export const dynamic = 'force-dynamic';

interface Icd10Result {
  code: string;
  turkceAciklama: string;
  ingilizceAciklama: string;
  bolum: string;
  confidence: number;
}

interface ApiResponse {
  results: Icd10Result[];
}

const Icd10Page: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Icd10Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [copiedToast, setCopiedToast] = useState(false);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('icd10_recent_searches');
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return;

    const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('icd10_recent_searches', JSON.stringify(updated));
  };

  const searchICD10 = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setQuery(searchQuery);

    try {
      const token = localStorage.getItem('token') || '';
      
      const response = await fetch('/api/doktor/araclar/icd10', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (!response.ok) {
        throw new Error('Arama başarısız');
      }

      const data: ApiResponse = await response.json();
      setResults(data.results || []);
      saveRecentSearch(searchQuery);
    } catch (error) {
      console.error('ICD10 arama hatası:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      searchICD10(query);
    }
  };

  const handleCardClick = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2000);
    } catch (err) {
      console.error('Kopyalama hatası:', err);
    }
  };

  const handleRecentClick = (term: string) => {
    setQuery(term);
    searchICD10(term);
  };

  return (
    <div className="min-h-screen bg-[#0A1628] text-white">
      <DoktorNav />
      
      <div className="max-w-4xl mx-auto px-6 pt-12 pb-24">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-semibold mb-2">ICD-10 Arama</h1>
          <p className="text-gray-400">Türkçe tanı kodlarını bulun ve kopyalayın</p>
        </div>

        {/* Large Centered Search */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-full max-w-2xl relative">
            <div className="flex items-center bg-white rounded-2xl shadow-xl overflow-hidden">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Türkçe tanı yazın..."
                className="flex-1 px-8 py-5 text-lg text-gray-900 placeholder-gray-400 focus:outline-none"
                disabled={loading}
              />
              <button
                onClick={() => searchICD10(query)}
                disabled={loading || !query.trim()}
                className="px-10 py-5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-800 text-white font-medium transition-colors"
              >
                {loading ? 'Aranıyor...' : 'Ara'}
              </button>
            </div>
          </div>

          {/* Recent Searches Chips */}
          {recentSearches.length > 0 && (
            <div className="mt-6 w-full max-w-2xl">
              <p className="text-sm text-gray-400 mb-3">Son aramalar</p>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentClick(term)}
                    className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-sm rounded-full transition-colors border border-white/10"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500"></div>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-4">
            {results.map((result, index) => (
              <div
                key={index}
                onClick={() => handleCardClick(result.code)}
                className="bg-white text-gray-900 rounded-2xl p-6 shadow-lg cursor-pointer hover:shadow-xl transition-all active:scale-[0.995]"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-3xl font-bold text-teal-600 tracking-tight">
                      {result.code}
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5">ICD-10 Kodu</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardClick(result.code);
                    }}
                    className="px-5 py-2 text-sm bg-teal-100 hover:bg-teal-200 text-teal-700 rounded-xl font-medium transition-colors"
                  >
                    Kopyala
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-gray-500 mb-1">Türkçe Açıklama</div>
                    <div className="text-lg font-medium">{result.turkceAciklama}</div>
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-widest text-gray-500 mb-1">İngilizce Açıklama</div>
                    <div className="text-gray-700">{result.ingilizceAciklama}</div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <div className="text-xs uppercase tracking-widest text-gray-500 mb-1">Bölüm</div>
                      <div className="font-medium">{result.bolum}</div>
                    </div>

                    {/* Confidence Meter */}
                    <div className="w-48">
                      <div className="flex justify-between text-xs mb-1 text-gray-500">
                        <span>Güven</span>
                        <span>{result.confidence}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-teal-600 transition-all rounded-full" 
                          style={{ width: `${result.confidence}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && results.length === 0 && query && (
          <div className="text-center py-12 text-gray-400">
            Sonuç bulunamadı. Farklı bir arama terimi deneyin.
          </div>
        )}
      </div>

      {/* Toast */}
      {copiedToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-teal-600 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2">
          <span>✓ Kod panoya kopyalandı</span>
        </div>
      )}
    </div>
  );
};

export default Icd10Page;
