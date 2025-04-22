# REST API Plan

## 1. Zasoby
- **Flashcards** - tabela `flashcards`
- **Generations** - tabela `generations`
- **Auth** - tabela `users` (zarządzana przez Supabase)
- **Study Session** - wykorzystuje dane z tabeli `flashcards` i algorytm spaced repetition

## 2. Punkty końcowe

### Flashcards

#### GET /api/flashcards
- **Opis**: Pobiera listę fiszek zalogowanego użytkownika
- **Parametry zapytania**:
  - `page` (opcjonalny): Numer strony (domyślnie 1)
  - `limit` (opcjonalny): Liczba fiszek na stronę (domyślnie 10)
  - `sort` (opcjonalny): Pole sortowania, np. `created_at` (domyślnie `created_at`)
  - `order` (opcjonalny): Kierunek sortowania, `asc` lub `desc` (domyślnie `desc`)
  - `source` (opcjonalny): Filtrowanie po źródle ('ai-full', 'ai-edited', 'manual')
  - `generation_id` (opcjonalny): Filtrowanie po identyfikatorze generacji
- **Struktura odpowiedzi**:
  ```json
  {
    "flashcards": [
      {
        "id": 123,
        "front": "Pytanie na przedniej stronie fiszki",
        "back": "Odpowiedź na tylnej stronie fiszki",
        "source": "ai-full",
        "generation_id": 456,
        "created_at": "2023-06-15T10:30:00Z",
        "updated_at": "2023-06-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100
    }
  }
  ```
- **Kody sukcesu**: 200 OK
- **Kody błędów**: 401 Unauthorized, 500 Internal Server Error

#### GET /api/flashcards/{id}
- **Opis**: Pobiera pojedynczą fiszkę
- **Struktura odpowiedzi**:
  ```json
  {
    "id": 123,
    "front": "Pytanie na przedniej stronie fiszki",
    "back": "Odpowiedź na tylnej stronie fiszki",
    "source": "ai-full",
    "generation_id": 456,
    "created_at": "2023-06-15T10:30:00Z",
    "updated_at": "2023-06-15T10:30:00Z"
  }
  ```
- **Kody sukcesu**: 200 OK
- **Kody błędów**: 401 Unauthorized, 404 Not Found, 500 Internal Server Error

#### POST /api/flashcards
- **Opis**: Tworzy nową fiszkę lub zestaw fiszek
- **Struktura żądania**:
  ```json
  {
    "flashcards": [
      {
        "front": "Pytanie na przedniej stronie fiszki",
        "back": "Odpowiedź na tylnej stronie fiszki",
        "source": "manual",
        "generation_id": null
      }
    ]
  }
  ```
- **Struktura odpowiedzi**:
  ```json
  {
    "flashcards": [
      {
        "id": 123,
        "front": "Pytanie na przedniej stronie fiszki",
        "back": "Odpowiedź na tylnej stronie fiszki",
        "source": "manual|ai-full|ai-edited",
        "generation_id": null,
        "created_at": "2023-06-15T10:30:00Z",
        "updated_at": "2023-06-15T10:30:00Z"
      },
      {
        "id": 124,
        "front": "Co to jest programowanie obiektowe?",
        "back": "Paradygmat programowania, w którym programy definiuje się za pomocą obiektów – elementów łączących stan i zachowanie",
        "source": "ai-full",
        "generation_id": 789,
        "created_at": "2023-06-15T10:31:00Z",
        "updated_at": "2023-06-15T10:31:00Z"
      }
    ]
  }
  ```
- **Walidacja**:
  - `front`: Maksymalnie 200 znaków
  - `back`: Maksymalnie 500 znaków
  - `source`: Musi być jednym z: 'ai-full', 'ai-edited', 'manual'
  - `generation_id`: Wymagane dla 'ai-full' i 'ai-edited', musi być null dla 'manual'
- **Kody sukcesu**: 201 Created
- **Kody błędów**: 400 Bad Request, 401 Unauthorized, 500 Internal Server Error

#### PUT /api/flashcards/{id}
- **Opis**: Aktualizuje istniejącą fiszkę
- **Struktura żądania** (fields to update):
  ```json
  {
    "front": "Zaktualizowane pytanie",
    "back": "Zaktualizowana odpowiedź",
    "source": "ai-edited"
  }
  ```
