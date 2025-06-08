import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import type { GenerationStatisticsDTO, ModelUsageStats } from "../types";
import ToastNotifications from "./ToastNotifications";
import type { ToastMessage, ToastType } from "./ToastNotifications";

const StatisticsView = () => {
  // Stan dla statystyk
  const [statistics, setStatistics] = useState<GenerationStatisticsDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  // Pobieranie statystyk
  const fetchStatistics = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generations/statistics");
      
      if (!response.ok) {
        throw new Error(`Błąd pobierania statystyk: ${response.status}`);
      }

      const data: GenerationStatisticsDTO = await response.json();
      setStatistics(data);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Nieznany błąd";
      setError(errorMessage);
      addToast("Nie udało się pobrać statystyk", "error");
    } finally {
      setLoading(false);
    }
  };

  // Efekt dla pierwszego załadowania
  useEffect(() => {
    fetchStatistics();
  }, []);

  // Formatowanie czasu trwania
  const formatDuration = (milliseconds: number) => {
    const seconds = Math.round(milliseconds / 1000);
    if (seconds < 60) return `${seconds}s`;
    return `${Math.round(seconds / 60)}min ${seconds % 60}s`;
  };

  // Formatowanie procentów
  const formatPercentage = (value: number) => {
    return `${Math.round(value * 100)}%`;
  };

  // Formatowanie nazwy modelu (skrócenie)
  const formatModelName = (model: string) => {
    if (model.length <= 30) return model;
    const parts = model.split('/');
    if (parts.length === 2) {
      return `${parts[0]}/.../...${parts[1].slice(-15)}`;
    }
    return `${model.slice(0, 25)}...`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !statistics) {
    return (
      <div className="text-center py-10">
        <p className="text-red-600 mb-4">{error || "Nie udało się załadować statystyk"}</p>
        <button
          onClick={fetchStatistics}
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
        >
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Główne metryki */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Łączne generacje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total_generations}</div>
            <p className="text-xs text-gray-500 mt-1">Ukończonych procesów generacji</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Wygenerowane fiszki</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total_generated_flashcards}</div>
            <p className="text-xs text-gray-500 mt-1">Łączna liczba propozycji</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Zaakceptowane fiszki</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total_accepted_flashcards}</div>
            <p className="text-xs text-gray-500 mt-1">Dodane do kolekcji</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Wskaźnik akceptacji</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatPercentage(statistics.acceptance_rate)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Akceptowanych propozycji</p>
          </CardContent>
        </Card>
      </div>

      {/* Szczegółowe statystyki */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Statystyki edycji */}
        <Card>
          <CardHeader>
            <CardTitle>Edycja propozycji</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {statistics.total_unedited_accepted}
                </div>
                <p className="text-sm text-gray-600">Bez edycji</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {statistics.total_edited_accepted}
                </div>
                <p className="text-sm text-gray-600">Z edycją</p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">
                <span className="font-medium">{formatPercentage(statistics.edit_rate)}</span> propozycji 
                zostało zmodyfikowanych przed akceptacją
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Wykorzystanie modeli */}
        <Card>
          <CardHeader>
            <CardTitle>Wykorzystane modele AI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statistics.models_used.map((model: ModelUsageStats, index) => (
                <div key={model.model} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate" title={model.model}>
                      {formatModelName(model.model)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Średni czas: {formatDuration(model.average_duration)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={index === 0 ? "default" : "outline"}>
                      {model.count} użyć
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            {statistics.models_used.length === 0 && (
              <p className="text-gray-500 text-center py-4">Brak danych o modelach</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Podsumowanie</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Wydajność generacji</h4>
              <p className="text-sm text-green-700">
                {statistics.total_generations > 0 ? (
                  <>
                    Średnio {Math.round(statistics.total_generated_flashcards / statistics.total_generations)} 
                    {" "}propozycji na generację
                  </>
                ) : (
                  "Brak danych do obliczeń"
                )}
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Jakość propozycji</h4>
              <p className="text-sm text-blue-700">
                {statistics.acceptance_rate > 0.5 ? "Wysoka" : 
                 statistics.acceptance_rate > 0.3 ? "Średnia" : "Niska"} jakość - 
                {" "}{formatPercentage(statistics.acceptance_rate)} akceptacji
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System powiadomień */}
      <ToastNotifications toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
};

export default StatisticsView; 