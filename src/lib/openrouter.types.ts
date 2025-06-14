import { z } from "zod";

// Typy parametrów modelu
export interface ModelParameters {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

// Typy formatu odpowiedzi
export interface ResponseFormatSchema {
  name: string;
  strict: boolean;
  schema: Record<string, unknown>;
}

// Bardziej szczegółowy schemat dla fiszek
export interface FlashcardsResponseSchema extends ResponseFormatSchema {
  name: string;
  strict: boolean;
  schema: {
    type: "object";
    properties: {
      flashcards: {
        type: "array";
        items: {
          type: "object";
          properties: {
            front: { type: "string" };
            back: { type: "string" };
          };
          required: string[];
        };
      };
    };
    required: string[];
  };
}

export interface ResponseFormat {
  type: "json_schema";
  json_schema: ResponseFormatSchema | FlashcardsResponseSchema;
}

// Typy żądań
export interface OpenRouterRequestPayload {
  model: string;
  messages: {
    role: "system" | "user" | "assistant";
    content: string;
  }[];
  response_format?: ResponseFormat;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

// Typy odpowiedzi
export interface OpenRouterMessage {
  role: string;
  content: string;
}

export interface OpenRouterChoice {
  message: OpenRouterMessage;
  finish_reason: string;
  index: number;
}

export interface OpenRouterUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: OpenRouterChoice[];
  usage: OpenRouterUsage;
}

// Typy błędów
export enum OpenRouterErrorType {
  TIMEOUT = "timeout",
  NETWORK = "network",
  API = "api",
  VALIDATION = "validation",
  PARSING = "parsing",
  AUTHENTICATION = "authentication",
  UNKNOWN = "unknown",
}

export interface OpenRouterErrorOptions {
  statusCode?: number;
  responseData?: unknown;
  cause?: Error;
}

// Typy bezpieczeństwa i limitowania
export interface RateLimiter {
  requestsPerMinute: number;
  requestTimestamps: number[];
}

// Typy klienta API
export interface ApiClientOptions {
  baseUrl: string;
  timeout: number;
  headers: Record<string, string>;
}

// Typy walidatorów odpowiedzi
export const createResponseSchema = (schema: ResponseFormatSchema) => {
  // Jeśli schema ma właściwości, traktujemy to jako JSON Schema
  if (schema.schema.type === "object" && schema.schema.properties) {
    const schemaObj: Record<string, z.ZodTypeAny> = {};

    for (const [key, prop] of Object.entries(schema.schema.properties)) {
      const property = prop as Record<string, unknown>;
      if (property.type === "string") {
        schemaObj[key] = z.string();
      } else if (property.type === "number") {
        schemaObj[key] = z.number();
      } else if (property.type === "boolean") {
        schemaObj[key] = z.boolean();
      } else if (property.type === "array") {
        // Dla tablic - proste podejście, zwracamy z.array(z.unknown())
        schemaObj[key] = z.array(z.unknown());
      } else {
        schemaObj[key] = z.unknown();
      }
    }
    return z.object(schemaObj);
  }

  // Fallback dla starych schematów
  const schemaObj: Record<string, z.ZodTypeAny> = {};
  for (const [key, type] of Object.entries(schema.schema)) {
    if (type === "string") {
      schemaObj[key] = z.string();
    } else if (type === "number") {
      schemaObj[key] = z.number();
    } else if (type === "boolean") {
      schemaObj[key] = z.boolean();
    } else {
      schemaObj[key] = z.unknown();
    }
  }
  return z.object(schemaObj);
};

// Typy konfiguracji
export interface OpenRouterConfig {
  apiKey?: string;
  modelName?: string;
  modelParameters?: Partial<ModelParameters>;
  systemMessage?: string;
  userMessage?: string;
  responseFormat?: ResponseFormat;
  retryCount?: number;
  rateLimiter?: {
    requestsPerMinute: number;
  };
}

// Typy metadanych odpowiedzi
export interface OpenRouterResponseMetadata {
  model: string;
  usage: OpenRouterUsage;
  finish_reason: string;
  parse_error?: string;
}

// Domyślne wartości
export const DEFAULT_MODEL_NAME = "microsoft/phi-4-reasoning-plus:free";
export const DEFAULT_SYSTEM_MESSAGE = "Instrukcje: traktuj dane jako poufne.";
export const DEFAULT_USER_MESSAGE = "Proszę o wygenerowanie podsumowania rozmowy.";
export const DEFAULT_RESPONSE_FORMAT: ResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: "ChatResponse",
    strict: true,
    schema: {
      message: "string",
      timestamp: "number",
    },
  },
};
export const DEFAULT_MODEL_PARAMETERS: ModelParameters = {
  temperature: 0.7,
  max_tokens: 150,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
};
