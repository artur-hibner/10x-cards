# Deployment na Cloudflare Pages

## Przegląd konfiguracji

Projekt został skonfigurowany do automatycznego deployment na Cloudflare Pages przy użyciu GitHub Actions.

## Wymagane sekrety GitHub

Aby deployment działał poprawnie, należy skonfigurować następujące sekrety w GitHub repository:

### 1. Cloudflare API Token
- Nazwa: `CLOUDFLARE_API_TOKEN`
- Wartość: Token API wygenerowany w Cloudflare Dashboard

**Jak wygenerować:**
1. Zaloguj się do Cloudflare Dashboard
2. Idź do **My Profile** > **API Tokens** > **Create Token**
3. Wybierz **Custom Token** > **Get started**
4. Nadaj nazwę tokenowi
5. Ustaw uprawnienia: **Account** > **Cloudflare Pages** > **Edit**
6. Kliknij **Continue to summary** > **Create Token**

### 2. Cloudflare Account ID
- Nazwa: `CLOUDFLARE_ACCOUNT_ID`
- Wartość: ID konta Cloudflare

**Jak znaleźć:**
- W Cloudflare Dashboard, po prawej stronie w sekcji **API** znajdziesz **Account ID**
- Alternatywnie: z URL `https://dash.cloudflare.com/<ACCOUNT_ID>/pages`

### 3. Supabase Configuration
- Nazwa: `SUPABASE_URL`
- Wartość: URL twojego projektu Supabase
- Nazwa: `SUPABASE_KEY`
- Wartość: Anonimowy klucz API Supabase

## Struktura workflow

### Workflow master.yml
- **Trigger**: Push do gałęzi `main`
- **Kroki**:
  1. Lintowanie kodu
  2. Uruchomienie testów jednostkowych
  3. Build aplikacji
  4. Deployment do Cloudflare Pages

### Zmienione pliki konfiguracyjne

#### astro.config.mjs
- Zmieniono adapter z `@astrojs/node` na `@astrojs/cloudflare`
- Włączono `platformProxy` dla lepszej kompatybilności

#### wrangler.toml
- Plik konfiguracyjny dla Cloudflare Workers/Pages
- Definiuje ustawienia środowiska production/preview
- **UWAGA**: Zaktualizuj `YOUR_KV_NAMESPACE_ID` prawdziwym ID namespace KV dla sesji

**Tworzenie KV Namespace:**
```bash
# Utwórz KV namespace dla sesji
wrangler kv:namespace create "SESSION" --preview
wrangler kv:namespace create "SESSION"
```

## Uruchomienie lokalnie z Cloudflare

```bash
# Instalacja wrangler globalnie
npm install -g wrangler

# Logowanie do Cloudflare
wrangler login

# Uruchomienie w trybie dev z Cloudflare bindings
npm run dev
```

## Deployment ręczny

```bash
# Build aplikacji
npm run build

# Deploy do Cloudflare Pages
wrangler pages deploy dist --project-name=10x-cards
```

## Rozwiązywanie problemów

### Problem: Błędy podczas budowania
- Sprawdź czy wszystkie zmienne środowiskowe są poprawnie skonfigurowane
- Upewnij się, że projekt 10x-cards istnieje w Cloudflare Pages

### Problem: Deployment się nie udaje
- Sprawdź czy API Token ma odpowiednie uprawnienia
- Sprawdź czy Account ID jest poprawny
- Sprawdź logi w GitHub Actions

### Problem: Aplikacja nie działa po deployment
- Sprawdź czy zmienne środowiskowe są skonfigurowane w Cloudflare Pages
- Sprawdź czy Supabase URL i klucz są poprawne 