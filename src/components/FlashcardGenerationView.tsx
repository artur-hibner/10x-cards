import React, { useState, useCallback } from "react";
import { Button } from "./ui/button";
import type { CreateGenerationRequestDTO, CreateGenerationResponseDTO } from "../types";
import TextInputArea from "./TextInputArea";
import ToastNotifications from "./ToastNotifications";
import type { ToastMessage, ToastType } from "./ToastNotifications";
import { AI_MODELS, getDefaultModel, type AIModel } from "../config/ai-models";

// Główny komponent widoku generowania fiszek
const FlashcardGenerationView = () => {
  // Stan dla tekstu źródłowego
  const [sourceText, setSourceText] = useState<string>("");
  const [textError, setTextError] = useState<string | undefined>();

  // Stan dla wybranego modelu AI
  const [selectedModel, setSelectedModel] = useState<AIModel>(getDefaultModel());

  // Stan dla procesu generowania
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Stan dla powiadomień
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Generowanie unikalnego ID
  const generateId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  // Dodawanie powiadomienia
  const addToast = useCallback((message: string, type: ToastType, duration = 5000) => {
    const id = generateId();
    setToasts((prevToasts) => [...prevToasts, { id, message, type, duration }]);
  }, []);

  // Usuwanie powiadomienia
  const removeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  // Walidacja tekstu źródłowego
  const validateSourceText = () => {
    if (sourceText.length < 1000) {
      setTextError("Tekst musi zawierać przynajmniej 1000 znaków");
      return false;
    }
    if (sourceText.length > 10000) {
      setTextError("Tekst nie może przekraczać 10000 znaków");
      return false;
    }
    setTextError(undefined);
    return true;
  };

  // Obsługa generowania fiszek - nowy workflow
  const handleGenerate = async () => {
    if (!validateSourceText()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source_text: sourceText,
          model_id: selectedModel.id,
        } as CreateGenerationRequestDTO),
      });

      if (!response.ok) {
        throw new Error(`Błąd API: ${response.status}`);
      }

      const data = (await response.json()) as CreateGenerationResponseDTO;

      addToast(`Wygenerowano ${data.flashcards_proposals.length} propozycji fiszek`, "success");

      // Przekierowanie do strony przeglądu generacji
      setTimeout(() => {
        window.location.href = `/generations/${data.generation_id}`;
      }, 1500);
    } catch (error) {
      console.error("Błąd podczas generowania fiszek:", error);
      setTextError("Wystąpił błąd podczas generowania fiszek. Spróbuj ponownie.");
      addToast("Nie udało się wygenerować fiszek. Spróbuj ponownie.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <p className="text-gray-600">
          Wprowadź tekst, z którego chcesz wygenerować fiszki. Po generacji zostaniesz przekierowany do strony
          przeglądu, gdzie będziesz mógł wybrać i zaakceptować konkretne propozycje.
        </p>
      </div>

      <TextInputArea value={sourceText} onChange={setSourceText} onBlur={validateSourceText} errorMessage={textError} />

      {/* Wybór modelu AI i przycisk generowania */}
      <div className="max-w-2xl mx-auto">
        <label htmlFor="ai-model-select" className="block text-sm font-medium text-gray-700 mb-2">
          Wybierz model AI do generowania fiszek:
        </label>

        {/* Select i przycisk w jednej linii */}
        <div className="flex gap-4 items-end">
          <div className="flex-1 max-w-sm">
            <select
              id="ai-model-select"
              value={selectedModel.id}
              onChange={(e) => {
                const model = AI_MODELS.find((m) => m.id === e.target.value);
                if (model) setSelectedModel(model);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            >
              {AI_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isLoading || sourceText.length < 1000}
            size="lg"
            className="flex-1"
          >
            {isLoading ? "Generowanie..." : "Generuj fiszki"}
          </Button>
        </div>

        {/* Informacje o wybranym modelu pod spodem */}
        <div className="mt-3 p-3 bg-gray-50 rounded-md">
          <div className="text-sm text-gray-700">
            <p>
              <strong>Model:</strong> {selectedModel.name}
            </p>
            <p>
              <strong>Nazwa w openrouter:</strong> {selectedModel.modelPath}
            </p>
            <p>
              <strong>Kontekst:</strong> {selectedModel.contextTokens}
            </p>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center py-10">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mb-4" />
          <p className="text-gray-600">Generowanie propozycji fiszek przy użyciu AI...</p>
        </div>
      )}

      {/* System powiadomień */}
      <ToastNotifications toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
};

export default FlashcardGenerationView;
