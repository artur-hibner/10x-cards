-- Dodanie kolumny source_text do tabeli generations
alter table public.generations
add column if not exists source_text text not null;

-- Dodanie kolumny status do tabeli generations
alter table public.generations
add column if not exists status varchar not null default 'processing'
check (status in ('processing', 'completed', 'error'));

-- Dodanie kolumny flashcards_proposals do tabeli generations
alter table public.generations
add column if not exists flashcards_proposals jsonb; 