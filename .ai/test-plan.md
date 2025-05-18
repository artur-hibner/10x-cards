# Plan Testów dla Projektu 10x-cards

## 1. Wprowadzenie i cele testowania

Niniejszy plan testów określa strategię, podejście, zasoby i harmonogram działań testowych dla projektu 10x-cards, aplikacji do tworzenia i zarządzania fiszkami edukacyjnymi wykorzystującej sztuczną inteligencję. Głównym celem testowania jest weryfikacja, czy aplikacja działa zgodnie z oczekiwaniami, jest niezawodna i funkcjonalna.

### 1.1 Cele testowania

- Weryfikacja poprawności działania generowania fiszek przy pomocy AI
- Testowanie interfejsu użytkownika pod kątem użyteczności
- Walidacja integracji z Supabase jako backendem
- Weryfikacja poprawności komunikacji z modelami AI poprzez OpenRouter
- Sprawdzenie obsługi użytkowników i systemu autoryzacji
- Testowanie wydajności aplikacji pod różnym obciążeniem
- Zapewnienie kompatybilności z różnymi urządzeniami i przeglądarkami

## 2. Zakres testów

### 2.1 W zakresie

- Testy komponentów frontendu (React i Astro)
- Testy integracyjne z Supabase
- Testy API (endpointy w `/src/pages/api`)
- Testy funkcjonalne generowania i zarządzania fiszkami
- Testy wydajnościowe
- Testy bezpieczeństwa, szczególnie autoryzacji
- Testy dostępności (WCAG)
- Testy responsywności

### 2.2 Poza zakresem

- Testy penetracyjne infrastruktury Supabase
- Testy modeli AI dostarczanych przez zewnętrznych dostawców
- Testy wydajności infrastruktury hostingowej (DigitalOcean)

## 3. Typy testów do przeprowadzenia

### 3.1 Testy jednostkowe

#### 3.1.1 Komponenty React

- Testy komponentów UI z użyciem React Testing Library
- Testy izolowanych komponentów funkcyjnych
- Testy hooków niestandardowych

**Narzędzia**: Vitest, React Testing Library, @testing-library/hooks

#### 3.1.2 Funkcje pomocnicze i usługi

- Testy usług `/src/services`
- Testy funkcji pomocniczych `/src/lib`

**Narzędzia**: Vitest, TypeScript

### 3.2 Testy integracyjne

#### 3.2.1 Integracja z Supabase

- Testy komunikacji z bazą danych
- Testy autoryzacji i uwierzytelniania
- Testy zapytań do bazy danych

**Narzędzia**: Vitest, Playwright, Supabase-js, Mock Service Worker

#### 3.2.2 Integracja komponentów

- Testy interakcji między komponentami
- Testy przepływu danych przez aplikację

**Narzędzia**: Playwright

### 3.3 Testy API

- Testy endpointów `/src/pages/api/flashcards.ts`
- Testy endpointów `/src/pages/api/generations.ts`
- Testy endpointów autoryzacji `/src/pages/api/auth`

**Narzędzia**: Vitest, Supertest, Mock Service Worker

### 3.4 Testy e2e (end-to-end)

- Testy kompletnych przepływów użytkownika
- Testy scenariuszy biznesowych

**Narzędzia**: Playwright

### 3.5 Testy wydajnościowe

- Testy obciążeniowe
- Testy szybkości ładowania strony
- Testy generowania fiszek

**Narzędzia**: Lighthouse, k6, WebPageTest

### 3.6 Testy dostępności

- Testy zgodności z WCAG 2.1 AA
- Testy z czytnikami ekranu
- Testy nawigacji klawiaturą

**Narzędzia**: axe-core, Pa11y, Lighthouse

### 3.7 Testy responsywności

- Testy na różnych rozmiarach ekranu
- Testy na różnych urządzeniach

**Narzędzia**: Playwright, Responsively App

### 3.8 Testy bezpieczeństwa

- Testy autoryzacji i uwierzytelniania
- Testy ochrony przed atakami XSS, CSRF
- Testy walidacji danych wejściowych

**Narzędzia**: OWASP ZAP, Snyk, SonarQube

## 4. Scenariusze testowe dla kluczowych funkcjonalności

### 4.1 Generowanie fiszek

1. **Wprowadzanie tekstu źródłowego**
   - Sprawdzenie walidacji minimalnej długości tekstu (1000 znaków)
   - Sprawdzenie walidacji maksymalnej długości tekstu (10000 znaków)
   - Weryfikacja obsługi różnych formatów tekstu

