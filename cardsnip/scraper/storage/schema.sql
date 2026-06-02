pragma foreign_keys = on;

create table if not exists products (
  id integer primary key autoincrement,
  name text not null,
  category text not null default 'other',
  language text not null default 'FR',
  extension text,
  image_url text,
  created_at text not null default current_timestamp
);

create table if not exists shops (
  id integer primary key autoincrement,
  name text not null unique,
  url text,
  scraper_key text not null default 'not_configured',
  country text not null default 'unknown',
  type text not null default 'tcg_specialist',
  priority text not null default 'medium',
  difficulty text not null default 'unknown',
  integration_status text not null default 'to_analyze',
  notes text,
  active integer not null default 1,
  trusted integer not null default 1,
  created_at text not null default current_timestamp
);

create table if not exists tracked_products (
  id integer primary key autoincrement,
  product_id integer not null,
  shop_id integer not null,
  source_url text not null,
  target_price real not null,
  active integer not null default 1,
  created_at text not null default current_timestamp,
  foreign key (product_id) references products(id) on delete cascade,
  foreign key (shop_id) references shops(id) on delete cascade
);

create table if not exists price_observations (
  id integer primary key autoincrement,
  tracked_product_id integer not null,
  price real not null,
  stock_status text not null,
  checked_at text not null default current_timestamp,
  foreign key (tracked_product_id) references tracked_products(id) on delete cascade
);

create table if not exists alerts (
  id integer primary key autoincrement,
  tracked_product_id integer not null,
  type text not null,
  message text not null,
  created_at text not null default current_timestamp,
  foreign key (tracked_product_id) references tracked_products(id) on delete cascade
);

create index if not exists tracked_products_active_idx on tracked_products(active);
create index if not exists tracked_products_product_idx on tracked_products(product_id);
create index if not exists tracked_products_shop_idx on tracked_products(shop_id);
create index if not exists price_observations_tracked_checked_idx
  on price_observations(tracked_product_id, checked_at desc);
create index if not exists price_observations_stock_idx on price_observations(stock_status);
create index if not exists alerts_created_idx on alerts(created_at desc);
create index if not exists alerts_tracked_type_idx on alerts(tracked_product_id, type);
