// src/components/JudgeScoringPanel.jsx
import React, { useState, useEffect } from 'react';
import axios from '../axios';

export default function JudgeScoringPanel() {
  const [auth, setAuth] = useState(() => {
    const saved = sessionStorage.getItem('judgeAuth');
    return saved ? JSON.parse(saved) : null;
  });
  const [judge, setJudge] = useState(null);
  const [contester, setContester] = useState(null);
  const [scores, setScores] = useState(Array(10).fill(''));
  const [submittedRounds, setSubmittedRounds] = useState(new Set());
  const [message, setMessage] = useState('');
  const [animation, setAnimation] = useState(false);

  useEffect(() => {
    if (!auth) return;

    axios.get('contesters/active/')
      .then(res => {
        if (res.data.length > 0) setContester(res.data[0]);
      });

    axios.get('ratings/', { auth })
      .then(res => {
        const rounds = new Set(res.data.map(r => r.round_number));
        setSubmittedRounds(rounds);
        if (res.data.length > 0) setJudge(res.data[0].judge);
      });
  }, [auth]);

  const handleScoreChange = (i, value) => {
    const updated = [...scores];
    updated[i] = value;
    setScores(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contester) return;

    try {
      for (let i = 0; i < 10; i++) {
        const score = parseFloat(scores[i]);
        if (!isNaN(score) && !submittedRounds.has(i + 1)) {
          await axios.post('ratings/', {
            contester: contester.id,
            round_number: i + 1,
            score
          }, { auth });
        }
      }
      setMessage('Scores submitted!');
      setAnimation(true);
      setTimeout(() => setAnimation(false), 1500);
      setScores(Array(10).fill(''));

      // refresh submitted
      const res = await axios.get('ratings/', { auth });
      setSubmittedRounds(new Set(res.data.map(r => r.round_number)));

    } catch (err) {
      setMessage('Error submitting: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const creds = {
      username: form.get('username'),
      password: form.get('password')
    };
    try {
      const res = await axios.get('ratings/', { auth: creds });
      sessionStorage.setItem('judgeAuth', JSON.stringify(creds));
      setAuth(creds);
    } catch {
      setMessage('Login failed');
    }
  };

  if (!auth) {
    return (
      <form onSubmit={handleLogin} className="max-w-md mx-auto p-4 border rounded shadow space-y-3">
        <h2 className="text-xl font-bold">Judge Login</h2>
        <input name="username" className="w-full p-2 border rounded" placeholder="Username" required />
        <input name="password" type="password" className="w-full p-2 border rounded" placeholder="Password" required />
        <button className="w-full bg-blue-600 text-white p-2 rounded">Login</button>
        {message && <p className="text-sm mt-2 text-center">{message}</p>}
      </form>
    );
  }

  return (
    <div className={`max-w-xl mx-auto p-4 border rounded shadow space-y-4 transition-opacity duration-500 ${animation ? 'opacity-30' : 'opacity-100'}`}>
      <h2 className="text-xl font-bold">Welcome, Judge {judge?.name} {judge?.surname}</h2>
      <p className="text-lg">Scoring: {contester?.name} {contester?.surname}</p>

      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        {scores.map((score, i) => (
          <div key={i} className="flex items-center space-x-2">
            <label className="w-24">Round {i + 1}:</label>
            <input
              type="number"
              step="0.1"
              value={score}
              disabled={submittedRounds.has(i + 1)}
              onChange={(e) => handleScoreChange(i, e.target.value)}
              className="flex-1 p-2 border rounded"
              required={!submittedRounds.has(i + 1)}
            />
            {submittedRounds.has(i + 1) && <span className="text-green-600">✓</span>}
          </div>
        ))}
        <button type="submit" className="w-full bg-green-600 text-white p-2 rounded">Submit Scores</button>
        {message && <p className="text-sm text-center mt-2">{message}</p>}
      </form>
    </div>
  );
}
