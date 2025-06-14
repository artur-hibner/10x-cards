# Specyfikacja Modułu Autentykacji dla 10x-cards

## Wprowadzenie

Dokument opisuje architekturę modułu autentykacji dla aplikacji 10x-cards, która umożliwia użytkownikom rejestrację, logowanie i odzyskiwanie hasła zgodnie z wymaganiami z PRD (US-001, US-002, US-009) oraz stack'iem technologicznym.

## 1. Architektura Interfejsu Użytkownika

### 1.1. Nowe strony i komponenty

#### Strony (Astro)

1. **src/pages/auth/login.astro**

   - Strona logowania z wykorzystaniem komponentu `LoginForm`
   - Server-side rendering z obsługą przekierowań dla zalogowanych użytkowników
   - Przekazywanie błędów z URL do formularza (np. po nieudanym logowaniu)

2. **src/pages/auth/register.astro**

   - Strona rejestracji z wykorzystaniem komponentu `RegisterForm`
   - Server-side rendering z obsługą przekierowań dla zalogowanych użytkowników
   - Obsługa komunikatów o sukcesie/błędach

3. **src/pages/auth/reset-password.astro**

   - Strona żądania linku do resetu hasła z komponentem `RequestPasswordResetForm`
   - Obsługa stanu formularza (wysłano/nie wysłano)

4. **src/pages/auth/update-password.astro**
   - Strona ustawiania nowego hasła po otrzymaniu linku resetującego
   - Walidacja tokenu resetującego hasło
   - Wykorzystanie komponentu `UpdatePasswordForm`

#### Komponenty React (interaktywne)

1. **src/components/auth/LoginForm.tsx**

   - Formularz logowania z polami email i hasło
   - Walidacja danych wejściowych po stronie klienta (Zod)
   - Obsługa błędów API
   - Przycisk "Zapomniałem hasła" kierujący do `reset-password`

2. **src/components/auth/RegisterForm.tsx**

   - Formularz rejestracji z polami email, hasło, potwierdzenie hasła
   - Walidacja danych wejściowych (Zod)
   - Obsługa błędów API
   - Link do logowania dla istniejących użytkowników

3. **src/components/auth/RequestPasswordResetForm.tsx**

   - Formularz żądania linku resetującego hasło
   - Pole email z walidacją
   - Komunikaty o sukcesie/błędach

4. **src/components/auth/UpdatePasswordForm.tsx**

   - Formularz ustawiania nowego hasła
   - Pola: nowe hasło, potwierdzenie hasła
   - Walidacja siły hasła

5. **src/components/auth/AuthStatus.tsx**
   - Komponent wyświetlający status zalogowania w prawym górnym rogu
   - Przycisk logowania lub wylogowania
   - Menu dropdown dla zalogowanego użytkownika (profil, wylogowanie)

#### Layouty

1. **src/layouts/AuthLayout.astro**

   - Specjalny layout dla stron autoryzacji
   - Prostszy interfejs niż główny layout aplikacji
   - Centrowanie formularzy, logo aplikacji

2. **Rozszerzenie istniejącego src/layouts/Layout.astro**
   - Dodanie komponentu `AuthStatus` w prawym górnym rogu

### 1.2. Walidacja i obsługa błędów

#### Schematy walidacji (Zod)

1. **src/lib/auth/validation.ts**
   - Schema dla logowania
   - Schema dla rejestracji
   - Schema dla resetu hasła
   - Schema dla aktualizacji hasła
   - Weryfikacja siły hasła (min. 8 znaków, wielkie i małe litery, cyfry)

#### Komunikaty błędów

1. Formularze React:

   - Błędy walidacji formularza (pola wymagane, format email, zgodność haseł)
   - Błędy API (niepoprawne dane logowania, email już istnieje)
   - Obsługa komunikatów w formularzach z wykorzystaniem komponentów UI z Shadcn
   - Obsługa stanu loading podczas zapytań

2. Komunikaty globalne:
   - Wykorzystanie istniejącego komponentu `ToastNotifications` do wyświetlania komunikatów globalne (sukces, błąd)

### 1.3. Scenariusze użycia

1. **Rejestracja użytkownika**

   - Użytkownik wchodzi na `/auth/register`
   - Wypełnia formularz (email, hasło, potwierdzenie)
   - Po poprawnej walidacji, dane są wysyłane do API Supabase
   - W przypadku powodzenia, użytkownik otrzymuje potwierdzenie pomyślnej rejestracji za pomocą komponentu ToastNotifications i zostaje zalogowany oraz przekierowany na stronę główną
   - W przypadku błędu, wyświetlany jest komunikat

