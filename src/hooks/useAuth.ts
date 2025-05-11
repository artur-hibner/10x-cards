import { useEffect, useState } from "react";
import type { UserAuthDTO, UserRegisterDTO, RequestPasswordResetDTO, UpdatePasswordDTO } from "../types";
import { SESSION_INACTIVITY_TIMEOUT, SESSION_MAX_AGE } from "../lib/auth/config";

/**
 * Hook dostarczający metody do interakcji z API autoryzacji
 */
export function useAuth() {
  // Przechowywanie adresu przekierowania w stanie
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  // Efekt do obsługi przekierowania
  useEffect(() => {
    if (redirectTo) {
      window.location.href = redirectTo;
      setRedirectTo(null);
    }
  }, [redirectTo]);

  /**
   * Efekt do obsługi timeoutów sesji
   */
  useEffect(() => {
    if (typeof window === "undefined") {
      return; // Nie wykonuj na serwerze
    }

    // Sprawdź czy użytkownik jest zalogowany (sprawdzamy to przez obecność tokenu w localStorage)
    const supabaseSession = JSON.parse(localStorage.getItem("sb-session") || "null");
    if (!supabaseSession) {
      return; // Użytkownik nie jest zalogowany, nie inicjalizuj timeoutów
    }

    let activityTimeout: number | undefined;
    let sessionTimeout: number | undefined;

    // Funkcja resetująca timeout nieaktywności
    const resetActivityTimeout = () => {
      // Wyczyść poprzedni timeout jeśli istnieje
      if (activityTimeout) {
        window.clearTimeout(activityTimeout);
      }

      // Ustawiamy czas ostatniej aktywności
      localStorage.setItem("lastActivity", Date.now().toString());

      // Ustawiamy nowy timeout
      activityTimeout = window.setTimeout(() => {
        // Wyloguj użytkownika po przekroczeniu czasu nieaktywności
        logout();
      }, SESSION_INACTIVITY_TIMEOUT);
    };

    // Inicjalizacja timeouta maksymalnego czasu sesji
    const initSessionTimeout = () => {
      // Pobierz czas utworzenia sesji
      const sessionCreatedAt = supabaseSession.created_at || Date.now();
      const timeLeft = SESSION_MAX_AGE - (Date.now() - new Date(sessionCreatedAt).getTime());

      if (timeLeft <= 0) {
        // Sesja już wygasła
        logout();
        return;
      }

      // Ustaw timeout na pozostały czas
      sessionTimeout = window.setTimeout(() => {
        logout();
      }, timeLeft);
    };

    // Obsługa zdarzeń aktywności użytkownika
    const handleUserActivity = () => {
      resetActivityTimeout();
    };

    // Dodaj listenerów na zdarzenia aktywności
    window.addEventListener("mousemove", handleUserActivity);
    window.addEventListener("keydown", handleUserActivity);
    window.addEventListener("click", handleUserActivity);
    window.addEventListener("scroll", handleUserActivity);
    window.addEventListener("touchstart", handleUserActivity);

    // Inicjalizacja timeoutów
    resetActivityTimeout();
    initSessionTimeout();

    // Cleanup przy odmontowaniu komponentu
    return () => {
      if (activityTimeout) window.clearTimeout(activityTimeout);
      if (sessionTimeout) window.clearTimeout(sessionTimeout);
      window.removeEventListener("mousemove", handleUserActivity);
      window.removeEventListener("keydown", handleUserActivity);
      window.removeEventListener("click", handleUserActivity);
      window.removeEventListener("scroll", handleUserActivity);
      window.removeEventListener("touchstart", handleUserActivity);
    };
  }, []);

  /**
   * Wysyła żądanie logowania do API
   */
  const login = async (credentials: UserAuthDTO) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      // Jeśli logowanie się powiodło i mamy adres przekierowania, zapisz do stanu
      if (data.success && data.redirect) {
        // Najpierw sprawdź, czy jest przekazany parametr redirect w window
        const redirectAfterLogin =
          typeof window !== "undefined"
            ? (window as Window & { redirectAfterLogin?: string }).redirectAfterLogin
            : undefined;

        // Użyj redirectAfterLogin z lokalnego stanu jeśli istnieje, w przeciwnym razie użyj z API
        setRedirectTo(redirectAfterLogin || data.redirect);
      }

      return data;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Wystąpił błąd podczas komunikacji z serwerem",
      };
    }
  };

  /**
   * Wysyła żądanie rejestracji do API
   */
  const register = async (userData: UserRegisterDTO) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      // Jeśli rejestracja się powiodła i mamy adres przekierowania, zapisz do stanu
      if (data.success && data.redirect) {
        setRedirectTo(data.redirect);
      }

      return data;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Wystąpił błąd podczas komunikacji z serwerem",
      };
    }
  };

  /**
   * Wysyła żądanie zresetowania hasła do API
   */
  const resetPassword = async (requestData: RequestPasswordResetDTO) => {
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Wystąpił błąd podczas komunikacji z serwerem",
      };
    }
  };

  /**
   * Wysyła żądanie aktualizacji hasła do API
   */
  const updatePassword = async (updateData: UpdatePasswordDTO) => {
    try {
      const response = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      // Jeśli aktualizacja się powiodła i mamy adres przekierowania, zapisz do stanu
      if (data.success && data.redirect) {
        setRedirectTo(data.redirect);
      }

      return data;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Wystąpił błąd podczas komunikacji z serwerem",
      };
    }
  };

  /**
   * Wysyła żądanie wylogowania do API
   */
  const logout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      // Jeśli wylogowanie się powiodło i mamy adres przekierowania, zapisz do stanu
      if (data.success && data.redirect) {
        setRedirectTo(data.redirect);
      }

      return data;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Wystąpił błąd podczas komunikacji z serwerem",
      };
    }
  };

  return {
    login,
    register,
    resetPassword,
    updatePassword,
    logout,
  };
}
