const { db } = require("../db/index");

const INSERT_TAX_UNIT_SQL = `
  INSERT INTO tax_units (
    company_id, name, alias,
    address_line1, address_line2, address_line3, address_line4,
    state, pincode, telephone,
    registered_for, set_alter_excise_details,
    registration_type, ecc_number,
    set_alter_excise_tariff, set_alter_rule11_book,
    sort_order, is_active
  ) VALUES (
    :company_id, :name, :alias,
    :address_line1, :address_line2, :address_line3, :address_line4,
    :state, :pincode, :telephone,
    :registered_for, :set_alter_excise_details,
    :registration_type, :ecc_number,
    :set_alter_excise_tariff, :set_alter_rule11_book,
    :sort_order, :is_active
  )
`;

module.exports = {
  create: async (data) => {
    try {
      const existsResult = await db.execute({
        sql: `SELECT * FROM tax_units WHERE company_id = ? AND LOWER(name) = LOWER(?) AND is_active = 1`,
        args: [data.company_id, data.name]
      });

      if (existsResult.rows.length > 0) return { success: false, error: "Tax unit already exists" };

      const result = await db.execute({
        sql: INSERT_TAX_UNIT_SQL,
        args: {
          company_id: data.company_id,
          name: data.name,
          alias: data.alias || null,
          address_line1: data.address_line1 || null,
          address_line2: data.address_line2 || null,
          address_line3: data.address_line3 || null,
          address_line4: data.address_line4 || null,
          state: data.state || null,
          pincode: data.pincode || null,
          telephone: data.telephone || null,
          registered_for: data.registered_for || "Excise",
          set_alter_excise_details: data.set_alter_excise_details ? 1 : 0,
          registration_type: data.registration_type || "Importer",
          ecc_number: data.ecc_number || null,
          set_alter_excise_tariff: data.set_alter_excise_tariff ? 1 : 0,
          set_alter_rule11_book: data.set_alter_rule11_book ? 1 : 0,
          sort_order: data.sort_order || 0,
          is_active: 1,
        }
      });

      const fetchResult = await db.execute({
        sql: `SELECT * FROM tax_units WHERE tax_unit_id = ?`,
        args: [Number(result.lastInsertRowid)]
      });

      return { success: true, taxUnit: fetchResult.rows[0] };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getAll: async (company_id) => {
    try {
      const result = await db.execute({
        sql: `SELECT * FROM tax_units WHERE company_id = ? AND is_active = 1`,
        args: [company_id]
      });
      return { success: true, taxUnits: result.rows };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getById: async (id) => {
    try {
      const result = await db.execute({
        sql: `SELECT * FROM tax_units WHERE tax_unit_id = ?`,
        args: [id]
      });
      if (result.rows.length === 0) return { success: false, error: "Tax unit not found" };
      return { success: true, taxUnit: result.rows[0] };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  update: async (data) => {
    try {
      const checkResult = await db.execute({
        sql: `SELECT * FROM tax_units WHERE tax_unit_id = ?`,
        args: [data.tax_unit_id]
      });
      if (checkResult.rows.length === 0) return { success: false, error: "Tax unit not found" };

      const taxUnit = checkResult.rows[0];

      await db.execute({
        sql: `
          UPDATE tax_units SET
            name = :name, alias = :alias,
            address_line1 = :address_line1, address_line2 = :address_line2,
            address_line3 = :address_line3, address_line4 = :address_line4,
            state = :state, pincode = :pincode, telephone = :telephone,
            registered_for = :registered_for,
            set_alter_excise_details = :set_alter_excise_details,
            registration_type = :registration_type, ecc_number = :ecc_number,
            set_alter_excise_tariff = :set_alter_excise_tariff,
            set_alter_rule11_book = :set_alter_rule11_book,
            sort_order = :sort_order,
            updated_at = datetime('now')
          WHERE tax_unit_id = :tax_unit_id
        `,
        args: {
          tax_unit_id: data.tax_unit_id,
          name: data.name !== undefined ? data.name : taxUnit.name,
          alias: data.alias !== undefined ? data.alias : taxUnit.alias,
          address_line1: data.address_line1 !== undefined ? data.address_line1 : taxUnit.address_line1,
          address_line2: data.address_line2 !== undefined ? data.address_line2 : taxUnit.address_line2,
          address_line3: data.address_line3 !== undefined ? data.address_line3 : taxUnit.address_line3,
          address_line4: data.address_line4 !== undefined ? data.address_line4 : taxUnit.address_line4,
          state: data.state !== undefined ? data.state : taxUnit.state,
          pincode: data.pincode !== undefined ? data.pincode : taxUnit.pincode,
          telephone: data.telephone !== undefined ? data.telephone : taxUnit.telephone,
          registered_for: data.registered_for !== undefined ? data.registered_for : taxUnit.registered_for,
          set_alter_excise_details: data.set_alter_excise_details !== undefined ? (data.set_alter_excise_details ? 1 : 0) : taxUnit.set_alter_excise_details,
          registration_type: data.registration_type !== undefined ? data.registration_type : taxUnit.registration_type,
          ecc_number: data.ecc_number !== undefined ? data.ecc_number : taxUnit.ecc_number,
          set_alter_excise_tariff: data.set_alter_excise_tariff !== undefined ? (data.set_alter_excise_tariff ? 1 : 0) : taxUnit.set_alter_excise_tariff,
          set_alter_rule11_book: data.set_alter_rule11_book !== undefined ? (data.set_alter_rule11_book ? 1 : 0) : taxUnit.set_alter_rule11_book,
          sort_order: data.sort_order !== undefined ? data.sort_order : taxUnit.sort_order,
        }
      });

      const updatedResult = await db.execute({
        sql: `SELECT * FROM tax_units WHERE tax_unit_id = ?`,
        args: [data.tax_unit_id]
      });
      return { success: true, taxUnit: updatedResult.rows[0] };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  delete: async (id) => {
    try {
      const checkResult = await db.execute({
        sql: `SELECT * FROM tax_units WHERE tax_unit_id = ?`,
        args: [id]
      });
      if (checkResult.rows.length === 0) return { success: false, error: "Tax unit not found" };

      await db.execute({
        sql: `UPDATE tax_units SET is_active = 0 WHERE tax_unit_id = ?`,
        args: [id]
      });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
};