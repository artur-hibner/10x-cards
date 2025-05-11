import type { APIRoute } from "astro";
import { SupabaseAuthService } from "../../../lib/auth/supabase-auth";
import { updatePasswordSchema } from "../../../lib/auth/validation";
import { 
  createValidationErrorResponse, 
  createAuthErrorResponse,
  createSuccessResponse,
  createServerErrorResponse
} from "../../../lib/auth/api-utils";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();

    // Walidacja danych wejściowych
    const result = updatePasswordSchema.safeParse(body);

    if (!result.success) {
      return createValidationErrorResponse(result.error);
    }

    const { password, token } = result.data;

    const authService = new SupabaseAuthService(locals.supabase);
    const { success, error } = await authService.updatePassword(password, token);

    if (!success) {
      return createAuthErrorResponse(error);
    }

    return createSuccessResponse(
      "Hasło zostało pomyślnie zaktualizowane",
      "/auth/login"
    );
  } catch (error) {
    console.error("Nieoczekiwany błąd podczas aktualizacji hasła:", error);
    return createServerErrorResponse("Wystąpił nieoczekiwany błąd podczas aktualizacji hasła");
  }
}; 