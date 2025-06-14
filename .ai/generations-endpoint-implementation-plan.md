# Plan wdrożenia endpointu API: POST /api/generations

## 1. Przegląd punktu końcowego

Endpoint inicjuje proces generacji fiszek na podstawie tekstu źródłowego. Po otrzymaniu żądania, system komunikuje się z API OpenRouter.ai aby wygenerować propozycje fiszek, zapisuje informacje o generacji w bazie danych i zwraca identyfikator generacji oraz wygenerowane propozycje fiszek.

## 2. Szczegóły żądania

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/generations`
- **Parametry**:
  - `source_text`: tekst źródłowy (wymagany, długość od 1000 do 10000 znaków)
- **Nagłówki**:
  - `Authorization`: Bearer token JWT (wymagany)
  - `Content-Type`: application/json (wymagany)
- **Request Body**:
  ```json
  {
    "source_text": "Przykładowy tekst źródłowy do generacji fiszek, który powinien zawierać od 1000 do 10000 znaków i opisywać temat, z którego chcemy wygenerować fiszki."
  }
  ```

## 3. Wykorzystywane typy

- **DTOs**:
  - `CreateGenerationRequestDTO` - struktura żądania
  - `CreateGenerationResponseDTO` - struktura odpowiedzi
  - `FlashcardProposalDTO` - typ reprezentujący propozycję fiszki
- **Modele**:
  - `GenerationEntity` - reprezentacja encji w bazie danych
  - `GenerationErrorLogEntity` - reprezentacja logu błędu w bazie danych

## 4. Szczegóły odpowiedzi

- **Kod sukcesu**: 202 Accepted
- **Struktura odpowiedzi**:
  ```json
  {
    "generation_id": 123,
    "flashcards_proposals": [
      {
        "id": "proposal-1",
        "front": "Co to jest React?",
        "back": "React to biblioteka JavaScript do budowania interfejsów użytkownika"
      },
      {
        "id": "proposal-2",
        "front": "Jakie są główne zalety React?",
        "back": "Wirtualny DOM, komponenty wielokrotnego użytku, jednokierunkowy przepływ danych"
      }
    ],
    "generated_count": 2
  }
  ```
  ```

  ```
- **Kody błędów**:
  - 400 Bad Request - nieprawidłowe dane wejściowe
  - 401 Unauthorized - brak autoryzacji
  - 500 Internal Server Error - błąd serwera

## 5. Przepływ danych

1. Odbiór żądania POST z ciałem zawierającym "source_text"
2. Walidacja danych wejściowych (długość tekstu, format)
3. Obliczenie hash'a tekstu źródłowego
4. Inicjalizacja rekordu w tabeli `generations`
5. Asynchroniczne wywołanie dedykowanego serwisu (generation.service), który:
   - Przekazuje "source_text" do API OpenRouter.ai w celu wygenerowania fiszek
   - Oblicza i zapisuje metadane generacji w tabeli generations (model, generated_count, source_text_hash, source_text_length, generation_duration)
   - Zarządza komunikacją z zewnętrznym serwisem AI i przetwarza otrzymane odpowiedzi
6. Przetworzenie odpowiedzi od modelu AI
7. Aktualizacja rekordu w tabeli `generations`
8. W przypadku błędu, zapis do tabeli `generation_error_logs`
9. Zwrócenie odpowiedzi z identyfikatorem generacji i propozycjami fiszek zgodnie z modelem CreateGenerationResponseDTO

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Weryfikacja tokenu JWT przez Supabase Auth
- **Autoryzacja**: Wykorzystanie Row Level Security (RLS) w bazie danych
- **Walidacja danych**:
  - Sprawdzenie długości tekstu źródłowego (1000-10000 znaków)
  - Sanityzacja tekstu wejściowego przed wysłaniem do API AI
- **Ochrona przed atakami**:
  - Rate limiting: ograniczenie liczby żądań z jednego adresu IP
  - Walidacja długości i zawartości tekstu źródłowego

## 7. Obsługa błędów

- **Nieprawidłowy tekst źródłowy**:
  - Kod: 400 Bad Request
  - Komunikat: "Tekst źródłowy musi zawierać od 1000 do 10000 znaków"
- **Błąd autoryzacji**:
  - Kod: 401 Unauthorized
  - Komunikat: "Brak autoryzacji lub nieprawidłowy token"
- **Błąd modelu AI**:
  - Kod: 500 Internal Server Error
  - Zapisanie szczegółów błędu w tabeli `generation_error_logs`
  - Komunikat: "Błąd podczas generacji fiszek. Spróbuj ponownie później"
- **Błąd bazy danych**:
  - Kod: 500 Internal Server Error
  - Komunikat: "Błąd serwera podczas przetwarzania żądania"

## 8. Rozważania dotyczące wydajności

- Asynchroniczne przetwarzanie zapytań do API AI
- Indeksowanie kolumn `user_id` i `source_text_hash` w tabeli `generations`
- Buforowanie wyników generacji dla podobnych tekstów źródłowych
- Monitorowanie czasu odpowiedzi API OpenRouter.ai
- Obsługa timeoutów dla długich zapytań do API AI

## 9. Etapy wdrożenia

1. **Utworzenie warstwy serwisowej**:

   - Implementacja `GenerationService` z metodą `createGeneration` do obsługi:
     - Zapisu danych w tabeli `generations`
     - Rejestracji błędów w tabeli `generation_error_logs`
   - Implementacja `MockAIService` symulującego odpowiedzi API AI:
     - Przygotowanie zestawu przykładowych odpowiedzi
     - Symulacja opóźnień i błędów

2. **Implementacja kontrolera**:

   - Utworzenie kontrolera `GenerationsController` z metodą `createGeneration`
   - Konfiguracja walidacji danych wejściowych
   - Konfiguracja mapowania odpowiedzi

3. **Implementacja warstwy danych**:

   - Utworzenie funkcji `createGeneration` do zapisywania danych w tabeli `generations`
   - Utworzenie funkcji `logGenerationError` do zapisywania błędów w tabeli `generation_error_logs`
   - Implementacja transakcji dla operacji bazodanowych

4. **Implementacja mocka AI**:

   - Przygotowanie zestawu przykładowych promptów i odpowiedzi
   - Implementacja losowego wyboru odpowiedzi
   - Symulacja różnych scenariuszy błędów

5. **Implementacja obsługi błędów**:

   - Utworzenie middleware do przechwytywania i logowania błędów
   - Implementacja transformacji błędów na odpowiednie odpowiedzi HTTP

6. **Dokumentacja**:

   - Aktualizacja dokumentacji API
   - Utworzenie przykładów użycia
   - Dokumentacja konfiguracji mocka

7. **Wdrożenie**:
   - Konfiguracja środowiska (zmienne środowiskowe, dostęp do bazy danych)
   - Wdrożenie na środowisko developerskie z użyciem mocków
   - Wdrożenie na środowisko testowe
