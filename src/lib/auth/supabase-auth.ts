import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import { ERROR_MESSAGES } from "./api-utils";

export enum AuthErrorType {
  INVALID_CREDENTIALS = "invalid_credentials",
  USER_EXISTS = "user_exists",
  INVALID_TOKEN = "invalid_token",
  SERVER_ERROR = "server_error",
  VALIDATION_ERROR = "validation_error",
}

export interface AuthError {
  type: AuthErrorType;
  message: string;
  status: number;
  details?: Record<string, string[]>;
}

export const authErrors = {
  [AuthErrorType.INVALID_CREDENTIALS]: {
    message: ERROR_MESSAGES.INVALID_CREDENTIALS,
    status: 401,
  },
  [AuthErrorType.USER_EXISTS]: {
    message: ERROR_MESSAGES.ACCOUNT_EXISTS,
    status: 409,
  },
  [AuthErrorType.INVALID_TOKEN]: {
    message: ERROR_MESSAGES.INVALID_TOKEN,
    status: 400,
  },
  [AuthErrorType.SERVER_ERROR]: {
    message: ERROR_MESSAGES.REQUEST_FAILED,
    status: 500,
  },
  [AuthErrorType.VALIDATION_ERROR]: {
    message: ERROR_MESSAGES.VALIDATION_FAILED,
    status: 400,
  },
};

export const handleAuthError = (error: Error & { message?: string }): AuthError => {
  if (error.message?.includes("already registered")) {
    return {
      type: AuthErrorType.USER_EXISTS,
      message: authErrors[AuthErrorType.USER_EXISTS].message,
      status: authErrors[AuthErrorType.USER_EXISTS].status,
    };
  }

  if (error.message?.includes("Invalid login credentials")) {
    return {
      type: AuthErrorType.INVALID_CREDENTIALS,
      message: authErrors[AuthErrorType.INVALID_CREDENTIALS].message,
      status: authErrors[AuthErrorType.INVALID_CREDENTIALS].status,
    };
  }

  if (error.message?.includes("token") || error.message?.includes("JWT")) {
    return {
      type: AuthErrorType.INVALID_TOKEN,
      message: authErrors[AuthErrorType.INVALID_TOKEN].message,
      status: authErrors[AuthErrorType.INVALID_TOKEN].status,
    };
  }

  console.error("Auth error:", error);

  return {
    type: AuthErrorType.SERVER_ERROR,
    message: authErrors[AuthErrorType.SERVER_ERROR].message,
    status: authErrors[AuthErrorType.SERVER_ERROR].status,
  };
};

export class SupabaseAuthService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async signUp(email: string, password: string) {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      if (error instanceof Error) {
        return { success: false, error: handleAuthError(error) };
      }
      return {
        success: false,
        error: handleAuthError(new Error("Nieznany błąd")),
      };
    }
  }

  async signIn(email: string, password: string) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      if (error instanceof Error) {
        return { success: false, error: handleAuthError(error) };
      }
      return {
        success: false,
        error: handleAuthError(new Error("Nieznany błąd")),
      };
    }
  }

  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut();

      if (error) throw error;

      return { success: true };
    } catch (error) {
      if (error instanceof Error) {
        return { success: false, error: handleAuthError(error) };
      }
      return {
        success: false,
        error: handleAuthError(new Error("Nieznany błąd")),
      };
    }
  }

  async resetPassword(email: string) {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: new URL("/auth/update-password", import.meta.env.SITE).toString(),
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      if (error instanceof Error) {
        return { success: false, error: handleAuthError(error) };
      }
      return {
        success: false,
        error: handleAuthError(new Error("Nieznany błąd")),
      };
    }
  }

  async updatePassword(password: string, token: string) {
    try {
      // Najpierw ustawiamy token w sesji
      await this.supabase.auth.setSession({
        access_token: token,
        refresh_token: "",
      });

      // Następnie aktualizujemy hasło
      const { error } = await this.supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      if (error instanceof Error) {
        return { success: false, error: handleAuthError(error) };
      }
      return {
        success: false,
        error: handleAuthError(new Error("Nieznany błąd")),
      };
    }
  }
}
