const { db } = require('../db/index');
const gstTaxEngine = require('./gstTaxEngine');
const gstr1Service = require('./gstr1Service');

module.exports = {
  computeTax: async (event, data) => {
    try {
      const result = await gstTaxEngine.computeVoucherTaxLines(db, data);
      return { success: true, ...result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  generateGSTR1: async (event, { company_id, fy_id, return_period }) => {
    return await gstr1Service.generateGSTR1(company_id, fy_id, return_period);
  },

  getGSTR1: async (event, { company_id, fy_id, return_period }) => {
    return await gstr1Service.getGSTR1(company_id, fy_id, return_period);
  },

  getHSNRates: async (event, company_id) => {
    try {
      const result = await db.execute({
        sql: `SELECT * FROM gst_hsn_rates WHERE company_id = ? ORDER BY hsn_code, effective_from DESC`,
        args: [company_id]
      });
      return { success: true, hsnRates: result.rows };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  upsertHSNRate: async (event, data) => {
    try {
      const {
        rate_id,
        company_id,
        hsn_code,
        effective_from,
        effective_to,
        taxability,
        gst_rate,
        cgst_rate,
        sgst_rate,
        igst_rate,
        cess_rate,
        type_of_supply
      } = data;

      if (!company_id || !hsn_code || !effective_from) {
        return { success: false, error: "company_id, hsn_code, and effective_from are required fields" };
      }

      if (rate_id) {
        await db.execute({
          sql: `UPDATE gst_hsn_rates SET
                  hsn_code = ?, effective_from = ?, effective_to = ?, taxability = ?,
                  gst_rate = ?, cgst_rate = ?, sgst_rate = ?, igst_rate = ?, cess_rate = ?, type_of_supply = ?
                WHERE rate_id = ? AND company_id = ?`,
          args: [
            hsn_code, effective_from, effective_to || null, taxability || 'Taxable',
            gst_rate || 0, cgst_rate || 0, sgst_rate || 0, igst_rate || 0, cess_rate || 0, type_of_supply || 'Goods',
            rate_id, company_id
          ]
        });
      } else {
        await db.execute({
          sql: `INSERT INTO gst_hsn_rates (
                  company_id, hsn_code, effective_from, effective_to, taxability,
                  gst_rate, cgst_rate, sgst_rate, igst_rate, cess_rate, type_of_supply
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            company_id, hsn_code, effective_from, effective_to || null, taxability || 'Taxable',
            gst_rate || 0, cgst_rate || 0, sgst_rate || 0, igst_rate || 0, cess_rate || 0, type_of_supply || 'Goods'
          ]
        });
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  deleteHSNRate: async (event, { rate_id, company_id }) => {
    try {
      await db.execute({
        sql: `DELETE FROM gst_hsn_rates WHERE rate_id = ? AND company_id = ?`,
        args: [rate_id, company_id]
      });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};
