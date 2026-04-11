-- 新規ユーザー登録時にデフォルトカテゴリを自動シードするトリガー
create or replace function seed_default_categories()
returns trigger as $$
begin
  insert into public.categories (user_id, name, type, sort_order, is_fixed, is_active)
  values
    (new.id, '給与',      'income',  1,  false, true),
    (new.id, '副業',      'income',  2,  false, true),
    (new.id, '投資収入',  'income',  3,  false, true),
    (new.id, 'その他収入','income',  4,  false, true),
    (new.id, '食費',      'expense', 10, false, true),
    (new.id, '日用品',    'expense', 11, false, true),
    (new.id, '交通費',    'expense', 12, false, true),
    (new.id, '住居費',    'expense', 13, true,  true),
    (new.id, '光熱費',    'expense', 14, true,  true),
    (new.id, '通信費',    'expense', 15, true,  true),
    (new.id, '保険料',    'expense', 16, true,  true),
    (new.id, '医療費',    'expense', 17, false, true),
    (new.id, '娯楽',      'expense', 18, false, true),
    (new.id, '衣服',      'expense', 19, false, true),
    (new.id, '教育',      'expense', 20, false, true),
    (new.id, '投資',      'expense', 21, false, true),
    (new.id, 'その他',    'expense', 22, false, true);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function seed_default_categories();
