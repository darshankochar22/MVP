// Generic GSP client for GSTN return filing (GSTR-1 / GSTR-3B). GSTN has no free direct API,
// so this talks to a GSP (ClearTax / Masters India / Sandbox-Quicko / …) whose base URL + API
// key come from gspConfig (.env). Endpoint paths are passed by the caller so a different GSP
// can be wired by adjusting the service, not this transport.

const https = require('https');
const { URL } = require('url');
const { getFilingConfig } = require('./gspConfig');

// Returns { ok, status, body, error }.
function request(method, path, body) {
  const cfg = getFilingConfig();
  return new Promise((resolve) => {
    if (!cfg) return resolve({ ok: false, error: 'GST filing not configured (.env)' });
    let u;
    try { u = new URL(cfg.baseUrl.replace(/\/+$/, '') + path); }
    catch { return resolve({ ok: false, error: 'Bad GST_FILING_BASE_URL' }); }

    const payload = body ? JSON.stringify(body) : null;
    const headers = {
      Authorization: `Bearer ${cfg.apiKey}`,
      'x-api-key': cfg.apiKey,
      Accept: 'application/json',
      ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
    };
    const opts = { hostname: u.hostname, port: u.port || 443, path: u.pathname + u.search, method, headers };
    const req = https.request(opts, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => {
        const ok = res.statusCode >= 200 && res.statusCode < 300;
        try {
          const parsed = JSON.parse(d);
          resolve({ ok, status: res.statusCode, body: parsed, error: ok ? null : (parsed.error || parsed.message || `HTTP ${res.statusCode}`) });
        } catch {
          resolve({ ok: false, status: res.statusCode, body: d, error: `HTTP ${res.statusCode}` });
        }
      });
    });
    req.on('error', (e) => resolve({ ok: false, error: e.message }));
    if (payload) req.write(payload);
    req.end();
  });
}

module.exports = { request, isConfigured: () => !!getFilingConfig() };
