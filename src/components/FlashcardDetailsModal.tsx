import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import type { FlashcardDTO } from "../types";

interface FlashcardDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  flashcardId: number | null;
}

interface FlashcardDetailsModalState {
  loading: boolean;
  flashcard: FlashcardDTO | null;
  error: string | null;
}

// Komponent do renderowania tekstu z łamaniem linii
const TextWithLineBreaks: React.FC<{ text: string; className?: string }> = ({ text, className = "" }) => {
  const lines = text.split("\n");

  return (
    <div className={className}>
      {lines.map((line, index) => (
        <React.Fragment key={index}>
          {line}
          {index < lines.length - 1 && <br />}
        </React.Fragment>
      ))}
    </div>
  );
};

export const FlashcardDetailsModal: React.FC<FlashcardDetailsModalProps> = ({ isOpen, onClose, flashcardId }) => {
  const [state, setState] = useState<FlashcardDetailsModalState>({
    loading: false,
    flashcard: null,
    error: null,
  });

  // Pobieranie danych fiszki
  useEffect(() => {
    if (!isOpen || !flashcardId) {
      setState({ loading: false, flashcard: null, error: null });
      return;
    }

    const fetchFlashcardDetails = async () => {
      setState({ loading: true, flashcard: null, error: null });

      try {
        const response = await fetch(`/api/flashcards/${flashcardId}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const flashcard: FlashcardDTO = await response.json();
        setState({ loading: false, flashcard, error: null });
      } catch (error) {
        setState({
          loading: false,
          flashcard: null,
          error: error instanceof Error ? error.message : "Nieznany błąd",
        });
      }
    };

    fetchFlashcardDetails();
  }, [isOpen, flashcardId]);

  // Funkcje pomocnicze
  const getSourceBadgeVariant = (source: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (source) {
      case "ai-full":
        return "default";
      case "ai-edited":
        return "secondary";
      case "manual":
        return "outline";
      default:
        return "default";
    }
  };

  const getSourceLabel = (source: string): string => {
    switch (source) {
      case "ai-full":
        return "AI (pełne)";
      case "ai-edited":
        return "AI (edytowane)";
      case "manual":
        return "Ręczne";
      default:
        return source;
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString("pl-PL");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] overflow-y-auto" style={{ maxWidth: "80vw", width: "80vw" }}>
        <DialogHeader>
          <DialogTitle>Szczegóły fiszki ID: {flashcardId}</DialogTitle>
        </DialogHeader>

        {state.loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Pobieranie szczegółów...</p>
          </div>
        )}

        {state.error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Błąd podczas pobierania</h3>
                  <div className="mt-2 text-sm text-red-700">{state.error}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {state.flashcard && (
          <div className="space-y-6">
            {/* Zawartość fiszki - główne */}
            <div className="space-y-4">
              <div>
                <div className="block text-sm font-medium text-gray-700 mb-2">Przód fiszki</div>
                <Card className="bg-blue-50">
                  <CardContent className="pt-4">
                    <TextWithLineBreaks text={state.flashcard.front} className="min-h-16" />
                  </CardContent>
                </Card>
              </div>

              <div>
                <div className="block text-sm font-medium text-gray-700 mb-2">Tył fiszki</div>
                <Card className="bg-green-50">
                  <CardContent className="pt-4">
                    <TextWithLineBreaks text={state.flashcard.back} className="min-h-24" />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Dane pomocnicze fiszki */}
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-4">Dane pomocnicze</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Lewa kolumna */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">ID:</span>
                    <span className="text-sm text-gray-900">{state.flashcard.id}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Źródło:</span>
                    <Badge variant={getSourceBadgeVariant(state.flashcard.source)}>
                      {getSourceLabel(state.flashcard.source)}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">ID Generacji:</span>
                    <span className="text-sm text-gray-900">{state.flashcard.generation_id || "Brak"}</span>
                  </div>
                </div>

                {/* Prawa kolumna */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Utworzono:</span>
                    <span className="text-sm text-gray-900">{formatDate(state.flashcard.created_at)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Zmodyfikowano:</span>
                    <span className="text-sm text-gray-900">{formatDate(state.flashcard.updated_at)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Status:</span>
                    <Badge
                      variant={state.flashcard.created_at === state.flashcard.updated_at ? "outline" : "secondary"}
                    >
                      {state.flashcard.created_at === state.flashcard.updated_at ? "Niemodyfikowana" : "Modyfikowana"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Akcje */}
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={onClose}>Zamknij</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
