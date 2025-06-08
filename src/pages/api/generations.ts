import { z } from "zod";
import type { APIRoute } from "astro";
import { GenerationService } from "../../services/generations.service";
import type { CreateGenerationRequestDTO, GenerationListResponseDTO } from "../../types";
import { supabaseClient } from "../../db/supabase.client";

export const prerender = false;

const createGenerationSchema = z.object({
  source_text: z
    .string()
    .min(1000, "Tekst źródłowy musi zawierać minimum 1000 znaków")
    .max(10000, "Tekst źródłowy nie może przekraczać 10000 znaków"),
  model_id: z.string().optional(),
});

// Schemat walidacji dla parametrów paginacji
const paginationSchema = z.object({
  page: z.string().pipe(z.coerce.number().min(1).default(1)).optional().default("1"),
  limit: z.string().pipe(z.coerce.number().min(1).max(100).default(10)).optional().default("10"),
});

export const GET: APIRoute = async ({ url }) => {
  try {
    // Parsowanie parametrów query
    const searchParams = Object.fromEntries(url.searchParams);
    const validationResult = paginationSchema.safeParse(searchParams);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowe parametry paginacji",
          details: validationResult.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { page, limit } = validationResult.data;
    const offset = (Number(page) - 1) * Number(limit);

    // Pobranie generacji z paginacją
    const {
      data: generations,
      error: fetchError,
      count,
    } = await supabaseClient
      .from("generations")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (fetchError) {
      throw new Error(`Błąd podczas pobierania generacji: ${fetchError.message}`);
    }

    // Mapowanie na DTO (bez flashcards_proposals dla listy)
    const generationsDto = generations.map((gen) => ({
      generation_id: gen.id,
      model: gen.model,
      generated_count: gen.generated_count,
      accepted_unedited_count: gen.accepted_unedited_count,
      accepted_edited_count: gen.accepted_edited_count,
      source_text_hash: gen.source_text_hash,
      source_text_length: gen.source_text_length,
      generation_duration: gen.generation_duration,
      status: gen.status,
      created_at: gen.created_at,
      updated_at: gen.updated_at,
    }));

    const response: GenerationListResponseDTO = {
      generations: generationsDto,
      total: count || 0,
      page: Number(page),
      per_page: Number(limit),
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Błąd podczas pobierania listy generacji:", error);
    return new Response(
      JSON.stringify({
        error: "Błąd serwera podczas pobierania listy generacji",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

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
    const result = await generationService.createGeneration(
      validationResult.data.source_text,
      validationResult.data.model_id
    );

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
