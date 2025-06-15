import { z } from "zod";
import type { APIRoute } from "astro";
import { FlashcardsService } from "../../../services/flashcards.service";
import type { UpdateFlashcardDTO } from "../../../types";

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

// Schemat walidacji dla aktualizacji fiszki
const updateFlashcardSchema = z
  .object({
    front: z.string().min(1, "Tekst na przodzie fiszki nie może być pusty").optional(),
    back: z.string().min(1, "Tekst na tyle fiszki nie może być pusty").optional(),
  })
  .refine(
    (data) => data.front !== undefined || data.back !== undefined,
    "Przynajmniej jedno pole (front lub back) musi być wypełnione"
  );

export const GET: APIRoute = async ({ params, locals }) => {
  console.log("Otrzymano żądanie GET /api/flashcards/[id]");
  console.log("Params:", params);

  try {
    // Sprawdzenie uwierzytelnienia
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          error: "Użytkownik nie jest zalogowany",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

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

    // Pobranie fiszki z serwisu z user_id
    const flashcardsService = new FlashcardsService();
    const flashcard = await flashcardsService.getFlashcardById(flashcardId, locals.user.id);

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

export const PUT: APIRoute = async ({ params, request, locals }) => {
  console.log("Otrzymano żądanie PUT /api/flashcards/[id]");
  console.log("Params:", params);

  try {
    // Sprawdzenie uwierzytelnienia
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          error: "Użytkownik nie jest zalogowany",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

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

    // Parsowanie JSON z body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowy format JSON",
          details: "Nie udało się parsować danych z żądania",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Walidacja danych do aktualizacji
    const updateValidation = updateFlashcardSchema.safeParse(requestBody);
    if (!updateValidation.success) {
      console.log("Błąd walidacji danych:", updateValidation.error.errors);
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowe dane aktualizacji",
          details: updateValidation.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const updateData: UpdateFlashcardDTO = updateValidation.data;

    // Aktualizacja fiszki z user_id
    const flashcardsService = new FlashcardsService();
    const updatedFlashcard = await flashcardsService.updateFlashcard(flashcardId, updateData, locals.user.id);

    // Zwrócenie zaktualizowanej fiszki
    return new Response(JSON.stringify(updatedFlashcard), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Błąd podczas aktualizacji fiszki:", error);

    // Sprawdzenie czy to błąd "nie znaleziono"
    if (error instanceof Error && error.message.includes("nie została znaleziona")) {
      return new Response(
        JSON.stringify({
          error: "Fiszka nie została znaleziona",
          details: error.message,
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Błąd serwera podczas aktualizacji fiszki",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  console.log("Otrzymano żądanie DELETE /api/flashcards/[id]");
  console.log("Params:", params);

  try {
    // Sprawdzenie uwierzytelnienia
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          error: "Użytkownik nie jest zalogowany",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

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

    // Usunięcie fiszki z user_id
    const flashcardsService = new FlashcardsService();
    const success = await flashcardsService.deleteFlashcard(flashcardId, locals.user.id);

    if (success) {
      return new Response(JSON.stringify({ message: "Fiszka została pomyślnie usunięta" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      return new Response(
        JSON.stringify({
          error: "Nie udało się usunąć fiszki",
          details: "Fiszka może nie istnieć lub nie masz uprawnień do jej usunięcia",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Błąd podczas usuwania fiszki:", error);
    return new Response(
      JSON.stringify({
        error: "Błąd serwera podczas usuwania fiszki",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