2. **Logowanie użytkownika**

   - Użytkownik wchodzi na `/auth/login`
   - Wypełnia formularz (email, hasło)
   - Po poprawnej walidacji, dane są wysyłane do API Supabase
   - W przypadku powodzenia, użytkownik jest przekierowywany na stronę generowania fiszek (zamiast na stronę główną, zgodnie z US-002)
   - W przypadku błędu, wyświetlany jest komunikat

3. **Resetowanie hasła**

   - Użytkownik wchodzi na `/auth/reset-password`
   - Podaje adres email
   - Na podany email wysyłany jest link do resetu hasła
   - Po kliknięciu w link, użytkownik trafia na `/auth/update-password` z tokenem w URL
   - Podaje nowe hasło i potwierdza
   - Po zmianie hasła jest przekierowywany na stronę logowania

4. **Wylogowanie**
   - Użytkownik klika przycisk wylogowania w prawym górnym rogu
   - Sesja jest usuwana, użytkownik jest przekierowywany na stronę główną
   - Wyświetlane jest powiadomienie o wylogowaniu za pomocą komponentu ToastNotifications

## 2. Logika Backendowa

### 2.1. Endpointy API

1. **src/pages/api/auth/register.ts**

   - Metoda: POST
   - Obsługa rejestracji użytkownika
   - Walidacja danych wejściowych (Zod)
   - Komunikacja z Supabase Auth API
   - Zwraca status 201 (Created) lub odpowiedni kod błędu

2. **src/pages/api/auth/login.ts**

   - Metoda: POST
   - Obsługa logowania użytkownika
   - Walidacja danych wejściowych (Zod)
   - Komunikacja z Supabase Auth API
   - Ustawienie cookies sesji
   - Zwraca status 200 (OK) lub odpowiedni kod błędu

3. **src/pages/api/auth/logout.ts**

   - Metoda: POST
   - Obsługa wylogowania użytkownika
   - Usunięcie cookies sesji
   - Zwraca status 200 (OK)

4. **src/pages/api/auth/reset-password.ts**

   - Metoda: POST
   - Żądanie wysłania linku do resetu hasła
   - Walidacja adresu email
   - Zwraca status 200 nawet jeśli email nie istnieje (ochrona przed wyciekiem informacji)

5. **src/pages/api/auth/update-password.ts**
   - Metoda: POST
   - Aktualizacja hasła na podstawie tokenu
   - Walidacja tokenu i nowego hasła
   - Zwraca status 200 (OK) lub odpowiedni kod błędu

### 2.2. Modele danych

#### Rozszerzenie typów dla autentykacji (src/types.ts)

```typescript
// Typy dla autentykacji
export interface UserAuthDTO {
  email: string;
  password: string;
}

export interface UserRegisterDTO extends UserAuthDTO {
  password_confirmation: string;
}

export interface RequestPasswordResetDTO {
  email: string;
}

export interface UpdatePasswordDTO {
  password: string;
  password_confirmation: string;
  token: string;
}

export interface AuthResponseDTO {
  success: boolean;
  message?: string;
  redirect?: string;
}

export interface UserDTO {
  id: string;
  email: string;
}
```

### 2.3. Walidacja danych wejściowych

Wykorzystanie biblioteki Zod do walidacji danych wejściowych w endpointach API:

```typescript
// src/lib/auth/validation.ts
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

export const registerSchema = z
  .object({
    email: z.string().email("Nieprawidłowy format adresu email"),
    password: z
      .string()
      .min(8, "Hasło musi mieć co najmniej 8 znaków")
      .regex(/[A-Z]/, "Hasło musi zawierać przynajmniej jedną wielką literę")
      .regex(/[a-z]/, "Hasło musi zawierać przynajmniej jedną małą literę")
      .regex(/[0-9]/, "Hasło musi zawierać przynajmniej jedną cyfrę"),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Hasła muszą być identyczne",
    path: ["password_confirmation"],
  });

export const requestPasswordResetSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu email"),
});

export const updatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Hasło musi mieć co najmniej 8 znaków")
      .regex(/[A-Z]/, "Hasło musi zawierać przynajmniej jedną wielką literę")
      .regex(/[a-z]/, "Hasło musi zawierać przynajmniej jedną małą literę")
      .regex(/[0-9]/, "Hasło musi zawierać przynajmniej jedną cyfrę"),
    password_confirmation: z.string(),
    token: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Hasła muszą być identyczne",
    path: ["password_confirmation"],
  });
```

### 2.4. Obsługa wyjątków

Implementacja centralnej obsługi błędów w endpointach API:

