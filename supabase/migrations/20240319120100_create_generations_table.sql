-- Utworzenie tabeli generations
create table if not exists public.generations (
    id bigserial primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    model varchar not null,
    generated_count integer not null,
    accepted_unedited_count integer,
    accepted_edited_count integer,
    source_text_hash varchar not null,
    source_text_length integer not null check (source_text_length between 1000 and 10000),
    generation_duration integer not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Indeks na user_id dla szybszego wyszukiwania
create index generations_user_id_idx on public.generations(user_id);

-- Trigger do automatycznej aktualizacji updated_at
create trigger set_updated_at
    before update on public.generations
    for each row
    execute function public.update_updated_at_column();

-- Włączenie Row Level Security
alter table public.generations enable row level security;

-- Polityki RLS dla użytkowników anonimowych
create policy "Użytkownicy anonimowi nie mogą wyświetlać generacji"
    on public.generations
    for select
    to anon
    using (false);

-- Polityki RLS dla zalogowanych użytkowników
create policy "Użytkownicy mogą wyświetlać tylko swoje generacje"
    on public.generations
    for select
    to authenticated
    using (auth.uid() = user_id);

create policy "Użytkownicy mogą tworzyć tylko swoje generacje"
    on public.generations
    for insert
    to authenticated
    with check (auth.uid() = user_id);

create policy "Użytkownicy mogą aktualizować tylko swoje generacje"
    on public.generations
    for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Użytkownicy mogą usuwać tylko swoje generacje"
    on public.generations
    for delete
    to authenticated
    using (auth.uid() = user_id); 