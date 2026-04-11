-- categories テーブルに icon カラムを追加
alter table categories add column if not exists icon text;
