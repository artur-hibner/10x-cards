import { useForm } from "../../hooks/useForm";
import { useAuth } from "../../hooks/useAuth";
import { requestPasswordResetSchema } from "../../lib/auth/validation";
import { Button } from "../ui/button";
import { FormError, FieldError, FormSuccess } from "../ui/form-feedback";
import type { RequestPasswordResetDTO } from "../../types";

export function RequestPasswordResetForm() {
  const auth = useAuth();
  const initialData: RequestPasswordResetDTO = {
    email: "",
  };

  const {
    formData,
    errors,
    isLoading,
    generalError,
    isSuccess,
    handleChange,
    handleSubmit
  } = useForm<RequestPasswordResetDTO, typeof requestPasswordResetSchema>(
    initialData,
    requestPasswordResetSchema,
    auth.resetPassword
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-center">Resetowanie hasła</h1>
      
      {generalError && <FormError>{generalError}</FormError>}
      
      {isSuccess ? (
        <FormSuccess>
          Jeśli podany adres email istnieje w naszej bazie, 
          wyślemy na niego instrukcję resetowania hasła.
          <div className="mt-4 flex justify-center">
            <a
              href="/auth/login"
              className="text-sm text-brand-purple hover:text-brand-purple/80 dark:text-brand-purple dark:hover:text-brand-purple/80"
            >
              Wróć do strony logowania
            </a>
          </div>
        </FormSuccess>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Podaj adres email przypisany do swojego konta, a my wyślemy Ci link do zresetowania hasła.
          </p>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Adres email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full rounded-md border ${
                errors.email ? "border-red-500" : "border-gray-300 dark:border-gray-600"
              } bg-white dark:bg-gray-700 p-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              disabled={isLoading}
            />
            <FieldError error={errors.email} />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-brand-purple hover:bg-brand-purple/90 text-white py-2 mt-4" 
            disabled={isLoading}
          >
            {isLoading ? "Wysyłanie..." : "Wyślij link resetujący"}
          </Button>
          
          <div className="text-center mt-4">
            <a href="/auth/login" className="text-sm text-brand-purple hover:text-brand-purple/80 dark:text-brand-purple dark:hover:text-brand-purple/80">
              Wróć do strony logowania
            </a>
          </div>
        </form>
      )}
    </div>
  );
} 