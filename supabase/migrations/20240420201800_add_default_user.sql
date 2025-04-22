-- Dodanie domyślnego użytkownika do tabeli auth.users
insert into auth.users (id, email, encrypted_password)
values 
  ('00000000-0000-0000-0000-000000000000', 'default@example.com', 'encrypted_password_hash')
on conflict (id) do nothing;

-- Modyfikacja ograniczenia foreign key w tabeli generations
alter table public.generations 
  drop constraint if exists generations_user_id_fkey,
  add constraint generations_user_id_fkey 
    foreign key (user_id) 
    references auth.users(id) 
    on delete cascade;

-- Modyfikacja ograniczenia foreign key w tabeli flashcards
alter table public.flashcards
  drop constraint if exists flashcards_user_id_fkey,
  add constraint flashcards_user_id_fkey 
    foreign key (user_id) 
    references auth.users(id) 
    on delete cascade;

-- Modyfikacja ograniczenia foreign key w tabeli generation_error_logs
alter table public.generation_error_logs
  drop constraint if exists generation_error_logs_user_id_fkey,
  add constraint generation_error_logs_user_id_fkey 
    foreign key (user_id) 
    references auth.users(id) 
    on delete cascade; 