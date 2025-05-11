import { useForm } from "../../hooks/useForm";
import { useAuth } from "../../hooks/useAuth";
import { loginSchema } from "../../lib/auth/validation";
import { Button } from "../ui/button";
import { FormError, FieldError } from "../ui/form-feedback";
import type { UserAuthDTO } from "../../types";

export function LoginForm() {
  const auth = useAuth();
  const initialData: UserAuthDTO = {
    email: "",
    password: "",
  };

  const { formData, errors, isLoading, generalError, apiErrorDetails, handleChange, handleSubmit } = useForm<
    UserAuthDTO,
    typeof loginSchema
  >(initialData, loginSchema, auth.login);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-center">Logowanie</h1>

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

        <div className="flex items-center justify-between">
          <a
            href="/auth/reset-password"
            className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Zapomniałem hasła
          </a>
        </div>

        <Button
          type="submit"
          className="w-full bg-brand-purple hover:bg-brand-purple/90 text-white py-2"
          disabled={isLoading}
        >
          {isLoading ? "Logowanie..." : "Zaloguj się"}
        </Button>

        <div className="text-center mt-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">Nie masz konta? </span>
          <a
            href="/auth/register"
            className="text-sm text-brand-purple hover:text-brand-purple/80 dark:text-brand-purple dark:hover:text-brand-purple/80"
          >
            Zarejestruj się
          </a>
        </div>
      </form>
    </div>
  );
}
