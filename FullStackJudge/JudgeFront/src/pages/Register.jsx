// src/pages/Register.jsx
import React, { useState } from 'react';
import axios, { getErrorMessage } from '../axios';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function Register() {
  const nav = useNavigate();
  const [formData, setFormData] = useState({
    password: '', password2: '', name: '', surname: '', email: '', judge_type: 'execution',
  });
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setStatus({ type: '', msg: '' });
    try {
      const { data } = await axios.post('auth/register/', formData);
      // persist auth
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('judge', JSON.stringify(data.judge));
      localStorage.setItem('username_hint', data.username); // show on login page later

      // Redirect based on judge type
      if (data.judge.is_main_judge) {
        nav('/main-judge', { replace: true });
      } else if (data.judge.judge_type === 'difficulty') {
        nav('/tezavnost', { replace: true });
      } else {
        nav('/sojenje', { replace: true });
      }
    } catch (err) {
      console.error(err);
      // Check for field-specific errors first, then use general error message
      const msg =
        err.response?.data?.non_field_errors ||
        err.response?.data?.password ||
        err.response?.data?.password2 ||
        getErrorMessage(err);
      setStatus({ type: 'error', msg: Array.isArray(msg) ? msg.join(' ') : String(msg) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      {/* Large Banner Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/30 to-primary/10" />
        <img
          src="/banner.webp"
          alt=""
          className="w-full h-full object-cover object-center opacity-40"
        />
        {/* Overlay gradient for better contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/40 to-background/60" />
      </div>

      {/* Register Card */}
      <Card className="w-full max-w-2xl mx-4 relative z-10 shadow-2xl border-border/50 backdrop-blur-sm bg-card/95">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-balance">Registracija sodnika</CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Uporabniško ime bo ustvarjeno samodejno iz vašega imena in priimka
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 rounded-lg border border-primary/20 bg-primary/10 p-3">
            <p className="text-sm text-center">
              Enkratna registracija omogoča hitrejši potek tekmovanja. Hvala za sodelovanje!
            </p>
          </div>

          {status.msg && (
            <div className={`mb-4 rounded-lg border p-3 ${
              status.type === 'error'
                ? 'bg-destructive/10 border-destructive/50 text-destructive'
                : 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
            }`}>
              <p className="text-sm">{status.msg}</p>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Name fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Ime</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Janez"
                  value={formData.name}
                  onChange={onChange}
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="surname" className="text-sm font-medium">Priimek</Label>
                <Input
                  id="surname"
                  name="surname"
                  placeholder="Novak"
                  value={formData.surname}
                  onChange={onChange}
                  required
                  className="h-11"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                E-pošta <span className="text-muted-foreground font-normal">(neobvezno)</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="janez.novak@example.com"
                value={formData.email}
                onChange={onChange}
                className="h-11"
              />
            </div>

            {/* Judge Type Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Tip sodnika</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, judge_type: 'execution' })}
                  className={`h-20 rounded-lg border-2 transition-all p-4 text-left ${
                    formData.judge_type === 'execution'
                      ? 'border-primary bg-primary/10 shadow-md'
                      : 'border-border hover:border-primary/50 hover:bg-accent/50'
                  }`}
                >
                  <div className="font-semibold text-base">Sodnik izvedbe</div>
                  <div className="text-xs text-muted-foreground mt-1">Ocenjujete skoke (10 krogov)</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, judge_type: 'difficulty' })}
                  className={`h-20 rounded-lg border-2 transition-all p-4 text-left ${
                    formData.judge_type === 'difficulty'
                      ? 'border-primary bg-primary/10 shadow-md'
                      : 'border-border hover:border-primary/50 hover:bg-accent/50'
                  }`}
                >
                  <div className="font-semibold text-base">Sodnik težavnosti</div>
                  <div className="text-xs text-muted-foreground mt-1">Ocenjujete težavnost (0.000-50.000)</div>
                </button>
              </div>
            </div>

            <div className="relative group space-y-2">

            {/* Password fields */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Geslo</Label>
              <Input
                id="password"
                type="password"
                name="password"
                placeholder=""
                value={formData.password}
                onChange={onChange}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password2" className="text-sm font-medium">Potrdi geslo</Label>
              <Input
                id="password2"
                type="password"
                name="password2"
                placeholder=""
                value={formData.password2}
                onChange={onChange}
                required
                className="h-11"
              />

              {/* Password requirements tooltip */}
              <div className="absolute left-0 top-full mt-2 w-full sm:w-96  p-4 bg-gray-50 text-xs rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-20 border border-border">
                <p className="font-semibold mb-2">Zahteve za geslo:</p>
                <ul className="space-y-1.5 pl-4">
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Minimalna dolžina — geslo mora imeti vsaj 8 znakov</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Ne sme biti preveč podobno uporabniškemu imenu ali e-pošti</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Ne sme biti pogosto uporabljeno geslo</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Mora vsebovati vsaj en ne-številski znak</span>
                  </li>
                </ul>
              </div>
            </div>
            </div>

            <Button
              disabled={loading}
              type="submit"
              className="w-full h-11 transition-colors border hover:bg-sky-200 text-base font-medium"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-75" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-25" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Ustvarjam…
                </span>
              ) : (
                'Ustvari račun'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            Že imate račun?{' '}
            <Link to="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
              Prijava
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
