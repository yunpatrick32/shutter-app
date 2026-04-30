-- Marketing ask (Apr 22): signup-source attribution for tracking campaign origins.
-- NOTE: Marketing says "creators" but the actual table is public.profiles.
alter table public.profiles add column if not exists signup_source text;
create index if not exists profiles_signup_source_idx on public.profiles (signup_source);
