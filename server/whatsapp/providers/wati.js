// Wati (BSP) adapter. Wati hosts the WhatsApp Business API connection, the number, and the
// inbound webhook for us; we reach it over a simple REST API. This is what lets a desktop
// app have a two-way inbox — we POLL Wati's getMessages instead of receiving webhooks.
//
// cfg (decrypted) = { baseUrl, accessToken, displayNumber }
//   baseUrl       e.g. https://live-server-12345.wati.io   (tenant endpoint from the Wati dashboard)
//   accessToken   the Wati API key (Bearer)
//   displayNumber the connected WhatsApp number, used in the path/query
//
// Normalized result shape matches the Meta adapter: { ok, wamid, error, raw }.
//
// Endpoint reference (docs.wati.io):
//   POST /api/v1/sendTemplateMessage?whatsappNumber=...
//   POST /api/v1/sendSessionMessage/{whatsappNumber}?messageText=...
//   POST /api/v1/sendSessionFile/{whatsappNumber}        (multipart file)
//   GET  /api/v1/getMessages/{whatsappNumber}?pageSize=&pageNumber=
//   GET  /api/v1/getContacts?pageSize=&pageNumber=
//   GET  /api/v1/getMessageTemplates?pageSize=

const https = require('https');
const { URL } = require('url');