- **Struktura odpowiedzi** (updated flashcard object):
  ```json
  {
    "id": 123,
    "front": "Zaktualizowane pytanie",
    "back": "Zaktualizowana odpowiedź",
    "source": "ai-edited",
    "generation_id": 456,
    "created_at": "2023-06-15T10:30:00Z",
    "updated_at": "2023-06-15T11:15:00Z"
  }
  ```
- **Walidacja**:
  - `front`: Maksymalnie 200 znaków
  - `back`: Maksymalnie 500 znaków
  - `source`: Musi być jednym z: 'ai-full', 'ai-edited', 'manual'
  - `generation_id`: Wymagane dla 'ai-full' i 'ai-edited', musi być null dla 'manual'
- **Kody sukcesu**: 200 OK
- **Kody błędów**: 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Internal Server Error

#### DELETE /api/flashcards/{id}
- **Opis**: Usuwa fiszkę
- **Struktura odpowiedzi**: Brak treści
- **Kody sukcesu**: 204 No Content
- **Kody błędów**: 401 Unauthorized, 404 Not Found, 500 Internal Server Error

### Generations

#### POST /api/generations
- **Opis**: Inicjuje generację kandydatów na fiszki z tekstu źródłowego
- **Struktura żądania**:
  ```json
  {
    "source_text": "Tekst źródłowy do generacji fiszek...",
  }
  ```
