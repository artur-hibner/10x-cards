import { useState, useEffect } from "react";
import { z } from "zod";
import { Button } from "../ui/button";

// Schema walidacji
const updatePasswordSchema = z.object({
  password: z.string()
    .min(8, "Hasło musi mieć co najmniej 8 znaków")
    .regex(/[A-Z]/, "Hasło musi zawierać przynajmniej jedną wielką literę")
    .regex(/[a-z]/, "Hasło musi zawierać przynajmniej jedną małą literę")
    .regex(/[0-9]/, "Hasło musi zawierać przynajmniej jedną cyfrę"),
  password_confirmation: z.string(),
}).refine((data) => data.password === data.password_confirmation, {
  message: "Hasła muszą być identyczne",
  path: ["password_confirmation"],
});

// Typ dla danych formularza
type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;

interface UpdatePasswordFormProps {
  token?: string;
}

export function UpdatePasswordForm({ token }: UpdatePasswordFormProps) {
  const [formData, setFormData] = useState<UpdatePasswordFormData>({
    password: "",
    password_confirmation: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Sprawdzenie czy token jest dostępny
  useEffect(() => {
    if (!token) {
      setTokenError("Brak lub nieprawidłowy token resetowania hasła. Upewnij się, że kliknąłeś w poprawny link.");
    }
  }, [token]);

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
    
    if (!token) {
      setTokenError("Brak tokenu resetowania hasła.");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Walidacja danych
      updatePasswordSchema.parse(formData);
      
      // Ponieważ nie implementujemy backendu, tylko wyświetlamy komunikat
      console.log("Aktualizacja hasła wysłana", { ...formData, token });
      
      // Symulacja sukcesu
      setIsSuccess(true);
      
      // Resetowanie formularza po sukcesie
      setFormData({ password: "", password_confirmation: "" });
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

  if (tokenError) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6 text-center">Błąd resetowania hasła</h1>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
          <p className="text-red-800 dark:text-red-400 text-center">{tokenError}</p>
          <div className="mt-4 flex justify-center">
            <a
              href="/auth/reset-password"
              className="text-sm text-brand-purple hover:text-brand-purple/80 dark:text-brand-purple dark:hover:text-brand-purple/80"
            >
              Wróć do strony resetowania hasła
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-center">Ustaw nowe hasło</h1>
      
      {isSuccess ? (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4 mb-6">
          <p className="text-green-800 dark:text-green-400 text-center">
            Twoje hasło zostało pomyślnie zresetowane. Możesz teraz się zalogować.
          </p>
          <div className="mt-4 flex justify-center">
            <a
              href="/auth/login"
              className="text-sm text-brand-purple hover:text-brand-purple/80 dark:text-brand-purple dark:hover:text-brand-purple/80"
            >
              Przejdź do strony logowania
            </a>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Wprowadź nowe hasło dla swojego konta.
          </p>
          
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
            {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
          </div>
          
          <div>
            <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
            {errors.password_confirmation && (
              <p className="mt-1 text-sm text-red-500">{errors.password_confirmation}</p>
            )}
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-brand-purple hover:bg-brand-purple/90 text-white py-2 mt-4" 
            disabled={isLoading}
          >
            {isLoading ? "Aktualizowanie..." : "Ustaw nowe hasło"}
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