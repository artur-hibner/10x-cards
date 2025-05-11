import type { APIRoute } from "astro";
import { SupabaseAuthService } from "../../../lib/auth/supabase-auth";
import { requestPasswordResetSchema } from "../../../lib/auth/validation";
import { 
  createValidationErrorResponse,
  createSuccessResponse
} from "../../../lib/auth/api-utils";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();

    // Walidacja danych wejściowych
    const result = requestPasswordResetSchema.safeParse(body);

    if (!result.success) {
      return createValidationErrorResponse(result.error);
    }

    const { email } = result.data;

    const authService = new SupabaseAuthService(locals.supabase);
    
    // Próbujemy zresetować hasło, ale nawet jeśli się nie uda, nie informujemy o tym
    // To zabezpieczenie przed wyciekiem informacji o istnieniu konta
    await authService.resetPassword(email);

    // Zawsze zwracamy tę samą odpowiedź, niezależnie od wyniku
    return createSuccessResponse(
      "Jeśli podany adres email istnieje w naszej bazie, wyślemy na niego instrukcję resetowania hasła."
    );
  } catch (error) {
    console.error("Nieoczekiwany błąd podczas żądania resetu hasła:", error);
    
    // Nawet w przypadku błędu serwera, zwracamy tę samą odpowiedź
    // aby nie ujawniać informacji o problemach technicznych
    return createSuccessResponse(
      "Jeśli podany adres email istnieje w naszej bazie, wyślemy na niego instrukcję resetowania hasła."
    );
  }
}; 