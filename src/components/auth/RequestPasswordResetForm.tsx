import { useState } from "react";
import { z } from "zod";
import { Button } from "../ui/button";

// Schema walidacji
const requestPasswordResetSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu email"),
});

// Typ dla danych formularza
type RequestPasswordResetFormData = z.infer<typeof requestPasswordResetSchema>;

export function RequestPasswordResetForm() {
  const [formData, setFormData] = useState<RequestPasswordResetFormData>({
    email: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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
      requestPasswordResetSchema.parse(formData);
      
      // Ponieważ nie implementujemy backendu, tylko wyświetlamy komunikat
      console.log("Żądanie resetu hasła wysłane", formData);
      
      // Symulacja sukcesu
      setIsSuccess(true);
      
      // Resetowanie formularza po sukcesie
      setFormData({ email: "" });
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
      <h1 className="text-2xl font-bold mb-6 text-center">Resetowanie hasła</h1>
      
      {isSuccess ? (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4 mb-6">
          <p className="text-green-800 dark:text-green-400 text-center">
            Jeśli podany adres email istnieje w naszej bazie, 
            wyślemy na niego instrukcję resetowania hasła.
          </p>
          <div className="mt-4 flex justify-center">
            <a
              href="/auth/login"
              className="text-sm text-brand-purple hover:text-brand-purple/80 dark:text-brand-purple dark:hover:text-brand-purple/80"
            >
              Wróć do strony logowania
            </a>
          </div>
        </div>
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
            {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
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