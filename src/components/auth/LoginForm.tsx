import { useState } from "react";
import { z } from "zod";
import { Button } from "../ui/button";

const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Usuwanie błędu po edycji pola
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Walidacja danych
      loginSchema.parse(formData);

      // Ponieważ nie implementujemy backendu, tylko wyświetlamy komunikat
      console.log("Dane logowania wysłane", formData);

      // Resetowanie formularza po sukcesie
      setFormData({ email: "", password: "" });
      setErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Formatowanie błędów Zod do prostego obiektu errors
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path) {
            fieldErrors[err.path[0]] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-center">Logowanie</h1>

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
          />
          {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
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
          />
          {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
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