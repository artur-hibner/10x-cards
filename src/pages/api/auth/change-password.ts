import type { APIRoute } from "astro";
import { supabaseClient } from "../../../db/supabase.client";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Sprawdzenie czy użytkownik jest zalogowany
    if (!locals.user) {
      return new Response(
        JSON.stringify({ error: "Nie jesteś zalogowany" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await request.json();
    const { current_password, new_password } = body;

    if (!current_password || !new_password) {
      return new Response(
        JSON.stringify({ error: "Obecne hasło i nowe hasło są wymagane" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (new_password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Nowe hasło musi mieć przynajmniej 6 znaków" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Najpierw sprawdź czy obecne hasło jest poprawne
    const { error: signInError } = await supabaseClient.auth.signInWithPassword({
      email: locals.user.email!,
      password: current_password,
    });

    if (signInError) {
      return new Response(
        JSON.stringify({ error: "Obecne hasło jest niepoprawne" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Zaktualizuj hasło
    const { error: updateError } = await supabaseClient.auth.updateUser({
      password: new_password,
    });

    if (updateError) {
      return new Response(
        JSON.stringify({ 
          error: "Nie udało się zmienić hasła",
          details: updateError.message 
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ message: "Hasło zostało zmienione pomyślnie" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Błąd podczas zmiany hasła:", error);
    return new Response(
      JSON.stringify({
        error: "Błąd serwera podczas zmiany hasła",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}; 