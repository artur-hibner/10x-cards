import { useEffect } from "react";
import { useForm } from "../../hooks/useForm";
import { useAuth } from "../../hooks/useAuth";
import { updatePasswordSchema } from "../../lib/auth/validation";
import { Button } from "../ui/button";
import { FormError, FieldError, FormSuccess } from "../ui/form-feedback";
import type { UpdatePasswordDTO } from "../../types";

interface UpdatePasswordFormProps {
  token?: string;
}

export function UpdatePasswordForm({ token }: UpdatePasswordFormProps) {
  const auth = useAuth();
  const initialData: UpdatePasswordDTO = {
    password: "",
    password_confirmation: "",
    token: token || "",
  };

  const {
    formData,
    errors,
    isLoading,
    generalError,
    isSuccess,
    setGeneralError,
    setFormData,
    handleChange,
    handleSubmit,
  } = useForm<UpdatePasswordDTO, typeof updatePasswordSchema>(initialData, updatePasswordSchema, auth.updatePassword);

  // Sprawdzenie czy token jest dostępny
  useEffect(() => {
    if (!token) {
      setGeneralError("Brak lub nieprawidłowy token resetowania hasła. Upewnij się, że kliknąłeś w poprawny link.");
    } else {
      // Ustawienie tokenu w formularzu
      setFormData((prev) => ({ ...prev, token }));
    }
  }, [token, setGeneralError, setFormData]);

  if (generalError && !token) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6 text-center">Błąd resetowania hasła</h1>
        <FormError>{generalError}</FormError>
        <div className="mt-4 flex justify-center">
          <a
            href="/auth/reset-password"
            className="text-sm text-brand-purple hover:text-brand-purple/80 dark:text-brand-purple dark:hover:text-brand-purple/80"
          >
            Wróć do strony resetowania hasła
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-center">Ustaw nowe hasło</h1>

      {generalError && <FormError>{generalError}</FormError>}

      {isSuccess ? (
        <FormSuccess>
          Twoje hasło zostało pomyślnie zresetowane. Możesz teraz się zalogować.
          <div className="mt-4 flex justify-center">
            <a
              href="/auth/login"
              className="text-sm text-brand-purple hover:text-brand-purple/80 dark:text-brand-purple dark:hover:text-brand-purple/80"
            >
              Przejdź do strony logowania
            </a>
          </div>
        </FormSuccess>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Wprowadź nowe hasło dla swojego konta.</p>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nowe hasło
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full rounded-md border ${
                errors.password ? "border-red-500" : "border-gray-300 dark:border-gray-600"
              } bg-white dark:bg-gray-700 p-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              disabled={isLoading}
            />
            <FieldError error={errors.password} />
          </div>

          <div>
            <label
              htmlFor="password_confirmation"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Powtórz hasło
            </label>
            <input
              type="password"
              id="password_confirmation"
              name="password_confirmation"
              value={formData.password_confirmation}
              onChange={handleChange}
              className={`w-full rounded-md border ${
                errors.password_confirmation ? "border-red-500" : "border-gray-300 dark:border-gray-600"
              } bg-white dark:bg-gray-700 p-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              disabled={isLoading}
            />
            <FieldError error={errors.password_confirmation} />
          </div>

          <Button
            type="submit"
            className="w-full bg-brand-purple hover:bg-brand-purple/90 text-white py-2 mt-4"
            disabled={isLoading}
          >
            {isLoading ? "Aktualizowanie..." : "Ustaw nowe hasło"}
          </Button>

          <div className="text-center mt-4">
            <a
              href="/auth/login"
              className="text-sm text-brand-purple hover:text-brand-purple/80 dark:text-brand-purple dark:hover:text-brand-purple/80"
            >
              Wróć do strony logowania
            </a>
          </div>
        </form>
      )}
    </div>
  );
}
