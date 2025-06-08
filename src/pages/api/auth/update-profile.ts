import type { APIRoute } from "astro";
import { z } from "zod";

export const prerender = false;

const updateProfileSchema = z.object({
  gender: z.enum(["male", "female"]).optional(),
  avatar_url: z.string().url().optional(),
});

export const PATCH: APIRoute = async ({ request, locals }) => {
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
    
    // Walidacja danych
    const result = updateProfileSchema.safeParse(body);
    if (!result.success) {
      return new Response(
        JSON.stringify({ 
          error: "Nieprawidłowe dane",
          details: result.error.errors 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { gender, avatar_url } = result.data;

    // Przygotowanie metadanych do aktualizacji
    const updateData: Record<string, string> = {};
    
    if (gender) {
      updateData.gender = gender;
      // Jeśli zmienia się płeć, aktualizuj domyślny avatar
      if (!avatar_url) {
        updateData.avatar_url = gender === "female" 
          ? "https://avatar.iran.liara.run/public/51"
          : "https://avatar.iran.liara.run/public/2";
      }
    }
    
    if (avatar_url) {
      updateData.avatar_url = avatar_url;
    }

    // Aktualizacja user metadata w Supabase
    const { error: updateError } = await locals.supabase.auth.updateUser({
      data: updateData
    });

    if (updateError) {
      return new Response(
        JSON.stringify({ 
          error: "Nie udało się zaktualizować profilu",
          details: updateError.message 
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        message: "Profil został zaktualizowany pomyślnie",
        avatar_url: updateData.avatar_url,
        gender: updateData.gender
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Błąd podczas aktualizacji profilu:", error);
    return new Response(
      JSON.stringify({
        error: "Błąd serwera podczas aktualizacji profilu",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}; 