import type { APIRoute } from "astro";
import type { GenerationStatisticsDTO, ModelUsageStats } from "../../../types";
import { supabaseClient } from "../../../db/supabase.client";

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    // Pobranie podstawowych statystyk generacji
    const { data: generationsData, error: generationsError } = await supabaseClient
      .from("generations")
      .select("*");

    if (generationsError) {
      throw new Error(`Błąd podczas pobierania danych generacji: ${generationsError.message}`);
    }

    // Pobranie wszystkich fiszek dla statystyk akceptacji
    const { data: flashcardsData, error: flashcardsError } = await supabaseClient
      .from("flashcards")
      .select("source, generation_id")
      .not("generation_id", "is", null);

    if (flashcardsError) {
      throw new Error(`Błąd podczas pobierania danych fiszek: ${flashcardsError.message}`);
    }

    // Obliczenie podstawowych statystyk
    const totalGenerations = generationsData.length;
    const totalGeneratedFlashcards = generationsData.reduce((sum, gen) => sum + gen.generated_count, 0);
    const totalAcceptedFlashcards = flashcardsData.length;
    const acceptanceRate = totalGeneratedFlashcards > 0 ? totalAcceptedFlashcards / totalGeneratedFlashcards : 0;

    // Statystyki edycji
    const totalUneditedAccepted = flashcardsData.filter(f => f.source === "ai-full").length;
    const totalEditedAccepted = flashcardsData.filter(f => f.source === "ai-edited").length;
    const editRate = totalAcceptedFlashcards > 0 ? totalEditedAccepted / totalAcceptedFlashcards : 0;

    // Statystyki według modeli
    const modelStats = new Map<string, { count: number; totalDuration: number }>();
    
    generationsData.forEach(gen => {
      const existing = modelStats.get(gen.model) || { count: 0, totalDuration: 0 };
      modelStats.set(gen.model, {
        count: existing.count + 1,
        totalDuration: existing.totalDuration + (gen.generation_duration || 0),
      });
    });

    const modelsUsed: ModelUsageStats[] = Array.from(modelStats.entries()).map(([model, stats]) => ({
      model,
      count: stats.count,
      average_duration: stats.count > 0 ? Math.round(stats.totalDuration / stats.count) : 0,
    }));

    const response: GenerationStatisticsDTO = {
      total_generations: totalGenerations,
      total_generated_flashcards: totalGeneratedFlashcards,
      total_accepted_flashcards: totalAcceptedFlashcards,
      acceptance_rate: Math.round(acceptanceRate * 100) / 100, // Zaokrąglenie do 2 miejsc po przecinku
      total_unedited_accepted: totalUneditedAccepted,
      total_edited_accepted: totalEditedAccepted,
      edit_rate: Math.round(editRate * 100) / 100,
      models_used: modelsUsed.sort((a, b) => b.count - a.count), // Sortowanie według popularności
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Błąd podczas pobierania statystyk generacji:", error);
    return new Response(
      JSON.stringify({
        error: "Błąd serwera podczas pobierania statystyk",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}; 