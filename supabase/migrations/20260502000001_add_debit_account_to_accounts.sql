alter table accounts
  add column debit_account_id uuid references accounts(id) on delete set null;
