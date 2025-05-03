import React, { useState, useCallback } from "react";
import { Button } from "./ui/button";
import type { CreateGenerationRequestDTO, CreateGenerationResponseDTO, CreateFlashcardDTO } from "../types";
import TextInputArea from "./TextInputArea";
import FlashcardList from "./FlashcardList";
import BulkSaveButton from "./BulkSaveButton";
import ToastNotifications from "./ToastNotifications";
import type { ToastMessage, ToastType } from "./ToastNotifications";

// Model lokalny dla propozycji fiszek z dodatkowymi polami do UI
interface FlashcardProposalViewModel {
  id: string;
  front: string;
  back: string;
  source: "ai-full" | "ai-edited" | "manual";
  accepted: boolean;
  edited: boolean;
}

// Główny komponent widoku generowania fiszek
const FlashcardGenerationView = () => {
  // Stan dla tekstu źródłowego
  const [sourceText, setSourceText] = useState<string>("");
  const [textError, setTextError] = useState<string | undefined>();

  // Stan dla procesu generowania
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Stan dla propozycji fiszek
  const [proposals, setProposals] = useState<FlashcardProposalViewModel[]>([]);

  // Stan dla ID generacji
  const [generationId, setGenerationId] = useState<number | null>(null);

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

  // Obsługa generowania fiszek
  const handleGenerate = async () => {
    if (!validateSourceText()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ source_text: sourceText } as CreateGenerationRequestDTO),
      });

      if (!response.ok) {
        throw new Error(`Błąd API: ${response.status}`);
      }

      const data = (await response.json()) as CreateGenerationResponseDTO;

      // Zapisz ID generacji
      setGenerationId(data.generation_id);

      // Przekształcanie odpowiedzi API na model propozycji dla UI
      const viewModels: FlashcardProposalViewModel[] = data.flashcards_proposals.map((proposal) => ({
        ...proposal,
        source: "ai-full",
        accepted: false, // Domyślnie wszystkie są nieakceptowane
        edited: false,
      }));

      setProposals(viewModels);
      addToast(`Wygenerowano ${data.flashcards_proposals.length} propozycji fiszek`, "info");
    } catch (error) {
      console.error("Błąd podczas generowania fiszek:", error);
      setTextError("Wystąpił błąd podczas generowania fiszek. Spróbuj ponownie.");
      addToast("Nie udało się wygenerować fiszek. Spróbuj ponownie.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Aktualizacja propozycji fiszki
  const handleUpdateProposal = (id: string, updates: Partial<FlashcardProposalViewModel>) => {
    setProposals((prevProposals) =>
      prevProposals.map((proposal) => (proposal.id === id ? { ...proposal, ...updates } : proposal))
    );
  };

  // Usunięcie propozycji fiszki
  const handleRemoveProposal = (id: string) => {
    setProposals((prevProposals) => prevProposals.filter((proposal) => proposal.id !== id));
    addToast("Fiszka została odrzucona", "info", 3000);
  };

  // Przygotowanie fiszek do zapisu (wszystkie)
  const prepareAllFlashcards = (): CreateFlashcardDTO[] => {
    return proposals.map((proposal) => ({
      front: proposal.front,
      back: proposal.back,
      source: proposal.source,
      generation_id: generationId,
    }));
  };

  // Przygotowanie zaakceptowanych fiszek do zapisu
  const prepareAcceptedFlashcards = (): CreateFlashcardDTO[] => {
    return proposals
      .filter((proposal) => proposal.accepted)
      .map((proposal) => ({
        front: proposal.front,
        back: proposal.back,
        source: proposal.source,
        generation_id: generationId,
      }));
  };

  // Zapisywanie fiszek do bazy danych
  const saveFlashcards = async (flashcards: CreateFlashcardDTO[]) => {
    if (!flashcards.length) {
      addToast("Brak fiszek do zapisania.", "error");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ flashcards }),
      });

      if (!response.ok) {
        throw new Error(`Błąd podczas zapisywania fiszek: ${response.status}`);
      }

      const result = await response.json();
      addToast(`Zapisano ${result.flashcards.length} fiszek pomyślnie`, "success");

      // Opcjonalnie: resetowanie formularza lub przekierowanie
      // setSourceText("");
      // setProposals([]);
      // setGenerationId(null);
    } catch (error) {
      console.error("Błąd podczas zapisywania fiszek:", error);
      addToast("Nie udało się zapisać fiszek. Spróbuj ponownie.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Obsługa zapisu wszystkich fiszek
  const handleSaveAll = async () => {
    const flashcards = prepareAllFlashcards();
    await saveFlashcards(flashcards);
  };

  // Obsługa zapisu zaakceptowanych fiszek
  const handleSaveAccepted = async () => {
    const flashcards = prepareAcceptedFlashcards();
    await saveFlashcards(flashcards);
  };

  // Obliczenie liczby zaakceptowanych propozycji
  const acceptedCount = proposals.filter((p) => p.accepted).length;

  return (
    <div className="space-y-8">
      <TextInputArea value={sourceText} onChange={setSourceText} onBlur={validateSourceText} errorMessage={textError} />

      <div className="flex justify-end">
        <Button onClick={handleGenerate} disabled={isLoading || sourceText.length < 1000}>
          {isLoading ? "Generowanie..." : "Generuj fiszki"}
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-10">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      )}

      {/* Lista wygenerowanych propozycji fiszek */}
      {proposals.length > 0 && (
        <div className="border rounded-md p-4">
          <FlashcardList
            proposals={proposals}
            onUpdateProposal={handleUpdateProposal}
            onRemoveProposal={handleRemoveProposal}
          />

          <div className="mt-6">
            <BulkSaveButton
              onSaveAll={handleSaveAll}
              onSaveAccepted={handleSaveAccepted}
              totalCount={proposals.length}
              acceptedCount={acceptedCount}
              disabled={!generationId}
              isLoading={isSaving}
            />
          </div>
        </div>
      )}

      {/* System powiadomień */}
      <ToastNotifications toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
};

export default FlashcardGenerationView;
