import { useCallback } from 'react';

export const useSessionHandler = () => {
  const handleSessionError = useCallback((error: any, response?: Response) => {
    // Sprawdź czy błąd jest związany z sesją
    if (response?.status === 401 || 
        (error?.message && error.message.includes('Użytkownik nie jest zalogowany'))) {
      
      console.log('Sesja wygasła, przekierowanie na stronę logowania...');
      
      // Przekieruj na stronę logowania z parametrem redirect
      const currentPath = window.location.pathname;
      window.location.href = `/?redirect=${encodeURIComponent(currentPath)}`;
      
      return true; // Oznacza że błąd sesji został obsłużony
    }
    
    return false; // Nie jest błąd sesji
  }, []);

  return { handleSessionError };
}; 