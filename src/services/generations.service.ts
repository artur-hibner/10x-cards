import type { CreateGenerationResponseDTO, FlashcardProposalDTO } from "../types";
import { supabaseClient, DEFAULT_USER_ID } from "../db/supabase.client";
import crypto from "crypto";

export class GenerationService {
  private openRouterApiKey: string;

  constructor() {
    // Pobranie klucza API OpenRouter
    this.openRouterApiKey = import.meta.env.OPENROUTER_API_KEY as string;
    if (!this.openRouterApiKey) {
      throw new Error("Brak klucza API OpenRouter");
    }
  }

  public async createGeneration(sourceText: string): Promise<CreateGenerationResponseDTO> {
    try {
      // Obliczenie hash'a tekstu źródłowego (MD5)
      const sourceTextHash = this.calculateHash(sourceText);

      // Generowanie propozycji fiszek
      const proposals = await this.generateFlashcards();

      // Inicjalizacja rekordu w bazie danych
      const { data: generation, error: dbError } = await supabaseClient
        .from("generations")
        .insert({
          user_id: DEFAULT_USER_ID,
          source_text_hash: sourceTextHash,
          source_text_length: sourceText.length,
          status: "completed",
          model: "mock-model",
          source_text: sourceText,
          generated_count: proposals.length,
          generation_duration: 0,
          accepted_edited_count: 0,
          accepted_unedited_count: 0,
          flashcards_proposals: proposals,
        })
        .select()
        .single();

      if (dbError) {
        throw new Error(`Błąd podczas tworzenia rekordu generacji: ${dbError.message}`);
      }

      // Przygotowanie odpowiedzi
      return {
        generation_id: generation.id,
        flashcards_proposals: proposals,
        generated_count: proposals.length,
      };
    } catch (error) {
      // Logowanie błędu
      await this.logGenerationError(error as Error);
      throw error;
    }
  }

  private calculateHash(text: string): string {
    return crypto.createHash("md5").update(text).digest("hex");
  }

  private async generateFlashcards(): Promise<FlashcardProposalDTO[]> {
    // Mock generacji fiszek - tutaj później będzie integracja z OpenRouter
    const mockProposals: FlashcardProposalDTO[] = [
      {
        id: crypto.randomUUID(),
        front: "Co to jest React?",
        back: "React to biblioteka JavaScript do budowania interfejsów użytkownika",
      },
      {
        id: crypto.randomUUID(),
        front: "Jakie są główne zalety React?",
        back: "Wirtualny DOM, komponenty wielokrotnego użytku, jednokierunkowy przepływ danych",
      },
      {
        id: crypto.randomUUID(),
        front: "Co to jest JSX?",
        back: "JSX to rozszerzenie składni JavaScript, które pozwala na pisanie kodu HTML w React",
      },
      {
        id: crypto.randomUUID(),
        front: "Co to są hooki w React?",
        back: "Hooki to funkcje pozwalające na używanie stanu i innych funkcjonalności React w komponentach funkcyjnych",
      },
    ];

    return mockProposals;
  }

  private async logGenerationError(error: Error, generationId?: number): Promise<void> {
    try {
      await supabaseClient.from("generation_error_logs").insert({
        generation_id: generationId ?? 0,
        error_code: error.name || "UnknownError",
        error_message: error.message,
        model: "unknown",
        source_text_hash: "",
        source_text_length: 0,
        user_id: DEFAULT_USER_ID,
        stack_trace: error.stack,
      });
    } catch (logError) {
      console.error("Błąd podczas logowania błędu generacji:", logError);
    }
  }
}
