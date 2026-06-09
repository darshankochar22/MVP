const { db } = require('../db/index');

const parseSlabRows = (classification) => {
  if (!classification) return classification;
  const result = { ...classification };
  if (typeof result.gst_rate_details === 'string' && result.gst_rate_details.trim()) {
    try {
      result.slab_rows = JSON.parse(result.gst_rate_details);
    } catch (err) {
      result.slab_rows = undefined;
    }
  } else {
    result.slab_rows = undefined;
  }
  return result;
};

const seedDefaultGSTClassifications = async (company_id) => {
  const defaults = [
    { name: 'GST 0%',    igst_rate: 0,  cgst_rate: 0,   sgst_rate: 0,   cess_rate: 0, taxability: 'Taxable',  nature_of_transaction: 'Not Applicable' },
    { name: 'GST 5%',    igst_rate: 5,  cgst_rate: 2.5, sgst_rate: 2.5, cess_rate: 0, taxability: 'Taxable',  nature_of_transaction: 'Not Applicable' },
    { name: 'GST 12%',   igst_rate: 12, cgst_rate: 6,   sgst_rate: 6,   cess_rate: 0, taxability: 'Taxable',  nature_of_transaction: 'Not Applicable' },
    { name: 'GST 18%',   igst_rate: 18, cgst_rate: 9,   sgst_rate: 9,   cess_rate: 0, taxability: 'Taxable',  nature_of_transaction: 'Not Applicable' },
    { name: 'GST 28%',   igst_rate: 28, cgst_rate: 14,  sgst_rate: 14,  cess_rate: 0, taxability: 'Taxable',  nature_of_transaction: 'Not Applicable' },
    { name: 'Exempt',    igst_rate: 0,  cgst_rate: 0,   sgst_rate: 0,   cess_rate: 0, taxability: 'Exempt',   nature_of_transaction: 'Not Applicable' },
    { name: 'Nil Rated', igst_rate: 0,  cgst_rate: 0,   sgst_rate: 0,   cess_rate: 0, taxability: 'Nil Rated',nature_of_transaction: 'Not Applicable' },
    { name: 'Non GST',   igst_rate: 0,  cgst_rate: 0,   sgst_rate: 0,   cess_rate: 0, taxability: 'Unknown',  nature_of_transaction: 'Not Applicable', is_non_gst_goods: 1 },
  ];

  for (const g of defaults) {
    await db.execute(
      `INSERT INTO gst_classifications (
        company_id, name, description, hsn_sac_code,
        is_non_gst_goods, nature_of_transaction, taxability,
        is_reverse_charge, is_ineligible_for_itc,
        rate_type,
        igst_rate, igst_valuation_type,
        cgst_rate, cgst_valuation_type,
        sgst_rate, sgst_valuation_type,
        cess_rate, cess_valuation_type,
        is_predefined, is_active
      ) VALUES (?, ?, null, null, ?, ?, ?, 0, 0, ?, 'Based on Value', ?, 'Based on Value', ?, 'Based on Value', ?, 'Based on Value', 1, 1)`,
      [
        company_id, g.name,
        g.is_non_gst_goods ?? 0,
        g.nature_of_transaction,
        g.taxability,
        g.igst_rate, g.cgst_rate, g.sgst_rate, g.cess_rate,
      ]
    );
  }
};

