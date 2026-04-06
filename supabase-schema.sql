-- ── Supabase schema — Tabla de productos ──────────────────────────────
-- Ejecuta esto en el SQL Editor de tu proyecto en supabase.com

create table if not exists products (
  id            uuid default gen_random_uuid() primary key,
  name          text not null,
  slug          text unique not null,
  price         numeric not null,
  compare_price numeric,
  description   text,
  category      text,
  subcategory   text,
  sizes         text[] default '{}',
  colors        text[] default '{}',
  images        text[] default '{}',
  badge         text,
  is_new        boolean default false,
  is_featured   boolean default false,
  created_at    timestamptz default now()
);

-- Índices útiles
create index if not exists products_category_idx on products(category);
create index if not exists products_is_featured_idx on products(is_featured);
create index if not exists products_slug_idx on products(slug);

-- Row Level Security (lectura pública)
alter table products enable row level security;
create policy "Public read" on products for select using (true);
