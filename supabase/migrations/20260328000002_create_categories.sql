-- ----------------------------------------------------------------
-- categories
-- ----------------------------------------------------------------
create table categories (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  name        text        not null,
  type        text        not null check (type in ('income', 'expense', 'transfer')),
  sort_order  int         not null default 0,
  is_fixed    bool        not null default false,  -- 固定費フラグ（月次レポートの固定費/変動費分類に使用）
  is_active   bool        not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger categories_updated_at
  before update on categories
  for each row execute function update_updated_at();

create index on categories(user_id, type);

-- RLS
alter table categories enable row level security;

create policy "自分のカテゴリのみ操作可能"
  on categories for all
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());
