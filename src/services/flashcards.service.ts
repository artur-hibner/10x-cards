import type {
  CreateFlashcardDTO,
  CreateFlashcardsResponseDTO,
  FlashcardSource,
  FlashcardListResponseDTO,
  FlashcardDTO,
  UpdateFlashcardDTO,
} from "../types";
import { supabaseClient, DEFAULT_USER_ID } from "../db/supabase.client";

export interface GetFlashcardsParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  source?: FlashcardSource;
  generation_id?: number | null;
}

export class FlashcardsService {
  /**
   * Tworzy nowe fiszki w bazie danych
   * @param flashcards Lista fiszek do utworzenia
   * @returns Utworzone fiszki z przypisanymi ID
   */
  public async createFlashcards(
    flashcards: CreateFlashcardDTO[],
    userId?: string
  ): Promise<CreateFlashcardsResponseDTO> {
    try {
      // Przygotowanie danych do zapisania
      const flashcardsToInsert = flashcards.map((flashcard) => ({
        ...flashcard,
        user_id: userId || DEFAULT_USER_ID,
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

  /**
   * Pobiera listę fiszek użytkownika z paginacją i filtrami
   * @param params Parametry filtrowania i paginacji
   * @returns Lista fiszek z informacjami o paginacji
   */
  public async getFlashcards(params: GetFlashcardsParams = {}, userId?: string): Promise<FlashcardListResponseDTO> {
    try {
      const { page = 1, limit = 10, sort = "created_at", order = "desc", source, generation_id } = params;

      // Walidacja parametrów
      if (page < 1) throw new Error("Numer strony musi być większy od 0");
      if (limit < 1 || limit > 100) throw new Error("Limit musi być między 1 a 100");
      if (!["created_at", "updated_at", "front", "back"].includes(sort)) {
        throw new Error("Nieprawidłowy parametr sortowania");
      }

      const offset = (page - 1) * limit;

      // Budowanie zapytania
      let query = supabaseClient
        .from("flashcards")
        .select("id, front, back, source, generation_id, created_at, updated_at", { count: "exact" })
        .eq("user_id", userId || DEFAULT_USER_ID);

      // Dodanie filtrów
      if (source) {
        query = query.eq("source", source);
      }

      if (generation_id !== undefined) {
        if (generation_id === null) {
          query = query.is("generation_id", null);
        } else {
          query = query.eq("generation_id", generation_id);
        }
      }

      // Sortowanie i paginacja
      query = query.order(sort, { ascending: order === "asc" }).range(offset, offset + limit - 1);

      const { data: flashcards, error, count } = await query;

      if (error) {
        throw new Error(`Błąd podczas pobierania fiszek: ${error.message}`);
      }

      if (!flashcards) {
        throw new Error("Nie udało się pobrać fiszek");
      }

      // Mapowanie wyników
      const mappedFlashcards: FlashcardDTO[] = flashcards.map((flashcard) => ({
        id: flashcard.id,
        front: flashcard.front,
        back: flashcard.back,
        source: flashcard.source as FlashcardSource,
        generation_id: flashcard.generation_id,
        created_at: flashcard.created_at,
        updated_at: flashcard.updated_at,
      }));

      return {
        flashcards: mappedFlashcards,
        pagination: {
          page,
          limit,
          total: count || 0,
        },
      };
    } catch (error) {
      console.error("Błąd podczas pobierania fiszek:", error);
      throw error;
    }
  }

  /**
   * Pobiera pojedynczą fiszkę po ID
   * @param id ID fiszki
   * @returns Fiszka lub null jeśli nie została znaleziona
   */
  public async getFlashcardById(id: number, userId?: string): Promise<FlashcardDTO | null> {
    try {
      // Walidacja ID
      if (!Number.isInteger(id) || id <= 0) {
        throw new Error("ID fiszki musi być liczbą całkowitą większą od 0");
      }

      // Pobieranie fiszki z bazy danych
      const { data: flashcard, error } = await supabaseClient
        .from("flashcards")
        .select("id, front, back, source, generation_id, created_at, updated_at")
        .eq("id", id)
        .eq("user_id", userId || DEFAULT_USER_ID)
        .single();

      if (error) {
        // Jeśli fiszka nie została znaleziona
        if (error.code === "PGRST116") {
          return null;
        }
        throw new Error(`Błąd podczas pobierania fiszki: ${error.message}`);
      }

      if (!flashcard) {
        return null;
      }

      // Mapowanie na DTO
      return {
        id: flashcard.id,
        front: flashcard.front,
        back: flashcard.back,
        source: flashcard.source as FlashcardSource,
        generation_id: flashcard.generation_id,
        created_at: flashcard.created_at,
        updated_at: flashcard.updated_at,
      };
    } catch (error) {
      console.error("Błąd podczas pobierania fiszki po ID:", error);
      throw error;
    }
  }

  /**
   * Aktualizuje fiszkę
   * @param id ID fiszki do aktualizacji
   * @param updateData Dane do aktualizacji
   * @returns Zaktualizowana fiszka
   */
  public async updateFlashcard(id: number, updateData: UpdateFlashcardDTO, userId?: string): Promise<FlashcardDTO> {
    try {
      // Walidacja ID
      if (!Number.isInteger(id) || id <= 0) {
        throw new Error("ID fiszki musi być liczbą całkowitą większą od 0");
      }

      // Walidacja danych
      if (!updateData.front?.trim() && !updateData.back?.trim()) {
        throw new Error("Przynajmniej jedno pole (front lub back) musi być wypełnione");
      }

      // Przygotowanie danych do aktualizacji
      const dataToUpdate: Partial<typeof updateData> = {};
      if (updateData.front !== undefined) dataToUpdate.front = updateData.front.trim();
      if (updateData.back !== undefined) dataToUpdate.back = updateData.back.trim();

      // Aktualizacja w bazie danych
      const { data: updatedFlashcard, error } = await supabaseClient
        .from("flashcards")
        .update(dataToUpdate)
        .eq("id", id)
        .eq("user_id", userId || DEFAULT_USER_ID)
        .select("id, front, back, source, generation_id, created_at, updated_at")
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          throw new Error("Fiszka nie została znaleziona lub nie masz uprawnień do jej edycji");
        }
        throw new Error(`Błąd podczas aktualizacji fiszki: ${error.message}`);
      }

      if (!updatedFlashcard) {
        throw new Error("Nie udało się zaktualizować fiszki");
      }

      return {
        id: updatedFlashcard.id,
        front: updatedFlashcard.front,
        back: updatedFlashcard.back,
        source: updatedFlashcard.source as FlashcardSource,
        generation_id: updatedFlashcard.generation_id,
        created_at: updatedFlashcard.created_at,
        updated_at: updatedFlashcard.updated_at,
      };
    } catch (error) {
      console.error("Błąd podczas aktualizacji fiszki:", error);
      throw error;
    }
  }

  /**
   * Usuwa fiszkę
   * @param id ID fiszki do usunięcia
   * @returns true jeśli usunięto pomyślnie
   */
  public async deleteFlashcard(id: number, userId?: string): Promise<boolean> {
    try {
      // Walidacja ID
      if (!Number.isInteger(id) || id <= 0) {
        throw new Error("ID fiszki musi być liczbą całkowitą większą od 0");
      }

      // Usunięcie z bazy danych
      const { error } = await supabaseClient
        .from("flashcards")
        .delete()
        .eq("id", id)
        .eq("user_id", userId || DEFAULT_USER_ID);

      if (error) {
        throw new Error(`Błąd podczas usuwania fiszki: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error("Błąd podczas usuwania fiszki:", error);
      throw error;
    }
  }
}
