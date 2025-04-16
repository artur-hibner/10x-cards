-- Wyłączenie wszystkich polityk RLS dla tabeli flashcards
drop policy if exists "Użytkownicy anonimowi nie mogą wyświetlać fiszek" on public.flashcards;
drop policy if exists "Użytkownicy mogą wyświetlać tylko swoje fiszki" on public.flashcards;
drop policy if exists "Użytkownicy mogą tworzyć tylko swoje fiszki" on public.flashcards;
drop policy if exists "Użytkownicy mogą aktualizować tylko swoje fiszki" on public.flashcards;
drop policy if exists "Użytkownicy mogą usuwać tylko swoje fiszki" on public.flashcards;

-- Wyłączenie wszystkich polityk RLS dla tabeli generations
drop policy if exists "Użytkownicy anonimowi nie mogą wyświetlać generacji" on public.generations;
drop policy if exists "Użytkownicy mogą wyświetlać tylko swoje generacje" on public.generations;
drop policy if exists "Użytkownicy mogą tworzyć tylko swoje generacje" on public.generations;
drop policy if exists "Użytkownicy mogą aktualizować tylko swoje generacje" on public.generations;
drop policy if exists "Użytkownicy mogą usuwać tylko swoje generacje" on public.generations;

-- Wyłączenie wszystkich polityk RLS dla tabeli generation_error_logs
drop policy if exists "Użytkownicy anonimowi nie mogą wyświetlać logów błędów" on public.generation_error_logs;
drop policy if exists "Użytkownicy mogą wyświetlać tylko swoje logi błędów" on public.generation_error_logs;
drop policy if exists "Użytkownicy mogą tworzyć tylko swoje logi błędów" on public.generation_error_logs; 