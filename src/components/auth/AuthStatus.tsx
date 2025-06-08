import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { useAuth } from "../../hooks/useAuth";
import { SESSION_INACTIVITY_TIMEOUT } from "../../lib/auth/config";

interface AuthStatusProps {
  isLoggedIn: boolean;
  userEmail?: string;
}

export function AuthStatus({ isLoggedIn, userEmail }: AuthStatusProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [sessionExpiryMinutes, setSessionExpiryMinutes] = useState<number | null>(null);
  const auth = useAuth();

  // Obsługa ostrzeżenia o wygasającej sesji
  useEffect(() => {
    if (!isLoggedIn) return;

    // Sprawdzanie pozostałego czasu co minutę
    const checkSessionExpiry = () => {
      const lastActivity = Number(localStorage.getItem("lastActivity") || Date.now());
      const timeElapsed = Date.now() - lastActivity;
      const timeRemaining = SESSION_INACTIVITY_TIMEOUT - timeElapsed;

      // Oblicz pozostałe minuty
      const minutesRemaining = Math.floor(timeRemaining / (60 * 1000));
      setSessionExpiryMinutes(minutesRemaining > 0 ? minutesRemaining : 0);

      // Pokaż ostrzeżenie gdy zostało mniej niż 5 minut
      setShowSessionWarning(minutesRemaining <= 5 && minutesRemaining > 0);
    };

    const interval = setInterval(checkSessionExpiry, 60 * 1000); // Sprawdzaj co minutę
    checkSessionExpiry(); // Sprawdź od razu

    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // Odświeżanie sesji
  const extendSession = () => {
    // Symulujemy aktywność użytkownika, co zresetuje timer w useAuth
    window.dispatchEvent(new MouseEvent("mousemove"));
    setShowSessionWarning(false);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await auth.logout();
    } catch (error) {
      console.error("Błąd podczas wylogowania:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  if (!isLoggedIn) {
    return (
      <div className="flex items-center">
        <a href="/auth/login">
          <Button variant="ghost" className="text-sm">
            Zaloguj się
          </Button>
        </a>
      </div>
    );
  }

  return (
    <div className="relative">
      {showSessionWarning && (
        <div className="absolute top-0 right-0 -mt-16 w-64 bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-2 rounded-md shadow-lg z-20">
          <p className="text-sm">
            Twoja sesja wygaśnie za {sessionExpiryMinutes} {sessionExpiryMinutes === 1 ? "minutę" : "minut"}.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 w-full border-yellow-400 text-yellow-700 hover:bg-yellow-200"
            onClick={extendSession}
          >
            Przedłuż sesję
          </Button>
        </div>
      )}

      <Button variant="ghost" className="text-sm flex items-center" onClick={toggleDropdown}>
        <span className="mr-1">{userEmail || "Użytkownik"}</span>
        <svg
          className={`h-4 w-4 transition-transform ${showDropdown ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">

            {sessionExpiryMinutes !== null && (
              <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
                Sesja wygaśnie za: {sessionExpiryMinutes} {sessionExpiryMinutes === 1 ? "minutę" : "minut"}
              </div>
            )}
            <button
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              role="menuitem"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "Wylogowywanie..." : "Wyloguj się"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
