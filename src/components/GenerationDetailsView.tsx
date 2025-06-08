import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import type { GenerationDTO, AcceptFlashcardsRequestDTO, AcceptFlashcardsResponseDTO, EditStatus } from "../types";
import ToastNotifications from "./ToastNotifications";
import type { ToastMessage, ToastType } from "./ToastNotifications";

interface GenerationDetailsViewProps {
  generationId: number;
}

// Model lokalny dla propozycji fiszek z dodatkowymi polami do UI
interface FlashcardProposalViewModel {
  id: string;
  front: string;
  back: string;
  originalFront: string;
  originalBack: string;
  selected: boolean;
  edited: boolean;
}

const GenerationDetailsView: React.FC<GenerationDetailsViewProps> = ({ generationId }) => {
  // Stan dla generacji
  const [generation, setGeneration] = useState<GenerationDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Stan dla propozycji
  const [proposals, setProposals] = useState<FlashcardProposalViewModel[]>([]);
  const [accepting, setAccepting] = useState<boolean>(false);

  // Stan dla powiadomień
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Funkcje dla powiadomień
  const generateId = () => Math.random().toString(36).substring(2, 15);

  const addToast = (message: string, type: ToastType, duration = 5000) => {
    const id = generateId();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Pobieranie szczegółów generacji
  const fetchGenerationDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/generations/${generationId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Generacja nie została znaleziona");
        }
        throw new Error(`Błąd pobierania generacji: ${response.status}`);
      }

      const data: GenerationDTO = await response.json();
      setGeneration(data);

      // Przekształcanie propozycji na model widoku
      const proposalViewModels: FlashcardProposalViewModel[] = data.flashcards_proposals.map(proposal => ({
        id: proposal.id,
        front: proposal.front,
        back: proposal.back,
        originalFront: proposal.front,
        originalBack: proposal.back,
        selected: false,
        edited: false,
      }));

      setProposals(proposalViewModels);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Nieznany błąd";
      setError(errorMessage);
      addToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  // Efekt dla pierwszego załadowania
  useEffect(() => {
    fetchGenerationDetails();
  }, [generationId]);

  // Obsługa zmiany zaznaczenia propozycji
  const handleProposalSelect = (proposalId: string, selected: boolean) => {
    setProposals(prev => 
      prev.map(proposal => 
        proposal.id === proposalId ? { ...proposal, selected } : proposal
      )
    );
  };

  // Obsługa zaznaczenia wszystkich
  const handleSelectAll = (selected: boolean) => {
    setProposals(prev => prev.map(proposal => ({ ...proposal, selected })));
  };

  // Obsługa edycji propozycji
  const handleProposalEdit = (proposalId: string, field: 'front' | 'back', value: string) => {
    setProposals(prev => 
      prev.map(proposal => {
        if (proposal.id === proposalId) {
          const updated = { ...proposal, [field]: value };
          // Sprawdź czy została edytowana
          updated.edited = updated.front !== updated.originalFront || updated.back !== updated.originalBack;
          return updated;
        }
        return proposal;
      })
    );
  };

  // Obsługa akceptacji wybranych propozycji
  const handleAcceptSelected = async () => {
    const selectedProposals = proposals.filter(p => p.selected);
    
    if (selectedProposals.length === 0) {
      addToast("Wybierz co najmniej jedną propozycję do akceptacji", "error");
      return;
    }

    setAccepting(true);

    try {
      const acceptFlashcardsRequest: AcceptFlashcardsRequestDTO = {
        accepted_flashcards: selectedProposals.map(proposal => ({
          proposal_id: proposal.id,
          front: proposal.front,
          back: proposal.back,
          edit_status: proposal.edited ? "edited" as EditStatus : "unedited" as EditStatus,
        }))
      };

      const response = await fetch(`/api/generations/${generationId}/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(acceptFlashcardsRequest),
      });

      if (!response.ok) {
        throw new Error(`Błąd podczas akceptacji fiszek: ${response.status}`);
      }

      const result: AcceptFlashcardsResponseDTO = await response.json();
      
      addToast(
        `Pomyślnie zaakceptowano ${result.accepted_count} fiszek. ${result.accepted_unedited_count} bez edycji, ${result.accepted_edited_count} z edycją.`,
        "success"
      );

      // Przekierowanie do listy fiszek po 2 sekundach
      setTimeout(() => {
        window.location.href = "/flashcards";
      }, 2000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Nieznany błąd";
      addToast(`Nie udało się zaakceptować fiszek: ${errorMessage}`, "error");
    } finally {
      setAccepting(false);
    }
  };

  // Formatowanie daty
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Formatowanie czasu trwania
  const formatDuration = (milliseconds: number) => {
    const seconds = Math.round(milliseconds / 1000);
    if (seconds < 60) return `${seconds}s`;
    return `${Math.round(seconds / 60)}min ${seconds % 60}s`;
  };

  // Stan ładowania
  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Stan błędu
  if (error || !generation) {
    return (
      <div className="text-center py-10">
        <p className="text-red-600 mb-4">{error || "Nie udało się załadować generacji"}</p>
        <div className="flex gap-2 justify-center">
          <Button onClick={fetchGenerationDetails} variant="outline">
            Spróbuj ponownie
          </Button>
          <Button onClick={() => window.location.href = "/generations"} variant="secondary">
            Powrót do listy
          </Button>
        </div>
      </div>
    );
  }

  const selectedCount = proposals.filter(p => p.selected).length;
  const editedCount = proposals.filter(p => p.selected && p.edited).length;
  const uneditedCount = selectedCount - editedCount;

  return (
    <div className="space-y-6">
      {/* Nagłówek */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Generacja #{generation.generation_id}</h1>
          <p className="text-gray-600">
            Wygenerowano {generation.generated_count} propozycji fiszek w {formatDuration(generation.generation_duration)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => window.location.href = "/generations"}
          >
            ← Powrót do listy
          </Button>
        </div>
      </div>

      {/* Informacje o generacji */}
      <Card>
        <CardHeader>
          <CardTitle>Szczegóły generacji</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <span className="font-medium text-gray-700">Status:</span>
            <div className="mt-1">
              <Badge 
                variant={generation.status === "completed" ? "default" : 
                         generation.status === "processing" ? "secondary" : "destructive"}
              >
                {generation.status === "completed" ? "Ukończona" :
                 generation.status === "processing" ? "W toku" : "Błąd"}
              </Badge>
            </div>
          </div>
          <div>
            <span className="font-medium text-gray-700">Model AI:</span>
            <p className="text-gray-900 text-sm">{generation.model}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Utworzono:</span>
            <p className="text-gray-900 text-sm">{formatDate(generation.created_at)}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Tekst źródłowy:</span>
            <p className="text-gray-900 text-sm">{generation.source_text_length} znaków</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Już zaakceptowano:</span>
            <p className="text-gray-900 text-sm">
              {(generation.accepted_unedited_count || 0) + (generation.accepted_edited_count || 0)} fiszek
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Akcje masowe */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Propozycje fiszek ({proposals.length})</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectedCount === proposals.length && proposals.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm">
                  Zaznacz wszystkie
                </label>
              </div>
              {selectedCount > 0 && (
                <div className="text-sm text-gray-600">
                  Wybrano: {selectedCount} ({uneditedCount} bez edycji, {editedCount} z edycją)
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Wybierz fiszki które chcesz dodać do swojej kolekcji. Możesz edytować treść przed akceptacją.
            </p>
            <Button
              onClick={handleAcceptSelected}
              disabled={selectedCount === 0 || accepting}
              size="lg"
            >
              {accepting ? "Akceptowanie..." : `Zaakceptuj wybrane (${selectedCount})`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista propozycji */}
      <div className="grid gap-4">
        {proposals.map((proposal, index) => (
          <Card
            key={proposal.id}
            className={`transition-all ${proposal.selected ? 'ring-2 ring-primary' : ''}`}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <Checkbox
                  checked={proposal.selected}
                  onCheckedChange={(checked) => handleProposalSelect(proposal.id, !!checked)}
                  className="mt-1"
                />

                {/* Numer fiszki */}
                <div className="text-sm font-medium text-gray-500 mt-1 min-w-[30px]">
                  #{index + 1}
                </div>

                {/* Treść fiszki */}
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Przód fiszki:
                    </label>
                    <Input
                      value={proposal.front}
                      onChange={(e) => handleProposalEdit(proposal.id, 'front', e.target.value)}
                      placeholder="Pytanie lub termin..."
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tył fiszki:
                    </label>
                    <Textarea
                      value={proposal.back}
                      onChange={(e) => handleProposalEdit(proposal.id, 'back', e.target.value)}
                      placeholder="Odpowiedź lub definicja..."
                      className="w-full min-h-[80px]"
                    />
                  </div>

                  {/* Oznaczenie edycji */}
                  {proposal.edited && (
                    <div className="flex items-center gap-2 pt-2">
                      <Badge variant="outline" className="text-xs">
                        Edytowano
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System powiadomień */}
      <ToastNotifications toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
};

export default GenerationDetailsView; 