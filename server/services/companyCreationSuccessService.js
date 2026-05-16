let companyCreationSuccesses = [];

const seedCompanyCreationSuccess = (company_id) => {
  companyCreationSuccesses.push({
    id: Date.now(),
    company_id,
    created_successfully: true,
    success_screen_shown: false,
    show_more_features: false,
    show_all_features: false,
    default_features_loaded: true,
    feature_setup_completed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
};

module.exports = {
  seedCompanyCreationSuccess,

  get: async (company_id) => {
    try {
      const record = companyCreationSuccesses.find(c => c.company_id === company_id);
      if (!record) return { success: false, error: 'Record not found' };
      return { success: true, record };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  update: async (data) => {
    try {
      const index = companyCreationSuccesses.findIndex(c => c.company_id === data.company_id);
      if (index === -1) return { success: false, error: 'Record not found' };

      companyCreationSuccesses[index] = {
        ...companyCreationSuccesses[index],
        ...data,
        updated_at: new Date().toISOString(),
      };
      return { success: true, record: companyCreationSuccesses[index] };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
};