function request(method, fullUrl, token, opts = {}) {
  return new Promise((resolve, reject) => {
    let u;
    try { u = new URL(fullUrl); } catch (e) { return reject(new Error(`Bad Wati base URL: ${e.message}`)); }
    const headers = { Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`, Accept: 'application/json' };
    let payload = null;
    if (opts.json !== undefined) {
      payload = JSON.stringify(opts.json);
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    } else if (opts.multipart) {
      payload = opts.multipart.buffer;
      headers['Content-Type'] = `multipart/form-data; boundary=${opts.multipart.boundary}`;
      headers['Content-Length'] = payload.length;
    }
    const reqOpts = { hostname: u.hostname, port: u.port || 443, path: u.pathname + u.search, method, headers };
    const req = https.request(reqOpts, (res) => {
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
}

// Wati success shape varies: { result: true } | { result: 'success' } | { ok: true }.
function normalize(res) {
  const b = res.body || {};
  const ok = res.status >= 200 && res.status < 300 && (b.result === true || b.result === 'success' || b.ok === true || b.validWhatsAppNumber === true);
  const wamid = b.id || b.messageId || b.message?.id || null;
  return { ok, wamid, error: ok ? null : (b.info || b.message || b.error || `HTTP ${res.status}`), raw: b };
}

const base = (cfg) => (cfg.baseUrl || '').replace(/\/+$/, '');

async function sendTemplate(cfg, to, templateName, languageCode, components) {
  // Wati flattens template body params into [{ name, value }] (named or positional "1","2"...).
  const parameters = componentsToWatiParams(components);
  const url = `${base(cfg)}/api/v1/sendTemplateMessage?whatsappNumber=${encodeURIComponent(to)}`;
  const body = { template_name: templateName, broadcast_name: `${templateName}_${to}`, parameters };
  return normalize(await request('POST', url, cfg.accessToken, { json: body }));
}

async function sendText(cfg, to, message) {
  const url = `${base(cfg)}/api/v1/sendSessionMessage/${encodeURIComponent(to)}?messageText=${encodeURIComponent(message)}`;
  return normalize(await request('POST', url, cfg.accessToken, {}));
}

// Send a document in an open session (24h window) by uploading the bytes directly.
// `data` is a base64 string; filename + contentType describe it.
async function sendDocument(cfg, to, { base64, filename, contentType, caption }) {
  if (!base64) return { ok: false, wamid: null, error: 'No file data provided.', raw: null };
  const buffer = Buffer.from(base64, 'base64');
  const multipart = buildMultipart('file', filename || 'document.pdf', contentType || 'application/pdf', buffer, caption);
  const url = `${base(cfg)}/api/v1/sendSessionFile/${encodeURIComponent(to)}`;
  return normalize(await request('POST', url, cfg.accessToken, { multipart }));
}

async function getMessages(cfg, phone, { pageSize = 50, pageNumber = 1 } = {}) {
  const url = `${base(cfg)}/api/v1/getMessages/${encodeURIComponent(phone)}?pageSize=${pageSize}&pageNumber=${pageNumber}`;
  const res = await request('GET', url, cfg.accessToken, {});
  const items = res.body?.messages?.items || res.body?.messages || [];
  return {
    ok: res.status === 200,
    messages: (Array.isArray(items) ? items : []).map(mapWatiMessage),
    error: res.status === 200 ? null : (res.body?.error || `HTTP ${res.status}`),
  };
}

async function getContacts(cfg, { pageSize = 100, pageNumber = 1 } = {}) {
  const url = `${base(cfg)}/api/v1/getContacts?pageSize=${pageSize}&pageNumber=${pageNumber}`;
  const res = await request('GET', url, cfg.accessToken, {});
  const items = res.body?.contact_list || res.body?.contacts || [];
  return {
    ok: res.status === 200,
    contacts: (Array.isArray(items) ? items : []).map((c) => ({
      name: c.fullName || c.name || '',
      phone: c.wAid || c.phone || c.id || '',
      lastMessageAt: c.lastUpdated || c.created || null,
    })),
    error: res.status === 200 ? null : (res.body?.error || `HTTP ${res.status}`),
  };
}

async function listTemplates(cfg) {
  const url = `${base(cfg)}/api/v1/getMessageTemplates?pageSize=100`;
  const res = await request('GET', url, cfg.accessToken, {});
  const items = res.body?.messageTemplates || res.body?.data || [];
  return {
    ok: res.status === 200,
    templates: (Array.isArray(items) ? items : []).map((t) => ({
      name: t.elementName || t.name,
      language: t.language?.value || t.language || 'en',
      category: t.category,
      status: t.status,
      body: t.body || '',
    })),
    error: res.status === 200 ? null : (res.body?.error || `HTTP ${res.status}`),
  };
}

// ---- helpers ---------------------------------------------------------------

// Wati owner flag: true => sent by the business (outbound), false => from the customer (inbound).
function mapWatiMessage(m) {
  return {
    wamid: m.id || m.whatsappMessageId || null,
    direction: m.owner ? 'out' : 'in',
    type: (m.type || 'text').toLowerCase(),
    body: m.text || m.caption || '',
    mediaUrl: m.data || null,
    status: m.statusString || m.status || null,
    ts: m.created || m.timestamp || null,
  };
}

function componentsToWatiParams(components) {
  if (!Array.isArray(components)) return [];
  const bodyComp = components.find((c) => c.type === 'body') || components.find((c) => c.type === 'BODY');
  const params = bodyComp?.parameters || [];
  return params.map((p, i) => ({ name: String(i + 1), value: p.text != null ? String(p.text) : String(p.value ?? '') }));
}

// Minimal multipart/form-data encoder for a single file field (+ optional caption field).
function buildMultipart(field, filename, contentType, fileBuffer, caption) {
  const boundary = `----watiform${Buffer.from(filename + fileBuffer.length).toString('hex').slice(0, 16)}`;
  const parts = [];
  const push = (s) => parts.push(Buffer.from(s, 'utf8'));
  if (caption) {
    push(`--${boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n${caption}\r\n`);
  }
  push(`--${boundary}\r\nContent-Disposition: form-data; name="${field}"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n`);
  parts.push(fileBuffer);
  push(`\r\n--${boundary}--\r\n`);
  return { boundary, buffer: Buffer.concat(parts) };
}

module.exports = { sendTemplate, sendText, sendDocument, getMessages, getContacts, listTemplates };
