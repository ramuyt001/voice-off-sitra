import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import express from 'express';
import { installAccess, hashPassword } from './access.mjs';

const password = 'fixture-only-password-42!';
const token = 'fixture_token_for_tests_only_012345678901234567890';
const env = { NODE_ENV: 'production', AUTH_PASSWORD_HASH: await hashPassword(password), AUTH_SESSION_SECRET: 'a'.repeat(64), AUTH_AUTOMATION_TOKEN_HASH: createHash('sha256').update(token).digest('hex') };
const protectedPaths = ['/generate-audio', '/generate-comparison', '/optimize-script', '/analyze-script', '/voice/create', '/voice/create-male'];
async function fixture(t, config = env, clock) {
  const app = express(); installAccess(app, config, clock); app.use(express.json());
  let called = 0;
  for (const p of protectedPaths) app.post('/api' + p, (_q, r) => { called++; r.json({ fixture: true }); });
  for (const p of ['/voice/status', '/voice/sample']) app.get('/api' + p, (_q, r) => { called++; r.json({ fixture: true }); });
  const server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const base = `http://127.0.0.1:${server.address().port}`;
  const origin = base.replace('http:', 'https:');
  const send = (path, options = {}) => fetch(base + path, options);
  const login = (value = password, originValue = origin) => send('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: originValue }, body: JSON.stringify({ password: value }) });
  return { send, login, origin, called: () => called };
}
test('all paid and profile endpoints reject anonymous requests before handlers', async t => {
  const f = await fixture(t);
  for (const p of protectedPaths) assert.equal((await f.send('/api' + p, { method: 'POST' })).status, 401);
  for (const p of ['/voice/status', '/voice/sample']) assert.equal((await f.send('/api' + p)).status, 401);
  assert.equal(f.called(), 0);
});
test('missing or malformed secrets fail closed', async t => {
  const f = await fixture(t, { ...env, AUTH_PASSWORD_HASH: '' });
  assert.deepEqual(await (await f.send('/api/auth/status')).json(), { configured: false, authenticated: false });
  assert.equal((await f.login()).status, 503);
  assert.equal((await f.send('/api/generate-audio', { method: 'POST', headers: { Authorization: 'Bearer ' + token } })).status, 503);
  assert.equal(f.called(), 0);
});
test('owner login creates secure cookie and protects subsequent writes against cross-site requests', async t => {
  const f = await fixture(t); const result = await f.login(); assert.equal(result.status, 200);
  const raw = result.headers.get('set-cookie');
  assert.match(raw, /__Host-voiceoff=/); assert.match(raw, /HttpOnly/); assert.match(raw, /Secure/); assert.match(raw, /SameSite=Strict/); assert.match(raw, /Path=\//);
  const cookie = raw.split(';')[0];
  assert.equal((await f.send('/api/voice/status', { headers: { Cookie: cookie } })).status, 200);
  assert.equal((await f.send('/api/generate-audio', { method: 'POST', headers: { Cookie: cookie, Origin: f.origin } })).status, 200);
  assert.equal((await f.send('/api/generate-audio', { method: 'POST', headers: { Cookie: cookie } })).status, 403);
  assert.equal((await f.send('/api/generate-audio', { method: 'POST', headers: { Cookie: cookie, Origin: 'https://attacker.example' } })).status, 403);
  assert.equal((await f.send('/api/voice/sample', { headers: { Cookie: cookie, 'Sec-Fetch-Site': 'cross-site' } })).status, 403);
  const logout = await f.send('/api/auth/logout', { method: 'POST', headers: { Cookie: cookie, Origin: f.origin } });
  assert.equal(logout.status, 200); assert.match(logout.headers.get('set-cookie'), /Expires=Thu, 01 Jan 1970/);
});
test('tampered and expired sessions are rejected', async t => {
  let time = Date.now(); const f = await fixture(t, env, () => time);
  const cookie = (await f.login()).headers.get('set-cookie').split(';')[0];
  assert.equal((await f.send('/api/voice/status', { headers: { Cookie: cookie + 'x' } })).status, 401);
  time += 8 * 60 * 60 * 1000 + 1000;
  assert.equal((await f.send('/api/voice/status', { headers: { Cookie: cookie } })).status, 401);
});
test('automation token grants only explicitly permitted routes and revocation rejects old key', async t => {
  const f = await fixture(t); const headers = { Authorization: 'Bearer ' + token };
  assert.equal((await f.send('/api/generate-audio', { method: 'POST', headers })).status, 200);
  assert.equal((await f.send('/api/generate-audio', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ profile: 'male' }) })).status, 403);
  assert.equal((await f.send('/api/voice/status', { headers })).status, 200);
  assert.equal((await f.send('/api/voice/status?profile=male', { headers })).status, 403);
  for (const p of protectedPaths.filter(p => p !== '/generate-audio')) assert.equal((await f.send('/api' + p, { method: 'POST', headers })).status, 403);
  assert.equal((await f.send('/api/voice/sample', { headers })).status, 403);
  assert.equal((await f.send('/api/generate-audio', { method: 'POST', headers: { Authorization: 'Bearer ' + 'x'.repeat(44) } })).status, 401);
  const revoked = await fixture(t, { ...env, AUTH_AUTOMATION_TOKEN_HASH: 'b'.repeat(64) });
  assert.equal((await revoked.send('/api/generate-audio', { method: 'POST', headers })).status, 401);
});
test('explicit HTTPS custom domain is accepted without allowing other origins', async t => {
  const f = await fixture(t, { ...env, AUTH_ALLOWED_ORIGINS: 'https://voice-off.example' });
  assert.equal((await f.login(password, 'https://voice-off.example')).status, 200);
  assert.equal((await f.login(password, 'https://other.example')).status, 403);
});
test('login throttles failed attempts, expires throttle, and rejects foreign origins', async t => {
  let time = Date.now(); const f = await fixture(t, env, () => time);
  assert.equal((await f.login(password, 'https://attacker.example')).status, 403);
  for (let i = 0; i < 5; i++) assert.equal((await f.login('wrong-password-test')).status, 401);
  assert.equal((await f.login()).status, 429);
  time += 15 * 60 * 1000 + 1;
  assert.equal((await f.login()).status, 200);
});