```typescript
// src/lib/auth/errors.ts
export enum AuthErrorType {
  INVALID_CREDENTIALS = "invalid_credentials",
  USER_EXISTS = "user_exists",
  INVALID_TOKEN = "invalid_token",
  SERVER_ERROR = "server_error",
  VALIDATION_ERROR = "validation_error",
}

export interface AuthError {
  type: AuthErrorType;
  message: string;
  status: number;
  details?: Record<string, string[]>;
}

export const authErrors = {
  [AuthErrorType.INVALID_CREDENTIALS]: {
    message: "Nieprawidłowy email lub hasło",
    status: 401,
  },
  [AuthErrorType.USER_EXISTS]: {
    message: "Użytkownik o podanym adresie email już istnieje",
    status: 409,
  },
  [AuthErrorType.INVALID_TOKEN]: {
    message: "Nieprawidłowy lub wygasły token",
    status: 400,
  },
  [AuthErrorType.SERVER_ERROR]: {
    message: "Wystąpił błąd serwera, spróbuj ponownie później",
    status: 500,
  },
  [AuthErrorType.VALIDATION_ERROR]: {
    message: "Nieprawidłowe dane wejściowe",
    status: 400,
  },
};
```

### 2.5. Aktualizacja renderowania server-side

Rozszerzenie middleware o obsługę uwierzytelniania:

```typescript
// src/middleware/index.ts
import { defineMiddleware } from "astro:middleware";
import { supabaseClient } from "../db/supabase.client";

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.supabase = supabaseClient;

  // Sprawdzenie sesji użytkownika
  const {
    data: { session },
  } = await context.locals.supabase.auth.getSession();
  context.locals.session = session;
  context.locals.user = session?.user || null;

  // Lista stron wymagających autoryzacji
  const authRequiredPages = ["/generate", "/flashcards", "/study"];

  // Lista stron tylko dla niezalogowanych użytkowników
  const guestOnlyPages = ["/auth/login", "/auth/register", "/auth/reset-password"];

  const url = new URL(context.request.url);
  const isAuthRequired = authRequiredPages.some((page) => url.pathname.startsWith(page));
  const isGuestOnly = guestOnlyPages.some((page) => url.pathname === page);

  // Przekierowanie jeśli użytkownik nie jest zalogowany a strona wymaga autoryzacji
  if (isAuthRequired && !context.locals.user) {
    return context.redirect(`/auth/login?redirect=${encodeURIComponent(url.pathname)}`);
  }

  // Przekierowanie jeśli użytkownik jest zalogowany a strona jest tylko dla gości
  if (isGuestOnly && context.locals.user) {
    return context.redirect("/generate");
  }

  return next();
});
```

## 3. System Autentykacji

### 3.1. Integracja z Supabase Auth

Utworzenie modułu do obsługi Supabase Auth:

```typescript
// src/lib/auth/supabase-auth.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { AuthError } from "./errors";
import { AuthErrorType, authErrors } from "./errors";

export const handleAuthError = (error: any): AuthError => {
  if (error.message?.includes("already registered")) {
    return {
      type: AuthErrorType.USER_EXISTS,
      message: authErrors[AuthErrorType.USER_EXISTS].message,
      status: authErrors[AuthErrorType.USER_EXISTS].status,
    };
  }

  if (error.message?.includes("Invalid login credentials")) {
    return {
      type: AuthErrorType.INVALID_CREDENTIALS,
      message: authErrors[AuthErrorType.INVALID_CREDENTIALS].message,
      status: authErrors[AuthErrorType.INVALID_CREDENTIALS].status,
    };
  }

  if (error.message?.includes("token") || error.message?.includes("JWT")) {
    return {
      type: AuthErrorType.INVALID_TOKEN,
      message: authErrors[AuthErrorType.INVALID_TOKEN].message,
      status: authErrors[AuthErrorType.INVALID_TOKEN].status,
    };
  }

  console.error("Auth error:", error);

  return {
    type: AuthErrorType.SERVER_ERROR,
    message: authErrors[AuthErrorType.SERVER_ERROR].message,
    status: authErrors[AuthErrorType.SERVER_ERROR].status,
  };
};

export class SupabaseAuthService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async signUp(email: string, password: string) {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      return { success: false, error: handleAuthError(error) };
    }
  }

  async signIn(email: string, password: string) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      return { success: false, error: handleAuthError(error) };
    }
  }

  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut();

      if (error) throw error;

      return { success: true };
    } catch (error) {
      return { success: false, error: handleAuthError(error) };
    }
  }

  async resetPassword(email: string) {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: new URL("/auth/update-password", import.meta.env.SITE).toString(),
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      return { success: false, error: handleAuthError(error) };
    }
  }

  async updatePassword(password: string, token: string) {
    try {
      // Najpierw ustawiamy token w sesji
      await this.supabase.auth.setSession({
        access_token: token,
        refresh_token: "",
      });

      // Następnie aktualizujemy hasło
      const { error } = await this.supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      return { success: false, error: handleAuthError(error) };
    }
  }
}
```

### 3.2. Implementacja w endpointach API

Przykładowa implementacja endpointu rejestracji:

```typescript
// src/pages/api/auth/register.ts
import type { APIRoute } from "astro";
import { SupabaseAuthService } from "../../../lib/auth/supabase-auth";
import { registerSchema } from "../../../lib/auth/validation";
import { AuthErrorType } from "../../../lib/auth/errors";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();

    // Walidacja danych wejściowych
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          success: false,
          type: AuthErrorType.VALIDATION_ERROR,
          message: "Nieprawidłowe dane wejściowe",
          details: result.error.format(),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { email, password } = result.data;

    const authService = new SupabaseAuthService(locals.supabase);
    const { success, error, data } = await authService.signUp(email, password);

    if (!success) {
      return new Response(
        JSON.stringify({
          success: false,
          type: error.type,
          message: error.message,
        }),
        {
          status: error.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Rejestracja zakończona pomyślnie",
        redirect: "/generate",
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error during registration:", error);

    return new Response(
      JSON.stringify({
        success: false,
        type: AuthErrorType.SERVER_ERROR,
        message: "Wystąpił nieoczekiwany błąd podczas rejestracji",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
```

Przykład implementacji endpointu logowania:

```typescript
// src/pages/api/auth/login.ts
import type { APIRoute } from "astro";
import { SupabaseAuthService } from "../../../lib/auth/supabase-auth";
import { loginSchema } from "../../../lib/auth/validation";
import { AuthErrorType } from "../../../lib/auth/errors";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();

    // Walidacja danych wejściowych
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          success: false,
          type: AuthErrorType.VALIDATION_ERROR,
          message: "Nieprawidłowe dane wejściowe",
          details: result.error.format(),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { email, password } = result.data;

    const authService = new SupabaseAuthService(locals.supabase);
    const { success, error, data } = await authService.signIn(email, password);

    if (!success) {
      return new Response(
        JSON.stringify({
          success: false,
          type: error.type,
          message: error.message,
        }),
        {
          status: error.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Logowanie zakończone pomyślnie",
        redirect: "/generate",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error during login:", error);

    return new Response(
      JSON.stringify({
        success: false,
        type: AuthErrorType.SERVER_ERROR,
        message: "Wystąpił nieoczekiwany błąd podczas logowania",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
```

### 3.3. Kontekst autoryzacji dla komponentów React

Implementacja AuthProvider do zarządzania stanem autoryzacji w aplikacji:

```typescript
// src/lib/auth/AuthContext.tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (email: string, password: string, passwordConfirmation: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<{ success: boolean; message?: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message?: string }>;
  updatePassword: (password: string, passwordConfirmation: string, token: string) => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
  initialUser,
  supabase,
}: {
  children: ReactNode;
  initialUser: User | null;
  supabase: SupabaseClient<Database>;
}) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, message: 'Wystąpił błąd podczas logowania' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, password_confirmation: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, password_confirmation }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, message: 'Wystąpił błąd podczas rejestracji' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, message: 'Wystąpił błąd podczas wylogowywania' };
    } finally {
      setIsLoading(false);
    }
  };

  const requestPasswordReset = async (email: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, message: 'Wystąpił błąd podczas wysyłania linku resetującego hasło' };
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async (password: string, password_confirmation: string, token: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, password_confirmation, token }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, message: 'Wystąpił błąd podczas aktualizacji hasła' };
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    requestPasswordReset,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

## 4. Podsumowanie

Przedstawiona architektura modułu autentykacji spełnia wszystkie wymagania określone w PRD (US-001, US-002 i US-009), wykorzystując stack technologiczny projektu 10x-cards (Astro, React, TypeScript, Tailwind, Shadcn/ui, Supabase).

Główne cechy architektury:

1. **Rozdzielenie odpowiedzialności:**

   - Komponenty React dla interaktywnych formularzy
   - Strony Astro dla renderowania server-side
   - Middleware do zabezpieczenia tras i zarządzania sesją
   - Endpointy API do komunikacji z Supabase Auth

2. **Bezpieczeństwo:**

   - Walidacja danych wejściowych (Zod)
   - Bezpieczne przechowywanie haseł (Supabase Auth)
   - Zabezpieczenie tras wymagających autoryzacji
   - Mechanizm odzyskiwania hasła

3. **Skalowalność:**

   - Modułowa struktura ułatwiająca rozbudowę
   - Typowanie danych dla lepszej konserwacji kodu
   - Centralna obsługa błędów

4. **UX:**
   - Przejrzyste komunikaty o błędach
   - Konsystentny interfejs dzięki Shadcn/ui
   - Intuicyjny przepływ procesów rejestracji, logowania i odzyskiwania hasła

Architektura będzie dobrą podstawą dla przyszłych rozszerzeń, takich jak uwierzytelnianie przez media społecznościowe czy bardziej zaawansowane mechanizmy zarządzania dostępem.
