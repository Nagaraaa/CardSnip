-- CardSnip database schema draft.
-- This file is intentionally not a Supabase migration yet because the Supabase CLI
-- is not installed locally. Convert it with `supabase migration new ...` later.

create extension if not exists "pgcrypto";

create type public.product_category as enum (
  'etb',
  'display',
  'booster',
  'bundle',
  'collection',
  'accessory',
  'other'
);

create type public.observation_source as enum (
  'manual',
  'csv_import',
  'scraper',
  'api',
  'partner'
);

create type public.stock_status as enum (
  'in_stock',
  'out_of_stock',
  'preorder',
  'unknown'
);

create type public.alert_kind as enum (
  'price_below_target',
  'back_in_stock',
  'new_deal',
  'watch_signal'
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  extension_name text,
  category public.product_category not null default 'other',
  language_code text not null default 'fr',
  release_date date,
  image_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_assets (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  source_url text,
  alt_text text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (product_id, storage_path)
);

create table public.shops (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  country_code text,
  website_url text,
  source_kind text not null default 'manual',
  enabled boolean not null default true,
  reliability_score integer not null default 70 check (reliability_score between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tracked_products (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  shop_id uuid references public.shops(id) on delete set null,
  product_url text,
  target_price numeric(10, 2),
  enabled boolean not null default true,
  priority integer not null default 2 check (priority between 1 and 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, shop_id, product_url)
);

create table public.price_observations (
  id uuid primary key default gen_random_uuid(),
  tracked_product_id uuid not null references public.tracked_products(id) on delete cascade,
  observed_at timestamptz not null default now(),
  source public.observation_source not null default 'manual',
  price numeric(10, 2) not null check (price >= 0),
  currency text not null default 'EUR',
  stock_status public.stock_status not null default 'unknown',
  source_url text,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  tracked_product_id uuid references public.tracked_products(id) on delete cascade,
  observation_id uuid references public.price_observations(id) on delete set null,
  kind public.alert_kind not null,
  title text not null,
  message text not null,
  delivered_console boolean not null default false,
  delivered_discord boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.watch_signals (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  title text not null,
  source_name text not null,
  source_url text,
  confidence integer not null default 50 check (confidence between 0 and 100),
  priority integer not null default 2 check (priority between 1 and 3),
  status text not null default 'to_verify',
  summary text,
  created_at timestamptz not null default now()
);

create index products_category_idx on public.products(category);
create index products_extension_name_idx on public.products(extension_name);
create index product_assets_product_id_idx on public.product_assets(product_id);
create index tracked_products_product_id_idx on public.tracked_products(product_id);
create index tracked_products_shop_id_idx on public.tracked_products(shop_id);
create index price_observations_tracked_product_observed_idx
  on public.price_observations(tracked_product_id, observed_at desc);
create index alerts_created_at_idx on public.alerts(created_at desc);
create index watch_signals_created_at_idx on public.watch_signals(created_at desc);

alter table public.products enable row level security;
alter table public.product_assets enable row level security;
alter table public.shops enable row level security;
alter table public.tracked_products enable row level security;
alter table public.price_observations enable row level security;
alter table public.alerts enable row level security;
alter table public.watch_signals enable row level security;

-- No public RLS policies yet.
-- Phase 1 backend should read/write through trusted server-side code only.
-- Add user-scoped policies when CardSnip introduces real accounts.
