import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import type { GenerationStatisticsDTO, ModelUsageStats } from "../types";
import ToastNotifications from "./ToastNotifications";
import type { ToastMessage, ToastType } from "./ToastNotifications";

const ProfileView = () => {
  // Stan dla profilu użytkownika
  const [userEmail, setUserEmail] = useState<string>("");
  const [registrationDate, setRegistrationDate] = useState<string>("");
  const [lastLogin, setLastLogin] = useState<string>("");
  const [avatar, setAvatar] = useState<string>("");
  
  // Stan dla zmiany hasła
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);

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

  // Pobieranie danych profilu
  const fetchUserProfile = async () => {
    try {
      const response = await fetch("/api/auth/profile");
      if (!response.ok) {
        throw new Error(`Błąd pobierania profilu: ${response.status}`);
      }
      const data = await response.json();
      setUserEmail(data.email || "");
      setRegistrationDate(data.created_at || "");
      setLastLogin(data.last_sign_in_at || "");
      setAvatar(data.avatar_url || "");
    } catch (err) {
      console.error("Błąd podczas pobierania profilu:", err);
      addToast("Nie udało się pobrać danych profilu", "error");
    }
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
    fetchUserProfile();
    fetchStatistics();
  }, []);

  // Obsługa zmiany hasła
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      addToast("Nowe hasła nie są identyczne", "error");
      return;
    }

    if (newPassword.length < 6) {
      addToast("Nowe hasło musi mieć przynajmniej 6 znaków", "error");
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (!response.ok) {
        throw new Error(`Błąd zmiany hasła: ${response.status}`);
      }

      addToast("Hasło zostało zmienione pomyślnie", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Błąd podczas zmiany hasła:", err);
      addToast("Nie udało się zmienić hasła", "error");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Formatowanie daty
  const formatDate = (dateString: string) => {
    if (!dateString) return "Brak danych";
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

  // Formatowanie nazwy modelu
  const formatModelName = (model: string) => {
    if (model.length <= 30) return model;
    const parts = model.split('/');
    if (parts.length === 2) {
      return `${parts[0]}/.../...${parts[1].slice(-15)}`;
    }
    return `${model.slice(0, 25)}...`;
  };

  return (
    <div className="space-y-8">
      {/* Sekcja profilu użytkownika */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Informacje podstawowe */}
          <Card>
            <CardHeader>
              <CardTitle>Informacje o profilu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  {avatar ? (
                    <img src={avatar} alt="Avatar" className="w-16 h-16 rounded-full" />
                  ) : (
                    <span className="text-2xl text-gray-500">
                      {userEmail.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{userEmail || "Ładowanie..."}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Data rejestracji</p>
                <p className="font-medium">{formatDate(registrationDate)}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Ostatnie logowanie</p>
                <p className="font-medium">{formatDate(lastLogin)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Zmiana hasła */}
          <Card>
            <CardHeader>
              <CardTitle>Zmiana hasła</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label htmlFor="current-password" className="block text-sm font-medium mb-1">
                    Obecne hasło
                  </label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    disabled={isChangingPassword}
                  />
                </div>
                
                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium mb-1">
                    Nowe hasło
                  </label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={isChangingPassword}
                    minLength={6}
                  />
                </div>
                
                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium mb-1">
                    Potwierdź nowe hasło
                  </label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isChangingPassword}
                    minLength={6}
                  />
                </div>
                
                <Button
                  type="submit"
                  disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                  className="w-full"
                >
                  {isChangingPassword ? "Zmienianie hasła..." : "Zmień hasło"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pozioma kreska oddzielająca */}
      <hr className="border-gray-300" />

      {/* Sekcja statystyk */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Statystyki generacji</h2>
          <p className="text-gray-600">
            Przegląd efektywności procesu generacji fiszek i wykorzystania modeli AI.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : error || !statistics ? (
          <div className="text-center py-10">
            <p className="text-red-600 mb-4">{error || "Nie udało się załadować statystyk"}</p>
            <Button onClick={fetchStatistics}>
              Spróbuj ponownie
            </Button>
          </div>
        ) : (
          <>
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

            {/* Szczegółowe statystyki - skrócona wersja */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Wykorzystane modele AI</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {statistics.models_used.slice(0, 3).map((model: ModelUsageStats, index) => (
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
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>

      {/* System powiadomień */}
      <ToastNotifications toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
};

export default ProfileView; 