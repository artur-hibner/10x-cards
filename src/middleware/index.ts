import { defineMiddleware } from "astro:middleware";
import { supabaseClient } from "../db/supabase.client";
import { AUTH_REQUIRED_PAGES, GUEST_ONLY_PAGES, LOGIN_PAGE } from "../lib/auth/config";

export const onRequest = defineMiddleware(async (context, next) => {
  // Przypisujemy klienta Supabase do context.locals
  context.locals.supabase = supabaseClient;

  // Sprawdzanie sesji użytkownika z automatycznym odświeżaniem
  const {
    data: { session },
    error: sessionError,
  } = await context.locals.supabase.auth.getSession();

  // Jeśli sesja wygasła, spróbuj ją odświeżyć
  if (sessionError && sessionError.message.includes("refresh_token_not_found")) {
    console.log("Sesja wygasła, próba odświeżenia...");
    const {
      data: { session: refreshedSession },
    } = await context.locals.supabase.auth.refreshSession();
    context.locals.session = refreshedSession;
    context.locals.user = refreshedSession?.user || null;
  } else {
    // Ustawiamy sesję i użytkownika w context.locals
    context.locals.session = session;
    context.locals.user = session?.user || null;
  }

  const url = new URL(context.request.url);
  const isAuthRequired = AUTH_REQUIRED_PAGES.some((page) => url.pathname.startsWith(page));
  const isGuestOnly = GUEST_ONLY_PAGES.some((page) => url.pathname === page);

  // Przekierowanie jeśli użytkownik nie jest zalogowany a strona wymaga autoryzacji
  if (isAuthRequired && !context.locals.user) {
    // Dla API endpoints zwracamy błąd 401 zamiast przekierowania
    if (url.pathname.startsWith("/api/")) {
      return new Response(
        JSON.stringify({
          error: "Użytkownik nie jest zalogowany",
          code: "UNAUTHORIZED",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Przekierowanie na stronę logowania ze zdefiniowanym parametrem przekierowania
    return context.redirect(`${LOGIN_PAGE}?redirect=${encodeURIComponent(url.pathname)}`);
  }

  // Przekierowanie jeśli użytkownik jest zalogowany a strona jest tylko dla gości
  if (isGuestOnly && context.locals.user) {
    return context.redirect("/generate");
  }

  return next();
});
