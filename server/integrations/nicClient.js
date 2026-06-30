// Shared NIC IRP client for e-Invoice and e-Way Bill. Handles the auth handshake + token
// cache, and exposes an authed request helper. Credentials come from gspConfig (.env).
//
// Normalized result for authedRequest: { ok, status, body, error }.

const https = require('https');
const { getGspConfig } = require('./gspConfig');

let _cache = null; // { token, sek, expiry }

const request = (host, method, path, headers, body) =>
  new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: host,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...headers,
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });

const isTokenValid = () => _cache && new Date() < new Date(_cache.expiry);

const errOf = (body, status) =>
  body?.ErrorDetails?.[0]?.ErrorMessage || body?.ErrorMessage || body?.error || `HTTP ${status}`;

async function authenticate() {
  const c = getGspConfig();
  if (!c) return { success: false, error: 'GST credentials not configured (.env)' };
  try {
    const res = await request(
      c.einvoiceBaseUrl,
      'POST',
      '/eivital/v1.04/dec/authenticate',
      { client_id: c.clientId, client_secret: c.clientSecret, Gstin: c.gstin },
      { UserName: c.username, Password: c.password, AppKey: c.appKey, ForceRefreshAccessToken: false }
    );
    if (res.body?.Status === '1') {
      const d = res.body.Data;
      _cache = { token: d.AuthToken, sek: d.Sek, expiry: d.TokenExpiry };
      return { success: true };
    }
    return { success: false, error: errOf(res.body, res.status) };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function ensureAuth() {
  if (isTokenValid()) return { success: true };
  return authenticate();
}

function authHeaders() {
  const c = getGspConfig() || {};
  return {
    client_id: c.clientId,
    client_secret: c.clientSecret,
    Gstin: c.gstin,
    user_name: c.username,
    authtoken: _cache?.token || '',
  };
}

// Make an authenticated NIC call. `host` selects the base (einvoice vs eway).
async function authedRequest(host, method, path, body) {
  const auth = await ensureAuth();
  if (!auth.success) return { ok: false, error: auth.error };
  try {
    const res = await request(host, method, path, authHeaders(), body);
    const ok = res.body?.Status === '1';
    return { ok, status: res.status, body: res.body, error: ok ? null : errOf(res.body, res.status) };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// Renderer-safe status (no secret).
function getStatus() {
  const c = getGspConfig();
  if (!c) return { configured: false };
  return {
    configured: true,
    provider: c.provider,
    gstin: c.gstin || null,
    sandbox: c.sandbox,
    einvoiceBaseUrl: c.einvoiceBaseUrl,
    ewaybillBaseUrl: c.ewaybillBaseUrl,
  };
}

module.exports = { authenticate, ensureAuth, authedRequest, authHeaders, isTokenValid, getStatus };
