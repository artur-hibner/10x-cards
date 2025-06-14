# CI/CD Setup

## Przegląd

Ten projekt używa GitHub Actions do automatyzacji procesów CI/CD. Setup składa się z dwóch głównych workflow:

### 1. CI Pipeline (`.github/workflows/ci.yml`)

**Wyzwalane:**
- Manualnie przez `workflow_dispatch`
- Przy pushu do branch `main`
- Przy pull request do branch `main`

**Kroki:**
1. **Test i Lint** - uruchamia się równolegle:
   - Lint kodu (ESLint)
   - Sprawdzenie TypeScript
   - Testy jednostkowe (Vitest) z coverage
   - Testy E2E (Playwright)

2. **Build Produkcyjny** - uruchamia się po udanych testach:
   - Build aplikacji Astro
   - Upload artefaktów build

### 2. Deploy Pipeline (`.github/workflows/deploy.yml`)

**Wyzwalane:**
- Manualnie przez `workflow_dispatch`
- Automatycznie po udanym CI na branch `main`

**Kroki:**
- Build produkcyjny
- Przygotowanie artefaktów do deployment
- Info o dalszych krokach deployment

## Konfiguracja

### Wymagane Secrets (opcjonalne)

Jeśli używasz Supabase, dodaj następujące secrets w ustawieniach repozytorium:

```
SUPABASE_URL=twoja_supabase_url
SUPABASE_ANON_KEY=twoj_supabase_anon_key
```

### Node.js Version

Pipeline automatycznie odczytuje wersję Node.js z pliku `.nvmrc` (obecnie: 22.14.0).

### Artefakty

- **Test artifacts**: Playwright reports (tylko przy niepowodzeniu testów)
- **Build artifacts**: Skompilowana aplikacja w folderze `dist/`

## Deployment na DigitalOcean

### Opcja 1: App Platform (Zalecane)

1. Połącz repozytorium GitHub z DigitalOcean App Platform
2. App Platform automatycznie zdetektuje Astro i skonfiguruje build
3. Deployment będzie się odbywał automatycznie przy pushu do `main`

### Opcja 2: Droplet z Dockerem

1. Stwórz `Dockerfile` w głównym katalogu:
```dockerfile
FROM node:22.14.0-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 4321
CMD ["npm", "run", "preview"]
```

2. Dodaj deployment step do workflow

### Opcja 3: Manual deployment

Pobierz artefakty z GitHub Actions i wdróż na serwer przy pomocy rsync/scp.

## Status Badgeś

Dodaj do README.md głównego projektu:

```markdown
![CI Status](https://github.com/your-username/your-repo/workflows/CI%2FCD%20Pipeline/badge.svg)
``` 