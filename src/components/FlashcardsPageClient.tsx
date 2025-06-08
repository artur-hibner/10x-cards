import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";

import { FlashcardDetailsModal } from "./FlashcardDetailsModal";
import type { FlashcardDTO } from "../types";

interface FlashcardsResponse {
  flashcards: FlashcardDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

interface FlashcardsPageClientState {
  flashcards: FlashcardDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  loading: boolean;
  error: string | null;
}

interface FiltersState {
  source: string;
  generationId: string;
  sortField: string;
  sortOrder: string;
  limit: string;
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

export const FlashcardsPageClient: React.FC = () => {
  const [state, setState] = useState<FlashcardsPageClientState>({
    flashcards: [],
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
    },
    loading: false,
    error: null,
  });

  const [filters, setFilters] = useState<FiltersState>({
    source: "all",
    generationId: "",
    sortField: "created_at",
    sortOrder: "desc",
    limit: "10",
  });

  const [modalState, setModalState] = useState({
    isOpen: false,
    flashcardId: null as number | null,
  });

  // Funkcja do budowania URL z parametrami
  const buildApiUrl = (params: Record<string, string | undefined>): string => {
    const url = new URL("/api/flashcards", window.location.origin);

    Object.entries(params).forEach(([key, value]) => {
      if (value && value.trim() !== "") {
        url.searchParams.append(key, value);
      }
    });

    return url.toString();
  };

