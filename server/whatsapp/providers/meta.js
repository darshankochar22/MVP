// Meta WhatsApp Cloud API adapter (graph.facebook.com).
// All functions take a decrypted `cfg` = { phoneNumberId, wabaId, accessToken } and
// return a normalized result: { ok, wamid, error, raw }.
//
// NOTE: inbound (replies / delivery receipts) on the direct Cloud API is delivered to a
// public webhook — a desktop app can't receive it, so getMessages() is unsupported here.
// Use the Wati adapter for a pollable inbox.

const https = require('https');

const HOST = 'graph.facebook.com';
const API_VERSION = 'v19.0';

function request(method, path, token, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const headers = { Authorization: `Bearer ${token}` };
    if (payload) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }
    const req = https.request({ hostname: HOST, path, method, headers }, (res) => {
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

function normalize(res) {
  const wamid = res.body?.messages?.[0]?.id || null;
  const ok = res.status >= 200 && res.status < 300 && !!wamid;
  return { ok, wamid, error: ok ? null : (res.body?.error?.message || `HTTP ${res.status}`), raw: res.body };
}

async function sendTemplate(cfg, to, templateName, languageCode, components) {
  const body = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode || 'en' },
      ...(components && components.length ? { components } : {}),
    },
  };
  return normalize(await request('POST', `/${API_VERSION}/${cfg.phoneNumberId}/messages`, cfg.accessToken, body));
}

async function sendText(cfg, to, message) {
  const body = { messaging_product: 'whatsapp', to, type: 'text', text: { body: message } };
  return normalize(await request('POST', `/${API_VERSION}/${cfg.phoneNumberId}/messages`, cfg.accessToken, body));
}

// Send a document by public link (Cloud API can't accept a raw upload inline; the file
// must be a reachable URL or a pre-uploaded media id). caption is optional.
async function sendDocument(cfg, to, { link, filename, caption }) {
  if (!link) return { ok: false, wamid: null, error: 'Meta sendDocument needs a public file link.', raw: null };
  const body = {
    messaging_product: 'whatsapp',
    to,
    type: 'document',
    document: { link, filename, ...(caption ? { caption } : {}) },
  };
  return normalize(await request('POST', `/${API_VERSION}/${cfg.phoneNumberId}/messages`, cfg.accessToken, body));
}

async function listTemplates(cfg) {
  const res = await request('GET', `/${API_VERSION}/${cfg.wabaId}/message_templates?limit=100`, cfg.accessToken);
  const data = Array.isArray(res.body?.data) ? res.body.data : [];
  return {
    ok: res.status === 200,
    templates: data.map((t) => ({
      name: t.name,
      language: t.language,
      category: t.category,
      status: t.status,
      body: (t.components || []).find((c) => c.type === 'BODY')?.text || '',
    })),
    error: res.status === 200 ? null : (res.body?.error?.message || `HTTP ${res.status}`),
  };
}

async function getMessages() {
  return { ok: false, messages: [], error: 'Inbound polling not supported on direct Meta Cloud API (requires a webhook).' };
}

async function getContacts() {
  return { ok: false, contacts: [], error: 'Contact listing not supported on direct Meta Cloud API.' };
}

module.exports = { sendTemplate, sendText, sendDocument, listTemplates, getMessages, getContacts };