2. **Proces generowania fiszek**
   - Weryfikacja poprawności wywołania API generowania
   - Testowanie obsługi błędów podczas generowania
   - Weryfikacja wyświetlania wskaźnika postępu
   - Testowanie czasu odpowiedzi przy różnych długościach tekstu

3. **Wyświetlanie wygenerowanych propozycji**
   - Weryfikacja poprawności wyświetlania propozycji
   - Testowanie funkcji akceptacji/odrzucania fiszek
   - Testowanie edycji propozycji fiszek
   - Weryfikacja sortowania i filtrowania propozycji

### 4.2 Zarządzanie fiszkami

1. **Zapisywanie fiszek**
   - Testowanie zapisywania pojedynczych fiszek
   - Testowanie zapisywania wielu fiszek jednocześnie
   - Weryfikacja przypisania odpowiednich źródeł do fiszek (ai-full, ai-edited, manual)
   - Testowanie zapisywania zmodyfikowanych fiszek

2. **Przeglądanie zapisanych fiszek**
   - Weryfikacja poprawności wyświetlania listy fiszek
   - Testowanie paginacji i sortowania
   - Testowanie filtrowania fiszek

3. **Edycja i usuwanie fiszek**
   - Testowanie aktualizacji istniejących fiszek
   - Testowanie usuwania fiszek
   - Weryfikacja blokad edycji (jeśli istnieją)

### 4.3 Autoryzacja użytkowników

1. **Rejestracja użytkownika**
   - Testowanie formularza rejestracji
   - Weryfikacja walidacji danych
   - Testowanie obsługi błędów
   - Weryfikacja komunikatów dla użytkownika

2. **Logowanie użytkownika**
   - Testowanie logowania z prawidłowymi danymi
   - Testowanie logowania z nieprawidłowymi danymi
   - Weryfikacja obsługi błędów
   - Testowanie mechanizmu "Zapomniałem hasła"

3. **Zarządzanie sesją**
   - Testowanie wygasania sesji
   - Weryfikacja odświeżania tokenów
   - Testowanie wylogowania
   - Weryfikacja dostępu do chronionych zasobów

## 5. Środowisko testowe

### 5.1 Środowiska testowe

1. **Środowisko deweloperskie**
   - Lokalny serwer Astro w trybie deweloperskim
   - Lokalna instancja Supabase lub emulator
   - Mocks dla usług zewnętrznych (np. OpenRouter.ai)

2. **Środowisko testowe (staging)**
   - Pełna instalacja aplikacji na serwerze testowym
   - Testowa instancja Supabase z zanonimizowanymi danymi
   - Ograniczone podłączenie do usług zewnętrznych

3. **Środowisko produkcyjne**
   - Testy smoke na środowisku produkcyjnym
   - Monitoring produkcyjny

### 5.2 Wymagania sprzętowe i programowe

- Node.js v22.14.0
- Przeglądarki: Chrome, Firefox, Safari, Edge (najnowsze wersje)
- Urządzenia mobilne: iOS i Android (najnowsze wersje)
- Dostęp do Supabase
- Dostęp do usługi OpenRouter.ai dla testowania generowania treści AI

## 6. Narzędzia do testowania

### 6.1 Narzędzia do testów automatycznych

- **Vitest**: framework do testów jednostkowych
- **React Testing Library**: testowanie komponentów React
- **Playwright**: testy e2e i integracyjne
- **Supertest**: testowanie API
- **Mock Service Worker**: mockowanie odpowiedzi API
- **TypeScript**: statyczne sprawdzanie typów
- **ESLint**: statyczna analiza kodu

### 6.2 Narzędzia do testów manualnych

- **Browser DevTools**: debugowanie i profile wydajnościowe
- **Lighthouse**: audyty wydajności i dostępności
- **WAVE**: testy dostępności
- **Responsively App**: testy responsywności
- **Postman/Insomnia**: testowanie API

### 6.3 Narzędzia do monitorowania jakości

- **SonarQube**: analiza statyczna kodu
- **GitHub Actions**: automatyzacja testów
- **Sentry**: monitorowanie błędów w środowisku produkcyjnym

## 7. Harmonogram testów

### 7.1 Testy w cyklu rozwoju

- **Testy jednostkowe**: wykonywane przez programistów podczas implementacji funkcji
- **Testy integracyjne**: wykonywane po zakończeniu implementacji funkcji lub modułu
- **Testy dostępności**: wykonywane podczas tworzenia lub modyfikacji interfejsu użytkownika