  // Funkcja do pobierania fiszek
  const fetchFlashcards = useCallback(
    async (page = 1): Promise<void> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const params = {
          page: page.toString(),
          limit: filters.limit,
          sort: filters.sortField,
          order: filters.sortOrder,
          source: filters.source === "all" ? "" : filters.source,
          generation_id: filters.generationId,
        };

        const url = buildApiUrl(params);

        const response = await fetch(url);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data: FlashcardsResponse = await response.json();

        setState((prev) => ({
          ...prev,
          flashcards: data.flashcards,
          pagination: data.pagination,
          loading: false,
          error: null,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : "Nieznany błąd",
        }));
      }
    },
    [filters]
  );

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

  // Obsługa filtrów
  const handleFilterChange = (key: keyof FiltersState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchFlashcards(1);
  };

  // Obsługa paginacji
  const goToPage = (page: number) => {
    fetchFlashcards(page);
  };

  // Obsługa modala
  const showFlashcardDetails = (flashcardId: number) => {
    setModalState({ isOpen: true, flashcardId });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, flashcardId: null });
  };

  // Załaduj fiszki przy starcie
  useEffect(() => {
    fetchFlashcards(1);
  }, [fetchFlashcards]);

  // Dodaj funkcje do globalnego scope dla kompatybilności z Astro
  useEffect(() => {
    const windowWithFlashcardFunctions = window as typeof window & {
      showFlashcardModal?: (id: number) => void;
    };

    windowWithFlashcardFunctions.showFlashcardModal = showFlashcardDetails;

    return () => {
      delete windowWithFlashcardFunctions.showFlashcardModal;
    };
  }, []);

  const renderPagination = () => {
    if (state.pagination.total <= state.pagination.limit) return null;

    const totalPages = Math.ceil(state.pagination.total / state.pagination.limit);
    const currentPage = state.pagination.page;

    return (
      <div className="mt-8 flex justify-center">
        <div className="flex gap-2 items-center">
          {currentPage > 1 && (
            <Button variant="outline" size="sm" onClick={() => goToPage(currentPage - 1)} className="gap-1 px-2.5">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:block">Poprzednia</span>
            </Button>
          )}

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = Math.max(1, currentPage - 2) + i;
            if (pageNum > totalPages) return null;

            return (
              <Button
                key={pageNum}
                variant={pageNum === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => goToPage(pageNum)}
                className="w-9 h-9"
              >
                {pageNum}
              </Button>
            );
          })}

          {currentPage < totalPages && (
            <Button variant="outline" size="sm" onClick={() => goToPage(currentPage + 1)} className="gap-1 px-2.5">
              <span className="hidden sm:block">Następna</span>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Panel filtrów i kontroli */}
      <Card className="p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Filtr źródła */}
          <div className="flex-1 min-w-48">
            <label htmlFor="source-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Źródło fiszki
            </label>
            <Select value={filters.source} onValueChange={(value) => handleFilterChange("source", value)}>
              <SelectTrigger id="source-filter">
                <SelectValue placeholder="Wszystkie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie</SelectItem>
                <SelectItem value="ai-full">AI (pełne)</SelectItem>
                <SelectItem value="ai-edited">AI (edytowane)</SelectItem>
                <SelectItem value="manual">Ręczne</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtr generacji */}
          <div className="flex-1 min-w-48">
            <label htmlFor="generation-filter" className="block text-sm font-medium text-gray-700 mb-1">
              ID Generacji
            </label>
            <Input
              id="generation-filter"
              placeholder="np. 123 lub 'null' dla manualnych"
              value={filters.generationId}
              onChange={(e) => handleFilterChange("generationId", e.target.value)}
            />
          </div>

          {/* Sortowanie */}
          <div className="flex-1 min-w-48">
            <label htmlFor="sort-field" className="block text-sm font-medium text-gray-700 mb-1">
              Sortowanie
            </label>
            <div className="flex gap-2">
              <Select value={filters.sortField} onValueChange={(value) => handleFilterChange("sortField", value)}>
                <SelectTrigger className="flex-1" id="sort-field">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Data utworzenia</SelectItem>
                  <SelectItem value="updated_at">Data modyfikacji</SelectItem>
                  <SelectItem value="front">Przód fiszki</SelectItem>
                  <SelectItem value="back">Tył fiszki</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.sortOrder} onValueChange={(value) => handleFilterChange("sortOrder", value)}>
                <SelectTrigger className="w-32" id="sort-order">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">↓ Malejąco</SelectItem>
                  <SelectItem value="asc">↑ Rosnąco</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Liczba na stronę */}
          <div className="min-w-32">
            <label htmlFor="limit-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Na stronę
            </label>
            <Select value={filters.limit} onValueChange={(value) => handleFilterChange("limit", value)}>
              <SelectTrigger id="limit-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Przycisk zastosuj */}
          <div>
            <Button onClick={applyFilters}>Zastosuj</Button>
          </div>
        </div>
      </Card>

      {/* Status ładowania */}
      {state.loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Ładowanie fiszek...</p>
        </div>
      )}

      {/* Informacje o wynikach */}
      {!state.loading && state.pagination.total > 0 && (
        <div className="mb-4 text-sm text-gray-600">
          Znaleziono <strong>{state.pagination.total}</strong> fiszek. Strona <strong>{state.pagination.page}</strong> z{" "}
          <strong>{Math.ceil(state.pagination.total / state.pagination.limit)}</strong>
        </div>
      )}

      {/* Komunikat błędu */}
      {state.error && (
        <Card className="border-red-200 bg-red-50 mb-4">
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
                <h3 className="text-sm font-medium text-red-800">Błąd</h3>
                <div className="mt-2 text-sm text-red-700">{state.error}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista fiszek */}
      {!state.loading && state.flashcards.length === 0 && !state.error && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">Brak fiszek spełniających kryteria</p>
          <p className="text-sm mt-2">Spróbuj zmienić filtry lub dodaj nowe fiszki</p>
        </div>
      )}

      {!state.loading && state.flashcards.length > 0 && (
        <div className="space-y-4">
          {state.flashcards.map((flashcard) => (
            <Card
              key={flashcard.id}
              className="p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => showFlashcardDetails(flashcard.id)}
            >
              {/* Header z badge i metadanymi */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <Badge variant={getSourceBadgeVariant(flashcard.source)}>{getSourceLabel(flashcard.source)}</Badge>
                  {flashcard.generation_id && <span className="text-xs text-gray-500">#{flashcard.generation_id}</span>}
                </div>
                <div className="text-xs text-gray-500 text-right">
                  <div>ID: {flashcard.id}</div>
                  <div>Utworzono: {formatDate(flashcard.created_at)}</div>
                  {flashcard.updated_at !== flashcard.created_at && (
                    <div>Zaktualizowano: {formatDate(flashcard.updated_at)}</div>
                  )}
                </div>
              </div>

              {/* Przód fiszki - 100% szerokości */}
              <div className="mb-4">
                <div className="block text-sm font-medium text-gray-700 mb-1">Przód fiszki</div>
                <Card className="bg-blue-50">
                  <CardContent className="pt-3 pb-3">
                    <TextWithLineBreaks text={flashcard.front} className="text-gray-900" />
                  </CardContent>
                </Card>
              </div>

              {/* Tył fiszki - 100% szerokości */}
              <div>
                <div className="block text-sm font-medium text-gray-700 mb-1">Tył fiszki</div>
                <Card className="bg-green-50">
                  <CardContent className="pt-3 pb-3">
                    <TextWithLineBreaks text={flashcard.back} className="text-gray-900" />
                  </CardContent>
                </Card>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Paginacja */}
      {renderPagination()}

      {/* Modal ze szczegółami fiszki */}
      <FlashcardDetailsModal isOpen={modalState.isOpen} onClose={closeModal} flashcardId={modalState.flashcardId} />
    </div>
  );
};
