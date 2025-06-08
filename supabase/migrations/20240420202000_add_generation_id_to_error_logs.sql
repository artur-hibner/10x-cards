-- Dodanie kolumny generation_id do tabeli generation_error_logs
alter table public.generation_error_logs
add column if not exists generation_id bigint not null default 0;

-- Dodanie foreign key constraint dla generation_id
alter table public.generation_error_logs
add constraint generation_error_logs_generation_id_fkey
  foreign key (generation_id)
  references public.generations(id)
  on delete cascade;

-- Dodanie indeksu na generation_id dla wydajności
create index if not exists generation_error_logs_generation_id_idx
on public.generation_error_logs(generation_id);