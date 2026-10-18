import { createHash, createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import express from 'express';

const scrypt = promisify(scryptCallback);
const COOKIE = '__Host-voiceoff';
const SESSION_SECONDS = 8 * 60 * 60;
const digest = value => createHash('sha256').update(value).digest('hex');
const equal = (a, b) => typeof a === 'string' && typeof b === 'string' && a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

export async function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 14 || password.length > 256) throw Error('Choisis un mot de passe entre 14 et 256 caractères.');
  const salt = randomBytes(24).toString('hex');
  const key = await scrypt(password, salt, 64);
  return `scrypt:${salt}:${key.toString('hex')}`;
}

export function installAccess(app, env = process.env, now = Date.now) {
  const passwordHash = env.AUTH_PASSWORD_HASH || '';
  const secret = env.AUTH_SESSION_SECRET || '';
  const automationHash = env.AUTH_AUTOMATION_TOKEN_HASH || '';
  const configured = /^scrypt:[a-f0-9]{48}:[a-f0-9]{128}$/.test(passwordHash) && /^[a-f0-9]{64,}$/.test(secret) && /^[a-f0-9]{64}$/.test(automationHash);
  const production = env.NODE_ENV !== 'test';
  const cookieName = production ? COOKIE : 'voiceoff-local';
  const cookieOptions = { httpOnly: true, secure: production, sameSite: 'strict', path: '/' };
  const additionalOrigins = [env.APP_URL, ...(env.AUTH_ALLOWED_ORIGINS || '').split(',')].filter(Boolean).flatMap(value => {
    try { const u = new URL(value); return u.protocol === 'https:' ? [u.origin] : []; } catch { return []; }
  });
  const attempts = new Map();
  let globalAttempts = [];
  const windowMs = 15 * 60 * 1000;
  const sign = body => createHmac('sha256', secret).update(body).digest('base64url');
  const session = req => {
    if (!configured) return false;
    const values = String(req.headers.cookie || '').split(';').map(v => v.trim()).filter(v => v.startsWith(`${cookieName}=`));
    if (values.length !== 1) return false;
    const token = values[0].slice(cookieName.length + 1);
    if (token.length > 1024) return false;
    const parts = token.split('.');
    if (parts.length !== 2 || !equal(sign(parts[0]), parts[1])) return false;
    try {
      const data = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
      const seconds = Math.floor(now() / 1000);
      return data.role === 'owner' && Number.isInteger(data.exp) && Number.isInteger(data.iat) && data.exp > seconds && data.iat <= seconds && data.exp - data.iat === SESSION_SECONDS;
    } catch { return false; }
  };
  const sameOrigin = req => {
    if (req.headers['sec-fetch-site'] === 'cross-site') return false;
    if (!req.headers.origin) return true;
    const allowed = production ? `https://${req.get('host')}` : `http://${req.get('host')}`;
    return req.headers.origin === allowed || additionalOrigins.includes(req.headers.origin);
  };
  const apiError = (res, status, error) => res.status(status).json({ error });
  app.disable('x-powered-by');
  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    next();
  });
  app.get('/api/auth/status', (req, res) => res.json({ configured, authenticated: session(req) }));
  app.post('/api/auth/login', express.json({ limit: '4kb' }), async (req, res) => {
    if (!configured) return apiError(res, 503, 'Accès privé à configurer avant utilisation.');
    if (!sameOrigin(req) || !req.headers.origin) return apiError(res, 403, 'Origine non autorisée.');
    const time = now();
    for (const [key, value] of attempts) if (time - value.start >= windowMs) attempts.delete(key);
    const ip = req.socket.remoteAddress || 'unknown';
    const attempt = attempts.get(ip) || { start: time, count: 0 };
    globalAttempts = globalAttempts.filter(t => time - t < windowMs);
    if (attempt.count >= 5 || globalAttempts.length >= 20 || attempts.size >= 1000 && !attempts.has(ip)) {
      res.setHeader('Retry-After', '900');
      return apiError(res, 429, 'Trop de tentatives. Réessaie dans 15 minutes.');
    }
    attempt.count++; attempts.set(ip, attempt); globalAttempts.push(time);
    const password = req.body?.password;
    if (typeof password !== 'string' || password.length < 14 || password.length > 256) return apiError(res, 401, 'Mot de passe incorrect.');
    const [, salt, expected] = passwordHash.split(':');
    try {
      const actual = await scrypt(password, salt, 64);
      if (!equal(actual.toString('hex'), expected)) return apiError(res, 401, 'Mot de passe incorrect.');
      const issued = Math.floor(time / 1000);
      const body = Buffer.from(JSON.stringify({ role: 'owner', iat: issued, exp: issued + SESSION_SECONDS, nonce: randomBytes(24).toString('hex') })).toString('base64url');
      res.cookie(cookieName, `${body}.${sign(body)}`, { ...cookieOptions, maxAge: SESSION_SECONDS * 1000 });
      return res.json({ authenticated: true });
    } catch { return apiError(res, 503, 'Connexion momentanément indisponible.'); }
  });
  app.post('/api/auth/logout', (req, res) => {
    if (!sameOrigin(req)) return apiError(res, 403, 'Origine non autorisée.');
    res.clearCookie(cookieName, cookieOptions); res.json({ authenticated: false });
  });
  app.use('/api', (req, res, next) => {
    if (!configured) return apiError(res, 503, 'Accès privé à configurer avant utilisation.');
    if (!sameOrigin(req)) return apiError(res, 403, 'Origine non autorisée.');
    const bearer = /^Bearer ([A-Za-z0-9_-]{43,128})$/.exec(req.headers.authorization || '');
    if (bearer && equal(digest(bearer[1]), automationHash)) {
      if (!(req.method === 'POST' && req.path === '/generate-audio' || req.method === 'GET' && req.path === '/voice/status')) return apiError(res, 403, 'Cette clé permet seulement la génération audio et la lecture du profil.');
      if (req.path === '/voice/status' && req.query.profile && req.query.profile !== 'female') return apiError(res, 403, 'Cette clé permet seulement la lecture du profil féminin.');
      if (req.method === 'POST') return express.json({ limit: '16kb' })(req, res, error => {
        if (error) return apiError(res, 400, 'Paramètres audio invalides.');
        if (req.body?.profile && req.body.profile !== 'female') return apiError(res, 403, 'Cette clé est réservée à la voix féminine Sitra.');
        next();
      });
      return next();
    }
    if (!session(req)) return apiError(res, 401, 'Connexion requise.');
    if (!['GET', 'HEAD'].includes(req.method) && !req.headers.origin) return apiError(res, 403, 'Origine non autorisée.');
    next();
  });
}
