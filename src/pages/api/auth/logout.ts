import type { APIRoute } from "astro";
import { SupabaseAuthService } from "../../../lib/auth/supabase-auth";
import { createAuthErrorResponse, createSuccessResponse, createServerErrorResponse } from "../../../lib/auth/api-utils";
import { DEFAULT_REDIRECT_AFTER_LOGOUT } from "../../../lib/auth/config";

export const prerender = false;

export const POST: APIRoute = async ({ locals }) => {
  try {
    const authService = new SupabaseAuthService(locals.supabase);
    const { success, error } = await authService.signOut();

    if (!success) {
      return createAuthErrorResponse(error);
    }

    return createSuccessResponse("Wylogowanie zakończone pomyślnie", DEFAULT_REDIRECT_AFTER_LOGOUT);
  } catch (error) {
    console.error("Nieoczekiwany błąd podczas wylogowania:", error);
    return createServerErrorResponse("Wystąpił nieoczekiwany błąd podczas wylogowania");
  }
};
