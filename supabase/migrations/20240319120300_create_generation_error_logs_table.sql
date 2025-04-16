-- Utworzenie tabeli generation_error_logs
create table if not exists public.generation_error_logs (
    id bigserial primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    model varchar not null,
    source_text_hash varchar not null,
    source_text_length integer not null check (source_text_length between 1000 and 10000),
    error_code varchar(100) not null,
    error_message text not null,
    created_at timestamptz not null default now()
);

-- Indeks na user_id dla szybszego wyszukiwania
create index generation_error_logs_user_id_idx on public.generation_error_logs(user_id);

-- Włączenie Row Level Security
alter table public.generation_error_logs enable row level security;

-- Polityki RLS dla użytkowników anonimowych
create policy "Użytkownicy anonimowi nie mogą wyświetlać logów błędów"
    on public.generation_error_logs
    for select
    to anon
    using (false);

-- Polityki RLS dla zalogowanych użytkowników
create policy "Użytkownicy mogą wyświetlać tylko swoje logi błędów"
    on public.generation_error_logs
    for select
    to authenticated
    using (auth.uid() = user_id);

create policy "Użytkownicy mogą tworzyć tylko swoje logi błędów"
    on public.generation_error_logs
    for insert
    to authenticated
    with check (auth.uid() = user_id);

-- Nie dodajemy polityk update i delete, ponieważ logi nie powinny być modyfikowane ani usuwane 