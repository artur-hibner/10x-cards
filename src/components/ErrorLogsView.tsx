import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import type { GenerationErrorLogsResponseDTO, GenerationErrorLogDTO } from "../types";
import ToastNotifications from "./ToastNotifications";
import type { ToastMessage, ToastType } from "./ToastNotifications";

const ErrorLogsView = () => {
  // Stan dla logów
  const [logs, setLogs] = useState<GenerationErrorLogDTO[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Stan dla filtrów
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [offset, setOffset] = useState<number>(0);
  const [limit] = useState<number>(20);

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

  // Pobieranie logów błędów
  const fetchErrorLogs = async (newOffset = 0) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: newOffset.toString(),
      });

      if (dateFrom) params.append('from', dateFrom);
      if (dateTo) params.append('to', dateTo);

      const response = await fetch(`/api/generations/error-logs?${params}`);
      
      if (!response.ok) {
        throw new Error(`Błąd pobierania logów: ${response.status}`);
      }

      const data: GenerationErrorLogsResponseDTO = await response.json();
      setLogs(data.logs);
      setTotal(data.total);
      setOffset(newOffset);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Nieznany błąd";
      setError(errorMessage);
      addToast("Nie udało się pobrać logów błędów", "error");
    } finally {
      setLoading(false);
    }
  };

  // Efekt dla pierwszego załadowania
  useEffect(() => {
    fetchErrorLogs();
  }, []);

  // Obsługa filtrów
  const handleFilterApply = () => {
    fetchErrorLogs(0);
  };

  const handleClearFilters = () => {
    setDateFrom('');
    setDateTo('');
    fetchErrorLogs(0);
  };

  // Formatowanie daty
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pl-PL');
  };

  // Formatowanie typu błędu
  const getErrorBadgeVariant = (errorType: string) => {
    switch (errorType.toLowerCase()) {
      case 'timeout':
      case 'timeouterror':
        return 'secondary' as const;
      case 'networkerror':
      case 'connectionerror':
        return 'outline' as const;
      case 'validationerror':
        return 'destructive' as const;
      default:
        return 'default' as const;
    }
  };

  // Paginacja
  const handlePrevPage = () => {
    if (offset > 0) {
      fetchErrorLogs(Math.max(0, offset - limit));
    }
  };

  const handleNextPage = () => {
    if (offset + limit < total) {
      fetchErrorLogs(offset + limit);
    }
  };

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Filtry */}
      <Card>
        <CardHeader>
          <CardTitle>Filtry</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="dateFrom" className="block text-sm font-medium mb-1">
                Data od:
              </label>
              <Input
                id="dateFrom"
                type="datetime-local"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="dateTo" className="block text-sm font-medium mb-1">
                Data do:
              </label>
              <Input
                id="dateTo"
                type="datetime-local"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleFilterApply} className="flex-1">
                Zastosuj filtry
              </Button>
              <Button onClick={handleClearFilters} variant="outline">
                Wyczyść
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Podsumowanie */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-xs text-gray-500">Łączna liczba błędów</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{currentPage}</div>
            <p className="text-xs text-gray-500">Aktualna strona</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalPages}</div>
            <p className="text-xs text-gray-500">Łączna liczba stron</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista logów */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : error ? (
        <div className="text-center py-10">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => fetchErrorLogs(offset)}>
            Spróbuj ponownie
          </Button>
        </div>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-10">
            <p className="text-gray-500">Brak logów błędów dla wybranych kryteriów</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <Card key={log.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">Błąd #{log.id}</CardTitle>
                    <p className="text-sm text-gray-500">
                      {formatDate(log.timestamp)} • Generation #{log.generation_id}
                    </p>
                  </div>
                  <Badge variant={getErrorBadgeVariant(log.error_type)}>
                    {log.error_type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Komunikat błędu */}
                <div>
                  <h4 className="font-medium text-sm mb-2">Komunikat błędu:</h4>
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-sm text-red-800 font-mono">
                      {log.error_message}
                    </p>
                  </div>
                </div>

                {/* Dane wejściowe */}
                <div>
                  <h4 className="font-medium text-sm mb-2">Dane wejściowe:</h4>
                  <div className="bg-gray-50 border rounded p-3">
                    <p className="text-sm text-gray-700 mb-1">
                      <strong>Prompt:</strong> {log.input_data.prompt}
                    </p>
                    <div className="text-xs text-gray-600 space-y-1">
                      {Object.entries(log.input_data.parameters).map(([key, value]) => (
                        <div key={key}>
                          <strong>{key}:</strong> {value}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stack trace */}
                {log.stack_trace && log.stack_trace !== log.error_message && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Stack trace:</h4>
                    <div className="bg-gray-900 text-gray-100 rounded p-3 overflow-x-auto">
                      <pre className="text-xs whitespace-pre-wrap">
                        {log.stack_trace}
                      </pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Paginacja */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <Button
            onClick={handlePrevPage}
            disabled={offset === 0}
            variant="outline"
          >
            Poprzednia strona
          </Button>
          <span className="text-sm text-gray-600">
            Strona {currentPage} z {totalPages}
          </span>
          <Button
            onClick={handleNextPage}
            disabled={offset + limit >= total}
            variant="outline"
          >
            Następna strona
          </Button>
        </div>
      )}

      {/* System powiadomień */}
      <ToastNotifications toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
};

export default ErrorLogsView; 