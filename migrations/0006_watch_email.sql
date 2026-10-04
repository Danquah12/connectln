alter table hall_watch_notes add column if not exists email text not null default '';
create index if not exists hall_watch_notes_email_idx on hall_watch_notes (email);
