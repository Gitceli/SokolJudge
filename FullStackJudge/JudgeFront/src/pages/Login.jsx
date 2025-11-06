// src/pages/Login.jsx
import { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios, { getErrorMessage } from '../axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function Login() {
  const nav = useNavigate();
  const hint = useMemo(() => localStorage.getItem('username_hint') || '', []);
  const [form, setForm] = useState({ username: '', password: '' });
  const [err, setErr] = useState('');

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      // DRF authtoken login (now uses /api/ base URL from axios config)
      const { data } = await axios.post('token-auth/', form);
      localStorage.setItem('auth_token', data.token);

      // fetch judge profile
      const me = await axios.get('auth/me/');
      localStorage.setItem('judge', JSON.stringify(me.data));

      // Redirect based on judge type
      if (me.data.is_main_judge) {
        nav('/main-judge', { replace: true });
      } else if (me.data.judge_type === 'difficulty') {
        nav('/tezavnost', { replace: true });
      } else {
        nav('/sojenje', { replace: true });
      }
    } catch (e) {
      console.error(e);
      // Use helper function for user-friendly error messages
      setErr(getErrorMessage(e));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/30 to-primary/10" />
        <img
          src="/banner.webp"
          alt=""
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/40 to-background/60" />
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md mx-4 relative z-10 shadow-2xl border-border/50 backdrop-blur-sm bg-card/95">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6 text-primary-foreground"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" x2="3" y1="12" y2="12" />
              </svg>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-balance">Prijava</CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Vnesite svoje podatke za dostop (sodnik)
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Optional username hint */}
          {hint && (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950 p-3">
              <p className="text-sm text-emerald-900 dark:text-emerald-100">
                Namig: <code className="font-mono font-bold">{hint}</code>
              </p>
            </div>
          )}

          {/* Error message */}
          {err && (
            <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{err}</p>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">Uporabniško ime</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="janeznovak"
                value={form.username}
                onChange={onChange}
                required
                className="h-11 font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Vaše ime + priimek (vse z malo). Primer: Janez Novak → <span className="font-mono">janeznovak</span>
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Geslo</Label>
                {/* Wire later if needed */}
                <a href="#" className="text-sm text-primary hover:text-primary/80 transition-colors">
                  Pozabljeno geslo?
                </a>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={onChange}
                required
                className="h-11"
              />
            </div>

            <Button type="submit" className="w-full h-11 text-base font-medium">
              Prijava
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            Nov sodnik?{' '}
            <Link to="/register" className="text-primary hover:text-primary/80 font-medium transition-colors">
              Ustvari račun
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
