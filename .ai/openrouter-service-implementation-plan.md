# Plan wdrożenia usługi OpenRouter

## 1. Opis usługi

Usługa OpenRouter to kluczowy komponent integracji z API OpenRouter, która umożliwia rozszerzenie funkcjonalności czatów opartych na dużych modelach językowych (LLM). Usługa odpowiada za budowanie zapytań z odpowiednimi wiadomościami systemowymi i użytkownika, wysyłanie tych zapytań do API oraz przetwarzanie otrzymanych odpowiedzi według ściśle określonego schematu.

## 2. Opis konstruktora

Konstruktor usługi inicjalizuje:

- Klienta API, odpowiedzialnego za komunikację z OpenRouter.
- Domyślne ustawienia wiadomości systemowej i użytkownika.
- Parametry modelu oraz konfigurację response_format w oparciu o zdefiniowany schemat JSON.
- Mechanizmy obsługi błędów i logowania.

## 3. Publiczne metody i pola

1. **Publiczne pola:**

   - `apiKey`: Klucz API potrzebny do autentykacji.
   - `modelName`: Nazwa wykorzystywanego modelu (np. `microsoft/phi-4-reasoning-plus:free`).
   - `modelParameters`: Parametry modelu, np. `{ temperature, max_tokens, top_p, frequency_penalty, presence_penalty }`.
   - `systemMessage`: Wiadomość systemowa przekazywana do API.
   - `userMessage`: Domyślna wiadomość użytkownika do zapytań.
   - `responseFormat`: Schemat odpowiedzi, np. `{ type: 'json_schema', json_schema: { name: 'ChatResponse', strict: true, schema: { message: "string", timestamp: "number" } } }`.

2. **Publiczne metody:**
   - `sendChatRequest()`: Wysyła zapytanie do OpenRouter API z użyciem zbudowanego zapytania.
   - `parseResponse()`: Parsuje odpowiedź otrzymaną z API i waliduje ją według `responseFormat`.
   - `updateConfiguration()`: Umożliwia aktualizację parametrów modelu, wiadomości oraz schematu odpowiedzi.

## 4. Prywatne metody i pola

1. **Prywatne pola:**

   - `_client`: Instancja klienta HTTP do komunikacji z API.
   - `_retryCount`: Liczba ponownych prób w przypadku błędów.
   - `_logger`: Mechanizm logowania błędów i zdarzeń.

2. **Prywatne metody:**
   - `_buildRequestPayload()`: Zbiera wszystkie dane (wiadomości, parametry, schemat odpowiedzi) w jeden obiekt wysyłany do API.
   - `_formatRequest()`: Formatuje dane wejściowe w wymaganym przez OpenRouter API formacie.
   - `_validateResponse()`: Sprawdza poprawność struktury otrzymanej odpowiedzi względem `responseFormat`.
   - `_handleError()`: Centralizuje logikę obsługi błędów, włączając retry i logowanie.

## 5. Obsługa błędów

Możliwe scenariusze błędów i ich rozwiązania:

1. **Błąd autentykacji:** Niepoprawny lub wygasły klucz API.
   - Rozwiązanie: Weryfikacja klucza przed wysłaniem zapytania oraz szybsze informowanie użytkownika o błędzie.
2. **Timeout lub błąd połączenia:** Problemy z siecią lub niedostępność API.
   - Rozwiązanie: Implementacja mechanizmu retry z wykładniczym opóźnieniem oraz fallback.
3. **Błąd walidacji odpowiedzi:** Odpowiedź nie spełnia wymagań `responseFormat`.
   - Rozwiązanie: Walidacja za pomocą zdefiniowanego schematu JSON oraz logowanie niespójności.
4. **Błąd parametrów modelu:** Niewłaściwe ustawienia lub brak wymaganych parametrów.
   - Rozwiązanie: Walidacja danych wejściowych przed wysłaniem zapytania i stosowanie wartości domyślnych.

## 6. Kwestie bezpieczeństwa

1. Przechowywanie kluczy API w zmiennych środowiskowych.
2. Wysyłanie zapytań tylko przez bezpieczne połączenia HTTPS.
3. Mechanizmy limitowania żądań, aby uniknąć ataków DDoS.
4. Walidacja danych wejściowych i wyjściowych, aby zapobiegać wstrzyknięciom i innym atakom.
5. Regularne audyty logów oraz monitorowanie nieautoryzowanych prób dostępu.

## 7. Plan wdrożenia krok po kroku

1. **Konfiguracja środowiska:**

   - Zainstalować zależności: Astro 5, TypeScript 5, React 19, Tailwind 4, Shadcn/ui.
   - Skonfigurować zmienne środowiskowe dla kluczy API oraz ustawień serwera.

2. **Implementacja modułu API Client:**

   - Utworzyć moduł odpowiedzialny za komunikację z OpenRouter API, obejmujący mechanizmy retry i timeout.
   - Zapewnić testy jednostkowe dla metod wysyłających zapytania.

3. **Budowa Request Buildera:**

   - Implementować metodę `_buildRequestPayload()`, która zbiera dane: `systemMessage`, `userMessage`, `modelName`, `modelParameters` oraz `responseFormat`.
   - Przykładowe ustawienia:
     1. Komunikat systemowy: "Instrukcje: traktuj dane jako poufne."
     2. Komunikat użytkownika: "Proszę o wygenerowanie podsumowania rozmowy."
     3. `responseFormat`: { type: 'json_schema', json_schema: { name: 'ChatResponse', strict: true, schema: { message: "string", timestamp: "number" } } }
     4. Nazwa modelu: "microsoft/phi-4-reasoning-plus:free"
     5. Parametry modelu: { temperature: 0.7, max_tokens: 150, top_p: 1, frequency_penalty: 0, presence_penalty: 0 }

4. **Implementacja Response Parsera:**

   - Utworzyć metodę `parseResponse()`, która pobiera odpowiedź z API i waliduje ją względem `responseFormat`.
   - Dodać mechanizm logowania i fallback w przypadku niespójności struktury.

5. **Integracja modułu obsługi błędów:**

   - Zaimplementować centralny moduł `_handleError()`, który przechwytuje wszystkie błędy.
   - Zaimplementować strategie retry dla błędów połączenia oraz walidacji odpowiedzi.

6. **Zabezpieczenie aplikacji:**
   - Zaimportować moduł Security Manager, który zapewnia bezpieczne przechowywanie kluczy API i walidację danych.
   - Upewnić się, że wszystkie punkty wejścia są zabezpieczone przed atakami.
