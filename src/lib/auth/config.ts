/**
 * Konfiguracja autoryzacji dla aplikacji 10x-cards
 */

/**
 * Lista ścieżek wymagających zalogowania użytkownika.
 * Użytkownik niezalogowany zostanie przekierowany na stronę logowania.
 */
export const AUTH_REQUIRED_PAGES = ["/generate", "/flashcards", "/study", "/profile"];

/**
 * Lista ścieżek dostępnych tylko dla niezalogowanych użytkowników.
 * Użytkownik zalogowany zostanie przekierowany na stronę główną aplikacji.
 */
export const GUEST_ONLY_PAGES = ["/auth/register", "/auth/reset-password"];

/**
 * Domyślna strona, na którą zostanie przekierowany użytkownik po pomyślnym zalogowaniu
 */
export const DEFAULT_REDIRECT_AFTER_LOGIN = "/generate";

/**
 * Domyślna strona, na którą zostanie przekierowany użytkownik po wylogowaniu
 */
export const DEFAULT_REDIRECT_AFTER_LOGOUT = "/";

/**
 * Strona, na którą zostanie przekierowany użytkownik,
 * gdy próbuje uzyskać dostęp do strony wymagającej autoryzacji
 */
export const LOGIN_PAGE = "/"; // Strona główna zawiera formularz logowania

/**
 * Czas (w milisekundach) po którym nieaktywna sesja użytkownika zostanie uznana za wygasłą
 * i użytkownik zostanie wylogowany automatycznie
 * 1 godzina = 60 * 60 * 1000 = 3600000 ms
 */
export const SESSION_INACTIVITY_TIMEOUT = 3600000;

/**
 * Maksymalny czas życia sesji (w milisekundach), po którym użytkownik
 * zostanie wylogowany niezależnie od aktywności
 * 24 godziny = 24 * 60 * 60 * 1000 = 86400000 ms
 */
export const SESSION_MAX_AGE = 86400000;
