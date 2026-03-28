-- update_updated_at が未定義の場合に備えて再定義
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ----------------------------------------------------------------
-- recurring_templates
-- ----------------------------------------------------------------
create table recurring_templates (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        not null references auth.users(id) on delete cascade,
  name           text        not null,
  amount         numeric     not null check (amount > 0),
  type           text        not null check (type in ('income', 'expense')),
  category_id    uuid        not null references categories(id) on delete restrict,
  account_id     uuid        not null references accounts(id) on delete restrict,
  day_of_month   int         not null check (day_of_month between 1 and 31),
  is_active      bool        not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger recurring_templates_updated_at
  before update on recurring_templates
  for each row execute function update_updated_at();

create index on recurring_templates(user_id, is_active);

-- RLS
alter table recurring_templates enable row level security;

create policy "自分のテンプレートのみ操作可能"
  on recurring_templates for all
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());
