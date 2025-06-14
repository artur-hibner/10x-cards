# Architektura UI dla 10x-cards

## 1. Przegląd struktury UI

Interfejs użytkownika dla MVP 10x-cards został zaprojektowany jako zestaw powiązanych widoków, które wspierają kluczowe funkcjonalności: autoryzację, generowanie fiszek przy użyciu AI, recenzję propozycji, zarządzanie fiszkami, sesje nauki oraz zarządzanie kontem użytkownika. Cała architektura opiera się na założeniach responsywności, dostępności (WCAG AA) i bezpieczeństwa (plany wdrożenia JWT na późniejszym etapie). W projekcie wykorzystane są technologie shadcn/ui, Tailwind CSS, React oraz Astro.

## 2. Lista widoków

### 2.1 Ekran autoryzacji

- **Ścieżka widoku:** '/login' i'/register'
- **Główny cel:** Umożliwienie logowania i rejestracji użytkownika.
- **Kluczowe informacje do wyświetlenia:** Formularz logowania/rejestracji, komunikaty błędów, opcjonalnie link do odzyskiwania hasła.
- **Kluczowe komponenty widoku:** Formularz, pola input, przycisk submit.
- **UX, dostępność i względy bezpieczeństwa:** Prosty układ umożliwiający łatwe wprowadzenie danych, zachowanie standardów dostępności, czytelne etykiety i mechanizmy walidacji.

### 2.2 Widok generowania fiszek

- **Ścieżka widoku:** '/generate'
- **Główny cel:** Umożliwienie użytkownikowi wprowadzenia tekstu i wygenerowania propozycji fiszek przez AI i ich rewizję (zaakceptuk, edytuj, odrzuć).
- **Kluczowe informacje do wyświetlenia:** Pole tekstowe do wprowadzenia treści, lista propozycji fiszek, wskaźnik ładowania (spinner/skeleton) podczas komunikacji z API. Przyciski akceptacji, edycji lub odrzucenia dla każdej fiszki.
- **Kluczowe komponenty widoku:** Formularz tekstowy, przycisk inicjujący generowanie, spinner/skeleton , lista wyników z opcjami akceptacji/edycji/odrzucenia. Przyciski akcji (zapisz wszystkie, zapisz zaakceptowane)
- **UX, dostępność i względy bezpieczeństwa:** Intuicyjny formularz, Jasne instrukcje dla użytkownika, czytelne stany ładowania, komunikaty o błędach i walidacja wejścia (1000-10000 znaków) responsywność, toast notifications.

### 2.3 Widok listy fiszek

- **Ścieżka widoku:** /flashcards
- **Główny cel:** Przegląd i zarządzanie zatwierdzonymi fiszkami.
- **Kluczowe informacje do wyświetlenia:** Lista fiszek z ich zawartością, opcje edycji (modal) oraz usuwania poszczególnych fiszek.
- **Kluczowe komponenty widoku:** Lista elementów, modal do edycji, przyciski usuwania, mechanizm bulk zapisu (np. "zapisz zatwierdzone").
- **UX, dostępność i względy bezpieczeństwa:** Intuicyjny interfejs wspierający szybkie akcje na fiszkach, dostępność operacji (np. klawiaturowa nawigacja) oraz potwierdzenia działań usunięcia.

### 2.4 Modal edycji fiszek

- **Ścieżka widoku:** wyświetlany nad widokiem listy fiszek
- **Główny cel:** Umożliwienie edycji fiszek z walidacją danych bez zapisu w czasie rzeczywistym
- **Kluczowe informacje do wyświetlenia:** Formularz edycji fiszki, pola "przód" oraz "tył", komunikaty walidacyjne.
- **Kluczowe komponenty widoku:** Modal z formularzem, przyciski "zapisz" "anuluj"
- **UX, dostępność i względy bezpieczeństwa:** Intuicyjny modal, dostępność dla czytników ekranu, walidacja danych po stronie klienta przed wysłaniem zmian.

### 2.5 Panel użytkownika

