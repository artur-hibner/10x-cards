# Plan implementacji widoku Generate

## 1. Przegląd
Widok **Generate** umożliwia użytkownikowi wprowadzenie długiego tekstu (od 1000 do 10000 znaków) i generowanie propozycji fiszek przy użyciu AI. Użytkownik może następnie przejrzeć, zaakceptować, edytować lub odrzucić poszczególne propozycje fiszek, a ostatecznie zapisać wybrane (zaakceptowane bądź wszystkie) fiszki do bazy danych.

## 2. Routing widoku
Widok będzie dostępny pod ścieżką: `/generate`

## 3. Struktura komponentów
- **FlashcardGenerationView** (główny kontener widoku) zawierający logikę i strukturę strony
  - **TextInputArea** – komponent pola tekstowego do wprowadzania źródłowego tekstu.
  - **GenerateButton** – przycisk inicjujący proces generowania fiszek.
  - **SkeletonLoader** – spinner/wskaźnik ładowania widoczny podczas oczekiwania na odpowiedź API.
  - **FlashcardList** – lista wyświetlająca propozycje fiszek otrzymanych z API.
    - **FlashcardListItem** – karta pojedynczej propozycji, zawierająca treść oraz akcje: Akceptuj, Edytuj, Odrzuć.
  - **BulkSaveButton** – komponent zawierający przyciski do zapisu wszystkich fiszek lub tylko zaakceptowanych.
  - **ToastNotifications** – system powiadomień dla komunikatów o sukcesie lub błędach.

## 4. Szczegóły komponentów
### GenerateView
- Opis: Główny komponent zarządzający stanem widoku i komunikacją z API.
- Główne elementy: pole tekstowe, przycisk generowania, kontener na listę propozycji, wskaźnik ładowania.
- Obsługiwane interakcje: Wprowadzenie tekstu, kliknięcie przycisku generowania, akcje na kartach propozycji.
- Walidacja: Tekst musi mieć długość 1000-10000 znaków.
- Typy: Wykorzystuje typy `CreateGenerationRequestDTO`, `CreateGenerationResponseDTO`, oraz lokalny model `FlashcardProposalViewModel`.
- Propsy: Brak (strona niezależna)

### TextInputArea
- Opis: Komponent pola tekstowego z walidacją długości.
- Główne elementy: `<textarea>`, etykieta, komunikat o błędzie.
- Obsługiwane interakcje: Zmiana wartości, walidacja po utracie fokusu.
- Walidacja: Minimum 1000 i maksimum 10000 znaków.
- Typy: Prosty string jako wartość.
- Propsy: `value`, `onChange`, `onBlur`, `errorMessage` (opcjonalnie).

### GenerateButton
- Opis: Przycisk do wysłania tekstu do API generacji.
- Główne elementy: `<button>` z etykietą.
- Obsługiwane interakcje: Kliknięcie, które wywołuje akcję API.
- Walidacja: Aktywowany tylko gdy tekst w polu jest poprawny.
- Typy: Brak dodatkowych, tylko event onClick.
- Propsy: `disabled` (boolean), `onClick`.

### LoadingIndicator
- Opis: Wskaźnik ładowania prezentujący stan oczekiwania.
- Główne elementy: Spinner lub skeleton.
- Obsługiwane interakcje: Brak interakcji.
- Walidacja: Pokazywany gdy oczekujemy odpowiedzi API.
- Typy: Brak.
- Propsy: Może być warunkowo renderowany.

### FlashcardList
- Opis: Lista renderująca wszystkie propozycje fiszek.
- Główne elementy: Kolekcja komponentów `ProposalCard`.
- Obsługiwane interakcje: Przekazywanie akcji do komponentów potomnych.
- Walidacja: Lista może być pusta, wyświetla komunikat gdy brak propozycji.
- Typy: Array of `FlashcardProposalViewModel`.
- Propsy: `proposals` (lista), `onUpdateProposal` (funkcja), `onRemoveProposal` (funkcja).