### 7.2 Testy przed wydaniem

- **Testy e2e**: wykonywane przed każdym wydaniem
- **Testy wydajnościowe**: wykonywane przed wydaniem
- **Testy bezpieczeństwa**: wykonywane przed wydaniem
- **Testy regresji**: wykonywane przed każdym wydaniem

### 7.3 Testy ciągłe

- **Testy smoke**: wykonywane automatycznie po każdym wdrożeniu
- **Monitoring produkcyjny**: ciągły

## 8. Kryteria akceptacji testów

### 8.1 Kryteria przejścia testów

- Wszystkie testy jednostkowe przechodzą pomyślnie
- Wszystkie testy integracyjne przechodzą pomyślnie
- Wszystkie testy e2e przechodzą pomyślnie
- Brak krytycznych błędów

### 8.2 Kryteria niepowodzenia testów

- Niepowodzenie testów automatycznych
- Problemy uniemożliwiające korzystanie z podstawowych funkcji aplikacji

## 9. Role i odpowiedzialności w procesie testowania

### 9.1 Role

- **Kierownik testów**: nadzór nad procesem testowania, raportowanie
- **Testerzy automatyczni**: tworzenie i utrzymanie testów automatycznych
- **Testerzy manualni**: wykonywanie testów manualnych, eksploracyjnych
- **Deweloperzy**: tworzenie i wykonywanie testów jednostkowych
- **Inżynierowie DevOps**: konfiguracja i utrzymanie środowisk testowych
- **Specjalista ds. dostępności**: testy dostępności, audyty WCAG

### 9.2 Odpowiedzialności

- **Kierownik testów**: planowanie testów, delegowanie zadań, raportowanie wyników
- **Testerzy automatyczni**: automatyzacja testów, utrzymanie frameworka testowego
- **Testerzy manualni**: wykonywanie testów, raportowanie błędów, weryfikacja napraw
- **Deweloperzy**: tworzenie testów jednostkowych, naprawianie błędów
- **Inżynierowie DevOps**: konfiguracja CI/CD, środowisk testowych
- **Specjalista ds. dostępności**: zapewnienie zgodności z WCAG, szkolenia z dostępności

## 10. Procedury raportowania błędów

### 10.1 Struktura raportu błędu

- Identyfikator błędu
- Tytuł
- Priorytet i waga błędu
- Środowisko, w którym występuje
- Kroki reprodukcji
- Rzeczywisty rezultat
- Oczekiwany rezultat
- Dane testowe
- Zrzuty ekranu/nagrania
- Informacje techniczne (logi, ślady stosu)

### 10.2 Klasyfikacja błędów

- **Krytyczny**: blokuje funkcje krytyczne dla działania aplikacji
- **Wysoki**: poważnie utrudnia korzystanie z głównych funkcji
- **Średni**: powoduje problemy, ale istnieją obejścia
- **Niski**: drobne problemy, nie wpływają na główne funkcje
- **Ulepszenie**: sugestie ulepszeń, a nie faktyczne błędy

### 10.3 Proces zarządzania błędami

1. **Zgłoszenie**: utworzenie raportu błędu
2. **Triage**: ocena i priorytetyzacja błędu
3. **Przypisanie**: przydzielenie do odpowiedzialnej osoby
4. **Naprawa**: implementacja rozwiązania
5. **Weryfikacja**: sprawdzenie poprawności naprawy
6. **Zamknięcie**: oznaczenie błędu jako rozwiązanego

## 11. Raportowanie testów

### 11.1 Raporty okresowe

- Codzienny raport postępu testów
- Cotygodniowy raport podsumowujący
- Raport przed wydaniem

### 11.2 Zawartość raportów

- Postęp testów (zakończone/planowane)
- Statystyki błędów (znalezione/naprawione/otwarte)
- Pokrycie testami (kod, funkcjonalności)
- Ryzyka i problemy
- Rekomendacje

## 12. Zarządzanie ryzykiem

### 12.1 Identyfikacja ryzyka

- Opóźnienia w dostarczaniu funkcjonalności
- Problemy z integracją zewnętrznych usług (Supabase, OpenRouter.ai)

### 12.2 Strategie łagodzenia ryzyka

- Wcześniejsze testowanie kluczowych funkcjonalności
- Mockowanie zewnętrznych usług w testach