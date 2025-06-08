import type { APIRoute } from "astro";
import { SupabaseAuthService } from "../../../lib/auth/supabase-auth";
import { loginSchema } from "../../../lib/auth/validation";
import {
  createValidationErrorResponse,
  createAuthErrorResponse,
  createSuccessResponse,
  createServerErrorResponse,
} from "../../../lib/auth/api-utils";
import { DEFAULT_REDIRECT_AFTER_LOGIN } from "../../../lib/auth/config";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();

    // Walidacja danych wejściowych
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return createValidationErrorResponse(result.error);
    }

    const { email, password } = result.data;

    const authService = new SupabaseAuthService(locals.supabase);
    const { success, error } = await authService.signIn(email, password);

    if (!success && error) {
      return createAuthErrorResponse(error);
    }

    return createSuccessResponse("Logowanie zakończone pomyślnie", DEFAULT_REDIRECT_AFTER_LOGIN);
  } catch (error) {
    console.error("Nieoczekiwany błąd podczas logowania:", error);
    return createServerErrorResponse("Wystąpił nieoczekiwany błąd podczas logowania");
  }
};
