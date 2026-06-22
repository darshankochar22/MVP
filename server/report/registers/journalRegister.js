const { getRegisterData } = require('../utils/registerBuilder');

const journalRegister = async (company_id, fy_id) => {
  try {
    const rows = await getRegisterData(company_id, fy_id, 'Journal');
    return { success: true, rows };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

module.exports = { journalRegister };