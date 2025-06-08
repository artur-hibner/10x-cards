import { useForm } from "../../hooks/useForm";
import { useAuth } from "../../hooks/useAuth";
import { registerSchema } from "../../lib/auth/validation";
import { Button } from "../ui/button";
import { FormError, FieldError } from "../ui/form-feedback";
import type { UserRegisterDTO } from "../../types";

export function RegisterForm() {
  const auth = useAuth();
  const initialData: UserRegisterDTO = {
    email: "",
    password: "",
    password_confirmation: "",
  };

  const { formData, errors, isLoading, generalError, apiErrorDetails, handleChange, handleSubmit } = useForm<
    UserRegisterDTO,
    typeof registerSchema
  >(initialData, registerSchema, auth.register);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-center">Rejestracja</h1>

      {generalError && <FormError details={apiErrorDetails}>{generalError}</FormError>}

      <form onSubmit={handleSubmit} className="space-y-4">
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
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          <FieldError error={errors.email} />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Hasło
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
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
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
            aria-invalid={!!errors.password_confirmation}
            aria-describedby={errors.password_confirmation ? "password_confirmation-error" : undefined}
          />
          <FieldError error={errors.password_confirmation} />
        </div>

        <Button
          type="submit"
          className="w-full bg-brand-purple hover:bg-brand-purple/90 text-white py-2 mt-4"
          disabled={isLoading}
        >
          {isLoading ? "Rejestracja..." : "Zarejestruj się"}
        </Button>

        <div className="text-center mt-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">Masz już konto? </span>
          <a
            href="/auth/login"
            className="text-sm text-brand-purple hover:text-brand-purple/80 dark:text-brand-purple dark:hover:text-brand-purple/80"
          >
            Zaloguj się
          </a>
        </div>
      </form>
    </div>
  );
}
