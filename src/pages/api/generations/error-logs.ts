import { z } from "zod";
import type { APIRoute } from "astro";
import type { GenerationErrorLogsResponseDTO, GenerationErrorLogDTO, ModelInputData } from "../../../types";
import { supabaseClient } from "../../../db/supabase.client";

export const prerender = false;

// Schemat walidacji dla parametrów query
const errorLogsQuerySchema = z.object({
  from: z.string().pipe(z.coerce.date()).optional(),
  to: z.string().pipe(z.coerce.date()).optional(),
  limit: z.string().pipe(z.coerce.number().min(1).max(100).default(50)).optional().default("50"),
  offset: z.string().pipe(z.coerce.number().min(0).default(0)).optional().default("0"),
});

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    // Sprawdzenie uwierzytelnienia
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          error: "Użytkownik nie jest zalogowany",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parsowanie parametrów query
    const searchParams = Object.fromEntries(url.searchParams);
    const validationResult = errorLogsQuerySchema.safeParse(searchParams);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowe parametry zapytania",
          details: validationResult.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { from, to, limit, offset } = validationResult.data;

    // Budowanie zapytania z filtrami TYLKO dla zalogowanego użytkownika
    let query = supabaseClient
      .from("generation_error_logs")
      .select("*", { count: "exact" })
      .eq("user_id", locals.user.id)
      .order("created_at", { ascending: false });

    // Aplikowanie filtrów czasowych
    if (from) {
      query = query.gte("created_at", from.toISOString());
    }
    if (to) {
      query = query.lte("created_at", to.toISOString());
    }

    // Aplikowanie paginacji
    query = query.range(Number(offset), Number(offset) + Number(limit) - 1);

    const { data: errorLogs, error: fetchError, count } = await query;

    if (fetchError) {
      throw new Error(`Błąd podczas pobierania logów błędów: ${fetchError.message}`);
    }

    // Mapowanie na DTO
    const logsDto: GenerationErrorLogDTO[] = errorLogs.map((log) => ({
      id: log.id.toString(),
      generation_id: log.generation_id,
      timestamp: log.created_at,
      error_type: log.error_code,
      error_message: log.error_message,
      created_at: log.created_at,
      user_id: log.user_id,
      model: log.model,
      source_text_hash: log.source_text_hash,
      source_text_length: log.source_text_length,
      input_data: {
        prompt: `Tekst źródłowy (${log.source_text_length} znaków, hash: ${log.source_text_hash.substring(0, 8)}...)`,
        parameters: {
          temperature: 0.3,
          max_tokens: 2000,
          model: log.model,
          source_text_length: log.source_text_length,
        },
      } as ModelInputData,
      stack_trace: log.error_message,
    })) as GenerationErrorLogDTO[];

    const response: GenerationErrorLogsResponseDTO = {
      total: count || 0,
      logs: logsDto,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Błąd podczas pobierania logów błędów generacji:", error);
    return new Response(
      JSON.stringify({
        error: "Błąd serwera podczas pobierania logów błędów",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
