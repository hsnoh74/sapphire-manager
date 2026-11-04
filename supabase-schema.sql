-- ════════════════════════════════════════════════════════════════
--  아즈텍 주식회사 · Sapphire Manager  —  Supabase 스키마 (최종본)
--  Supabase > SQL Editor > New query 에 전체를 붙여넣고 Run 하세요.
--  여러 번 실행해도 안전하며, 이전 버전 DB가 있어도 그대로 업그레이드됩니다(데이터 유지).
-- ════════════════════════════════════════════════════════════════
create extension if not exists pgcrypto;

-- ───────── 1. 테이블 ─────────
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  boule_id text,
  product_name text not null,
  status text default '재고',
  diameter_inch numeric,
  weight_kg numeric,
  orientation text,
  furnace_no text,
  customer text,
  sales_channel text,
  price numeric,
  cost numeric,
  application text[],          -- 제품 응용처 (복수)
  stock_location text,
  memo text,                   -- 상세 설명
  category text default '웨이퍼',
  created_at timestamptz default now()
);
create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  url text not null,
  path text,
  created_at timestamptz default now()
);
create table if not exists assets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  location text,
  purchase_price numeric,
  purchase_place text,
  purchase_date date,
  residual_value numeric,
  status text default '정상',
  warranty_end date,
  manager text,
  memo text,
  registered_date date default current_date,   -- 등록일자
  disposal_date date,                          -- 폐기일자
  created_at timestamptz default now()
);
create table if not exists asset_images (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references assets(id) on delete cascade,
  url text not null,
  path text,
  created_at timestamptz default now()
);

-- 이전 버전 DB 업그레이드용 (이미 있으면 건너뜀)
alter table products       add column if not exists application text[];
alter table products       add column if not exists memo text;
alter table assets         add column if not exists registered_date date default current_date;
alter table assets         add column if not exists disposal_date date;
alter table product_images add column if not exists created_at timestamptz default now();
alter table asset_images   add column if not exists created_at timestamptz default now();

-- ───────── 2. 관리자 명단 ─────────
-- 여기에 이메일이 등록된 계정만 "수정·삭제"를 할 수 있습니다. (등록은 모든 직원 가능)
create table if not exists admins (
  email text primary key
);
alter table admins enable row level security;   -- 정책을 만들지 않음 = 앱에서는 직접 읽기/쓰기 불가

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke all on function public.is_admin() from public;
revoke all on function public.is_admin() from anon;
grant execute on function public.is_admin() to authenticated;

-- ★ 관리자 지정 (아래 줄의 이메일을 실제 관리자 로그인 이메일로 바꿔서 실행)
-- insert into admins (email) values ('admin@회사도메인.com') on conflict do nothing;

-- ───────── 3. 행 수준 보안(RLS) ─────────
alter table products       enable row level security;
alter table product_images enable row level security;
alter table assets         enable row level security;
alter table asset_images   enable row level security;

-- 이전 정책 정리
drop policy if exists "auth all" on products;
drop policy if exists "auth all" on product_images;
drop policy if exists "auth all" on assets;
drop policy if exists "auth all" on asset_images;
drop policy if exists "read"   on products;       drop policy if exists "insert" on products;
drop policy if exists "update" on products;       drop policy if exists "delete" on products;
drop policy if exists "read"   on product_images; drop policy if exists "insert" on product_images;
drop policy if exists "update" on product_images; drop policy if exists "delete" on product_images;
drop policy if exists "read"   on assets;         drop policy if exists "insert" on assets;
drop policy if exists "update" on assets;         drop policy if exists "delete" on assets;
drop policy if exists "read"   on asset_images;   drop policy if exists "insert" on asset_images;
drop policy if exists "update" on asset_images;   drop policy if exists "delete" on asset_images;

-- 로그인한 직원: 조회 + 등록 / 관리자: 수정 + 삭제
create policy "read"   on products for select to authenticated using (true);
create policy "insert" on products for insert to authenticated with check (true);
create policy "update" on products for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "delete" on products for delete to authenticated using (public.is_admin());

create policy "read"   on product_images for select to authenticated using (true);
create policy "insert" on product_images for insert to authenticated with check (true);
create policy "update" on product_images for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "delete" on product_images for delete to authenticated using (public.is_admin());

create policy "read"   on assets for select to authenticated using (true);
create policy "insert" on assets for insert to authenticated with check (true);
create policy "update" on assets for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "delete" on assets for delete to authenticated using (public.is_admin());

create policy "read"   on asset_images for select to authenticated using (true);
create policy "insert" on asset_images for insert to authenticated with check (true);
create policy "update" on asset_images for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "delete" on asset_images for delete to authenticated using (public.is_admin());

-- ───────── 4. 사진 저장소(Storage) ─────────
-- 버킷은 "공개 읽기"(사진 주소로 화면에 표시), 업로드는 로그인 직원, 수정·삭제는 관리자만 가능
insert into storage.buckets (id, name, public)
values ('product-photos', 'product-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "photos insert" on storage.objects;
drop policy if exists "photos update" on storage.objects;
drop policy if exists "photos delete" on storage.objects;

create policy "photos insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-photos');
create policy "photos update" on storage.objects for update to authenticated
  using (bucket_id = 'product-photos' and public.is_admin());
create policy "photos delete" on storage.objects for delete to authenticated
  using (bucket_id = 'product-photos' and public.is_admin());
