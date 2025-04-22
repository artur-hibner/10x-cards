import { z } from "zod";
import type { APIRoute } from "astro";
import { GenerationService } from "../../services/generations.service";
import type { CreateGenerationRequestDTO } from "../../types";

export const prerender = false;

const createGenerationSchema = z.object({
  source_text: z
    .string()
    .min(1000, "Tekst źródłowy musi zawierać minimum 1000 znaków")
    .max(10000, "Tekst źródłowy nie może przekraczać 10000 znaków"),
});

export const POST: APIRoute = async ({ request }) => {
  console.log("Request headers:", Object.fromEntries(request.headers.entries()));

  try {
    // Parsowanie body żądania
    const rawBody = await request.text();
    console.log("Raw request body:", rawBody);

    const body = JSON.parse(rawBody) as CreateGenerationRequestDTO;
    console.log("Parsed request body:", body);

    // Walidacja danych wejściowych
    const validationResult = createGenerationSchema.safeParse(body);
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

    // Inicjalizacja serwisu i przetwarzanie żądania
    const generationService = new GenerationService();
    const result = await generationService.createGeneration(validationResult.data.source_text);

    return new Response(JSON.stringify(result), {
      status: 202,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Błąd podczas generacji fiszek:", error);
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
