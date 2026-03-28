-- updated_at を自動更新するトリガー関数（全テーブル共通）
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ----------------------------------------------------------------
-- accounts
-- ----------------------------------------------------------------
create table accounts (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references auth.users(id) on delete cascade,
  name             text        not null,
  kind             text        not null check (kind in ('bank', 'cash', 'credit_card', 'e_money')),
  sort_order       int         not null default 0,
  is_active        bool        not null default true,
  opening_balance  numeric     not null default 0 check (opening_balance >= 0),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger accounts_updated_at
  before update on accounts
  for each row execute function update_updated_at();

create index on accounts(user_id, is_active);

-- RLS
alter table accounts enable row level security;

create policy "自分の口座のみ操作可能"
  on accounts for all
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());
