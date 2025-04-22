-- Wyłączenie RLS dla wszystkich tabel
alter table public.generations disable row level security;
alter table public.flashcards disable row level security;
alter table public.generation_error_logs disable row level security; 