### FlashcardListItem
- Opis: Karta pojedynczej propozycji fiszki z akcjami.
- Główne elementy: Wyświetlanie pól `front` i `back`, przyciski akcji.
- Obsługiwane interakcje:
  - **Akceptuj**: Zaznaczanie propozycji jako zaakceptowane.
  - **Edytuj**: Uruchomienie trybu edycji (inline lub modal) w celu modyfikacji treści.
  - **Odrzuć**: Usunięcie propozycji z widoku.
- Walidacja: Podczas edycji walidacja długości pól: `front` max 200 znaków, `back` max 500 znaków.
- Typy: `FlashcardProposalViewModel` z polami: `id`, `front`, `back`, `source`. `accepted` (boolean), `edited` (boolean).
- Propsy: `proposal` (obiekt typu FlashcardProposalViewModel), `onAccept`, `onEdit`, `onReject`.

### BulkSaveButton
- Opis: Komponent umożliwiający masowy zapis fiszek. W zależności od wyboru użytkownika, pozwala na zapis wszystkich fiszek lub tylko tych zaakceptowanych.
- Główne elementy: Przyciski "Zapisz wszystkie" oraz "Zapisz zaakceptowane" prezentowane w jednym komponencie. Umożliwia wysłanie danych do backendu w jednym żądaniu
- Obsługiwane interakcje: OnClick dla każdego przycisk, któ©y wywołuje odpowiednią funkcję wysyłającą żądanie do API
- Walidacja: Aktywowany jedynie gdy istnieją fiszki do zapisu; dane fiszek muszą spełniac walidację (front <= 200 znaków, back <= 500 znaków).
- Typy: Wykorzystuje typy zdefiniowane w `types.ts`, w tym interfejs `FlashcardsCreateCommand` (bazujący na `FlashcardCreateDto`).
- Propsy: onSaveAll, onSaveAccepted, disabled.

### ToastNotifications
- Opis: Komponent odpowiedzialny za wyświetlanie krótkich powiadomień (toast), informujących użytkownika o sukcesach, błędach lub innych ważnych zdarzeniach.
- Główne elementy: Pasek z komunikatem oraz ikonka zależna od typu (np. 'success', 'error', 'info').
- Obsługiwane interakcje: Automatyczne znikanie po ustalonym czasie oraz możliwość ręcznego zamknięcia powiadomienia.
- Walidacja: Toasty wyświetlane są tylko w przypadku wystąpienia odpowiednich zdarzeń; sprawdzana jest poprawność treści i typu komunikatu.
- Typy: Wykorzystuje typ `ToastMessage` zawierający:
  - `message`: string
  - `type`: 'success' | 'error' | 'info'
  - `duration`: number (czas wyświetlania w milisekundach).
- Propsy: `toasts` (lista powiadomień), `onRemoveToast` (funkcja usuwająca powiadomienie), `autoCloseDuration` (opcjonalnie, czas wyświetlania).

## 5. Typy
- `GenerateFlashcardsCommand`:
  - `source_text`: string – tekst źródłowy do generacji fiszek.
- `GenerationCreateResponseDto`:
  - `generation_id`: number – identyfikator generacji.
  - `flashcards_proposals`: FlashcardProposalDto[] – lista propozycji fiszek.
  - `generated_count`: number – liczba wygenerowanych fiszek.
- `FlashcardProposalDto`:
  - `id`: string – unikalny identyfikator propozycji.
  - `front`: string – treść przodu fiszki.
  - `back`: string – treść tyłu fiszki.
- `FlashcardProposalViewModel`:
  - `id`: string – unikalny identyfikator propozycji.
  - `front`: string – treść przodu fiszki.
  - `back`: string – treść tyłu fiszki.
  - `source`: 'ai-full' | 'ai-edited' | 'manual' – domyślny typ źródła, możliwy do dynamicznego ustawienia przez użytkownika.
  - `accepted`: boolean – flaga, czy propozycja została zaakceptowana.
  - `edited`: boolean – flaga, czy fiszka została edytowana.
- `FlashcardsCreateCommand`:
  - `front`: string
  - `back`: string
  - `source`: 'ai-full' | 'ai-edited' | 'manual'
  - `generation_id`: number | null

