import type { CreateGenerationResponseDTO, FlashcardProposalDTO } from "../types";
import { supabaseClient, DEFAULT_USER_ID } from "../db/supabase.client";
import type { Json } from "../db/database.types";
import crypto from "crypto";
import { OpenRouterService } from "../lib/openrouter.service";
import type { FlashcardsResponseSchema } from "../lib/openrouter.types";
import { getModelById, getDefaultModel, type AIModel } from "../config/ai-models";

// Interfejs odpowiedzi z modelu
interface FlashcardResponse {
  front: string;
  back: string;
}

export class GenerationService {
  private openRouterApiKey: string;
  private openRouterService: OpenRouterService;
  private readonly MODEL_NAME = "deepseek/deepseek-chat-v3-0324:free";

  constructor() {
    // Pobranie klucza API OpenRouter
    this.openRouterApiKey = import.meta.env.OPENROUTER_API_KEY as string;
    if (!this.openRouterApiKey) {
      throw new Error("Brak klucza API OpenRouter");
    }

    // Inicjalizacja serwisu OpenRouter z dokładną definicją schematu fiszek
    this.openRouterService = new OpenRouterService(
      this.openRouterApiKey,
      this.MODEL_NAME,
      {
        temperature: 0.7,
        max_tokens: 2000,
      },
      "Jesteś ekspertem w tworzeniu materiałów edukacyjnych. Twoim zadaniem jest tworzenie wysokiej jakości fiszek w języku polskim na podstawie podanego tekstu.",
      "", // Treść użytkownika będzie dodana w momencie wywołania
      {
        type: "json_schema",
        json_schema: {
          name: "FlashcardsResponse",
          strict: true,
          schema: {
            type: "object",
            properties: {
              flashcards: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    front: { type: "string" },
                    back: { type: "string" },
                  },
                  required: ["front", "back"],
                },
              },
            },
            required: ["flashcards"],
          },
        } as FlashcardsResponseSchema,
      }
    );
  }

  public async createGeneration(sourceText: string, modelId?: string): Promise<CreateGenerationResponseDTO> {
    // Wybranie modelu AI na podstawie modelId lub użycie domyślnego
    const selectedModel: AIModel = modelId ? getModelById(modelId) || getDefaultModel() : getDefaultModel();

    try {
      // Obliczenie hash'a tekstu źródłowego (MD5)
      const sourceTextHash = this.calculateHash(sourceText);

      // Czas rozpoczęcia generacji
      const startTime = Date.now();

      // Generowanie propozycji fiszek z wybranym modelem
      const proposals = await this.generateFlashcards(sourceText, selectedModel);

      // Czas zakończenia generacji
      const generationDuration = Date.now() - startTime;

      // Inicjalizacja rekordu w bazie danych
      const { data: generation, error: dbError } = await supabaseClient
        .from("generations")
        .insert({
          user_id: DEFAULT_USER_ID,
          source_text_hash: sourceTextHash,
          source_text_length: sourceText.length,
          status: "completed",
          model: selectedModel.modelPath,
          source_text: sourceText,
          generated_count: proposals.length,
          generation_duration: generationDuration,
          accepted_edited_count: 0,
          accepted_unedited_count: 0,
          flashcards_proposals: proposals as unknown as Json,
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
      await this.logGenerationError(error as Error, undefined, selectedModel.modelPath);
      throw error;
    }
  }

  private calculateHash(text: string): string {
    return crypto.createHash("md5").update(text).digest("hex");
  }

  private async generateFlashcards(sourceText: string, selectedModel: AIModel): Promise<FlashcardProposalDTO[]> {
    try {
      // Utworzenie dedykowanego serwisu OpenRouter dla wybranego modelu
      const modelService = new OpenRouterService(
        this.openRouterApiKey,
        selectedModel.modelPath,
        {
          temperature: 0.3,
          max_tokens: 2000,
        },
        "Jesteś ekspertem w tworzeniu materiałów edukacyjnych. Twoim zadaniem jest tworzenie wysokiej jakości fiszek w języku polskim na podstawie podanego tekstu.",
        "",
        {
          type: "json_schema",
          json_schema: {
            name: "FlashcardsResponse",
            strict: true,
            schema: {
              type: "object",
              properties: {
                flashcards: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      front: { type: "string" },
                      back: { type: "string" },
                    },
                    required: ["front", "back"],
                  },
                },
              },
              required: ["flashcards"],
            },
          },
        }
      );

      // Korzystamy z systemu walidacji JSON w OpenRouter zamiast opisywać format w promptcie
      const prompt = `
Zadanie: Wygeneruj fiszki edukacyjne w języku polskim na podstawie podanego tekstu.

Tekst źródłowy:
${sourceText}

Wymagania:
1. Stwórz od 5 do 10 fiszek edukacyjnych w języku POLSKIM.
2. Każda fiszka musi zawierać pytanie (front) i odpowiedź (back).
3. Fiszki muszą dotyczyć NAJWAŻNIEJSZYCH informacji z tekstu.
4. Wszystkie fiszki MUSZĄ być w języku polskim.
5. Unikaj fiszek zawierających meta-instrukcje, nazwy języków programowania i terminy techniczne.

WAŻNE: Odpowiedź MUSI być w formacie JSON zgodnym z poniższym schematem:
{
  "flashcards": [
    {
      "front": "Pytanie 1",
      "back": "Odpowiedź 1"
    },
    {
      "front": "Pytanie 2",
      "back": "Odpowiedź 2"
    }
  ]
}
`;

      console.log("Wysyłanie zapytania do OpenRouter API");

      // Wywołanie OpenRouter API - schemat JSON jest już przekazany w konstruktorze
      const response = await modelService.sendChatRequest(prompt);

      // Dodatkowe logowanie odpowiedzi dla celów diagnostycznych
      console.log("Otrzymana odpowiedź z OpenRouter API:", JSON.stringify(response, null, 2));

      // Najpierw sprawdzamy, czy jest standardowy format z polem flashcards
      if (response && response.flashcards && Array.isArray(response.flashcards)) {
        // Standardowe mapowanie fiszek na format aplikacji
        return response.flashcards.map((card: FlashcardResponse) => ({
          id: crypto.randomUUID(),
          front: typeof card.front === "string" ? card.front.replace(/^["']|["']$/g, "") : card.front,
          back: typeof card.back === "string" ? card.back.replace(/^["']|["']$/g, "") : card.back,
        }));
      }
      // Następnie sprawdzamy, czy mamy pole "flashcard" (liczba pojedyncza) zamiast "flashcards"
      else if (response && response.flashcard && Array.isArray(response.flashcard)) {
        console.log("Znaleziono pole 'flashcard' zamiast 'flashcards'");
        return response.flashcard.map((card: FlashcardResponse) => ({
          id: crypto.randomUUID(),
          front: typeof card.front === "string" ? card.front.replace(/^["']|["']$/g, "") : card.front,
          back: typeof card.back === "string" ? card.back.replace(/^["']|["']$/g, "") : card.back,
        }));
      }
      // Jeśli odpowiedź ma format tekstowy, spróbuj wyekstrahować JSON z kodu markdown
      else if (response && response.content && typeof response.content === "string") {
        console.log("Próba ekstrakcji fiszek z tekstu odpowiedzi...");

        // Próba ekstrakcji bloku kodu JSON z odpowiedzi Markdown
        const jsonBlocks = this.extractJsonFromMarkdown(response.content);
        if (jsonBlocks.length > 0) {
          for (const jsonStr of jsonBlocks) {
            try {
              const parsedJson = JSON.parse(jsonStr);

              // Sprawdź, czy parsedJson ma pole "flashcards" lub "flashcard"
              if (parsedJson.flashcards && Array.isArray(parsedJson.flashcards)) {
                console.log("Znaleziono JSON z polem 'flashcards' w bloku kodu");
                return parsedJson.flashcards.map((card: FlashcardResponse) => ({
                  id: crypto.randomUUID(),
                  front: typeof card.front === "string" ? card.front.replace(/^["']|["']$/g, "") : card.front,
                  back: typeof card.back === "string" ? card.back.replace(/^["']|["']$/g, "") : card.back,
                }));
              } else if (parsedJson.flashcard && Array.isArray(parsedJson.flashcard)) {
                console.log("Znaleziono JSON z polem 'flashcard' w bloku kodu");
                return parsedJson.flashcard.map((card: FlashcardResponse) => ({
                  id: crypto.randomUUID(),
                  front: typeof card.front === "string" ? card.front.replace(/^["']|["']$/g, "") : card.front,
                  back: typeof card.back === "string" ? card.back.replace(/^["']|["']$/g, "") : card.back,
                }));
              }
            } catch (err) {
              console.error("Błąd podczas parsowania JSON z bloku kodu:", err);
            }
          }
        }

        // Jeśli nie znaleziono JSON, spróbuj wyekstrahować dane z tekstu
        const extractedFlashcards = this.extractFlashcardsFromText(response.content);
        if (extractedFlashcards.length > 0) {
          console.log(`Udało się wyekstrahować ${extractedFlashcards.length} fiszek z tekstu`);
          return extractedFlashcards;
        }
      }

      // Jeśli odpowiedź jest w innym formacie, rzuć błąd z dokładniejszymi informacjami
      console.error("Nieoczekiwany format odpowiedzi z OpenRouter API:", JSON.stringify(response, null, 2));
      throw new Error(
        `Nieprawidłowy format odpowiedzi z API. Oczekiwano obiektu z polem 'flashcards' zawierającym tablicę, otrzymano: ${JSON.stringify(response).substring(0, 200)}...`
      );
    } catch (error) {
      console.error("Błąd podczas generowania fiszek:", error);

      // Dodanie szczegółów błędu jeśli to możliwe
      const errorMessage =
        error instanceof Error
          ? `Nie udało się wygenerować fiszek: ${error.message}`
          : "Nie udało się wygenerować fiszek: Nieznany błąd";

      throw new Error(errorMessage);
    }
  }

  /**
   * Ekstrahuje bloki JSON z odpowiedzi Markdown
   */
  private extractJsonFromMarkdown(text: string): string[] {
    const jsonBlocks: string[] = [];

    // Wzorzec do wykrywania bloków kodu JSON w markdown: ```json ... ```
    const jsonCodeBlockRegex = /```(?:json)?\s*([\s\S]*?)```/gi;

    let match;
    while ((match = jsonCodeBlockRegex.exec(text)) !== null) {
      if (match[1] && match[1].trim()) {
        jsonBlocks.push(match[1].trim());
      }
    }

    return jsonBlocks;
  }

  /**
   * Ekstrahuje fiszki z tekstu odpowiedzi, jeśli model nie zwrócił poprawnego JSON
   */
  private extractFlashcardsFromText(text: string): FlashcardProposalDTO[] {
    const flashcards: FlashcardProposalDTO[] = [];

    // Wzorce do wyszukiwania par front/back w tekście
    const patterns = [
      // Wzorzec dla formatu z myślnikami
      /Flashcard\s+\d+:\s*\n+\s*-\s*Pytanie:\s*["']?(.*?)["']?\s*\n+\s*-\s*Odpowiedź:\s*["']?(.*?)["']?(?=\n|$|\nFlashcard|\n\n)/gis,
      // Inne wzorce
      /Front:\s*["']?(.*?)["']?\s*,?\s*Back:\s*["']?(.*?)["']?(?=\n|$|\nFlashcard|\n\n)/gi,
      /Front:\s*["']?(.*?)["']?\s*\n\s*Back:\s*["']?(.*?)["']?(?=\n|$|\nFlashcard|\n\n)/gi,
      /["']?front["']?:\s*["']?(.*?)["']?\s*,\s*["']?back["']?:\s*["']?(.*?)["']?/gi,
      /Pytanie:\s*["']?(.*?)["']?\s*,?\s*Odpowiedź:\s*["']?(.*?)["']?(?=\n|$|\n\s*\n)/gi,
      /Pytanie:\s*["']?(.*?)["']?\s*\n+\s*Odpowiedź:\s*["']?(.*?)["']?(?=\n|$|\n\s*\n)/gi,
      /\d+\.\s*["']?(.*?)["']?\s*-\s*["']?(.*?)["']?(?=\n|$|\n\d+\.)/gi,
    ];

    // Próbujemy dopasować każdy wzorzec
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        if (match[1] && match[2]) {
          flashcards.push({
            id: crypto.randomUUID(),
            front: match[1].trim(),
            back: match[2].trim(),
          });
        }
      }
    }

    // Jako ostatnią deskę ratunku, szukamy po prostu linii z pytaniami (zawierających znak zapytania)
    // i następujących po nich odpowiedzi
    if (flashcards.length === 0) {
      const questionLines = text.match(/[^.!?]*\?[^.!?]*(?:\.|!|\?|$)/g);
      if (questionLines && questionLines.length > 0) {
        for (const question of questionLines) {
          const trimmedQuestion = question.trim();
          // Szukamy pierwszej linii po pytaniu, która nie jest pytaniem
          const restOfText = text.split(trimmedQuestion)[1];
          if (restOfText) {
            const answerMatch = restOfText.match(/^\s*([^?]+?)(?=\n\s*\n|\n\s*[A-Z]|$)/);
            if (answerMatch && answerMatch[1]) {
              flashcards.push({
                id: crypto.randomUUID(),
                front: trimmedQuestion.replace(/^["'\s]+|["'\s]+$/g, ""),
                back: answerMatch[1].replace(/^["'\s]+|["'\s]+$/g, ""),
              });
            }
          }
        }
      }
    }

    return flashcards;
  }

  private mapFlashcards(flashcards: FlashcardResponse[]): FlashcardProposalDTO[] {
    return flashcards.map((card) => ({
      id: crypto.randomUUID(),
      front: card.front,
      back: card.back,
    }));
  }

  private async logGenerationError(error: Error, generationId?: number, modelPath?: string): Promise<void> {
    try {
      await supabaseClient.from("generation_error_logs").insert({
        generation_id: generationId ?? 0,
        error_code: error.name || "UnknownError",
        error_message: error.message,
        model: modelPath || this.MODEL_NAME,
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
