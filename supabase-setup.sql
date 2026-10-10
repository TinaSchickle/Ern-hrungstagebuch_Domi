-- Ernährungstagebuch (Domi): Tabelle + Zugriffsregeln. Kann gefahrlos mehrfach laufen.
-- Datum und Uhrzeit werden bewusst als deutsche Ortszeit (Europe/Berlin) gespeichert.

create table if not exists public.etb_entries (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('essen', 'beobachtung')),
  text text not null,
  entry_date date not null,
  entry_time time not null,
  created_at timestamptz not null default now()
);

create index if not exists etb_entries_date_idx
  on public.etb_entries (entry_date desc, entry_time desc);

alter table public.etb_entries enable row level security;

drop policy if exists "etb_entries_all" on public.etb_entries;
create policy "etb_entries_all" on public.etb_entries
  for all to anon using (true) with check (true);