- **Struktura odpowiedzi**:
  ```json
  {
    "generation_id": 456,
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
- **Kody sukcesu**: 202 Accepted
- **Kody błędów**: 400 Bad Request, 401 Unauthorized, 500 Internal Server Error

#### GET /api/generations
- **Opis**: Pobiera listę wszystkich generacji fiszek
- **Struktura odpowiedzi**:
  ```json
  {
    "generations": [
      {
        "id": 456,
        "status": "completed",
        "generated_count": 15,
        "accepted_unedited_count": 0,
        "accepted_edited_count": 0,
        "source_text_length": 3500,
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
        "created_at": "2023-06-15T10:30:00Z",
        "updated_at": "2023-06-15T10:30:30Z"
      }
    ],
    "total": 1,
    "page": 1,
    "per_page": 20
  }
  ```
- **Parametry zapytania**:
  - `page`: Numer strony (domyślnie 1)
  - `per_page`: Liczba wyników na stronę (domyślnie 20, max 100)
- **Kody sukcesu**: 200 OK
- **Kody błędów**: 401 Unauthorized, 500 Internal Server Error

#### GET /api/generations/{id}
- **Opis**: Pobiera status i wyniki generacji fiszek
- **Struktura odpowiedzi**:
  ```json
  {
    "generation_id": 456,
    "status": "completed",
    "model": "gpt-4-turbo",
    "generated_count": 15,
    "accepted_unedited_count": 0,
    "accepted_edited_count": 0,
    "source_text_hash": "abc123",
    "source_text_length": 3500,
    "generation_duration": 5000,
    "flashcards_proposals": [
      {
        "id": "proposal-1",
        "front": "Pytanie 1",
        "back": "Odpowiedź 1"
      },
      {
        "id": "proposal-2",
        "front": "Pytanie 2",
        "back": "Odpowiedź 2"
      }
    ],
    "created_at": "2023-06-15T10:30:00Z",
    "updated_at": "2023-06-15T10:30:30Z"
  }
  ```
- **Kody sukcesu**: 200 OK
- **Kody błędów**: 401 Unauthorized, 404 Not Found, 500 Internal Server Error

#### POST /api/generations/{id}/accept
- **Opis**: Akceptuje wybrane propozycje fiszek z generacji
- **Struktura żądania**:
  ```json
  {
    "accepted_flashcards": [
      {
        "proposal_id": "proposal-1",
        "front": "Pytanie 1",
        "back": "Odpowiedź 1",
        "edit_status": "unedited"
      },
      {
        "proposal_id": "proposal-2",
        "front": "Zmodyfikowane pytanie 2",
        "back": "Zmodyfikowana odpowiedź 2",
        "edit_status": "edited"
      }
    ]
  }
  ```
- **Struktura odpowiedzi**:
  ```json
  {
    "generation_id": 456,
    "accepted_count": 2,
    "accepted_flashcards": [
      {
        "id": 124,
        "front": "Pytanie 1",
        "back": "Odpowiedź 1",
        "source": "ai-full"
      },
      {
        "id": 125,
        "front": "Zmodyfikowane pytanie 2",
        "back": "Zmodyfikowana odpowiedź 2",
        "source": "ai-edited"
      }
    ],
    "accepted_unedited_count": 1,
    "accepted_edited_count": 1
  }
  ```
- **Kody sukcesu**: 200 OK
- **Kody błędów**: 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Internal Server Error

#### GET /api/generations/error-logs
- **Opis**: Pobiera logi błędów z generacji fiszek
- **Parametry zapytania**:
  - `from` (opcjonalny): Data początkowa w formacie ISO
  - `to` (opcjonalny): Data końcowa w formacie ISO
  - `limit` (opcjonalny): Limit zwracanych wpisów (domyślnie 50)
  - `offset` (opcjonalny): Przesunięcie dla paginacji
- **Struktura odpowiedzi**:
  ```json
  {
    "total": 42,
    "logs": [
      {
        "id": "err-123",
        "generation_id": 789,
        "timestamp": "2024-03-15T14:22:33Z",
        "error_type": "model_error",
        "error_message": "Model nie odpowiedział w wyznaczonym czasie",
        "model": "gpt-4-turbo",
        "input_data": {
          "prompt": "Wygeneruj fiszki o temacie...",
          "parameters": {
            "temperature": 0.7,
            "max_tokens": 1000
          }
        },
        "stack_trace": "Error: Request timeout at..."
      }
    ]
  }
  ```
- **Kody sukcesu**: 200 OK
- **Kody błędów**: 401 Unauthorized, 500 Internal Server Error

#### GET /api/generations/statistics
- **Opis**: Pobiera statystyki generacji fiszek
- **Struktura odpowiedzi**:
  ```json
  {
    "total_generations": 10,
    "total_generated_flashcards": 150,
    "total_accepted_flashcards": 120,
    "acceptance_rate": 0.8,
    "total_unedited_accepted": 90,
    "total_edited_accepted": 30,
    "edit_rate": 0.25,
    "models_used": [
      {
        "model": "gpt-4-turbo",
        "count": 6,
        "average_duration": 5200
      },
      {
        "model": "claude-3-sonnet",
        "count": 4,
        "average_duration": 4800
      }
    ]
  }
  ```
- **Kody sukcesu**: 200 OK
- **Kody błędów**: 401 Unauthorized, 500 Internal Server Error

## 3. Uwierzytelnianie i autoryzacja

System uwierzytelniania i autoryzacji jest oparty na funkcjach Supabase:

- Supabase Auth obsługuje rejestrację i logowanie użytkowników
- Sesje użytkowników są zarządzane przez JWT tokeny
- Każde żądanie API zawiera token JWT w nagłówku `Authorization` w formacie `Bearer {token}`
- Row Level Security (RLS) w bazie danych PostgreSQL zapewnia, że użytkownicy mają dostęp tylko do swoich danych
- API weryfikuje tokeny przez mechanizmy Supabase i stosuje odpowiednie polityki dostępu

Polityki RLS są skonfigurowane tak, że:
- Użytkownicy mogą czytać, aktualizować i usuwać tylko własne fiszki (gdzie `user_id` odpowiada ich ID)
- Użytkownicy mogą czytać i zarządzać tylko własnymi generacjami
- Dostęp do endpointów API jest ograniczony do zalogowanych użytkowników

## 4. Walidacja i logika biznesowa

### Walidacja

#### Flashcards
- `front`: wymagane, niepuste, maksymalnie 200 znaków
- `back`: wymagane, niepuste, maksymalnie 500 znaków
- `source`: wymagane, jedna z wartości: 'ai-full', 'ai-edited', 'manual'

#### Generations
- `source_text`: wymagane, długość między 1000 a 10000 znaków
- `source_text_hash`: wymagane, unikalny hash tekstu źródłowego
- `model`: wymagane, dozwolone tylko konkretne modele skonfigurowane w systemie

### Logika biznesowa

#### Generacja fiszek
- Proces generacji jest asynchroniczny
- Po utworzeniu generacji, system komunikuje się z API OpenRouter.ai, aby wygenerować propozycje fiszek
- Propozycje są przechowywane tymczasowo do momentu akceptacji
- Status generacji jest aktualizowany (processing → completed/error)
- Statystyki dotyczące zaakceptowanych i zmodyfikowanych fiszek są aktualizowane