## 6. Zarządzanie stanem
Widok będzie używał React `useState` do zarządzania:
- Wartością pola tekstowego.
- Stanem ładowania (`isLoading`).
- Listą propozycji (`proposals`).
- Stanem błędów i powiadomień (`error`, `toastMessage`).
Dodatkowo, można stworzyć custom hook do obsługi wywołań API, np. `useApiCall`.

## 7. Integracja API
- Wywołanie API po kliknięciu przycisku generowania:
  - Metoda: `POST`
  - Endpoint: `/api/generations`
  - Żądanie: `{ source_text: string }`
  - Odpowiedź: `{ generation_id: number, flashcards_proposals: FlashcardProposalDto[], generated_count: number }`
- Wywołanie API przy zapisie fiszek przez BulkSaveButton:
  - Metoda: `POST`
  - Endpoint: `/api/flashcards`
  - Żądanie: `{ flashcards: FlashcardsCreateCommand[] }` – dane konwertowane z wybranych propozycji według typu `FlashcardsCreateCommand`.
  - Odpowiedź: Zwraca zapisane fiszki wraz z ich identyfikatorami i metadanymi.

## 8. Interakcje użytkownika
- Użytkownik wprowadza tekst do pola.
- Po osiągnięciu minimalnej długości przycisk generowania staje się aktywny.
- Po kliknięciu przycisku wyświetlany jest stan ładowania.
- Po otrzymaniu danych, lista propozycji jest wyświetlana.
- Dla każdej propozycji użytkownik może kliknąć:
  - **Akceptuj**: propozycja jest oznaczana jako zaakceptowana.
  - **Edytuj**: użytkownik modyfikuje treść fiszki, walidacja jest wykonywana na polach.
  - **Odrzuć**: usunięcie propozycji z widoku.
- Po zatwierdzeniu akcji, użytkownik może kliknąć "Zapisz zaakceptowane", co wywołuje zapis do bazy danych z odpowiednim wywołaniem API.
- W razie błędów, użytkownik otrzymuje powiadomienie (toast).

## 9. Warunki i walidacja
- Tekst wejściowy musi mieć od 1000 do 10000 znaków.
- Propozycje fiszek muszą spełniać walidację:
  - `front`: nie pusty, max 200 znaków.
  - `back`: nie pusty, max 500 znaków.
- Przycisk generowania jest aktywny tylko przy poprawnym stanie tekstu.
- Podczas edycji fiszki, walidacja musi zapewnić zgodność z wymaganiami API.

## 10. Obsługa błędów
- Wyświetlenie toast notification z komunikatem o błędzie, gdy:
  - Tekst jest nieprawidłowy lub nie spełnia długości.
  - API zwróci błąd (400, 401, 500) przy wywołaniu POST /api/generations lub POST /api/flashcards.
- Blokada dalszych akcji do momentu rozwiązania błędu.

## 11. Kroki implementacji
1. Utworzenie nowego pliku widoku `/generate` w folderze `src/pages`.
2. Stworzenie głównego komponentu `FlashcardGenerationView` wraz z importem niezbędnych bibliotek (React, shadcn/ui, Tailwind).
3. Implementacja komponentu `TextInputArea` z walidacją długości tekstu.
4. Implementacja przycisku `GenerateButton` oraz integracji z API POST `/api/generations`.
5. Dodanie `SkeletonLoader` jako wskaźnika ładowania podczas oczekiwania na odpowiedź API.
6. Implementacja `FlashcardList` oraz komponentu `FlashcardListItem` do renderowania propozycji fiszek z akcjami: Akceptuj, Edytuj, Odrzuć.
7. Implementacja mechanizmu edycji (inline/modal) do modyfikacji treści fiszki z walidacją pól.
8. Implementacja komponentu `BulkSaveButton`, który wywołuje API POST `/api/flashcards` przy użyciu typu `FlashcardsCreateCommand` dla zapisania fiszek.
9. Dodanie systemu powiadomień za pomocą `ToastNotifications` do obsługi błędów i sukcesów.
10. Testowanie widoku pod kątem poprawności wejść, interakcji użytkownika oraz zgodności z wymaganiami bezpieczeństwa i dostępności.
11. Integracja oraz finalne testy, usuwanie potencjalnych błędów oraz optymalizacja responsywności.