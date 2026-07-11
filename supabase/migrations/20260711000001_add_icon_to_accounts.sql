-- accounts テーブルに icon カラムを追加
alter table accounts add column if not exists icon text;
