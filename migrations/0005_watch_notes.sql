create table if not exists hall_watch_notes (
  id        text primary key,
  at        timestamptz not null default now(),
  who_id    text not null,
  who_name  text not null default '',
  action    text not null,
  target    text not null,
  detail    text
);
create index if not exists hall_watch_notes_at_idx on hall_watch_notes (at desc);
