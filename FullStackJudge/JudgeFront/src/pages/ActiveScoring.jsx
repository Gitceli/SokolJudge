import React, { useEffect, useMemo, useState, useRef } from 'react';
import axios, { getErrorMessage } from '../axios';
import Layout from '../components/Layout';

export default function ActiveScoring() {
  const judge = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('judge') || '{}'); } catch { return {}; }
  }, []);

  const [active, setActive] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  // 10 jumps + 1 landing, each with score and deduction
  const [jumpScores, setJumpScores] = useState(Array(10).fill(''));
  const [jumpDeductions, setJumpDeductions] = useState(Array(10).fill(''));
  const [landingScore, setLandingScore] = useState('');
  const [landingDeduction, setLandingDeduction] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Refs for auto-focus navigation (10 jumps * 2 fields + 1 landing * 2 fields = 22 inputs)
  const inputRefs = useRef([]);

  // Load active contester
  useEffect(() => {
    let mounted = true;

    const loadActiveContester = async () => {
      try {
        const [activeRes, myRatings] = await Promise.all([
          axios.get('contesters/active/'),
          axios.get('ratings/')
        ]);
        const theActive = (activeRes.data?.results ?? activeRes.data)[0] || null;

        if (mounted) {
          setActive(prevActive => {
            if (!prevActive || !theActive) return theActive;
            if (prevActive.id !== theActive.id) {
              // Reset all scores when competitor changes
              setJumpScores(Array(10).fill(''));
              setJumpDeductions(Array(10).fill(''));
              setLandingScore('');
              setLandingDeduction('');
              setSubmitted(false);
              setSuccess('');
              setError('');
              return theActive;
            }
            return prevActive;
          });

          // Check if this contester has already been scored by this judge
          if (theActive && myRatings.data?.results) {
            const hasScored = myRatings.data.results.some(r => r.contester === theActive.id);
            setSubmitted(hasScored);
          }
        }
      } catch (e) {
        console.error(e);
        if (mounted) setError('Napaka pri nalaganju tekmovalca.');
      }
    };

    loadActiveContester();
    const intervalId = setInterval(loadActiveContester, 3000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  // Handle keyboard navigation
  // Tab = move right (horizontally) - uses browser default behavior
  // Enter = move down (vertically to next jump's score field)
  const handleKeyDown = (e, currentIndex) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Move vertically down to next jump
      // If we're on a score field (even index), go to next score field (+2)
      // If we're on a deduction field (odd index), go to next score field (+1)
      const isScoreField = currentIndex % 2 === 0;
      const nextIndex = isScoreField ? currentIndex + 2 : currentIndex + 1;

      console.log('Enter pressed. Current index:', currentIndex, 'Is score field:', isScoreField, 'Next index:', nextIndex);

      if (nextIndex < inputRefs.current.length && inputRefs.current[nextIndex]) {
        inputRefs.current[nextIndex].focus();
        console.log('Focused on index:', nextIndex);
      } else {
        console.log('No valid next input found');
      }
    }
  };

  const handleSubmitAll = async (e) => {
    e.preventDefault();
    if (!active) {
      setError('Ni aktivnega tekmovalca.');
      return;
    }

    // Allow re-submission to correct scores
    if (submitted) {
      const confirmResubmit = window.confirm(
        'Ste že oddali ocene za tega tekmovalca. Ali želite posodobiti ocene?'
      );
      if (!confirmResubmit) {
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setError('');
      setSuccess('');

      // Submit all 10 jumps
      const promises = [];
      for (let i = 0; i < 10; i++) {
        const roundNumber = i + 1;
        const score = parseFloat(jumpScores[i]) || 0;
        const deductionInt = parseInt(jumpDeductions[i]) || 0;
        const deductionValue = deductionInt / 10;

        // For round 10, include the landing score and deduction
        const isLastRound = i === 9;
        const landingScoreValue = isLastRound ? (parseFloat(landingScore) || 0) : 0;
        const landingDeductionInt = isLastRound ? (parseInt(landingDeduction) || 0) : 0;
        const landingDeductionValue = landingDeductionInt / 10;

        // Total deduction is jump deduction + landing deduction (for round 10)
        const totalDeduction = isLastRound ? deductionValue + landingDeductionValue : deductionValue;

        promises.push(
          axios.post('ratings/', {
            contester: active.id,
            judge_id: judge.id,
            round_number: roundNumber,
            score: score,
            landing_score: landingScoreValue,
            deduction: totalDeduction,
          })
        );
      }

      await Promise.all(promises);

      const wasAlreadySubmitted = submitted;
      setSubmitted(true);
      setSuccess(wasAlreadySubmitted ? 'Ocene so bile uspešno posodobljene!' : 'Vse ocene so bile uspešno oddane!');

      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      console.error('Full error:', err);
      console.error('Error response:', err.response?.data);
      // Check for field-specific errors first, then use general error handler
      const msg = err.response?.data?.non_field_errors ||
                  getErrorMessage(err);
      setError(Array.isArray(msg) ? msg.join(' ') : String(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-3 sm:p-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Sojenje v teku</h1>
            <p className="text-xs sm:text-sm text-gray-600">
              Sodnik: <strong>{judge?.name} {judge?.surname}</strong> ({judge?.judge_number})
            </p>
          </div>
          <div className="flex gap-2 sm:gap-3 text-xs sm:text-sm flex-wrap">
            <a href="/rezultati" className="text-blue-600 hover:underline whitespace-nowrap">Rezultati</a>
            {judge?.is_main_judge && <a href="/main-judge" className="text-blue-600 hover:underline whitespace-nowrap">Nadzorna plošča</a>}
            <a href="/login" onClick={() => { localStorage.clear(); }} className="text-blue-600 hover:underline whitespace-nowrap">Odjava</a>
          </div>
        </header>

        {!active ? (
          <div className="p-4 border rounded-lg bg-yellow-50 text-center">
            <p className="text-sm sm:text-base">
              {error || 'Ni aktivnega tekmovalca. Počakajte, da ga aktivira administrator…'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Active Competitor Info */}
            <div className="p-4 sm:p-6 border-2 rounded-lg bg-white shadow-sm">
              <div className="text-sm sm:text-base font-semibold text-gray-600 mb-2">Aktivni Tekmovalec</div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2">
                {active.name} {active.surname}
              </h2>
              <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                <span className="font-semibold">#{active.competitor_number}</span>
                <span>•</span>
                <span>{active.club}</span>
                <span>•</span>
                <span>{active.group}</span>
              </div>
            </div>

            {/* Success Message */}
            {success && (
              <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg text-green-700 font-semibold text-center">
                ✓ {success}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Scoring Form */}
            {submitted ? (
              <div className="p-8 text-center border-2 rounded-lg bg-green-50 border-green-300">
                <div className="text-xl font-bold text-green-700 mb-2">✓ Ocene oddane</div>
                <p className="text-gray-600">Uspešno ste oddali vse ocene za tega tekmovalca.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitAll}>
                <div className="bg-white border-2 rounded-lg shadow-sm overflow-hidden">
                  {/* Instructions */}
                  <div className="p-4 bg-blue-50 border-b">
                    <p className="text-sm text-blue-800">
                      <strong>Navodila:</strong> Vnesite ocene za vse skoke (10 skokov) in pristanek.
                      Pritisk tipke Enter/Tab vas premakne na naslednje polje. <br />
                      Odbitki se vnašajo kot cela števila (npr. 5 = 0.5 odbitka).
                    </p>
                  </div>

                  {/* Table for desktop, cards for mobile */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100 border-b-2">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Skok</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Ocena skoka</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Odbitek (0-9)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* 10 Jumps */}
                        {[...Array(10)].map((_, i) => {
                          const refIndex = i * 2;
                          return (
                            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-4 py-3 font-semibold text-gray-700">Skok {i + 1}</td>
                              <td className="px-4 py-3">
                                <input
                                  ref={el => inputRefs.current[refIndex] = el}
                                  type="number"
                                  step="0.001"
                                  min="0"
                                  max="30"
                                  inputMode="decimal"
                                  value={jumpScores[i]}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (e.target.value === '' || (val >= 0 && val <= 30)) {
                                      const copy = [...jumpScores];
                                      copy[i] = e.target.value;
                                      setJumpScores(copy);
                                    }
                                  }}
                                  onKeyDown={(e) => handleKeyDown(e, refIndex)}
                                  className="w-full p-2 border-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="0.000"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  ref={el => inputRefs.current[refIndex + 1] = el}
                                  type="number"
                                  step="1"
                                  min="0"
                                  max="9"
                                  inputMode="numeric"
                                  value={jumpDeductions[i]}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= 9)) {
                                      const copy = [...jumpDeductions];
                                      copy[i] = val;
                                      setJumpDeductions(copy);
                                    }
                                  }}
                                  onKeyDown={(e) => handleKeyDown(e, refIndex + 1)}
                                  className="w-24 p-2 border-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="0"
                                />
                                {jumpDeductions[i] && (
                                  <span className="ml-2 text-sm text-gray-500">= {(parseInt(jumpDeductions[i]) / 10).toFixed(1)}</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}

                        {/* Landing (Row 11) */}
                        <tr className="bg-blue-50 border-t-2 border-blue-300">
                          <td className="px-4 py-3 font-bold text-blue-900">Doskok</td>
                          <td className="px-4 py-3">
                            <input
                              ref={el => inputRefs.current[20] = el}
                              type="number"
                              step="0.001"
                              min="0"
                              max="30"
                              inputMode="decimal"
                              value={landingScore}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (e.target.value === '' || (val >= 0 && val <= 30)) {
                                  setLandingScore(e.target.value);
                                }
                              }}
                              onKeyDown={(e) => handleKeyDown(e, 20)}
                              className="w-full p-2 border-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="0.000"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              ref={el => inputRefs.current[21] = el}
                              type="number"
                              step="1"
                              min="0"
                              max="9"
                              inputMode="numeric"
                              value={landingDeduction}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= 9)) {
                                  setLandingDeduction(val);
                                }
                              }}
                              onKeyDown={(e) => handleKeyDown(e, 21)}
                              className="w-24 p-2 border-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="0"
                            />
                            {landingDeduction && (
                              <span className="ml-2 text-sm text-gray-500">= {(parseInt(landingDeduction) / 10).toFixed(1)}</span>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="md:hidden divide-y">
                    {/* 10 Jumps */}
                    {[...Array(10)].map((_, i) => {
                      const refIndex = i * 2;
                      return (
                        <div key={i} className="p-4 space-y-3">
                          <div className="font-bold text-lg text-gray-800 mb-3">Skok {i + 1}</div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ocena skoka</label>
                            <input
                              ref={el => inputRefs.current[refIndex] = el}
                              type="number"
                              step="0.001"
                              min="0"
                              max="30"
                              inputMode="decimal"
                              value={jumpScores[i]}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (e.target.value === '' || (val >= 0 && val <= 30)) {
                                  const copy = [...jumpScores];
                                  copy[i] = e.target.value;
                                  setJumpScores(copy);
                                }
                              }}
                              onKeyDown={(e) => handleKeyDown(e, refIndex)}
                              className="w-full p-3 text-lg border-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="0.000"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Odbitek (0-9)
                              {jumpDeductions[i] && <span className="ml-2 text-blue-600">= {(parseInt(jumpDeductions[i]) / 10).toFixed(1)}</span>}
                            </label>
                            <input
                              ref={el => inputRefs.current[refIndex + 1] = el}
                              type="number"
                              step="1"
                              min="0"
                              max="9"
                              inputMode="numeric"
                              value={jumpDeductions[i]}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= 9)) {
                                  const copy = [...jumpDeductions];
                                  copy[i] = val;
                                  setJumpDeductions(copy);
                                }
                              }}
                              onKeyDown={(e) => handleKeyDown(e, refIndex + 1)}
                              className="w-full p-3 text-lg border-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      );
                    })}

                    {/* Landing */}
                    <div className="p-4 space-y-3 bg-blue-50">
                      <div className="font-bold text-lg text-blue-900 mb-3">Pristanek</div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ocena pristanka</label>
                        <input
                          ref={el => inputRefs.current[20] = el}
                          type="number"
                          step="0.001"
                          min="0"
                          max="30"
                          inputMode="decimal"
                          value={landingScore}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (e.target.value === '' || (val >= 0 && val <= 30)) {
                              setLandingScore(e.target.value);
                            }
                          }}
                          onKeyDown={(e) => handleKeyDown(e, 20)}
                          className="w-full p-3 text-lg border-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.000"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Odbitek (0-9)
                          {landingDeduction && <span className="ml-2 text-blue-600">= {(parseInt(landingDeduction) / 10).toFixed(1)}</span>}
                        </label>
                        <input
                          ref={el => inputRefs.current[21] = el}
                          type="number"
                          step="1"
                          min="0"
                          max="9"
                          inputMode="numeric"
                          value={landingDeduction}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= 9)) {
                              setLandingDeduction(val);
                            }
                          }}
                          onKeyDown={(e) => handleKeyDown(e, 21)}
                          className="w-full p-3 text-lg border-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-4 text-lg font-bold rounded-lg transition-colors shadow-lg ${
                      isSubmitting
                        ? 'bg-blue-400 text-white cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                    }`}
                  >
                    {isSubmitting ? 'Oddajam vse ocene...' : 'Oddaj vse ocene'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
