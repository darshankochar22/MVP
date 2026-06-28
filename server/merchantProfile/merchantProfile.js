// Merchant Profile — named master under "Payment Request" (Issue #139).
// Each profile is a payment-gateway/UPI merchant identity (name + method).
const init = async (db) => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS merchant_profiles (
      merchant_profile_id  INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id           INTEGER NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
      name                 TEXT NOT NULL,
      payment_method       TEXT DEFAULT 'UPI',
      is_active            INTEGER DEFAULT 1,
      created_at           TEXT DEFAULT (datetime('now')),
      updated_at           TEXT DEFAULT (datetime('now'))
    )
  `);
};

module.exports = { init };
