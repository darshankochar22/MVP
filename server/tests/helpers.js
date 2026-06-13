const { initDB, db } = require("../db/index");
const companyService = require("../company/companyService");

let initPromise = null;

async function setupTestDB() {
  if (!initPromise) {
    initPromise = initDB();
  }
  await initPromise;
  return db;
}

async function createTestCompany(name = "Test Integration Company") {
  const data = {
    name,
    mailing_name: name + " Co.",
    address1: "123 Test Street",
    address2: "Suite 400",
    state: "Maharashtra",
    country: "India",
    pincode: "400001",
    telephone: "022-1234567",
    mobile: "9876543210",
    fax: "022-7654321",
    email: "test@integration.com",
    website: "www.integration.com",
    base_currency_symbol: "₹",
    formal_name: "INR",
    financial_year_beginning_from: "2026-04-01",
    books_beginning_from: "2026-04-01",
    password: "secure_password",
  };
  const result = await companyService.create(data);
  if (!result.success) {
    throw new Error(`Failed to create test company: ${result.error}`);
  }
  return result.company;
}

module.exports = {
  setupTestDB,
  createTestCompany,
  db,
};
