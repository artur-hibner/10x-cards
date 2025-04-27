import type { CreateFlashcardDTO, CreateFlashcardsResponseDTO, FlashcardSource } from "../types";
import { supabaseClient, DEFAULT_USER_ID } from "../db/supabase.client";

export class FlashcardsService {
  /**
   * Tworzy nowe fiszki w bazie danych
   * @param flashcards Lista fiszek do utworzenia
   * @returns Utworzone fiszki z przypisanymi ID
   */
  public async createFlashcards(flashcards: CreateFlashcardDTO[]): Promise<CreateFlashcardsResponseDTO> {
    try {
      // Przygotowanie danych do zapisania
      const flashcardsToInsert = flashcards.map((flashcard) => ({
        ...flashcard,
        user_id: DEFAULT_USER_ID,
      }));

      // Zapis do bazy danych
      const { data: insertedFlashcards, error } = await supabaseClient
        .from("flashcards")
        .insert(flashcardsToInsert)
        .select();

      if (error) {
        throw new Error(`Błąd podczas zapisywania fiszek: ${error.message}`);
      }

      if (!insertedFlashcards) {
        throw new Error("Nie udało się utworzyć fiszek");
      }

      // Mapowanie odpowiedzi do oczekiwanej struktury
      return {
        flashcards: insertedFlashcards.map((flashcard) => ({
          id: flashcard.id,
          front: flashcard.front,
          back: flashcard.back,
          source: flashcard.source as FlashcardSource,
          generation_id: flashcard.generation_id,
          created_at: flashcard.created_at,
          updated_at: flashcard.updated_at,
        })),
      };
    } catch (error) {
      console.error("Błąd w serwisie fiszek:", error);
      throw error;
    }
  }
}
