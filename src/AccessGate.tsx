import { useEffect, useState, type FormEvent } from 'react';
import App from './App';

export default function AccessGate() {
  const [state, setState] = useState<'loading' | 'setup' | 'login' | 'ready'>('loading');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    fetch('/api/auth/status', { cache: 'no-store' }).then(r => {
      if (!r.ok) throw Error();
      return r.json();
    }).then(s => setState(!s.configured ? 'setup' : s.authenticated ? 'ready' : 'login'))
      .catch(() => { setError('Connexion indisponible. Recharge la page pour réessayer.'); setState('login'); });
  }, []);
  async function login(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || 'Connexion refusée.');
      setPassword(''); setState('ready');
    } catch (e) { setError(e instanceof Error ? e.message : 'Connexion refusée.'); }
    finally { setBusy(false); }
  }
  async function logout() {
    setBusy(true);
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) throw Error();
      window.location.reload();
    } catch { setError('Déconnexion non confirmée. Réessaie.'); setBusy(false); }
  }
  if (state === 'ready') return <><div className="bg-slate-950 text-slate-300 flex justify-end items-center gap-4 px-5 py-2 text-sm"><span>Accès privé Sitra</span><button onClick={logout} disabled={busy} className="underline">Se déconnecter</button>{error && <span role="alert">{error}</span>}</div><App /></>;
  return <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6"><section className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-8 shadow-xl"><p className="text-purple-400 text-sm mb-3">SITRA · VOIX OFF</p><h1 className="text-2xl font-semibold mb-3">Accès privé</h1>{state === 'loading' ? <p>Vérification de l’accès…</p> : state === 'setup' ? <p>La protection doit être configurée par le propriétaire avant toute génération.</p> : <form onSubmit={login}><p className="text-slate-400 mb-6">Connecte-toi pour utiliser ton application.</p><label htmlFor="private-password" className="block mb-2">Mot de passe</label><input id="private-password" type="password" autoComplete="current-password" required minLength={14} maxLength={256} value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-lg bg-slate-950 border border-slate-600 p-3 mb-4" /><button disabled={busy} className="w-full rounded-lg bg-purple-600 p-3 font-semibold disabled:opacity-50">{busy ? 'Connexion…' : 'Se connecter'}</button></form>}{error && <p role="alert" className="text-red-300 mt-4">{error}</p>}</section></main>;
}
