const whatsappService = require('./whatsappService');

module.exports = {
  saveConfig: async (event, data) => {
    return await whatsappService.saveConfig(data);
  },

  getConfig: async (event, { company_id }) => {
    return await whatsappService.getConfig(company_id);
  },

  sendInvoice: async (event, { company_id, voucher_id, to_phone, invoice_data }) => {
    return await whatsappService.sendInvoice(company_id, voucher_id, to_phone, invoice_data);
  },

  sendPaymentReminder: async (event, { company_id, to_phone, reminder_data }) => {
    return await whatsappService.sendPaymentReminder(company_id, to_phone, reminder_data);
  },

  sendStatement: async (event, { company_id, to_phone, statement_data }) => {
    return await whatsappService.sendStatement(company_id, to_phone, statement_data);
  },

  sendText: async (event, { company_id, to_phone, message }) => {
    return await whatsappService.sendText(company_id, to_phone, message);
  },

  getLogs: async (event, { company_id, limit }) => {
    return await whatsappService.getLogs(company_id, limit);
  },

  verifyWebhook: async (event, { mode, token, challenge, verify_token }) => {
    return whatsappService.verifyWebhook(mode, token, challenge, verify_token);
  },

  // ---- CRM workspace API (developer-side env connection) ----
  getStatus: async (event, company_id) => {
    return await whatsappService.getStatus(company_id);
  },

  sendTemplate: async (event, { company_id, to_phone, template_name, params, voucher_id, language }) => {
    return await whatsappService.sendTemplate(company_id, to_phone, template_name, params, voucher_id, language);
  },

  sendDocument: async (event, { company_id, to_phone, data, voucher_id }) => {
    return await whatsappService.sendDocument(company_id, to_phone, data, voucher_id);
  },

  importContacts: async (event, { company_id, contacts }) => {
    return await whatsappService.importContacts(company_id, contacts);
  },

  getConversations: async (event, company_id) => {
    return await whatsappService.getConversations(company_id);
  },

  getConversation: async (event, { company_id, phone }) => {
    return await whatsappService.getConversation(company_id, phone);
  },

  syncConversation: async (event, { company_id, phone }) => {
    return await whatsappService.syncConversation(company_id, phone);
  },

  markRead: async (event, { company_id, phone }) => {
    return await whatsappService.markRead(company_id, phone);
  },

  reply: async (event, { company_id, phone, message }) => {
    return await whatsappService.reply(company_id, phone, message);
  },

  getTemplates: async (event, company_id) => {
    return await whatsappService.getTemplates(company_id);
  },

  syncTemplates: async (event, company_id) => {
    return await whatsappService.syncTemplates(company_id);
  },

  runCampaign: async (event, { company_id, name, template_name, audience, recipients }) => {
    return await whatsappService.runCampaign(company_id, { name, template_name, audience, recipients });
  },

  getCampaigns: async (event, company_id) => {
    return await whatsappService.getCampaigns(company_id);
  },
};