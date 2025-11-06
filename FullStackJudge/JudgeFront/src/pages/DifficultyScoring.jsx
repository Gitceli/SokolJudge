import React, { useEffect, useState, useMemo } from 'react';
import axios from '../axios';
import Layout from '../components/Layout';

export default function DifficultyScoring() {
  const judge = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('judge') || '{}'); } catch { return {}; }
  }, []);

  const [active, setActive] = useState(null);
  const [difficulty, setDifficulty] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [myScore, setMyScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadActiveContester = async () => {
      try {
        setError('');
        const [activeRes, myScores] = await Promise.all([
          axios.get('contesters/active/'),
          axios.get('difficulty-scores/')
        ]);

        const theActive = (activeRes.data?.results ?? activeRes.data)[0] || null;

        if (mounted) {
          setActive(prevActive => {
            // If active competitor changed, reset form
            if (!prevActive || !theActive) return theActive;
            if (prevActive.id !== theActive.id) {
              setDifficulty('');
              setSubmitted(false);
              setMyScore(null);
              return theActive;
            }
            return prevActive;
          });

          // Check if we already scored this contester
          if (theActive && myScores.data?.results) {
            const existing = myScores.data.results.find(s => s.contester === theActive.id);
            if (existing) {
              setSubmitted(true);
              setMyScore(existing);
              setDifficulty(existing.difficulty);
            }
          }
        }
      } catch (e) {
        console.error(e);
        if (mounted) setError('Napaka pri nalaganju tekmovalca.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadActiveContester();
    // Poll every 3 seconds for active competitor updates
    const intervalId = setInterval(loadActiveContester, 3000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!active) {
      setError('Ni aktivnega tekmovalca.');
      return;
    }

    const val = parseFloat(difficulty);
    if (isNaN(val) || val < 0 || val > 50) {
      setError('Težavnost mora biti med 0.000 in 50.000');
      return;
    }

    try {
      setError('');
      await axios.post('difficulty-scores/', {
        contester: active.id,
        difficulty: val.toFixed(3),
      });
      setSubmitted(true);
      setMyScore({ difficulty: val.toFixed(3) });
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.non_field_errors?.[0] ||
                  err.response?.data?.detail ||
                  'Napaka pri oddaji ocene.';
      setError(msg);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Ocenjevanje težavnosti</h1>
            <p className="text-sm text-gray-600">
              Sodnik: <strong>{judge?.name} {judge?.surname}</strong> ({judge?.judge_number})
            </p>
          </div>
          <div className="flex gap-3 text-sm flex-wrap">
            <a href="/rezultati" className="text-blue-600 hover:underline whitespace-nowrap">Rezultati</a>
            <a href="/login" onClick={() => { localStorage.clear(); }} className="text-blue-600 hover:underline whitespace-nowrap">
              Odjava
            </a>
          </div>
        </header>

        {error && (
          <div className="p-3 mb-4 border rounded bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center text-gray-600">
            <div className="text-xl">Nalaganje...</div>
          </div>
        ) : !active ? (
          <div className="p-8 text-center border rounded bg-yellow-50">
            <div className="text-xl font-semibold">Ni aktivnega tekmovalca</div>
            <p className="text-gray-600 mt-2">Počakajte, da glavni sodnik izbere tekmovalca.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active Competitor Info */}
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h2 className="text-xl font-bold mb-4">Aktivni tekmovalec</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Številka:</span>
                  <span className="ml-2 font-semibold">{active.competitor_number}</span>
                </div>
                <div>
                  <span className="text-gray-600">Ime:</span>
                  <span className="ml-2 font-semibold">{active.name} {active.surname}</span>
                </div>
                <div>
                  <span className="text-gray-600">Klub:</span>
                  <span className="ml-2 font-semibold">{active.club}</span>
                </div>
                <div>
                  <span className="text-gray-600">Skupina:</span>
                  <span className="ml-2 font-semibold">{active.group}</span>
                </div>
              </div>
            </div>

            {/* Difficulty Score Form */}
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h2 className="text-xl font-bold mb-4">Ocena težavnosti</h2>

              {submitted && myScore ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <div className="text-sm text-green-600 font-semibold mb-2">Oddana ocena</div>
                  <div className="text-4xl font-bold text-green-700">{parseFloat(myScore.difficulty).toFixed(3)}</div>
                  <p className="text-sm text-gray-600 mt-2">Uspešno ste oddali oceno težavnosti za tega tekmovalca.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Težavnost (0.000 - 50.000)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      max="50"
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      placeholder="npr. 12.500"
                      className="w-full p-4 text-2xl border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      inputMode="decimal"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Vnesite oceno z do tremi decimalkami (npr. 12.500, 25.123)
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors text-lg shadow-md"
                  >
                    Oddaj oceno težavnosti
                  </button>
                </form>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Navodilo:</strong> Kot sodnik težavnosti ocenjujete samo težavnost elementa.
                Vsak tekmovalec prejme eno oceno težavnosti v obsegu od 0.000 do 50.000.
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
