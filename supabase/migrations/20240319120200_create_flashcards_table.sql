-- Utworzenie tabeli flashcards
create table if not exists public.flashcards (
    id bigserial primary key,
    front varchar(200) not null,
    back varchar(500) not null,
    source varchar not null check (source in ('ai-full', 'ai-edited', 'manual')),
    generation_id bigint references public.generations(id) on delete set null,
    user_id uuid not null references auth.users(id) on delete cascade,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Indeksy dla szybszego wyszukiwania
create index flashcards_user_id_idx on public.flashcards(user_id);
create index flashcards_generation_id_idx on public.flashcards(generation_id);

-- Trigger do automatycznej aktualizacji updated_at
create trigger set_updated_at
    before update on public.flashcards
    for each row
    execute function public.update_updated_at_column();

-- Włączenie Row Level Security
alter table public.flashcards enable row level security;

-- Polityki RLS dla użytkowników anonimowych
create policy "Użytkownicy anonimowi nie mogą wyświetlać fiszek"
    on public.flashcards
    for select
    to anon
    using (false);

-- Polityki RLS dla zalogowanych użytkowników
create policy "Użytkownicy mogą wyświetlać tylko swoje fiszki"
    on public.flashcards
    for select
    to authenticated
    using (auth.uid() = user_id);

create policy "Użytkownicy mogą tworzyć tylko swoje fiszki"
    on public.flashcards
    for insert
    to authenticated
    with check (auth.uid() = user_id);

create policy "Użytkownicy mogą aktualizować tylko swoje fiszki"
    on public.flashcards
    for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Użytkownicy mogą usuwać tylko swoje fiszki"
    on public.flashcards
    for delete
    to authenticated
    using (auth.uid() = user_id); 