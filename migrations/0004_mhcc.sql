-- Maryland Labor / MHCC professional book. Purchased directory. Not per-user.
create table if not exists mhcc_book (
  id           text primary key,
  license      text not null,
  first_name   text not null,
  last_name    text not null,
  profession   text not null,
  trade        text not null,
  status       text not null default 'Active',
  city         text,
  county       text,
  state        text not null default 'MD',
  zip          text,
  issued       text,
  expires      text,
  board        text,
  source       text not null default 'maryland-labor',
  sample       boolean not null default false,
  created_at   timestamptz not null default now()
);
create unique index if not exists mhcc_book_license_idx on mhcc_book (license, board);
create index if not exists mhcc_book_trade_idx on mhcc_book (trade);
create index if not exists mhcc_book_city_idx on mhcc_book (city);
