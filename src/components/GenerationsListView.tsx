import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import type { GenerationListResponseDTO, GenerationDTO } from "../types";
import ToastNotifications from "./ToastNotifications";
import type { ToastMessage, ToastType } from "./ToastNotifications";

// Typ dla pojedynczej generacji w liście (bez flashcards_proposals)
type GenerationListItem = Omit<GenerationDTO, "flashcards_proposals">;

const GenerationsListView = () => {
  // Stan dla listy generacji
  const [generations, setGenerations] = useState<GenerationListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Stan dla paginacji
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [perPage] = useState<number>(10);

  // Stan dla powiadomień
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Stan dla modala usuwania
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    generation: GenerationListItem | null;
    loading: boolean;
  }>({
    isOpen: false,
    generation: null,
    loading: false,
  });

  // Funkcje dla powiadomień
  const generateId = () => Math.random().toString(36).substring(2, 15);

  const addToast = (message: string, type: ToastType, duration = 5000) => {
    const id = generateId();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Pobieranie listy generacji
  const fetchGenerations = async (page: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/generations?page=${page}&limit=${perPage}`);

      if (!response.ok) {
        throw new Error(`Błąd pobierania generacji: ${response.status}`);
      }

      const data: GenerationListResponseDTO = await response.json();

      setGenerations(data.generations);
      setCurrentPage(data.page);
      setTotalItems(data.total);
      setTotalPages(Math.ceil(data.total / data.per_page));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Nieznany błąd";
      setError(errorMessage);
      addToast("Nie udało się pobrać listy generacji", "error");
    } finally {
      setLoading(false);
    }
  };

  // Efekt dla pierwszego załadowania
  useEffect(() => {
    fetchGenerations(1);
  }, []);

  // Obsługa zmiany strony
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchGenerations(newPage);
    }
  };

  // Formatowanie daty
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pl-PL", {
      year: "numeric",
      month: "short",
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

  // Nawigacja do szczegółów generacji
  const navigateToGeneration = (generationId: number) => {
    window.location.href = `/generations/${generationId}`;
  };

  // Otwieranie modala usuwania
  const handleDeleteGeneration = (generation: GenerationListItem, event: React.MouseEvent) => {
    event.stopPropagation(); // Zatrzymanie propagacji aby nie kliknąć w kartę
    setDeleteModalState({
      isOpen: true,
      generation,
      loading: false,
    });
  };

  // Potwierdzenie usunięcia generacji
  const confirmDeleteGeneration = async () => {
    if (!deleteModalState.generation) return;

    setDeleteModalState((prev) => ({ ...prev, loading: true }));

    try {
      const response = await fetch(`/api/generations/${deleteModalState.generation.generation_id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Błąd usuwania generacji: ${response.status}`);
      }

      // Zamknij modal i odśwież listę
      setDeleteModalState({
        isOpen: false,
        generation: null,
        loading: false,
      });

      addToast("Generacja została pomyślnie usunięta", "success");

      // Odświeżenie listy
      fetchGenerations(currentPage);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Nieznany błąd";
      addToast(`Nie udało się usunąć generacji: ${errorMessage}`, "error");
      setDeleteModalState((prev) => ({ ...prev, loading: false }));
    }
  };

  // Zamknięcie modala usuwania
  const closeDeleteModal = () => {
    setDeleteModalState({
      isOpen: false,
      generation: null,
      loading: false,
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => fetchGenerations(currentPage)} variant="outline">
          Spróbuj ponownie
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Informacje o liście */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Znaleziono {totalItems} {totalItems === 1 ? "generację" : totalItems < 5 ? "generacje" : "generacji"}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => (window.location.href = "/generate")}>
            Nowa generacja
          </Button>
        </div>
      </div>

      {/* Lista generacji */}
      {generations.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-600 mb-4">Nie masz jeszcze żadnych generacji</p>
          <Button onClick={() => (window.location.href = "/generate")}>Wygeneruj pierwsze fiszki</Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {generations.map((generation) => (
            <Card key={generation.generation_id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">Generacja #{generation.generation_id}</CardTitle>
                  <Badge
                    variant={
                      generation.status === "completed"
                        ? "default"
                        : generation.status === "processing"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {generation.status === "completed"
                      ? "Ukończona"
                      : generation.status === "processing"
                        ? "W toku"
                        : "Błąd"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Podstawowe informacje */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Wygenerowano:</span>
                    <p className="text-gray-900">{generation.generated_count} fiszek</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Zaakceptowano:</span>
                    <p className="text-gray-900">
                      {(generation.accepted_unedited_count || 0) + (generation.accepted_edited_count || 0)} fiszek
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Czas trwania:</span>
                    <p className="text-gray-900">{formatDuration(generation.generation_duration)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Model:</span>
                    <p className="text-gray-900 text-xs truncate">{generation.model}</p>
                  </div>
                </div>

                {/* Statystyki akceptacji */}
                {generation.accepted_unedited_count || generation.accepted_edited_count ? (
                  <div className="flex gap-2">
                    {generation.accepted_unedited_count ? (
                      <Badge variant="outline" className="text-xs">
                        {generation.accepted_unedited_count} bez edycji
                      </Badge>
                    ) : null}
                    {generation.accepted_edited_count ? (
                      <Badge variant="outline" className="text-xs">
                        {generation.accepted_edited_count} z edycją
                      </Badge>
                    ) : null}
                  </div>
                ) : null}

                {/* Informacje o tekście źródłowym */}
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Tekst źródłowy: {generation.source_text_length} znaków</span>
                  <span>Utworzono: {formatDate(generation.created_at)}</span>
                </div>

                {/* Przyciski akcji */}
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => navigateToGeneration(generation.generation_id)}>
                    Zobacz
                  </Button>
                  <Button variant="destructive" size="sm" onClick={(e) => handleDeleteGeneration(generation, e)}>
                    Usuń
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Paginacja */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Poprzednia
          </Button>

          <div className="flex items-center gap-2">
            {/* Wyświetlanie numerów stron */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum =
                currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i;

              if (pageNum < 1 || pageNum > totalPages) return null;

              return (
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Następna
          </Button>
        </div>
      )}

      {/* Modal potwierdzenia usunięcia */}
      <Dialog open={deleteModalState.isOpen} onOpenChange={closeDeleteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Potwierdź usunięcie</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-sm text-gray-700">
              <p className="mb-3">Czy na pewno chcesz usunąć tę generację?</p>

              {deleteModalState.generation && (
                <div className="bg-gray-50 p-3 rounded-md text-center">
                  <div className="text-sm text-gray-600">
                    <strong>Generacja ID:</strong> {deleteModalState.generation.generation_id}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {deleteModalState.generation.generated_count} fiszek,{" "}
                    {deleteModalState.generation.source_text_length} znaków
                  </div>
                </div>
              )}

              <p className="mt-3 text-red-600 font-medium text-center">⚠️ Tej operacji nie można cofnąć!</p>
              <p className="text-xs text-red-500 text-center mt-1">
                Zostaną usunięte również wszystkie powiązane fiszki.
              </p>
            </div>

            {/* Przyciski */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={closeDeleteModal}
                variant="outline"
                className="flex-1"
                disabled={deleteModalState.loading}
              >
                Anuluj
              </Button>
              <Button
                onClick={confirmDeleteGeneration}
                variant="destructive"
                className="flex-1"
                disabled={deleteModalState.loading}
              >
                {deleteModalState.loading ? "Usuwanie..." : "Usuń generację"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* System powiadomień */}
      <ToastNotifications toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
};

export default GenerationsListView;
