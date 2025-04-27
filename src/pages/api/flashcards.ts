import { z } from "zod";
import type { APIRoute } from "astro";
import { FlashcardsService } from "../../services/flashcards.service";
import type { CreateFlashcardsRequestDTO } from "../../types";

export const prerender = false;

// Schemat walidacji dla pojedynczej fiszki
const flashcardSchema = z.object({
  front: z.string().min(1, "Front nie może być pusty").max(200, "Front nie może przekraczać 200 znaków"),
  back: z.string().min(1, "Back nie może być pusty").max(500, "Back nie może przekraczać 500 znaków"),
  source: z.enum(["ai-full", "ai-edited", "manual"], {
    errorMap: () => ({ message: "Source musi być jednym z: 'ai-full', 'ai-edited', 'manual'" }),
  }),
  generation_id: z.number().nullable(),
});

// Schemat walidacji dla całego żądania
const createFlashcardsSchema = z.object({
  flashcards: z.array(flashcardSchema).min(1, "Musisz podać co najmniej jedną fiszkę"),
});

// Walidacja zależności między generation_id a source
const validateSourceAndGenerationId = (flashcard: z.infer<typeof flashcardSchema>) => {
  if ((flashcard.source === "ai-full" || flashcard.source === "ai-edited") && flashcard.generation_id === null) {
    throw new Error(`Pole generation_id jest wymagane dla source: ${flashcard.source}`);
  }

  if (flashcard.source === "manual" && flashcard.generation_id !== null) {
    throw new Error("Pole generation_id musi być null dla source: manual");
  }

  return true;
};

export const POST: APIRoute = async ({ request }) => {
  console.log("Otrzymano żądanie POST /api/flashcards");
  console.log("Request headers:", Object.fromEntries(request.headers.entries()));

  try {
    // Parsowanie body żądania
    const rawBody = await request.text();
    console.log("Raw request body:", rawBody);

    const body = JSON.parse(rawBody) as CreateFlashcardsRequestDTO;
    console.log("Parsed request body:", body);

    // Walidacja podstawowej struktury danych
    const validationResult = createFlashcardsSchema.safeParse(body);
    if (!validationResult.success) {
      console.log("Błąd walidacji:", validationResult.error.errors);
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowe dane wejściowe",
          details: validationResult.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Walidacja zależności generation_id od source
    try {
      validationResult.data.flashcards.forEach(validateSourceAndGenerationId);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log("Błąd walidacji zależności:", error.message);
        return new Response(
          JSON.stringify({
            error: "Nieprawidłowe dane wejściowe",
            details: error.message,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      // Dla przypadku gdy error nie jest instancją Error
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowe dane wejściowe",
          details: "Nieznany błąd podczas walidacji",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Inicjalizacja serwisu i zapis fiszek
    const flashcardsService = new FlashcardsService();
    const result = await flashcardsService.createFlashcards(validationResult.data.flashcards);

    // Zwrócenie odpowiedzi
    return new Response(JSON.stringify(result), {
      status: 201, // Created
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Błąd podczas przetwarzania żądania:", error);
    return new Response(
      JSON.stringify({
        error: "Błąd serwera podczas przetwarzania żądania",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
