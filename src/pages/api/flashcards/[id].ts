import { z } from "zod";
import type { APIRoute } from "astro";
import { FlashcardsService } from "../../../services/flashcards.service";

export const prerender = false;

// Schemat walidacji dla parametru ID
const idParamSchema = z.string().transform((val, ctx) => {
  const parsed = parseInt(val, 10);
  if (isNaN(parsed) || parsed <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "ID musi być liczbą całkowitą większą od 0",
    });
    return z.NEVER;
  }
  return parsed;
});

export const GET: APIRoute = async ({ params }) => {
  console.log("Otrzymano żądanie GET /api/flashcards/[id]");
  console.log("Params:", params);

  try {
    // Walidacja parametru ID
    const validationResult = idParamSchema.safeParse(params.id);
    if (!validationResult.success) {
      console.log("Błąd walidacji ID:", validationResult.error.errors);
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowy identyfikator fiszki",
          details: validationResult.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const flashcardId = validationResult.data;

    // Pobranie fiszki z serwisu
    const flashcardsService = new FlashcardsService();
    const flashcard = await flashcardsService.getFlashcardById(flashcardId);

    // Sprawdzenie czy fiszka została znaleziona
    if (!flashcard) {
      return new Response(
        JSON.stringify({
          error: "Fiszka nie została znaleziona",
          details: `Fiszka o ID ${flashcardId} nie istnieje lub nie należy do użytkownika`,
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Zwrócenie fiszki
    return new Response(JSON.stringify(flashcard), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Błąd podczas pobierania fiszki:", error);
    return new Response(
      JSON.stringify({
        error: "Błąd serwera podczas pobierania fiszki",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
