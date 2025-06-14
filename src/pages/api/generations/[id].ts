import { z } from "zod";
import type { APIRoute } from "astro";
import type { GenerationDTO, GenerationStatus, FlashcardProposalDTO } from "../../../types";
import { supabaseClient } from "../../../db/supabase.client";

export const prerender = false;

// Schemat walidacji dla parametru id
const idSchema = z.string().pipe(z.coerce.number().positive());

export const GET: APIRoute = async ({ params }) => {
  try {
    // Walidacja parametru id
    const validationResult = idSchema.safeParse(params.id);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowy identyfikator generacji",
          details: validationResult.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const generationId = validationResult.data;

    // Pobranie szczegółów generacji
    const { data: generation, error: fetchError } = await supabaseClient
      .from("generations")
      .select("*")
      .eq("id", generationId)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
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
      throw new Error(`Błąd podczas pobierania generacji: ${fetchError.message}`);
    }

    // Mapowanie na DTO (z flashcards_proposals)
    const generationDto: GenerationDTO = {
      generation_id: generation.id,
      model: generation.model,
      generated_count: generation.generated_count,
      accepted_unedited_count: generation.accepted_unedited_count,
      accepted_edited_count: generation.accepted_edited_count,
      source_text_hash: generation.source_text_hash,
      source_text_length: generation.source_text_length,
      generation_duration: generation.generation_duration,
      status: generation.status as GenerationStatus,
      flashcards_proposals: (generation.flashcards_proposals as unknown as FlashcardProposalDTO[]) || [],
      source_text: generation.source_text,
      created_at: generation.created_at,
      updated_at: generation.updated_at,
    };

    return new Response(JSON.stringify(generationDto), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Błąd podczas pobierania szczegółów generacji:", error);
    return new Response(
      JSON.stringify({
        error: "Błąd serwera podczas pobierania szczegółów generacji",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  try {
    // Walidacja parametru id
    const validationResult = idSchema.safeParse(params.id);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowy identyfikator generacji",
          details: validationResult.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const generationId = validationResult.data;

    // Sprawdzenie czy generacja istnieje
    const { error: fetchError } = await supabaseClient.from("generations").select("id").eq("id", generationId).single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
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
      throw new Error(`Błąd podczas sprawdzania generacji: ${fetchError.message}`);
    }

    // Usunięcie powiązanych fiszek (jeśli istnieją)
    const { error: flashcardsDeleteError } = await supabaseClient
      .from("flashcards")
      .delete()
      .eq("generation_id", generationId);

    if (flashcardsDeleteError) {
      console.error("Błąd podczas usuwania fiszek:", flashcardsDeleteError);
      // Nie przerywamy procesu - fiszki mogą nie istnieć
    }

    // Usunięcie generacji
    const { error: deleteError } = await supabaseClient.from("generations").delete().eq("id", generationId);

    if (deleteError) {
      throw new Error(`Błąd podczas usuwania generacji: ${deleteError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Generacja została pomyślnie usunięta",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Błąd podczas usuwania generacji:", error);
    return new Response(
      JSON.stringify({
        error: "Błąd serwera podczas usuwania generacji",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
