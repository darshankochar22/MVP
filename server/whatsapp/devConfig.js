// Developer-side WhatsApp credentials.
//
// The connection (provider + secret + number) is configured by the DEVELOPER/operator via
// environment variables on the machine or build — NOT entered through the app UI. This
// mirrors how the AI key (AI_API_KEY) and the Razorpay key (RAZORPAY_KEY_ID) are provided.
//
//   WHATSAPP_PROVIDER          'wati' | 'meta'        (default 'wati')
//   WHATSAPP_API_KEY           bearer secret — Wati API key OR Meta access token
//                              (alias: WHATSAPP_TOKEN)
//   WHATSAPP_BASE_URL          Wati tenant endpoint, e.g. https://live-server-12345.wati.io
//   WHATSAPP_NUMBER            connected WhatsApp number (Wati path/query param)
//   WHATSAPP_PHONE_NUMBER_ID   Meta Cloud API only
//   WHATSAPP_WABA_ID           Meta Cloud API only
//
// Returns null when no secret is set (i.e. WhatsApp is not configured on this machine).

function getDevConfig() {
  const accessToken = (process.env.WHATSAPP_API_KEY || process.env.WHATSAPP_TOKEN || '').trim();
  if (!accessToken) return null;
  return {
    provider: (process.env.WHATSAPP_PROVIDER || 'wati').toLowerCase(),
    baseUrl: process.env.WHATSAPP_BASE_URL || null,
    displayNumber: process.env.WHATSAPP_NUMBER || null,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    wabaId: process.env.WHATSAPP_WABA_ID || '',
    accessToken,
  };
}

function isConfigured() {
  return !!getDevConfig();
}

module.exports = { getDevConfig, isConfigured };
