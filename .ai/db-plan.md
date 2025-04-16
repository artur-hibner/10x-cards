# Schemat bazy danych PostgreSQL – 10x-cards

## 1. Tabele

### a) `users`
- `id` – UUID PRIMARY KEY (główny klucz, zarządzany przez Supabase)
- `email` – VARCHAR(255), UNIQUE, NOT NULL
- `encrypted_password` – VARCHAR, NOT NULL
- `created_at` – TIMESTAMPTZ, NOT NULL, DEFAULT now()
- `confirmed_at` – TIMESTAMPTZ

### b) `flashcards`
- `id` – BIGSERIAL, PRIMARY KEY
- `front` – VARCHAR(200), NOT NULL
- `back` – VARCHAR(500), NOT NULL
- `source` – VARCHAR, NOT NULL, CHECK (source IN ('ai-full', 'ai-edited', 'manual'))
- `generation_id` – BIGINT, REFERENCES generations(id) ON DELETE SETT NULL
- `user_id` – UUID, NOT NULL, REFERENCES users(id)
- `created_at` – TIMESTAMPTZ, NOT NULL, DEFAULT now()
- `updated_at` – TIMESTAMPTZ, NOT NULL, DEFAULT now()

*Trigger: Automatically update the "update_at" column on record updates.*

Indeksy:
- INDEX na `user_id`
- INDEX na `generation_id`

### c) `generations`
- `id` – BIGSERIAL, PRIMARY KEY
- `user_id` – UUID, NOT NULL, REFERENCES users(id)
- `model` – VARCHAR, NOT NULL
- `generated_count` – INTEGER, NOT NULL
- `accepted_unedited_count` – INTEGER, NULLABLE
- `accepted_edited_count` – INTEGER, NULLABLE
- `source_text_hash` – VARCHAR, NOT NULL
- `source_text_length` – INTEGER, NOT NULL, CHECK (source_text_length BETWEEN 1000 AND 10000)
- `generation_duration` – INTEGER, NOT NULL
- `created_at` – TIMESTAMPTZ, NOT NULL, DEFAULT now()
- `updated_at` – TIMESTAMPTZ, NOT NULL, DEFAULT now()

Indeksy:
- INDEX na `user_id`

### d) `generation_error_logs`
- `id` – BIGSERIAL, PRIMARY KEY
- `user_id` – UUID, NOT NULL, REFERENCES users(id)
- `model` – VARCHAR, NOT NULL
- `source_text_hash` – VARCHAR, NOT NULL
- `source_text_length` – INTEGER, NOT NULL, CHECK (source_text_length BETWEEN 1000 AND 10000)
- `error_code` – VARCHAR(100), NOT NULL
- `error_message` – TEXT, NOT NULL
- `created_at` – TIMESTAMPTZ, NOT NULL, DEFAULT now()

Indeksy:
- INDEX na `user_id`

## 2. Relacje między tabelami

- `users` (1) --- (N) `flashcards` (poprzez `user_id`)
- `users` (1) --- (N) `generations` (poprzez `user_id`)
- `users` (1) --- (N) `generation_error_logs` (poprzez `user_id`)
- `generations` (1) --- (N) `flashcards` (poprzez `generation_id`, opcjonalnie)

## 3. Indeksy

- Indywidualne indeksy na kolumnach `user_id` w tabelach: `flashcards`, `generations`, `generation_error_logs`
- Indeks na `generation_id` w tabeli `flashcards`

## 4. Zasady PostgreSQL

### Ograniczenia CHECK
- W tabeli `flashcards`: kolumna `source` musi przyjmować jedną z wartości: ('ai-full', 'ai-edited', 'manual').
- W tabelach `generations` oraz `generation_error_logs`: kolumna `source_text_length` musi mieścić się w przedziale 1000–10000.

### Trigger
- Automatyczny trigger aktualizujący pole `updated_at` w tabelach `flashcards` oraz `generations` przy każdej modyfikacji.

### Row Level Security (RLS)
- Wdrożenie RLS na tabelach `flashcards`, `generations` oraz `generation_error_logs` oparte na kolumnie `user_id`, aby zapewnić, że użytkownicy mają dostęp tylko do swoich danych.

## 5. Dodatkowe uwagi

- Schemat został zaprojektowany z myślą o skalowalności i wydajności, z minimalnymi indeksami na kluczowych kolumnach.
- Optymalizacja pod backend Supabase uwierzytelniający użytkowników i zarządzający danymi.
- Użycie CHECK constraints oraz triggerów gwarantuje integralność danych i automatyczne zarządzanie timestampami.