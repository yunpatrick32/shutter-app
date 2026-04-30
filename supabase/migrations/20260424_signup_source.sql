-- Marketing ask (Apr 22): signup-source attribution for tracking campaign origins.
alter table public.creators add column if not exists signup_source text;
create index if not exists creators_signup_source_idx on public.creators (signup_source);