- **Ścieżka widoku:** '/profile'
- **Główny cel:** Zarządzanie danymi konta użytkownika oraz ustawieniami profilu.
- **Kluczowe informacje do wyświetlenia:** Dane profilowe, ustawienia (np. zmiana hasła, preferencje). Przycisk wylogowania
- **Kluczowe komponenty widoku:** Formularze, przyciski edycji, informacje konfiguracyjne.
- **UX, dostępność i względy bezpieczeństwa:** Intuicyjny układ, zabezpieczenia dostępu, czytelność i możliwość modyfikacji danych.

### 2.6 Ekran sesji powtórek

- **Ścieżka widoku:** '/session'
- **Główny cel:** Umożliwienie przeprowadzenia sesji nauki na podstawie fiszek zgodnie z algorytmem powtórek.
- **Kluczowe informacje do wyświetlenia:** Front fiszki, opcja odkrycia odpowiedzi, mechanizm oceny stopnia zapamiętania.
- **Kluczowe komponenty widoku:** Komponent fiszki, przyciski do odkrycia odpowiedzi i oceny, wskaźniki postępu sesji.
- **UX, dostępność i względy bezpieczeństwa:** Prostota i intuicyjność interfejsu, szybki dostęp do akcji, dostępność dla użytkowników z ograniczeniami ruchowymi.

## 3. Mapa podróży użytkownika

1. **Logowanie/Rejestracja:** Użytkownik rozpoczyna na ekranie autoryzacji (/login). Po poprawnym zalogowaniu użytkownik zostaje przekierowany do widoku generowania fiszek.
2. **Generowanie fiszek:** Na widoku generowania (/generate) użytkownik wprowadza tekst, inicjuje generowanie, oczekuje na wyniki (spinner) i przegląda propozycje fiszek otrzymane z API.
3. **Recenzja i bulk zapis:** Użytkownik przegląda propozycje, dokonuje akceptacji, edycji lub odrzucenia pojedynczych fiszek, a następnie zatwierdza wybrane fiszki poprzez bulk zapis (np. "zapisz zatwierdzone").
4. **Zarządzanie fiszkami:** Przejście do widoku listy fiszek (/flashcards) pozwala na dalsze zarządzanie – edycję lub usuwanie poszczególnych fiszek za pomocą modalu.
5. **Panel użytkownika:** Opcjonalnie użytkownik odwiedza panel konta (/profile), aby zarządzać danymi profilowymi.
6. **Sesja powtórek:** Użytkownik może rozpocząć sesję nauki (/session), która prezentuje fiszki w kolejności zgodnej z algorytmem powtórek.

## 4. Układ i struktura nawigacji

- **Główne menu:** Dostępne jako górne menu w layoucie strony po zalogowaniu, zawierające linki do: Generowanie fiszek, Moje fiszki, Sesja nauki, Profil oraz opcję wylogowania.
- **Nawigacja responsywna:** Na mniejszych ekranach użycie hamburger menu, zapewniające łatwy dostęp do kluczowych widoków.
- **Routing:** Wykorzystanie systemu routingu (np. React Router) dla płynnych przejść między widokami.

## 5. Kluczowe komponenty

- **Formularz logowania/rejestracji:** Umożliwia wprowadzenie danych i autoryzację użytkownika (logowanie, rejestracja z obsługą walidacji).
- **Formularz generowania fiszek:** Pole tekstowe, przycisk generowania, spinner ładowania.
- **Lista propozycji fiszek:** Komponent listy z opcjami akceptacji, edycji (modal) i odrzucenia oraz z opcją usuwania
- **Modal edycji fiszek:** Umożliwia jednostkową edycję fiszki w kontekście listy (z walidacją danych przed zatwierdzeniem).
- **Komponent listy fiszek:** Służy do przeglądu zatwierdzonych fiszek z opcjami usuwania i bulk zapisu.
- **Panel użytkownika:** Wyświetla i umożliwia edycję danych profilu oraz ustawień konta.
- **Komponent sesji powtórek:** Prezentuje fiszki w trybie nauki z opcjami odkrycia odpowiedzi i oceny zapamiętania.
- **Nawigacja (header/side menu):** Globalny komponent umożliwiający szybkie przejścia między widokami.
- **Toast notifications:** Komponent do wyświetlania komunikatów o sukcesach oraz błędach
