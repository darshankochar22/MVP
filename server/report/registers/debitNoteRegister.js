const { getRegisterData } = require('../utils/registerBuilder');

const debitNoteRegister = async (company_id, fy_id) => {
  try {
    const rows = await getRegisterData(company_id, fy_id, 'Debit Note');
    return { success: true, rows };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

module.exports = { debitNoteRegister };