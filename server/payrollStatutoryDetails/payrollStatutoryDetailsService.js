// Payroll Statutory Details service — Drizzle ORM (follows companyGstDetailsService).
//   * READS use db.all(sql`SELECT ...`) so the legacy snake_case shape is preserved
//     and mapped to the camelCase the frontend uses.
//   * MUTATIONS use the query builder (upsert by company_id).
const { db } = require('../db/index');
const { sql, eq } = require('drizzle-orm');
const { payrollStatutoryDetails } = require('../db/schema');

const DEFAULTS = {
  pfCompanyCode: '',
  pfAccountGroupCode: '',
  pfSecurityCode: '',
  esiCompanyCode: '',
  esiBranchOffice: '',
  esiStandardWorkingDays: 0,
  npsCorporateRegistrationNumber: '',
  npsCorporateBranchOfficeNumber: '',
  itTan: '',
  itTanRegistrationNumber: '',
  itCircleOrWard: '',
  itDeductorType: 'Government',
  itDeductorBranchDivision: '',
  itPersonResponsibleName: '',
  itPersonResponsibleRelation: '',
  itDesignation: '',
  itPan: '',
};

const get = async (company_id) => {
  try {
    const rows = await db.all(
      sql`SELECT * FROM ${payrollStatutoryDetails}
          WHERE ${payrollStatutoryDetails.companyId} = ${company_id}
          LIMIT 1`
    );

    if (!rows || rows.length === 0) {
      return { success: true, exists: false, data: { ...DEFAULTS } };
    }

    const r = rows[0];
    return {
      success: true,
      exists: true,
      data: {
        pfCompanyCode: r.pf_company_code || '',
        pfAccountGroupCode: r.pf_account_group_code || '',
        pfSecurityCode: r.pf_security_code || '',
        esiCompanyCode: r.esi_company_code || '',
        esiBranchOffice: r.esi_branch_office || '',
        esiStandardWorkingDays: Number(r.esi_standard_working_days) || 0,
        npsCorporateRegistrationNumber: r.nps_corporate_registration_number || '',
        npsCorporateBranchOfficeNumber: r.nps_corporate_branch_office_number || '',
        itTan: r.it_tan || '',
        itTanRegistrationNumber: r.it_tan_registration_number || '',
        itCircleOrWard: r.it_circle_or_ward || '',
        itDeductorType: r.it_deductor_type || 'Government',
        itDeductorBranchDivision: r.it_deductor_branch_division || '',
        itPersonResponsibleName: r.it_person_responsible_name || '',
        itPersonResponsibleRelation: r.it_person_responsible_relation || '',
        itDesignation: r.it_designation || '',
        itPan: r.it_pan || '',
      },
    };
  } catch (err) {
    console.error('Error fetching payroll statutory details:', err);
    return { success: false, error: err.message };
  }
};

const toColumns = (data) => ({
  pfCompanyCode: data.pfCompanyCode || null,
  pfAccountGroupCode: data.pfAccountGroupCode || null,
  pfSecurityCode: data.pfSecurityCode || null,
  esiCompanyCode: data.esiCompanyCode || null,
  esiBranchOffice: data.esiBranchOffice || null,
  esiStandardWorkingDays: Number(data.esiStandardWorkingDays) || 0,
  npsCorporateRegistrationNumber: data.npsCorporateRegistrationNumber || null,
  npsCorporateBranchOfficeNumber: data.npsCorporateBranchOfficeNumber || null,
  itTan: data.itTan || null,
  itTanRegistrationNumber: data.itTanRegistrationNumber || null,
  itCircleOrWard: data.itCircleOrWard || null,
  itDeductorType: data.itDeductorType || 'Government',
  itDeductorBranchDivision: data.itDeductorBranchDivision || null,
  itPersonResponsibleName: data.itPersonResponsibleName || null,
  itPersonResponsibleRelation: data.itPersonResponsibleRelation || null,
  itDesignation: data.itDesignation || null,
  itPan: data.itPan || null,
});

const save = async (data) => {
  try {
    const company_id = data.company_id;
    if (!company_id) return { success: false, error: 'Company ID is required' };

    const existing = await db.all(
      sql`SELECT ${payrollStatutoryDetails.companyId} FROM ${payrollStatutoryDetails}
          WHERE ${payrollStatutoryDetails.companyId} = ${company_id}
          LIMIT 1`
    );

    if (existing && existing.length > 0) {
      await db
        .update(payrollStatutoryDetails)
        .set({ ...toColumns(data), updatedAt: sql`datetime('now')` })
        .where(eq(payrollStatutoryDetails.companyId, company_id));
    } else {
      await db
        .insert(payrollStatutoryDetails)
        .values({ companyId: company_id, ...toColumns(data) });
    }

    return { success: true };
  } catch (err) {
    console.error('Error saving payroll statutory details:', err);
    return { success: false, error: err.message };
  }
};

module.exports = { get, save };
