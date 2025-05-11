import { useState } from "react";
import { z } from "zod";

/**
 * Hook do obsługi formularzy z walidacją Zod
 * 
 * @param initialData - Początkowe dane formularza
 * @param schema - Schema Zod do walidacji formularza
 * @param onSubmit - Funkcja wywoływana przy pomyślnej walidacji i wysyłce formularza
 */
export function useForm<T extends Record<string, any>, S extends z.ZodType<T>>(
  initialData: T,
  schema: S,
  onSubmit: (data: T) => Promise<{success: boolean; message?: string; details?: Record<string, string[]>}>
) {
  const [formData, setFormData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [apiErrorDetails, setApiErrorDetails] = useState<Record<string, string[]> | undefined>(undefined);

  /**
   * Obsługuje zmianę wartości w polach formularza
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Usuwanie błędu po edycji pola
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors: Record<string, string> = {};
        for (const key in prev) {
          if (key !== name) {
            newErrors[key] = prev[key];
          }
        }
        return newErrors;
      });
    }
    
    // Usuwanie ogólnego błędu i szczegółów błędów API po jakiejkolwiek zmianie
    if (generalError) {
      setGeneralError(null);
    }
    
    if (apiErrorDetails) {
      setApiErrorDetails(undefined);
    }
  };

  /**
   * Obsługuje wysyłanie formularza
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setGeneralError(null);
    setErrors({});
    setApiErrorDetails(undefined);
    
    try {
      // Walidacja danych po stronie klienta
      schema.parse(formData);
      
      // Wywołanie funkcji onSubmit dostarczonej jako parametr
      const result = await onSubmit(formData);
      
      if (result.success) {
        setIsSuccess(true);
      } else {
        setGeneralError(result.message || "Wystąpił błąd");
        
        // Zapisz szczegóły błędu API, jeśli są dostępne
        if (result.details && Object.keys(result.details).length > 0) {
          setApiErrorDetails(result.details);
          
          // Ustawianie błędów walidacji dla poszczególnych pól
          const fieldErrors: Record<string, string> = {};
          Object.entries(result.details).forEach(([field, errorMsgs]) => {
            if (errorMsgs && errorMsgs.length > 0) {
              fieldErrors[field] = errorMsgs[0];
            }
          });
          
          if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
          }
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Formatowanie błędów Zod do prostego obiektu errors
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path && err.path.length > 0) {
            fieldErrors[err.path[0]] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else if (error instanceof Error) {
        setGeneralError(error.message);
      } else {
        setGeneralError("Wystąpił nieoczekiwany błąd");
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Resetuje formularz do stanu początkowego
   */
  const resetForm = () => {
    setFormData(initialData);
    setErrors({});
    setGeneralError(null);
    setApiErrorDetails(undefined);
    setIsLoading(false);
    setIsSuccess(false);
  };

  return {
    formData,
    errors,
    isLoading,
    generalError,
    isSuccess,
    apiErrorDetails,
    handleChange,
    handleSubmit,
    resetForm,
    setFormData,
    setGeneralError,
    setIsSuccess
  };
} 