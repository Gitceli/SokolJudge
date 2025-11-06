import React, { useEffect, useState, useMemo } from 'react';
import axios from '../axios';
import Layout from '../components/Layout';
import ExcelJS from 'exceljs';

export default function MainJudgeDashboard() {
  const judge = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('judge') || '{}'); } catch { return {}; }
  }, []);

  const [contesters, setContesters] = useState([]);
  const [activeContester, setActiveContester] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [settingActive, setSettingActive] = useState(null);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Load all contesters
  const loadContesters = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get('contesters/');
      const data = res.data?.results ?? res.data;
      setContesters(data);
      // Find the currently active one
      const active = data.find(c => c.active);
      setActiveContester(active || null);
    } catch (e) {
      console.error(e);
      setError('Unable to load contestants. Make sure you are logged in as main judge.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContesters();
  }, []);

  const handleSetActive = async (contesterId) => {
    try {
      setSettingActive(contesterId);
      setError('');
      await axios.post(`/api/contesters/${contesterId}/set_active/`);
      // Reload to get updated state
      await loadContesters();
    } catch (e) {
      console.error(e);
      const msg = e.response?.data?.detail || 'Failed to set active competitor.';
      setError(Array.isArray(msg) ? msg.join(' ') : String(msg));
    } finally {
      setSettingActive(null);
    }
  };

  const handleExportToExcel = async () => {
    try {
      setIsExporting(true);
      setError('');

      // Fetch full results data
      const res = await axios.get('contesters/results/');
      const results = res.data;

      // Create workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Rezultati Tekmovanja');

      // Add title
      worksheet.mergeCells('A1:K1');
      worksheet.getCell('A1').value = 'Rezultati Tekmovanja';
      worksheet.getCell('A1').font = { size: 16, bold: true };
      worksheet.getCell('A1').alignment = { horizontal: 'center' };

      // Add headers
      const headerRow = worksheet.addRow([
        'Štev. tekm.', 'Ime', 'Priimek', 'Klub', 'Skupina',
        'Najboljši rezultat', 'Povprečni rezultat', 'Skupno skokov',
        'Sodniki', 'Ocene po sklokih', 'Čas'
      ]);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Add data
      results.forEach(contester => {
        const judgesInfo = contester.judges.map(j =>
          `${j.judge_number}: ${j.rounds.map(r => `R${r.round_number}=${r.score}`).join(', ')}`
        ).join('\n');

        worksheet.addRow([
          contester.competitor_number,
          contester.name,
          contester.surname,
          contester.club,
          contester.group,
          contester.statistics.best_score,
          contester.statistics.average_score,
          contester.statistics.total_rounds,
          contester.judges.map(j => j.judge_number).join(', '),
          judgesInfo,
          new Date().toLocaleString('sl-SI')
        ]);
      });

      // Auto-size columns
      worksheet.columns.forEach(column => {
        column.width = 15;
      });
      worksheet.getColumn(10).width = 40; // Wider for scores details

      // Generate file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Rezultati_Tekmovanja_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

    } catch (e) {
      console.error(e);
      setError('Napaka pri izvozu v Excel. Poskusite ponovno.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleResetScores = async () => {
    try {
      setIsResetting(true);
      setError('');
      await axios.post('contesters/reset_all_scores/');
      setShowResetConfirm(false);
      // Reload contesters
      await loadContesters();
      alert('Vsi rezultati so bili uspešno ponastavljeni!');
    } catch (e) {
      console.error(e);
      const msg = e.response?.data?.detail || 'Napaka pri ponastavljanju rezultatov.';
      setError(Array.isArray(msg) ? msg.join(' ') : String(msg));
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto p-3 sm:p-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Nadzorna Plošča Glavnega Sodnika</h1>
            <p className="text-xs sm:text-sm text-gray-600">
              Sodnik: <strong>{judge?.name} {judge?.surname}</strong> ({judge?.judge_number})
            </p>
          </div>
          <div className="flex gap-2 sm:gap-3 text-xs sm:text-sm flex-wrap">
            <a href="/sojenje" className="text-blue-600 hover:underline whitespace-nowrap">Sojenje</a>
            <a href="/rezultati" className="text-blue-600 hover:underline whitespace-nowrap">Rezultati</a>
            <a href="/login" onClick={() => { localStorage.clear(); }} className="text-blue-600 hover:underline whitespace-nowrap">Odjava</a>
          </div>
        </header>

      {error && (
        <div className="p-3 sm:p-4 mb-4 border rounded-lg bg-red-50 border-red-200 text-red-700 text-sm sm:text-base">
          {error}
        </div>
      )}

      {activeContester && (
        <div className="p-4 sm:p-6 mb-4 sm:mb-6 border-2 border-green-500 rounded-lg bg-green-50 shadow-md">
          <div className="font-semibold text-sm sm:text-lg mb-2 text-green-700">Trenutno Aktivni Tekmovalec</div>
          <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-900">
            {activeContester.name} {activeContester.surname}
          </div>
          <div className="flex flex-wrap gap-2 mt-2 text-xs sm:text-sm text-gray-700">
            <span className="font-semibold">#{activeContester.competitor_number}</span>
            <span>•</span>
            <span>{activeContester.club}</span>
            <span>•</span>
            <span>{activeContester.group}</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-gray-600 text-sm sm:text-base">Nalaganje tekmovalcev...</div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-lg sm:text-xl font-semibold">Vsi Tekmovalci</h2>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={handleExportToExcel}
                disabled={isExporting || contesters.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 active:bg-green-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm sm:text-base inline-flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" x2="12" y1="15" y2="3"/>
                </svg>
                {isExporting ? 'Izvažam...' : 'Izvozi v Excel'}
              </button>
              <button
                onClick={() => setShowResetConfirm(true)}
                disabled={isResetting || contesters.length === 0}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 active:bg-red-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm sm:text-base inline-flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                  <path d="M3 3v5h5"/>
                </svg>
                Ponastavi rezultate
              </button>
            </div>
          </div>
          {contesters.length === 0 ? (
            <div className="p-4 sm:p-6 border rounded-lg bg-yellow-50 text-center text-sm sm:text-base">
              Ni tekmovalcev. Dodajte jih prek Django administracije.
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {contesters.map((contester) => {
                const isActive = contester.active;
                const isSetting = settingActive === contester.id;
                return (
                  <div
                    key={contester.id}
                    className={`p-4 sm:p-5 border-2 rounded-lg flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 shadow-sm transition-all ${
                      isActive ? 'bg-green-100 border-green-500' : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-base sm:text-lg">
                        {contester.name} {contester.surname}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-1 text-xs sm:text-sm text-gray-600">
                        <span className="font-semibold">#{contester.competitor_number}</span>
                        <span>•</span>
                        <span>{contester.club}</span>
                        <span>•</span>
                        <span>{contester.group}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSetActive(contester.id)}
                      disabled={isActive || isSetting}
                      className={`w-full sm:w-auto px-4 sm:px-5 py-3 sm:py-2 rounded-lg font-semibold text-sm sm:text-base whitespace-nowrap transition-colors ${
                        isActive
                          ? 'bg-green-600 text-white cursor-default'
                          : isSetting
                          ? 'bg-gray-400 text-white'
                          : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                      }`}
                    >
                      {isActive ? '✓ Aktiven' : isSetting ? 'Nastavljam...' : 'Nastavi kot aktivnega'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-red-600 mb-4">Pozor!</h3>
            <p className="text-gray-700 mb-6">
              Ali ste prepričani, da želite <strong>izbrisati vse rezultate</strong>?
              To bo trajno izbrisalo vse ocene vseh sodnikov za vse tekmovalce.
            </p>
            <p className="text-sm text-gray-600 mb-6">
              To dejanje je <strong>nepovratlivo</strong>. Priporočamo, da najprej izvozite rezultate v Excel.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                disabled={isResetting}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50"
              >
                Prekliči
              </button>
              <button
                onClick={handleResetScores}
                disabled={isResetting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                {isResetting ? 'Ponastavljam...' : 'Da, izbriši vse'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </Layout>
  );
}
