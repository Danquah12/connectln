-- Shared hall: lines, calls, vouches. Cards live on profiles.person.
create table if not exists hall_posts (
  id         text primary key,
  author_id  text not null,
  kind       text not null,
  body       text not null,
  photo      text,
  parent_id  text,
  likes      integer not null default 0,
  boosts     integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists hall_posts_created_idx on hall_posts (created_at desc);
create index if not exists hall_posts_author_idx on hall_posts (author_id);

create table if not exists hall_calls (
  id         text primary key,
  author_id  text not null,
  payload    text not null,
  created_at timestamptz not null default now()
);
create index if not exists hall_calls_created_idx on hall_calls (created_at desc);

create table if not exists hall_vouches (
  id         text primary key,
  from_id    text not null,
  to_id      text not null,
  site       text not null,
  body       text not null,
  kinds      text,
  created_at timestamptz not null default now(),
  unique (from_id, to_id)
);
create index if not exists hall_vouches_to_idx on hall_vouches (to_id);

create table if not exists hall_call_apps (
  call_id    text not null,
  user_id    text not null,
  created_at timestamptz not null default now(),
  primary key (call_id, user_id)
);
