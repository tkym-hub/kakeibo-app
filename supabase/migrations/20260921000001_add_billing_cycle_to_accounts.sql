-- クレジットカードの締め日・引き落とし日（口座ごとに異なるサイクルに対応）
alter table accounts
  add column closing_day          int check (closing_day between 1 and 31),
  add column payment_day          int check (payment_day between 1 and 31),
  add column payment_month_offset int not null default 0 check (payment_month_offset between 0 and 2);

comment on column accounts.closing_day          is '締め日（null なら月初〜月末を1期間として扱う）';
comment on column accounts.payment_day          is '引き落とし日（null なら対象月の末日）';
comment on column accounts.payment_month_offset is '締め月から引き落とし月までの月数。0=当月、1=翌月';
