// Payment-link generation for the invoice "Pay Now" button.
//
// Provider-agnostic: today it implements Razorpay (the most common India SMB gateway).
// Credentials come from env (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) so nothing secret is
// committed. When unconfigured it returns { ok: false } and the caller simply omits the
// Pay Now link — invoice sending still works without it.
//
// Razorpay Payment Links API: POST https://api.razorpay.com/v1/payment_links
//   auth: HTTP Basic (key_id:key_secret), body: { amount(paise), currency, description, customer }

const https = require('https');

function razorpayCreds() {
  const id = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  return id && secret ? { id, secret } : null;
}

function isConfigured() {
  return !!razorpayCreds();
}

// amount is in rupees (number/string). Returns { ok, url, id } or { ok:false, error }.
async function createPaymentLink({ amount, description, customerName, customerPhone }) {
  const creds = razorpayCreds();
  if (!creds) return { ok: false, error: 'No payment gateway configured.' };

  const paise = Math.round(Number(amount) * 100);
  if (!paise || paise <= 0) return { ok: false, error: 'Invalid amount for payment link.' };

  const payload = JSON.stringify({
    amount: paise,
    currency: 'INR',
    description: (description || 'Invoice payment').slice(0, 2048),
    customer: { name: customerName || 'Customer', contact: customerPhone || undefined },
    notify: { sms: false, email: false },
    reminder_enable: true,
  });

  const auth = Buffer.from(`${creds.id}:${creds.secret}`).toString('base64');
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.razorpay.com',
      path: '/v1/payment_links',
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          const body = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300 && body.short_url) {
            resolve({ ok: true, url: body.short_url, id: body.id });
          } else {
            resolve({ ok: false, error: body.error?.description || `HTTP ${res.statusCode}` });
          }
        } catch {
          resolve({ ok: false, error: 'Bad response from payment gateway.' });
        }
      });
    });
    req.on('error', (e) => resolve({ ok: false, error: e.message }));
    req.write(payload);
    req.end();
  });
}

module.exports = { isConfigured, createPaymentLink };
