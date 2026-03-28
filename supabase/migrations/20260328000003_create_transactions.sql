-- ----------------------------------------------------------------
-- transactions
-- ----------------------------------------------------------------
create table transactions (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references auth.users(id) on delete cascade,
  account_id       uuid        not null references accounts(id) on delete restrict,
  category_id      uuid        not null references categories(id) on delete restrict,
  txn_date         date        not null,
  type             text        not null check (type in ('income', 'expense', 'transfer')),
  amount           numeric     not null check (amount > 0),  -- 常に正数。向きは type で表現
  memo             text,
  transfer_pair_id uuid        references transactions(id) on delete set null,  -- 振替ペア
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger transactions_updated_at
  before update on transactions
  for each row execute function update_updated_at();

create index on transactions(user_id, txn_date);
create index on transactions(user_id, category_id, txn_date);
create index on transactions(user_id, account_id, txn_date);

-- RLS
alter table transactions enable row level security;

create policy "自分の明細のみ操作可能"
  on transactions for all
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());
