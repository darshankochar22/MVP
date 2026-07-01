// WhatsApp Business CRM service.
//
// The connection is resolved developer-side first (env via devConfig — Wati BSP by default,
// Meta Cloud API optional), falling back to a per-company row in whatsapp_config (Meta-style).
// The renderer NEVER receives the raw secret — getStatus() masks it.
//
// Outbound goes straight to the provider; the inbox is poll-based (syncConversation pulls
// from Wati's getMessages), because a desktop app cannot receive webhooks.

const { db } = require('../db/index');
const { sql, eq } = require('drizzle-orm');
const { whatsappConfig, whatsappLogs } = require('../db/schema');
const devConfig = require('./devConfig');
const watiProvider = require('./providers/wati');
const metaProvider = require('./providers/meta');
const { maskSecret } = require('./secret');
const paymentLink = require('./paymentLink');

// ---- phone normalisation ----------------------------------------------------

const normalizePhone = (phone) => {
  let num = String(phone || '').replace(/[\s\-\(\)]/g, '');
  if (num.startsWith('+')) num = num.slice(1);
  if (num.startsWith('0')) num = '91' + num.slice(1);
  if (!num.startsWith('91') && num.length === 10) num = '91' + num;
  return num;
};

// ---- connection resolution ---------------------------------------------------

// env (developer-side) first, then the legacy per-company DB row (Meta-style).
const resolveConfig = async (company_id) => {
  const env = devConfig.getDevConfig();
  if (env) return { source: 'env', ...env };

  try {
    const rows = await db.all(
      sql`SELECT * FROM ${whatsappConfig}
          WHERE ${whatsappConfig.companyId} = ${company_id}
            AND ${whatsappConfig.isActive} = 1`
    );
    if (rows.length > 0) {
      const r = rows[0];
      return {
        source: 'db',
        provider: 'meta',
        baseUrl: null,
        displayNumber: null,
        phoneNumberId: r.phone_number_id,
        wabaId: r.waba_id,
        accessToken: r.access_token,
      };
    }
  } catch (_) { /* table may not exist yet */ }
  return null;
};

const providerOf = (cfg) => (cfg.provider === 'meta' ? metaProvider : watiProvider);

const NOT_CONFIGURED = { success: false, error: 'WhatsApp is not configured on this machine (set WHATSAPP_API_KEY etc. in .env).' };

// ---- status ------------------------------------------------------------------

