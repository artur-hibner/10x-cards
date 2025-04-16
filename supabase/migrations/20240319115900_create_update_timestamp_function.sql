-- Funkcja do automatycznej aktualizacji kolumny updated_at
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$; 