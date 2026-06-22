const calcLedgerBalance = (ledger_id, entries, opening_balance = 0, opening_balance_type = 'Dr') => {
  const rawOpening = Number(opening_balance) || 0;
  let balance = rawOpening < 0
    ? rawOpening
    : (opening_balance_type === 'Cr' ? -rawOpening : rawOpening);
  entries
    .filter(e => e.ledger_id === ledger_id)
    .forEach(e => {
      balance += e.type === 'Dr' ? e.amount : -e.amount;
    });
  return balance;
};

module.exports = { calcLedgerBalance };