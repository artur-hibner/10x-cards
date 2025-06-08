import type { APIRoute } from "astro";
import { SupabaseAuthService } from "../../../lib/auth/supabase-auth";
import { registerSchema } from "../../../lib/auth/validation";
import {
  createValidationErrorResponse,
  createAuthErrorResponse,
  createSuccessResponse,
  createServerErrorResponse,
  HTTP_STATUS,
} from "../../../lib/auth/api-utils";
import { DEFAULT_REDIRECT_AFTER_LOGIN } from "../../../lib/auth/config";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();

    // Walidacja danych wejściowych
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return createValidationErrorResponse(result.error);
    }

    const { email, password } = result.data;

    const authService = new SupabaseAuthService(locals.supabase);
    const { success, error } = await authService.signUp(email, password);

    if (!success) {
      return createAuthErrorResponse(error);
    }

    return createSuccessResponse("Rejestracja zakończona pomyślnie", DEFAULT_REDIRECT_AFTER_LOGIN, HTTP_STATUS.CREATED);
  } catch (error) {
    console.error("Nieoczekiwany błąd podczas rejestracji:", error);
    return createServerErrorResponse("Wystąpił nieoczekiwany błąd podczas rejestracji");
  }
};
