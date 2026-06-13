const { db } = require('../db/index');

const get = async (company_id) => {
  try {
    const result = await db.execute({
      sql: `SELECT * FROM company_tcs_details WHERE company_id = ? LIMIT 1`,
      args: [company_id],
    });

    if (!result.rows || result.rows.length === 0) {
      return { success: true, exists: false, data: null };
    }

    const r = result.rows[0];
    return {
      success: true,
      exists: true,
      data: {
        tanRegNumber:                  r.tan_reg_number || '',
        tan:                           r.tan || '',
        collectorType:                 r.collector_type || 'Company',
        collectorBranch:               r.collector_branch || '',
        setAlterPersonResponsible:     r.set_alter_person_responsible === 1,
        personResponsibleName:         r.person_responsible_name || '',
        personResponsibleSonDaughterOf: r.person_responsible_son_daughter_of || '',
        personResponsibleDesignation:  r.person_responsible_designation || '',
        personResponsiblePan:          r.person_responsible_pan || '',
        personResponsibleFlatNo:       r.person_responsible_flat_no || '',
        personResponsiblePremises:     r.person_responsible_premises || '',
        personResponsibleRoad:         r.person_responsible_road || '',
        personResponsibleArea:         r.person_responsible_area || '',
        personResponsibleCity:         r.person_responsible_city || '',
        personResponsibleState:        r.person_responsible_state || '',
        personResponsiblePincode:      r.person_responsible_pincode || '',
        personResponsiblePhone:        r.person_responsible_phone || '',
        personResponsibleStdCode:      r.person_responsible_std_code || '',
        personResponsibleTelephone:    r.person_responsible_telephone || '',
        personResponsibleEmail:        r.person_responsible_email || '',
        ignoreItExemption:             r.ignore_it_exemption === 1,
      },
    };
  } catch (err) {
    console.error('Error fetching company TCS details:', err);
    return { success: false, error: err.message };
  }
};

const save = async (data) => {
  try {
    const company_id = data.company_id;
    if (!company_id) {
      return { success: false, error: 'Company ID is required' };
    }

    const existing = await db.execute({
      sql: `SELECT company_id FROM company_tcs_details WHERE company_id = ? LIMIT 1`,
      args: [company_id],
    });

    const args = [
      data.tanRegNumber || null,
      data.tan || null,
      data.collectorType || 'Company',
      data.collectorBranch || null,
      data.setAlterPersonResponsible ? 1 : 0,
      data.personResponsibleName || null,
      data.personResponsibleSonDaughterOf || null,
      data.personResponsibleDesignation || null,
      data.personResponsiblePan || null,
      data.personResponsibleFlatNo || null,
      data.personResponsiblePremises || null,
      data.personResponsibleRoad || null,
      data.personResponsibleArea || null,
      data.personResponsibleCity || null,
      data.personResponsibleState || null,
      data.personResponsiblePincode || null,
      data.personResponsiblePhone || null,
      data.personResponsibleStdCode || null,
      data.personResponsibleTelephone || null,
      data.personResponsibleEmail || null,
      data.ignoreItExemption ? 1 : 0,
    ];

    if (existing.rows && existing.rows.length > 0) {
      await db.execute({
        sql: `UPDATE company_tcs_details SET
                tan_reg_number                    = ?,
                tan                               = ?,
                collector_type                    = ?,
                collector_branch                  = ?,
                set_alter_person_responsible      = ?,
                person_responsible_name           = ?,
                person_responsible_son_daughter_of = ?,
                person_responsible_designation    = ?,
                person_responsible_pan            = ?,
                person_responsible_flat_no        = ?,
                person_responsible_premises       = ?,
                person_responsible_road           = ?,
                person_responsible_area           = ?,
                person_responsible_city           = ?,
                person_responsible_state          = ?,
                person_responsible_pincode        = ?,
                person_responsible_phone          = ?,
                person_responsible_std_code       = ?,
                person_responsible_telephone      = ?,
                person_responsible_email          = ?,
                ignore_it_exemption               = ?,
                updated_at                        = datetime('now')
              WHERE company_id = ?`,
        args: [...args, company_id],
      });
    } else {
      await db.execute({
        sql: `INSERT INTO company_tcs_details (
                company_id,
                tan_reg_number,
                tan,
                collector_type,
                collector_branch,
                set_alter_person_responsible,
                person_responsible_name,
                person_responsible_son_daughter_of,
                person_responsible_designation,
                person_responsible_pan,
                person_responsible_flat_no,
                person_responsible_premises,
                person_responsible_road,
                person_responsible_area,
                person_responsible_city,
                person_responsible_state,
                person_responsible_pincode,
                person_responsible_phone,
                person_responsible_std_code,
                person_responsible_telephone,
                person_responsible_email,
                ignore_it_exemption
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [company_id, ...args],
      });
    }

    return { success: true };
  } catch (err) {
    console.error('Error saving company TCS details:', err);
    return { success: false, error: err.message };
  }
};

module.exports = { get, save };