# Konfiguracja zmiennych środowiskowych Cloudflare

## Problem
Cloudflare Workers Runtime nie odczytuje zmiennych środowiskowych tak samo jak Node.js. Dlatego musisz ręcznie ustawić zmienne w panelu Cloudflare.

## Wymagane zmienne środowiskowe

Następujące zmienne muszą być ustawione w Cloudflare Pages:

- `SUPABASE_URL` - URL do twojej instancji Supabase
- `SUPABASE_KEY` - Anon key z Supabase  
- `OPENROUTER_API_KEY` - Klucz API OpenRouter

## Jak ustawić zmienne w Cloudflare Pages

1. Przejdź do [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Wybierz swoją stronę w sekcji "Pages"
3. Przejdź do zakładki "Settings"
4. Znajdź sekcję "Environment variables"
5. Dodaj wszystkie wymagane zmienne dla środowiska Production:
   - Nazwa: `SUPABASE_URL`, Wartość: `https://your-project.supabase.co`
   - Nazwa: `SUPABASE_KEY`, Wartość: `your-anon-key`
   - Nazwa: `OPENROUTER_API_KEY`, Wartość: `your-openrouter-key`

## Weryfikacja

Po ustawieniu zmiennych i re-deploymencie, aplikacja powinna działać poprawnie.

## Wrangler.toml

Zmienne są również skonfigurowane w `wrangler.toml` z użyciem składni `$VARIABLE_NAME`, co oznacza, że wartości będą pobierane z:
- Zmiennych środowiskowych w środowisku CI/CD (GitHub Actions)
- Ustawień w Cloudflare Dashboard
- Lokalnych zmiennych środowiskowych (dla `wrangler dev`)

## GitHub Actions

W pliku `.github/workflows/master.yml` dodano również zmienne środowiskowe w sekcjach build i deploy. Upewnij się, że masz ustawione następujące secrety w repozytorium GitHub:
- `SUPABASE_URL`
- `SUPABASE_KEY`  
- `OPENROUTER_API_KEY`

## Migracja z import.meta.env

Projekt został zmigrowany z `import.meta.env` na `astro:env` zgodnie z [dokumentacją Astro](https://docs.astro.build/en/guides/environment-variables/#variable-types) dla lepszej kompatybilności z Cloudflare Workers Runtime. 