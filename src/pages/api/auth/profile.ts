import type { APIRoute } from "astro";
import { supabaseClient } from "../../../db/supabase.client";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    // Sprawdzenie czy użytkownik jest zalogowany
    if (!locals.user) {
      return new Response(JSON.stringify({ error: "Nie jesteś zalogowany" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Pobranie danych użytkownika z Supabase
    const { data: user, error } = await supabaseClient.auth.getUser();

    if (error || !user.user) {
      return new Response(JSON.stringify({ error: "Nie udało się pobrać danych użytkownika" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Określamy avatar URL na podstawie metadata lub płci
    const gender = user.user.user_metadata?.gender;
    const defaultAvatarUrl =
      gender === "female" ? "https://avatar.iran.liara.run/public/51" : "https://avatar.iran.liara.run/public/2";

    const userData = {
      email: user.user.email,
      created_at: user.user.created_at,
      last_sign_in_at: user.user.last_sign_in_at,
      avatar_url: user.user.user_metadata?.avatar_url || defaultAvatarUrl,
      gender: gender || "male",
    };

    return new Response(JSON.stringify(userData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Błąd podczas pobierania profilu:", error);
    return new Response(
      JSON.stringify({
        error: "Błąd serwera podczas pobierania profilu",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
