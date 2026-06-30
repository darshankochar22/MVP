const s = require('./ewayBillService');

module.exports = {
  getStatus:          (e, { company_id })                               => s.getStatus(company_id),
  generateFromVoucher:(e, { company_id, voucher_id, transport })        => s.generateFromVoucher(company_id, voucher_id, transport),
  generateByIrn:      (e, { company_id, voucher_id, irn, transport })   => s.generateByIrn(company_id, voucher_id, irn, transport),
  cancel:             (e, { ewb_no, cancel_reason, cancel_remarks })    => s.cancel(ewb_no, cancel_reason, cancel_remarks),
  get:                (e, { ewb_no })                                   => s.get(ewb_no),
  getRecords:         (e, { company_id })                               => s.getRecords(company_id),
};
