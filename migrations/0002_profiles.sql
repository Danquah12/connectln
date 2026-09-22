-- Per-login seat on the board. Better Auth owns identity + sessions;
-- this table is the operator role, status, and the person's card.
create table if not exists profiles (
  user_id    text primary key,
  role       text not null default 'member',
  status     text not null default 'active',
  name       text not null default '',
  email      text,
  person     text not null default '{}',
  created_at timestamptz not null default now(),
  last_seen  timestamptz not null default now()
);

create index if not exists profiles_role_idx on profiles (role);
create index if not exists profiles_status_idx on profiles (status);
