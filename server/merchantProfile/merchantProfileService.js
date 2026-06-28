// Merchant Profile service — Drizzle ORM (follows exciseDutyClassificationService,
// minus the child-table list). Reads return rows via db.all(SELECT *) so the
// snake_case shape (merchant_profile_id, payment_method, …) reaches the frontend.
const { db } = require('../db/index');
const { sql, eq } = require('drizzle-orm');
const { merchantProfiles } = require('../db/schema');

const findRow = async (whereSql) => {
  const rows = await db.all(sql`SELECT * FROM ${merchantProfiles} WHERE ${whereSql}`);
  return rows[0];
};

module.exports = {
  create: async (data) => {
    try {
      const exists = await db.all(
        sql`SELECT * FROM ${merchantProfiles}
            WHERE ${merchantProfiles.companyId} = ${data.company_id}
              AND LOWER(${merchantProfiles.name}) = LOWER(${data.name})
              AND ${merchantProfiles.isActive} = 1`
      );
      if (exists.length > 0) return { success: false, error: 'Merchant Profile already exists' };

      const inserted = await db
        .insert(merchantProfiles)
        .values({
          companyId: data.company_id,
          name: data.name,
          paymentMethod: data.payment_method ?? 'UPI',
          isActive: 1,
        })
        .returning({ id: merchantProfiles.merchantProfileId });

      const profile = await findRow(sql`${merchantProfiles.merchantProfileId} = ${inserted[0].id}`);
      return { success: true, profile };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getAll: async (company_id) => {
    try {
      const profiles = await db.all(
        sql`SELECT * FROM ${merchantProfiles}
            WHERE ${merchantProfiles.companyId} = ${company_id}
              AND ${merchantProfiles.isActive} = 1`
      );
      return { success: true, profiles };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getById: async (id) => {
    try {
      const profile = await findRow(sql`${merchantProfiles.merchantProfileId} = ${id}`);
      if (!profile) return { success: false, error: 'Merchant Profile not found' };
      return { success: true, profile };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  update: async (data) => {
    try {
      const current = await findRow(sql`${merchantProfiles.merchantProfileId} = ${data.merchant_profile_id}`);
      if (!current) return { success: false, error: 'Merchant Profile not found' };

      await db
        .update(merchantProfiles)
        .set({
          name: data.name ?? current.name,
          paymentMethod: data.payment_method !== undefined ? data.payment_method : current.payment_method,
          updatedAt: sql`datetime('now')`,
        })
        .where(eq(merchantProfiles.merchantProfileId, data.merchant_profile_id));

      const profile = await findRow(sql`${merchantProfiles.merchantProfileId} = ${data.merchant_profile_id}`);
      return { success: true, profile };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  delete: async (id) => {
    try {
      const existing = await findRow(sql`${merchantProfiles.merchantProfileId} = ${id}`);
      if (!existing) return { success: false, error: 'Merchant Profile not found' };
      await db.update(merchantProfiles).set({ isActive: 0 }).where(eq(merchantProfiles.merchantProfileId, id));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
};
