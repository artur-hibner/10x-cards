import { z } from "zod";
import type { APIRoute } from "astro";
import type { AcceptFlashcardsRequestDTO, AcceptFlashcardsResponseDTO } from "../../../../types";
import { supabaseClient } from "../../../../db/supabase.client";
import { DEFAULT_USER_ID } from "../../../../db/supabase.client";

export const prerender = false;

// Schemat walidacji dla parametru id
const idSchema = z.string().pipe(z.coerce.number().positive());

// Schemat walidacji dla akceptowanych fiszek
const acceptFlashcardsSchema = z.object({
  accepted_flashcards: z.array(
    z.object({
      proposal_id: z.string(),
      front: z.string().min(1, "Front fiszki nie może być pusty"),
      back: z.string().min(1, "Tył fiszki nie może być pusty"),
      edit_status: z.enum(["edited", "unedited"]),
    })
  ).min(1, "Musisz wybrać co najmniej jedną fiszkę do akceptacji"),
});

export const POST: APIRoute = async ({ params, request }) => {
  try {
    // Walidacja parametru id
    const idValidation = idSchema.safeParse(params.id);
    if (!idValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowy identyfikator generacji",
          details: idValidation.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const generationId = idValidation.data;

    // Parsowanie i walidacja body żądania
    const rawBody = await request.text();
    const body = JSON.parse(rawBody) as AcceptFlashcardsRequestDTO;

    const bodyValidation = acceptFlashcardsSchema.safeParse(body);
    if (!bodyValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowe dane żądania",
          details: bodyValidation.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { accepted_flashcards } = bodyValidation.data;

    // Sprawdzenie czy generacja istnieje
    const { data: generation, error: generationError } = await supabaseClient
      .from("generations")
      .select("id, status")
      .eq("id", generationId)
      .single();

    if (generationError) {
      if (generationError.code === "PGRST116") {
        return new Response(
          JSON.stringify({
            error: "Generacja nie została znaleziona",
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      throw new Error(`Błąd podczas sprawdzania generacji: ${generationError.message}`);
    }

    if (generation.status !== "completed") {
      return new Response(
        JSON.stringify({
          error: "Nie można akceptować fiszek z generacji która nie została ukończona",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Rozpoczęcie transakcji - tworzenie fiszek
    const flashcardsToCreate = accepted_flashcards.map(flashcard => ({
      front: flashcard.front,
      back: flashcard.back,
      source: flashcard.edit_status === "edited" ? "ai-edited" as const : "ai-full" as const,
      generation_id: generationId,
      user_id: DEFAULT_USER_ID,
    }));

    const { data: createdFlashcards, error: createError } = await supabaseClient
      .from("flashcards")
      .insert(flashcardsToCreate)
      .select();

    if (createError) {
      throw new Error(`Błąd podczas tworzenia fiszek: ${createError.message}`);
    }

    // Aktualizacja statystyk generacji
    const acceptedUnedited = accepted_flashcards.filter(f => f.edit_status === "unedited").length;
    const acceptedEdited = accepted_flashcards.filter(f => f.edit_status === "edited").length;

    const { error: updateError } = await supabaseClient
      .from("generations")
      .update({
        accepted_unedited_count: acceptedUnedited,
        accepted_edited_count: acceptedEdited,
        updated_at: new Date().toISOString(),
      })
      .eq("id", generationId);

    if (updateError) {
      throw new Error(`Błąd podczas aktualizacji statystyk generacji: ${updateError.message}`);
    }

    // Przygotowanie odpowiedzi
    const response: AcceptFlashcardsResponseDTO = {
      generation_id: generationId,
      accepted_count: accepted_flashcards.length,
      accepted_flashcards: createdFlashcards.map(flashcard => ({
        id: flashcard.id,
        front: flashcard.front,
        back: flashcard.back,
        source: flashcard.source,
        generation_id: flashcard.generation_id,
        created_at: flashcard.created_at,
        updated_at: flashcard.updated_at,
      })),
      accepted_unedited_count: acceptedUnedited,
      accepted_edited_count: acceptedEdited,
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Błąd podczas akceptacji fiszek:", error);
    return new Response(
      JSON.stringify({
        error: "Błąd serwera podczas akceptacji fiszek",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}; 