import React, { useEffect, useState, useMemo } from 'react';
import axios from '../axios';
import Layout from '../components/Layout';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export default function Rezultati() {
  const judge = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('judge') || '{}'); } catch { return {}; }
  }, []);

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedView, setSelectedView] = useState('overview'); // overview, individual
  const [selectedContester, setSelectedContester] = useState(null);

  const loadResults = async () => {
    try {
      setError('');
      const res = await axios.get('contesters/results/');
      setResults(res.data);
    } catch (e) {
      console.error(e);
      setError('Unable to load results.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResults();
    // Poll every 5 seconds for real-time updates
    const intervalId = setInterval(loadResults, 5000);
    return () => clearInterval(intervalId);
  }, []);

  // Prepare data for overview bar chart (best scores)
  const overviewData = results
    .filter(c => c.statistics.total_rounds > 0)
    .sort((a, b) => b.statistics.best_score - a.statistics.best_score)
    .map(c => ({
      name: `${c.name} ${c.surname}`,
      bestScore: c.statistics.best_score,
      avgScore: c.statistics.average_score,
      competitor_number: c.competitor_number,
      id: c.id
    }));

  // Prepare data for individual competitor line chart
  const getIndividualData = (contester) => {
    if (!contester) return [];

    // Get all rounds across all judges
    const roundsMap = {};
    contester.judges.forEach(judge => {
      judge.rounds.forEach(round => {
        if (!roundsMap[round.round_number]) {
          roundsMap[round.round_number] = { round: round.round_number };
        }
        roundsMap[round.round_number][judge.judge_number] = round.score;
      });
    });

    return Object.values(roundsMap).sort((a, b) => a.round - b.round);
  };

  const renderOverviewChart = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white p-4 sm:p-6 rounded-lg border shadow-sm">
        <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Najboljši Rezultati po Tekmovalcih</h2>
        <ResponsiveContainer width="100%" height={300} className="sm:h-96">
          <BarChart data={overviewData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="competitor_number" label={{ value: 'Št. tekmovalca', position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: 'Točke', angle: -90, position: 'insideLeft' }} />
            <Tooltip content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white p-3 border rounded shadow-lg">
                    <p className="font-semibold">{payload[0].payload.name}</p>
                    <p className="text-sm text-blue-600">Najboljši: {payload[0].value}</p>
                    <p className="text-sm text-green-600">Povprečje: {payload[0].payload.avgScore}</p>
                  </div>
                );
              }
              return null;
            }} />
            <Legend />
            <Bar dataKey="bestScore" name="Najboljši rezultat" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-lg border shadow-sm">
        <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Povprečni Rezultati</h2>
        <ResponsiveContainer width="100%" height={300} className="sm:h-96">
          <BarChart data={overviewData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="competitor_number" label={{ value: 'Številka tekmovalca', position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: 'Točke', angle: -90, position: 'insideLeft' }} />
            <Tooltip content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white p-3 border rounded shadow-lg">
                    <p className="font-semibold">{payload[0].payload.name}</p>
                    <p className="text-sm text-green-600">Povprečje: {payload[0].value}</p>
                  </div>
                );
              }
              return null;
            }} />
            <Legend />
            <Bar dataKey="avgScore" name="Povprečni rezultat" fill="#10B981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-lg border shadow-sm">
        <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Izberi Tekmovalca za Podrobnosti</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {results
            .filter(c => c.statistics.total_rounds > 0)
            .sort((a, b) => a.competitor_number.localeCompare(b.competitor_number))
            .map(contester => (
              <button
                key={contester.id}
                onClick={() => {
                  setSelectedContester(contester);
                  setSelectedView('individual');
                }}
                className="p-4 border-2 rounded-lg hover:bg-blue-50 hover:border-blue-500 border-gray-200 text-left transition-all shadow-sm"
              >
                <div className="font-semibold text-sm sm:text-base">#{contester.competitor_number} - {contester.name} {contester.surname}</div>
                <div className="text-xs sm:text-sm text-gray-600 mt-1">{contester.club}</div>
                <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 text-xs sm:text-sm mt-2">
                  <span className="text-blue-600 font-semibold">Najboljši: {contester.statistics.best_score}</span>
                  <span className="hidden sm:inline">|</span>
                  <span className="text-green-600 font-semibold">Povprečje: {contester.statistics.average_score}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Skokov: {contester.statistics.total_rounds}
                </div>
              </button>
            ))}
        </div>
      </div>
    </div>
  );

  const renderIndividualChart = () => {
    if (!selectedContester) return null;

    const data = getIndividualData(selectedContester);
    const judges = selectedContester.judges;

    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">
              {selectedContester.name} {selectedContester.surname}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 flex flex-wrap gap-2">
              <span className="font-semibold">#{selectedContester.competitor_number}</span>
              <span>•</span>
              <span>{selectedContester.club}</span>
              <span>•</span>
              <span>{selectedContester.group}</span>
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedView('overview');
              setSelectedContester(null);
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 active:bg-gray-800 text-sm sm:text-base whitespace-nowrap"
          >
            ← Nazaj na pregled
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-600 font-semibold">Najboljši rezultat</div>
            <div className="text-3xl font-bold text-blue-700">{selectedContester.statistics.best_score}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-sm text-green-600 font-semibold">Povprečni rezultat</div>
            <div className="text-3xl font-bold text-green-700">{selectedContester.statistics.average_score}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="text-sm text-purple-600 font-semibold">Skupno skokov</div>
            <div className="text-3xl font-bold text-purple-700">{selectedContester.statistics.total_rounds}</div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Rezultati po Skokih in Sodnikih</h3>
          <ResponsiveContainer width="100%" height={300} className="sm:h-96">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="round" label={{ value: 'Skok', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Točke', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              {judges.map((judge, idx) => (
                <Line
                  key={judge.judge_number}
                  type="monotone"
                  dataKey={judge.judge_number}
                  name={`${judge.judge_number} (${judge.judge_name})`}
                  stroke={COLORS[idx % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Tabela Rezultatov</h3>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full border-collapse text-sm sm:text-base">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 sm:p-3 text-left text-xs sm:text-sm sticky left-0 bg-gray-100">Skok</th>
                  {judges.map(judge => (
                    <th key={judge.judge_number} className="border p-2 sm:p-3 text-xs sm:text-sm">
                      {judge.judge_number}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map(row => (
                  <tr key={row.round} className="hover:bg-gray-50">
                    <td className="border p-2 sm:p-3 font-semibold text-xs sm:text-sm sticky left-0 bg-white">Skok {row.round}</td>
                    {judges.map(judge => (
                      <td key={judge.judge_number} className="border p-2 sm:p-3 text-center">
                        {row[judge.judge_number] !== undefined ? (
                          <span className="font-semibold text-blue-600 text-sm sm:text-base">{row[judge.judge_number]}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-3 sm:p-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Rezultati Tekmovanja</h1>
            {judge?.id ? (
              <p className="text-xs sm:text-sm text-gray-600">
                Sodnik: <strong>{judge?.name} {judge?.surname}</strong> ({judge?.judge_number})
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-gray-600">
                Ogled rezultatov v živo
              </p>
            )}
          </div>
          <div className="flex gap-2 sm:gap-3 text-xs sm:text-sm flex-wrap">
            {judge?.id ? (
              <>
                {judge?.is_main_judge ? (
                  <a href="/main-judge" className="text-blue-600 hover:underline whitespace-nowrap">Nadzorna plošča</a>
                ) : (
                  <a href="/sojenje" className="text-blue-600 hover:underline whitespace-nowrap">Sojenje</a>
                )}
                <a href="/login" onClick={() => { localStorage.clear(); }} className="text-blue-600 hover:underline whitespace-nowrap">
                  Odjava
                </a>
              </>
            ) : (
              <a href="/login" className="text-blue-600 hover:underline whitespace-nowrap">
                Prijava
              </a>
            )}
          </div>
        </header>

      {error && (
        <div className="p-3 mb-4 border rounded bg-red-50 text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-gray-600">
          <div className="text-xl">Nalaganje rezultatov...</div>
        </div>
      ) : results.length === 0 ? (
        <div className="p-8 text-center border rounded bg-yellow-50">
          <div className="text-xl font-semibold">Ni rezultatov</div>
          <p className="text-gray-600 mt-2">Počakajte, da sodniki začnejo ocenjevati tekmovalce.</p>
        </div>
      ) : (
        <>
          {selectedView === 'overview' ? renderOverviewChart() : renderIndividualChart()}
        </>
      )}
      </div>
    </Layout>
  );
}
