-- ══════════════════════════════════════════════════════════════════════════════
-- Sprint 6 — Bialy Colombia
-- Run this in: Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. Storage buckets ────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images', 'product-images', true,
  10485760,   -- 10 MB
  array['image/jpeg','image/jpg','image/png','image/webp']
)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'home-images', 'home-images', true,
  10485760,   -- 10 MB
  array['image/jpeg','image/jpg','image/png','image/webp']
)
on conflict (id) do nothing;

-- ── 2. Storage RLS policies ───────────────────────────────────────────────────

-- Public SELECT on product-images
drop policy if exists "Public read product-images"  on storage.objects;
create policy "Public read product-images"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Service role INSERT/UPDATE/DELETE on product-images
drop policy if exists "Service write product-images" on storage.objects;
create policy "Service write product-images"
  on storage.objects for insert
  with check (bucket_id = 'product-images');

drop policy if exists "Service update product-images" on storage.objects;
create policy "Service update product-images"
  on storage.objects for update
  using (bucket_id = 'product-images');

drop policy if exists "Service delete product-images" on storage.objects;
create policy "Service delete product-images"
  on storage.objects for delete
  using (bucket_id = 'product-images');

-- Public SELECT on home-images
drop policy if exists "Public read home-images" on storage.objects;
create policy "Public read home-images"
  on storage.objects for select
  using (bucket_id = 'home-images');

-- Service role INSERT/UPDATE on home-images
drop policy if exists "Service write home-images" on storage.objects;
create policy "Service write home-images"
  on storage.objects for insert
  with check (bucket_id = 'home-images');

drop policy if exists "Service update home-images" on storage.objects;
create policy "Service update home-images"
  on storage.objects for update
  using (bucket_id = 'home-images');

-- ── 3. home_sections table ────────────────────────────────────────────────────

create table if not exists home_sections (
  id          text        primary key,
  label       text        not null,
  image_url   text        not null,
  updated_at  timestamptz not null default now()
);

-- RLS
alter table home_sections enable row level security;

drop policy if exists "Public read home_sections"         on home_sections;
drop policy if exists "Service role write home_sections"  on home_sections;

create policy "Public read home_sections"
  on home_sections for select
  using (true);

create policy "Service role write home_sections"
  on home_sections for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ── 4. Initial rows ───────────────────────────────────────────────────────────

insert into home_sections (id, label, image_url) values
  ('hero_1',             'Hero — Slide 1',                        '/images/hero-bialy-1.jpg'),
  ('hero_2',             'Hero — Slide 2',                        '/images/hero-bialy-2.jpg'),
  ('estilo_casual',      'Colecciones — Vestidos',                '/images/estilo-casual.jpg'),
  ('estilo_elegante',    'Colecciones — Blusas',                  '/images/estilo-elegante.jpg'),
  ('estilo_romantico',   'Colecciones — Tallas Grandes',          '/images/estilo-romantico.jpg'),
  ('vestido_eleccion_1', 'Editorial Split — Imagen principal',    '/images/vestido-eleccion-1.jpg'),
  ('vestido_eleccion_2', 'Editorial Split — Imagen acento',       '/images/vestido-eleccion-2.jpg'),
  ('detalle_tela',       'Promo Editorial — Imagen',              '/images/detalle-tela.jpg')
on conflict (id) do nothing;

-- ── 5. products table — add variants column if not exists ────────────────────

alter table products
  add column if not exists description text,
  add column if not exists tags        text[],
  add column if not exists variants    jsonb default '[]'::jsonb;
