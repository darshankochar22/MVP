const { db } = require('../db/index');

module.exports = {
  getByCompany: async (company_id) => {
    try {
      const result = await db.execute(
        `SELECT * FROM company_gst_details WHERE company_id = ? AND is_active = 1`,
        [company_id]
      );
      return { success: true, gstDetails: result.rows[0] || null };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  upsert: async (data) => {
    try {
      const existing = await db.execute(
        `SELECT * FROM company_gst_details WHERE company_id = ?`,
        [data.company_id]
      );

      if (existing.rows.length > 0) {
        await db.execute(
          `UPDATE company_gst_details SET
            gstin = ?,
            registration_type = ?,
            state_name = ?,
            applicable_from = ?,
            periodicity_of_gstr1 = ?,
            assessee_of_other_territory = ?,
            enable_e_invoice = ?,
            e_invoice_applicable_from = ?,
            enable_e_way_bill = ?,
            e_way_bill_applicable_from = ?,
            e_way_bill_for_intrastate = ?,
            hsn_sac_details = ?,
            hsn_sac = ?,
            description = ?,
            gst_rate_details = ?,
            taxability_type = ?,
            gst_rate = ?,
            hsn_summary_for = ?,
            min_hsn_sac_length = ?,
            show_gst_advances = ?,
            update_gst_on_master_alter = ?,
            set_alter_gst_return_details = ?,
            is_active = 1,
            updated_at = datetime('now')
          WHERE company_id = ?`,
          [
            data.gstin || null,
            data.registration_type || 'Regular',
            data.state_name || null,
            data.applicable_from || null,
            data.periodicity_of_gstr1 || 'Monthly',
            data.assessee_of_other_territory ? 1 : 0,
            data.enable_e_invoice ? 1 : 0,
            data.e_invoice_applicable_from || null,
            data.enable_e_way_bill ? 1 : 0,
            data.e_way_bill_applicable_from || null,
            data.e_way_bill_for_intrastate ? 1 : 0,
            data.hsn_sac_details || 'Not Defined',
            data.hsn_sac || null,
            data.description || null,
            data.gst_rate_details || 'Not Defined',
            data.taxability_type || null,
            data.gst_rate ?? 0,
            data.hsn_summary_for || 'All Sections',
            data.min_hsn_sac_length ?? 4,
            data.show_gst_advances ? 1 : 0,
            data.update_gst_on_master_alter ? 1 : 0,
            data.set_alter_gst_return_details ? 1 : 0,
            data.company_id,
          ]
        );
      } else {
        await db.execute(
          `INSERT INTO company_gst_details (
            company_id, gstin, registration_type, state_name, applicable_from,
            periodicity_of_gstr1, assessee_of_other_territory,
            enable_e_invoice, e_invoice_applicable_from,
            enable_e_way_bill, e_way_bill_applicable_from, e_way_bill_for_intrastate,
            hsn_sac_details, hsn_sac, description,
            gst_rate_details, taxability_type, gst_rate,
            hsn_summary_for, min_hsn_sac_length,
            show_gst_advances, update_gst_on_master_alter, set_alter_gst_return_details,
            is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [
            data.company_id,
            data.gstin || null,
            data.registration_type || 'Regular',
            data.state_name || null,
            data.applicable_from || null,
            data.periodicity_of_gstr1 || 'Monthly',
            data.assessee_of_other_territory ? 1 : 0,
            data.enable_e_invoice ? 1 : 0,
            data.e_invoice_applicable_from || null,
            data.enable_e_way_bill ? 1 : 0,
            data.e_way_bill_applicable_from || null,
            data.e_way_bill_for_intrastate ? 1 : 0,
            data.hsn_sac_details || 'Not Defined',
            data.hsn_sac || null,
            data.description || null,
            data.gst_rate_details || 'Not Defined',
            data.taxability_type || null,
            data.gst_rate ?? 0,
            data.hsn_summary_for || 'All Sections',
            data.min_hsn_sac_length ?? 4,
            data.show_gst_advances ? 1 : 0,
            data.update_gst_on_master_alter ? 1 : 0,
            data.set_alter_gst_return_details ? 1 : 0,
          ]
        );
      }

      const saved = await db.execute(
        `SELECT * FROM company_gst_details WHERE company_id = ?`,
        [data.company_id]
      );
      return { success: true, gstDetails: saved.rows[0] };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
};
