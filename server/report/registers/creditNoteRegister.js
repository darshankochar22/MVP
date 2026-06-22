const { getRegisterData } = require('../utils/registerBuilder');

const creditNoteRegister = async (company_id, fy_id) => {
  try {
    const rows = await getRegisterData(company_id, fy_id, 'Credit Note');
    return { success: true, rows };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

module.exports = { creditNoteRegister };