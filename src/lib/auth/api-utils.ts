import type { AuthResponseDTO } from "../../types";
import { AuthErrorType } from "./supabase-auth";
import { z } from "zod";

/**
 * Stałe statusy HTTP używane w odpowiedziach API
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

/**
 * Standardowe komunikaty błędów dla wszystkich endpointów
 */
export const ERROR_MESSAGES = {
  VALIDATION_FAILED: "Podane dane są nieprawidłowe lub niekompletne.",
  AUTH_REQUIRED: "Ta operacja wymaga autoryzacji.",
  ACCESS_DENIED: "Nie masz uprawnień do wykonania tej operacji.",
  REQUEST_FAILED: "Nie można przetworzyć żądania. Spróbuj ponownie później.",
  ACCOUNT_EXISTS: "Konto o podanym adresie email już istnieje.",
  INVALID_CREDENTIALS: "Nieprawidłowy adres email lub hasło.",
  ACCOUNT_NOT_FOUND: "Nie znaleziono konta o podanym adresie email.",
  INVALID_TOKEN: "Nieprawidłowy lub wygasły token.",
  PASSWORD_REQUIRED: "Hasło jest wymagane.",
  PASSWORD_MISMATCH: "Podane hasła nie są identyczne.",
  WEAK_PASSWORD: "Hasło jest za słabe. Musi zawierać co najmniej 8 znaków, w tym wielką literę, małą literę i cyfrę.",
};

/**
 * Przygotowuje standardową odpowiedź z błędem walidacji
 */
export function createValidationErrorResponse(zodError: z.ZodError) {
  // Przygotuj szczegółowe informacje o błędach
  const details: Record<string, string[]> = {};

  // Mapowanie błędów Zod bezpośrednio z issues
  zodError.errors.forEach((error) => {
    const path = error.path[0]?.toString() || "form";
    if (!details[path]) {
      details[path] = [];
    }
    details[path].push(error.message);
  });

  // Utwórz główny komunikat błędu na podstawie pól z błędami
  let message = ERROR_MESSAGES.VALIDATION_FAILED;

  if (details.email && details.email.length > 0) {
    message = details.email[0];
  } else if (details.password && details.password.length > 0) {
    message = details.password[0];
  } else if (details.password_confirmation && details.password_confirmation.length > 0) {
    message = details.password_confirmation[0];
  }

  return new Response(
    JSON.stringify({
      success: false,
      type: AuthErrorType.VALIDATION_ERROR,
      message,
      details,
    }),
    {
      status: HTTP_STATUS.BAD_REQUEST,
      headers: { "Content-Type": "application/json" },
    }
  );
}

/**
 * Przygotowuje standardową odpowiedź z błędem autoryzacji
 */
export function createAuthErrorResponse(error: { type: AuthErrorType; message: string; status: number }) {
  // Wybierz bardziej przyjazny komunikat błędu dla użytkownika na podstawie typu błędu
  let userFriendlyMessage = error.message;

  switch (error.type) {
    case AuthErrorType.INVALID_CREDENTIALS:
      userFriendlyMessage = ERROR_MESSAGES.INVALID_CREDENTIALS;
      break;
    case AuthErrorType.USER_EXISTS:
      userFriendlyMessage = ERROR_MESSAGES.ACCOUNT_EXISTS;
      break;
    case AuthErrorType.INVALID_TOKEN:
      userFriendlyMessage = ERROR_MESSAGES.INVALID_TOKEN;
      break;
    case AuthErrorType.SERVER_ERROR:
      userFriendlyMessage = ERROR_MESSAGES.REQUEST_FAILED;
      break;
  }

  return new Response(
    JSON.stringify({
      success: false,
      type: error.type,
      message: userFriendlyMessage,
      originalError: error.message, // Zachowujemy oryginalny komunikat dla debugowania
    }),
    {
      status: error.status,
      headers: { "Content-Type": "application/json" },
    }
  );
}

/**
 * Przygotowuje standardową odpowiedź z sukcesem
 */
export function createSuccessResponse(message: string, redirectPath?: string, status: number = HTTP_STATUS.OK) {
  const response: AuthResponseDTO = {
    success: true,
    message,
  };

  if (redirectPath) {
    response.redirect = redirectPath;
  }

  return new Response(JSON.stringify(response), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Przygotowuje standardową odpowiedź dla błędów serwera
 */
export function createServerErrorResponse(errorMessage: string) {
  // Zawsze używaj ogólnego komunikatu dla użytkownika, zachowując szczegółowy błąd do logowania
  return new Response(
    JSON.stringify({
      success: false,
      type: AuthErrorType.SERVER_ERROR,
      message: ERROR_MESSAGES.REQUEST_FAILED,
      originalError: errorMessage, // Dla celów debugowania
    }),
    {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      headers: { "Content-Type": "application/json" },
    }
  );
}
