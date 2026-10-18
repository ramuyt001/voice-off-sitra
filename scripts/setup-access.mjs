import { createServer } from 'node:http';
import { randomBytes, createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { hashPassword } from '../access.mjs';

const nonce = randomBytes(32).toString('hex');
const port = 4348;
const origin = `http://127.0.0.1:${port}`;
const hosts = new Set([`127.0.0.1:${port}`, `localhost:${port}`]);
const folder = new URL('../private-access/', import.meta.url);
let complete = false;
const server = createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'");
  if (!hosts.has(req.headers.host)) { res.writeHead(403); res.end(); return; }
  if (req.url === '/' && req.method === 'GET') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(`<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Accès privé Sitra</title><style>body{font:18px system-ui;background:#101827;color:#fff}main{max-width:560px;margin:50px auto;padding:24px}input,button{box-sizing:border-box;width:100%;padding:14px;margin:10px 0;font:inherit}button{background:#9333ea;color:#fff;border:0;border-radius:10px}p{line-height:1.5}</style><main><h1>Créer ton accès privé</h1><p>Choisis un mot de passe d’au moins 14 caractères. Il reste sur ton PC pendant cette préparation et ne sera ni affiché dans la conversation ni envoyé à GitHub. Aucune voix ne sera générée.</p><form><label>Mot de passe<input type="password" id="password" autocomplete="new-password" minlength="14" maxlength="256" required></label><label>Confirme-le<input type="password" id="confirm" autocomplete="new-password" minlength="14" maxlength="256" required></label><button>Enregistrer la protection</button></form><p id="status" role="status"></p></main><script>document.querySelector('form').onsubmit=async e=>{e.preventDefault();const p=document.querySelector('#password'),c=document.querySelector('#confirm'),s=document.querySelector('#status');if(p.value!==c.value){s.textContent='Les mots de passe ne correspondent pas.';return}try{const r=await fetch('/save',{method:'POST',headers:{'Content-Type':'application/json','X-Sitra-CSRF':'${nonce}'},body:JSON.stringify({password:p.value})});const x=await r.json();if(!r.ok)throw Error(x.error);p.value='';c.value='';document.querySelector('form').hidden=true;s.textContent='Protection enregistrée en privé sur ton PC. La mise en ligne n’est pas encore effectuée.'}catch(e){s.textContent=e.message}};</script></html>`); return;
  }
  if (req.url !== '/save' || req.method !== 'POST' || req.headers.origin !== `http://${req.headers.host}` || req.headers['x-sitra-csrf'] !== nonce || complete) { res.writeHead(403); res.end(); return; }
  let raw = '';
  for await (const chunk of req) { raw += chunk; if (raw.length > 4096) { res.writeHead(413); res.end(); return; } }
  res.setHeader('Content-Type', 'application/json');
  try {
    const { password } = JSON.parse(raw);
    const passwordHash = await hashPassword(password);
    const token = randomBytes(32).toString('base64url');
    const settings = { AUTH_PASSWORD_HASH: passwordHash, AUTH_SESSION_SECRET: randomBytes(32).toString('hex'), AUTH_AUTOMATION_TOKEN_HASH: createHash('sha256').update(token).digest('hex') };
    mkdirSync(folder, { recursive: true });
    writeFileSync(new URL('deployment-secrets.env', folder), Object.entries(settings).map(([k,v]) => `${k}=${v}`).join('\n') + '\n', { mode: 0o600 });
    writeFileSync(new URL('automation-access.json', folder), JSON.stringify({ token, allowed: ['POST /api/generate-audio', 'GET /api/voice/status'] }), { mode: 0o600 });
    const envPath = new URL('../.env', import.meta.url);
    let env = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
    for (const [key,value] of Object.entries(settings)) {
      const pattern = new RegExp(`^${key}=.*$`, 'm');
      env = pattern.test(env) ? env.replace(pattern, `${key}=${value}`) : `${env.trimEnd()}\n${key}=${value}\n`;
    }
    writeFileSync(envPath, env, { mode: 0o600 }); complete = true;
    res.end(JSON.stringify({ saved: true })); console.log('Protection enregistrée. Aucun secret affiché. Aucune génération audio.');
    setTimeout(() => server.close(), 1000);
  } catch (e) { res.writeHead(400); res.end(JSON.stringify({ error: e.message })); }
});
server.listen(port, '127.0.0.1', () => console.log(`Formulaire privé : ${origin}`));