const getStatus = async (company_id) => {
  try {
    const cfg = await resolveConfig(company_id);
    if (!cfg) return { success: true, configured: false, source: null };
    return {
      success: true,
      configured: true,
      source: cfg.source,
      provider: cfg.provider,
      baseUrl: cfg.baseUrl || null,
      displayNumber: cfg.displayNumber || null,
      phoneNumberId: cfg.phoneNumberId || '',
      wabaId: cfg.wabaId || '',
      masked: maskSecret(cfg.accessToken),
      paymentGateway: paymentLink.isConfigured() ? 'razorpay' : null,
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// ---- logging + message persistence --------------------------------------------

const saveLog = async (company_id, voucher_id, to_number, message_type, template_name, status, wamid, error) => {
  try {
    await db.insert(whatsappLogs).values({
      companyId: company_id,
      voucherId: voucher_id || null,
      toNumber: to_number,
      messageType: message_type,
      templateName: template_name || null,
      status,
      wamid: wamid || null,
      error: error || null,
    });
  } catch (_) {}
};

const recordOutbound = async (company_id, phone, body, wamid) => {
  try {
    await db.execute(
      `INSERT INTO whatsapp_messages (company_id, phone, direction, type, body, wamid, status, ts)
       VALUES (?, ?, 'out', 'text', ?, ?, 'SENT', datetime('now'))`,
      [company_id, phone, body || '', wamid || null]
    );
    await db.execute(
      `UPDATE whatsapp_contacts
          SET last_message_at = datetime('now'), last_message_text = ?
        WHERE company_id = ? AND phone = ?`,
      [body || '', company_id, phone]
    );
  } catch (_) {}
};

// ---- outbound ------------------------------------------------------------------

const sendText = async (company_id, to_phone, message) => {
  try {
    const cfg = await resolveConfig(company_id);
    if (!cfg) return NOT_CONFIGURED;
    const phone = normalizePhone(to_phone);

    const r = await providerOf(cfg).sendText(cfg, phone, message);
    await saveLog(company_id, null, phone, 'TEXT', null, r.ok ? 'SENT' : 'FAILED', r.wamid, r.ok ? null : String(r.error));
    if (r.ok) await recordOutbound(company_id, phone, message, r.wamid);
    return r.ok ? { success: true, wamid: r.wamid } : { success: false, error: r.error || 'Failed to send' };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

const sendTemplateMessage = async (company_id, to_phone, template_name, params = [], voucher_id = null, language = 'en', message_type = 'TEMPLATE') => {
  try {
    const cfg = await resolveConfig(company_id);
    if (!cfg) return NOT_CONFIGURED;
    const phone = normalizePhone(to_phone);

    const components = [{
      type: 'body',
      parameters: (params || []).map((p) => ({ type: 'text', text: String(p) })),
    }];
    const r = await providerOf(cfg).sendTemplate(cfg, phone, template_name, language, components);
    await saveLog(company_id, voucher_id, phone, message_type, template_name, r.ok ? 'SENT' : 'FAILED', r.wamid, r.ok ? null : String(r.error));
    if (r.ok) await recordOutbound(company_id, phone, `[${template_name}]`, r.wamid);
    return r.ok ? { success: true, wamid: r.wamid } : { success: false, error: r.error || 'Failed to send' };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

const sendTemplate = async (company_id, to_phone, template_name, params, voucher_id, language) =>
  sendTemplateMessage(company_id, to_phone, template_name, params, voucher_id, language, 'TEMPLATE');

const sendInvoice = async (company_id, voucher_id, to_phone, invoice_data = {}) => {
  const result = await sendTemplateMessage(
    company_id, to_phone, 'invoice_share',
    [
      invoice_data.party_name || 'Customer',
      invoice_data.voucher_number || '',
      invoice_data.date || '',
      `₹${invoice_data.total_amount ?? ''}`,
    ],
    voucher_id, 'en', 'INVOICE'
  );
  // Optional payment link (Razorpay) appended as a follow-up text.
  if (result.success && paymentLink.isConfigured() && invoice_data.total_amount) {
    try {
      const link = await paymentLink.createPaymentLink({
        amount: invoice_data.total_amount,
        description: `Invoice ${invoice_data.voucher_number || ''}`,
        customer_name: invoice_data.party_name,
      });
      if (link?.short_url) {
        await sendText(company_id, to_phone, `Pay online: ${link.short_url}`);
        result.paymentLink = link.short_url;
      }
    } catch (_) { /* payment link is best-effort */ }
  }
  return result;
};

const sendPaymentReminder = (company_id, to_phone, reminder_data = {}) =>
  sendTemplateMessage(
    company_id, to_phone, 'payment_reminder',
    [reminder_data.party_name || '', `₹${reminder_data.outstanding_amount ?? ''}`, reminder_data.due_date || 'immediately'],
    null, 'en', 'PAYMENT_REMINDER'
  );

const sendStatement = (company_id, to_phone, statement_data = {}) =>
  sendTemplateMessage(
    company_id, to_phone, 'account_statement',
    [statement_data.party_name || '', statement_data.from_date || '', statement_data.to_date || '', `₹${statement_data.closing_balance ?? ''}`],
    null, 'en', 'STATEMENT'
  );

const sendDocument = async (company_id, to_phone, data = {}, voucher_id = null) => {
  try {
    const cfg = await resolveConfig(company_id);
    if (!cfg) return NOT_CONFIGURED;
    const phone = normalizePhone(to_phone);
    const r = await providerOf(cfg).sendDocument(cfg, phone, data);
    await saveLog(company_id, voucher_id, phone, 'DOCUMENT', null, r.ok ? 'SENT' : 'FAILED', r.wamid, r.ok ? null : String(r.error));
    return r.ok ? { success: true, wamid: r.wamid } : { success: false, error: r.error || 'Failed to send' };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// ---- inbox / contacts ------------------------------------------------------------

const importContacts = async (company_id, contacts = []) => {
  try {
    let added = 0;
    for (const c of contacts) {
      const phone = normalizePhone(c.phone);
      if (!phone) continue;
      const existing = await db.execute(
        `SELECT contact_id FROM whatsapp_contacts WHERE company_id = ? AND phone = ?`,
        [company_id, phone]
      );
      if (existing.rows?.length) continue;
      await db.execute(
        `INSERT INTO whatsapp_contacts (company_id, ledger_id, name, phone) VALUES (?, ?, ?, ?)`,
        [company_id, c.ledger_id || null, c.name || null, phone]
      );
      added++;
    }
    return { success: true, added };
  } catch (err) {
    return { success: false, added: 0, error: err.message };
  }
};

const getConversations = async (company_id) => {
  try {
    const res = await db.execute(
      `SELECT * FROM whatsapp_contacts
        WHERE company_id = ?
        ORDER BY COALESCE(last_message_at, created_at) DESC`,
      [company_id]
    );
    return { success: true, contacts: res.rows || [] };
  } catch (err) {
    return { success: false, contacts: [], error: err.message };
  }
};

const getConversation = async (company_id, phone) => {
  try {
    const p = normalizePhone(phone);
    const res = await db.execute(
      `SELECT * FROM whatsapp_messages
        WHERE company_id = ? AND phone = ?
        ORDER BY COALESCE(ts, created_at) ASC`,
      [company_id, p]
    );
    return { success: true, messages: res.rows || [] };
  } catch (err) {
    return { success: false, messages: [], error: err.message };
  }
};

// Poll the BSP for the latest messages of one conversation and persist the new ones.
const syncConversation = async (company_id, phone) => {
  try {
    const cfg = await resolveConfig(company_id);
    if (!cfg) return NOT_CONFIGURED;
    const p = normalizePhone(phone);

    const r = await providerOf(cfg).getMessages(cfg, p, {});
    if (!r.ok) return { success: false, messages: [], error: r.error };

    let newest = null;
    for (const m of r.messages) {
      const exists = m.wamid
        ? await db.execute(`SELECT message_id FROM whatsapp_messages WHERE company_id = ? AND wamid = ?`, [company_id, m.wamid])
        : { rows: [] };
      if (exists.rows?.length) continue;
      await db.execute(
        `INSERT INTO whatsapp_messages (company_id, phone, direction, type, body, media_url, wamid, status, ts)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [company_id, p, m.direction, m.type || 'text', m.body || '', m.mediaUrl || null, m.wamid, m.status || null, m.ts || null]
      );
      if (m.direction === 'in') newest = m;
    }
    if (newest) {
      await db.execute(
        `UPDATE whatsapp_contacts
            SET last_message_at = COALESCE(?, datetime('now')), last_message_text = ?,
                unread_count = unread_count + 1
          WHERE company_id = ? AND phone = ?`,
        [newest.ts, newest.body || '', company_id, p]
      );
    }
    return await getConversation(company_id, p);
  } catch (err) {
    return { success: false, messages: [], error: err.message };
  }
};

const markRead = async (company_id, phone) => {
  try {
    await db.execute(
      `UPDATE whatsapp_contacts SET unread_count = 0 WHERE company_id = ? AND phone = ?`,
      [company_id, normalizePhone(phone)]
    );
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

const reply = (company_id, phone, message) => sendText(company_id, phone, message);

// ---- templates ---------------------------------------------------------------------

const getTemplates = async (company_id) => {
  try {
    const res = await db.execute(
      `SELECT * FROM whatsapp_templates WHERE company_id = ? ORDER BY name`,
      [company_id]
    );
    return { success: true, templates: res.rows || [] };
  } catch (err) {
    return { success: false, templates: [], error: err.message };
  }
};

const syncTemplates = async (company_id) => {
  try {
    const cfg = await resolveConfig(company_id);
    if (!cfg) return NOT_CONFIGURED;
    const r = await providerOf(cfg).listTemplates(cfg);
    if (!r.ok) return { success: false, error: r.error };

    await db.execute(`DELETE FROM whatsapp_templates WHERE company_id = ?`, [company_id]);
    for (const t of r.templates) {
      await db.execute(
        `INSERT INTO whatsapp_templates (company_id, name, language, category, status) VALUES (?, ?, ?, ?, ?)`,
        [company_id, t.name, t.language || 'en', t.category || null, t.status || 'APPROVED']
      );
    }
    return { success: true, count: r.templates.length };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// ---- campaigns -----------------------------------------------------------------------

const runCampaign = async (company_id, { name, template_name, audience, recipients = [] }) => {
  try {
    const ins = await db.execute(
      `INSERT INTO whatsapp_campaigns (company_id, name, template_name, audience, total, status)
       VALUES (?, ?, ?, ?, ?, 'RUNNING')`,
      [company_id, name, template_name || null, audience || null, recipients.length]
    );
    let campaignId = Number(ins?.lastInsertRowid ?? 0);
    if (!campaignId) {
      const row = await db.execute(
        `SELECT MAX(campaign_id) AS id FROM whatsapp_campaigns WHERE company_id = ?`,
        [company_id]
      );
      campaignId = Number(row.rows?.[0]?.id || 0);
    }

    let sent = 0;
    let failed = 0;
    for (const rcpt of recipients) {
      const r = await sendTemplateMessage(company_id, rcpt.phone, template_name, rcpt.params || [], null, 'en', 'CAMPAIGN');
      if (r.success) sent++;
      else failed++;
    }

    await db.execute(
      `UPDATE whatsapp_campaigns SET sent = ?, failed = ?, status = 'DONE' WHERE campaign_id = ?`,
      [sent, failed, campaignId]
    );

    return { success: true, total: recipients.length, sent, failed };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

const getCampaigns = async (company_id) => {
  try {
    const res = await db.execute(
      `SELECT * FROM whatsapp_campaigns WHERE company_id = ? ORDER BY created_at DESC, campaign_id DESC`,
      [company_id]
    );
    return { success: true, campaigns: res.rows || [] };
  } catch (err) {
    return { success: false, campaigns: [], error: err.message };
  }
};

// ---- legacy config CRUD (kept for the Settings UI / old handlers) ------------------------

const saveConfig = async (data) => {
  try {
    const existing = await db.all(
      sql`SELECT * FROM ${whatsappConfig} WHERE ${whatsappConfig.companyId} = ${data.company_id}`
    );
    if (existing.length > 0) {
      await db.update(whatsappConfig).set({
        phoneNumberId: data.phone_number_id,
        wabaId: data.waba_id,
        accessToken: data.access_token,
        isActive: 1,
        updatedAt: sql`datetime('now')`,
      }).where(eq(whatsappConfig.companyId, data.company_id));
    } else {
      await db.insert(whatsappConfig).values({
        companyId: data.company_id,
        phoneNumberId: data.phone_number_id,
        wabaId: data.waba_id,
        accessToken: data.access_token,
      });
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

const getConfig = async (company_id) => {
  try {
    const rows = await db.all(
      sql`SELECT * FROM ${whatsappConfig}
          WHERE ${whatsappConfig.companyId} = ${company_id}
            AND ${whatsappConfig.isActive} = 1`
    );
    if (rows.length === 0) return { success: false, error: 'WhatsApp not configured' };
    return { success: true, config: rows[0] };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

const getLogs = async (company_id, limit = 50) => {
  try {
    const rows = await db.all(
      sql`SELECT * FROM ${whatsappLogs}
          WHERE ${whatsappLogs.companyId} = ${company_id}
          ORDER BY ${whatsappLogs.sentAt} DESC
          LIMIT ${limit}`
    );
    return { success: true, logs: rows };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

const verifyWebhook = (mode, token, challenge, verify_token) => {
  if (mode === 'subscribe' && token === verify_token) {
    return { success: true, challenge };
  }
  return { success: false, error: 'Verification failed' };
};

module.exports = {
  // status + connection
  getStatus,
  normalizePhone,
  // outbound
  sendInvoice,
  sendPaymentReminder,
  sendStatement,
  sendText,
  sendTemplate,
  sendDocument,
  // inbox
  importContacts,
  getConversations,
  getConversation,
  syncConversation,
  markRead,
  reply,
  // templates + campaigns
  getTemplates,
  syncTemplates,
  runCampaign,
  getCampaigns,
  // legacy
  saveConfig,
  getConfig,
  getLogs,
  verifyWebhook,
};