module.exports = {
  seedDefaultGSTClassifications,

  create: async (data) => {
    try {
      const exists = await db.execute(
        `SELECT * FROM gst_classifications WHERE company_id = ? AND LOWER(name) = LOWER(?) AND is_active = 1`,
        [data.company_id, data.name]
      );
      if (exists.rows.length > 0) return { success: false, error: 'GST Classification already exists' };
      console.log("GST CREATE EXECUTING");

      const result = await db.execute(
        `INSERT INTO gst_classifications (
          company_id, name, description, hsn_sac_code,
          is_non_gst_goods, nature_of_transaction, taxability,
          is_reverse_charge, is_ineligible_for_itc,
          rate_type,
          igst_rate, igst_valuation_type,
          cgst_rate, cgst_valuation_type,
          sgst_rate, sgst_valuation_type,
          cess_rate, cess_valuation_type,
          gst_rate_details,
          is_predefined, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.company_id,
          data.name,
          data.description || null,
          data.hsn_sac_code || null,
          data.is_non_gst_goods ?? 0,
          data.nature_of_transaction || 'Not Applicable',
          data.taxability || 'Unknown',
          data.is_reverse_charge ?? 0,
          data.is_ineligible_for_itc ?? 0,
          data.rate_type || 'Fixed Rate',
          data.igst_rate ?? 0,
          data.igst_valuation_type || 'Based on Value',
          data.cgst_rate ?? 0,
          data.cgst_valuation_type || 'Based on Value',
          data.sgst_rate ?? 0,
          data.sgst_valuation_type || 'Based on Value',
          data.cess_rate ?? 0,
          data.cess_valuation_type || 'Based on Value',
          data.rate_type === 'Slab Based' && Array.isArray(data.slab_rows)
            ? JSON.stringify(data.slab_rows)
            : null,
          0,
          1,
        ]
      );

      const classification = await db.execute(
        `SELECT * FROM gst_classifications WHERE gc_id = ?`,
        [result.lastInsertRowid]
      );
      return { success: true, classification: parseSlabRows(classification.rows[0]) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getAll: async (company_id) => {
    try {
      const result = await db.execute(
        `SELECT * FROM gst_classifications WHERE company_id = ? AND is_active = 1`,
        [company_id]
      );
      return {
        success: true,
        gstClassifications: result.rows.map(parseSlabRows),
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getById: async (id) => {
    try {
      const result = await db.execute(
        `SELECT * FROM gst_classifications WHERE gc_id = ?`,
        [id]
      );
      if (result.rows.length === 0) return { success: false, error: 'GST Classification not found' };
      return { success: true, classification: parseSlabRows(result.rows[0]) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  update: async (data) => {
    try {
      const existing = await db.execute(
        `SELECT * FROM gst_classifications WHERE gc_id = ?`,
        [data.gc_id]
      );
      if (existing.rows.length === 0) return { success: false, error: 'GST Classification not found' };
      if (existing.rows[0].is_predefined) return { success: false, error: 'Cannot edit predefined GST classifications' };

      const c = existing.rows[0];
      await db.execute(
        `UPDATE gst_classifications SET
          name = ?,
          description = ?,
          hsn_sac_code = ?,
          is_non_gst_goods = ?,
          nature_of_transaction = ?,
          taxability = ?,
          is_reverse_charge = ?,
          is_ineligible_for_itc = ?,
          rate_type = ?,
          igst_rate = ?,
          igst_valuation_type = ?,
          cgst_rate = ?,
          cgst_valuation_type = ?,
          sgst_rate = ?,
          sgst_valuation_type = ?,
          cess_rate = ?,
          cess_valuation_type = ?,
          gst_rate_details = ?,
          updated_at = datetime('now')
        WHERE gc_id = ?`,
                [
          data.name              ?? c.name,
          data.description       ?? c.description,
          data.hsn_sac_code      ?? c.hsn_sac_code,
          data.is_non_gst_goods  ?? c.is_non_gst_goods,
          data.nature_of_transaction ?? c.nature_of_transaction,
          data.taxability        ?? c.taxability,
          data.is_reverse_charge ?? c.is_reverse_charge,
          data.is_ineligible_for_itc ?? c.is_ineligible_for_itc,
          data.rate_type ?? c.rate_type,
          data.igst_rate         ?? c.igst_rate,
          data.igst_valuation_type ?? c.igst_valuation_type,
          data.cgst_rate         ?? c.cgst_rate,
          data.cgst_valuation_type ?? c.cgst_valuation_type,
          data.sgst_rate         ?? c.sgst_rate,
          data.sgst_valuation_type ?? c.sgst_valuation_type,
          data.cess_rate         ?? c.cess_rate,
          data.cess_valuation_type ?? c.cess_valuation_type,
          data.rate_type === 'Slab Based' && Array.isArray(data.slab_rows)
            ? JSON.stringify(data.slab_rows)
            : c.gst_rate_details || null,
          data.gc_id,
        ]
      );

      const updated = await db.execute(
        `SELECT * FROM gst_classifications WHERE gc_id = ?`,
        [data.gc_id]
      );
      return { success: true, classification: parseSlabRows(updated.rows[0]) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  delete: async (id) => {
    try {
      const existing = await db.execute(
        `SELECT * FROM gst_classifications WHERE gc_id = ?`,
        [id]
      );
      if (existing.rows.length === 0) return { success: false, error: 'GST Classification not found' };
      if (existing.rows[0].is_predefined) return { success: false, error: 'Cannot delete predefined GST classifications' };

      await db.execute(
        `UPDATE gst_classifications SET is_active = 0 WHERE gc_id = ?`,
        [id]
      );
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
};