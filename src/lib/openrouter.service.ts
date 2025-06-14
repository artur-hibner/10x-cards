import type {
  ModelParameters,
  ResponseFormat,
  OpenRouterRequestPayload,
  OpenRouterResponse,
  ApiClientOptions,
  OpenRouterConfig,
  OpenRouterErrorOptions,
  RateLimiter,
  OpenRouterResponseMetadata,
} from "./openrouter.types";
import {
  createResponseSchema,
  DEFAULT_MODEL_NAME,
  DEFAULT_SYSTEM_MESSAGE,
  DEFAULT_USER_MESSAGE,
  DEFAULT_RESPONSE_FORMAT,
  DEFAULT_MODEL_PARAMETERS,
  OpenRouterErrorType,
} from "./openrouter.types";
import { logger, SafeLogger, LogLevel } from "./logger";

class OpenRouterError extends Error {
  type: OpenRouterErrorType;
  statusCode?: number;
  responseData?: unknown;

  constructor(message: string, type: OpenRouterErrorType, options?: OpenRouterErrorOptions) {
    super(message, { cause: options?.cause });
    this.type = type;
    this.statusCode = options?.statusCode;
    this.responseData = options?.responseData;
    this.name = "OpenRouterError";
  }
}

// Klasa implementująca klienta API
class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private headers: Record<string, string>;
  private logger: SafeLogger;

  constructor(options: ApiClientOptions, customLogger?: SafeLogger) {
    this.baseUrl = options.baseUrl;
    this.timeout = options.timeout;
    this.headers = options.headers;
    this.logger = customLogger ?? logger;
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    try {
      this.logger.debug(`Wysyłanie żądania ${this.baseUrl}${endpoint}`, { endpoint, data });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.headers,
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        this.logger.error(`Błąd API: ${response.status} ${response.statusText}`, errorData);

        // Obsługa specyficznych błędów API
        if (response.status === 401) {
          throw new OpenRouterError(
            "Błąd uwierzytelniania: nieprawidłowy lub wygasły klucz API",
            OpenRouterErrorType.AUTHENTICATION,
            { statusCode: response.status, responseData: errorData }
          );
        } else if (response.status === 429) {
          throw new OpenRouterError("Przekroczono limit zapytań do API", OpenRouterErrorType.API, {
            statusCode: response.status,
            responseData: errorData,
          });
        } else {
          throw new OpenRouterError(`Błąd API: ${response.status} ${response.statusText}`, OpenRouterErrorType.API, {
            statusCode: response.status,
            responseData: errorData,
          });
        }
      }

      const responseData = (await response.json()) as T;
      this.logger.debug(`Odebrano odpowiedź z ${endpoint}`, responseData);
      return responseData;
    } catch (error) {
      if (error instanceof OpenRouterError) {
        throw error;
      } else if (error instanceof Error && error.name === "AbortError") {
        this.logger.error("Timeout żądania", { timeout: this.timeout });
        throw new OpenRouterError("Przekroczono limit czasu żądania", OpenRouterErrorType.TIMEOUT, { cause: error });
      } else if (error instanceof TypeError && error.message.includes("fetch")) {
        this.logger.error("Błąd połączenia sieciowego", error);
        throw new OpenRouterError("Błąd połączenia sieciowego", OpenRouterErrorType.NETWORK, {
          cause: error instanceof Error ? error : undefined,
        });
      }

      this.logger.error("Nieoczekiwany błąd podczas komunikacji z API", error);
      throw new OpenRouterError("Nieoczekiwany błąd podczas komunikacji z API", OpenRouterErrorType.UNKNOWN, {
        cause: error instanceof Error ? error : undefined,
      });
    }
  }
}

// Główna klasa usługi OpenRouter
export class OpenRouterService {
  // Publiczne pola
  public apiKey: string;
  public modelName: string;
  public modelParameters: ModelParameters;
  public systemMessage: string;
  public userMessage: string;
  public responseFormat: ResponseFormat;

  // Prywatne pola
  private _client: ApiClient;
  private _retryCount: number;
  private _logger: SafeLogger;
  private _rateLimiter: RateLimiter;

  /**
   * Konstruktor inicjalizujący serwis OpenRouter
   */
  constructor(
    apiKey: string,
    modelName = DEFAULT_MODEL_NAME,
    modelParameters: ModelParameters = DEFAULT_MODEL_PARAMETERS,
    systemMessage = DEFAULT_SYSTEM_MESSAGE,
    userMessage = DEFAULT_USER_MESSAGE,
    responseFormat: ResponseFormat = DEFAULT_RESPONSE_FORMAT,
    config: Partial<OpenRouterConfig> = {}
  ) {
    // Konfiguracja loggera
    this._logger = new SafeLogger({
      level: LogLevel.INFO,
      // Dodajemy klucze specyficzne dla OpenRouter API
      sensitiveKeys: [...logger.getSensitiveKeys(), "bearer", "openrouter"],
    });

    // Walidacja kluczowych parametrów
    if (!apiKey) {
      this._logger.error("Brak klucza API");
      throw new OpenRouterError("Klucz API jest wymagany", OpenRouterErrorType.AUTHENTICATION);
    }

    this.apiKey = apiKey;
    this.modelName = modelName;
    this.modelParameters = modelParameters;
    this.systemMessage = systemMessage;
    this.userMessage = userMessage;
    this.responseFormat = responseFormat;
    this._retryCount = config.retryCount ?? 3;

    // Inicjalizacja rate limitera (domyślnie 60 zapytań na minutę)
    this._rateLimiter = {
      requestsPerMinute: config.rateLimiter?.requestsPerMinute ?? 60,
      requestTimestamps: [],
    };

    this._logger.info("Inicjalizacja serwisu OpenRouter", {
      modelName,
      hasApiKey: !!apiKey,
      rateLimiter: this._rateLimiter.requestsPerMinute,
    });

    // Inicjalizacja klienta API
    this._client = new ApiClient(
      {
        baseUrl: "https://openrouter.ai/api/v1",
        timeout: 30000,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "https://api.openrouter.ai",
          "X-Title": "OpenRouter Service",
        },
      },
      this._logger
    );
  }

  /**
   * Metoda wysyłająca zapytanie do OpenRouter API
   */
  public async sendChatRequest(userInput?: string): Promise<Record<string, unknown>> {
    try {
      // Sprawdzenie limitów zapytań
      this._checkRateLimit();

      const payload = this._buildRequestPayload(userInput);
      const formattedRequest = this._formatRequest(payload);

      this._logger.debug("Wysyłanie zapytania do OpenRouter API", {
        model: this.modelName,
        inputLength: userInput?.length ?? this.userMessage.length,
      });

      // Wysyłanie zapytania do API
      const response = await this._client.post<OpenRouterResponse>("/chat/completions", formattedRequest);

      // Rejestracja zapytania w rate limiterze
      this._rateLimiter.requestTimestamps.push(Date.now());

      this._logger.debug("Otrzymano odpowiedź z OpenRouter API", {
        model: response.model,
        usedTokens: response.usage.total_tokens,
      });

      // Parsowanie i walidacja odpowiedzi
      return this.parseResponse(response);
    } catch (error) {
      return this._handleError(error);
    }
  }

  /**
   * Metoda parsująca odpowiedź z API
   */
  public parseResponse(response: OpenRouterResponse): Record<string, unknown> {
    if (!response || !response.choices || response.choices.length === 0) {
      this._logger.error("Nieprawidłowa struktura odpowiedzi", response);
      throw new OpenRouterError("Nieprawidłowa struktura odpowiedzi", OpenRouterErrorType.VALIDATION);
    }

    const choice = response.choices[0];
    const content = choice.message.content;

    // Logowanie surowej zawartości dla debugowania
    this._logger.info("Surowa zawartość odpowiedzi z modelu", {
      content: content,
      contentLength: content?.length || 0,
      contentType: typeof content,
    });

    // Dodanie metadanych do odpowiedzi
    const metadata: OpenRouterResponseMetadata = {
      model: response.model,
      usage: response.usage,
      finish_reason: choice.finish_reason,
    };

    try {
      // Jeśli odpowiedź zawiera dane JSON, próbujemy je sparsować
      if (this.responseFormat.type === "json_schema") {
        try {
          const jsonContent = JSON.parse(content);
          this._logger.debug("Odpowiedź w formacie JSON", { format: this.responseFormat.json_schema.name });
          const validatedContent = this._validateResponse(jsonContent);

          // Łączymy zwalidowaną zawartość z metadanymi
          return {
            ...validatedContent,
            _metadata: metadata,
          };
        } catch (parseError) {
          // Jeśli model zwrócił nieprawidłowy JSON pomimo instrukcji,
          // logujemy błąd, ale zwracamy zawartość jako tekst z metadanymi
          this._logger.error("Błąd podczas parsowania odpowiedzi JSON", parseError);

          return {
            content,
            _metadata: {
              ...metadata,
              parse_error: "Invalid JSON returned by model",
            },
          };
        }
      }

      // Dla odpowiedzi tekstowych zwróć zawartość z metadanymi
      this._logger.debug("Odpowiedź tekstowa");
      return {
        content,
        _metadata: metadata,
      };
    } catch (error) {
      this._logger.error("Błąd podczas przetwarzania odpowiedzi", error);
      throw new OpenRouterError("Nie można przetworzyć odpowiedzi z API", OpenRouterErrorType.PARSING, {
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Metoda aktualizująca konfigurację serwisu
   */
  public updateConfiguration(config: OpenRouterConfig): void {
    this._logger.info("Aktualizacja konfiguracji", {
      updatedModelName: !!config.modelName,
      updatedSystemMessage: !!config.systemMessage,
    });

    if (config.apiKey) {
      this.apiKey = config.apiKey;
      // Aktualizacja nagłówków autoryzacji w kliencie API
      this._client = new ApiClient(
        {
          baseUrl: "https://openrouter.ai/api/v1",
          timeout: 30000,
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "https://api.openrouter.ai",
            "X-Title": "OpenRouter Service",
          },
        },
        this._logger
      );
    }

    if (config.modelName) this.modelName = config.modelName;
    if (config.modelParameters) this.modelParameters = { ...this.modelParameters, ...config.modelParameters };
    if (config.systemMessage) this.systemMessage = config.systemMessage;
    if (config.userMessage) this.userMessage = config.userMessage;
    if (config.responseFormat) this.responseFormat = config.responseFormat;
    if (config.retryCount) this._retryCount = config.retryCount;

    // Aktualizacja limitera jeśli przekazano konfigurację
    if (config.rateLimiter) {
      this._rateLimiter.requestsPerMinute = config.rateLimiter.requestsPerMinute;
    }
  }

  /**
   * Konfiguracja limitowania zapytań
   */
  public setRateLimit(requestsPerMinute: number): void {
    this._logger.info(`Aktualizacja limitu zapytań na ${requestsPerMinute}/min`);
    this._rateLimiter.requestsPerMinute = requestsPerMinute;
  }

  /**
   * Konfiguracja poziomu logowania
   */
  public setLogLevel(level: LogLevel): void {
    this._logger.setLevel(level);
  }

  /**
   * Metoda budująca payload zapytania
   */
  private _buildRequestPayload(userInput?: string): OpenRouterRequestPayload {
    const actualUserMessage = userInput || this.userMessage;

    const payload: OpenRouterRequestPayload = {
      model: this.modelName,
      messages: [
        { role: "system", content: this.systemMessage },
        { role: "user", content: actualUserMessage },
      ],
      ...this.modelParameters,
    };

    // Dodanie response_format jeśli zdefiniowano
    if (this.responseFormat) {
      payload.response_format = this.responseFormat;
    }

    return payload;
  }

  /**
   * Metoda formatująca zapytanie do API
   */
  private _formatRequest(payload: OpenRouterRequestPayload): OpenRouterRequestPayload {
    // Tu można dodać dodatkowe transformacje payloadu jeśli są wymagane
    return payload;
  }

  /**
   * Metoda walidująca strukturę odpowiedzi
   */
  private _validateResponse(jsonResponse: Record<string, unknown>): Record<string, unknown> {
    // Jeśli mamy zdefiniowany schemat JSON do walidacji
    if (this.responseFormat.type === "json_schema") {
      const schema = this.responseFormat.json_schema;

      // Budowanie dynamicznego schematu Zod na podstawie responseFormat
      const zodSchema = createResponseSchema(schema);

      try {
        // Walidacja odpowiedzi przy użyciu schematu Zod
        return zodSchema.parse(jsonResponse);
      } catch (error) {
        this._logger.error("Błąd walidacji odpowiedzi", error);
        throw new OpenRouterError("Odpowiedź nie spełnia wymaganego schematu JSON", OpenRouterErrorType.VALIDATION, {
          cause: error instanceof Error ? error : undefined,
        });
      }
    }

    return jsonResponse;
  }

  /**
   * Sprawdzanie limitów zapytań
   */
  private _checkRateLimit(): void {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;

    // Filtrujemy tylko zapytania z ostatniej minuty
    this._rateLimiter.requestTimestamps = this._rateLimiter.requestTimestamps.filter(
      (timestamp) => timestamp > oneMinuteAgo
    );

    // Sprawdzamy, czy przekroczono limit
    if (this._rateLimiter.requestTimestamps.length >= this._rateLimiter.requestsPerMinute) {
      const oldestTimestamp = this._rateLimiter.requestTimestamps[0];
      const waitTime = 60 * 1000 - (now - oldestTimestamp);

      this._logger.warn(`Przekroczono limit zapytań (${this._rateLimiter.requestsPerMinute}/min)`, {
        currentCount: this._rateLimiter.requestTimestamps.length,
        waitTimeSeconds: Math.ceil(waitTime / 1000),
      });

      throw new OpenRouterError(
        `Przekroczono limit zapytań (${this._rateLimiter.requestsPerMinute}/min). Spróbuj ponownie za ${Math.ceil(waitTime / 1000)} s.`,
        OpenRouterErrorType.API
      );
    }
  }

  /**
   * Metoda obsługująca błędy
   */
  private _handleError(error: unknown, retryCount = 0): Promise<Record<string, unknown>> {
    // Jeśli to już obiekt OpenRouterError, używamy go bezpośrednio
    const openRouterError =
      error instanceof OpenRouterError
        ? error
        : new OpenRouterError("Nieznany błąd podczas komunikacji z OpenRouter API", OpenRouterErrorType.UNKNOWN, {
            cause: error instanceof Error ? error : undefined,
          });

    this._logger.error(`[${openRouterError.type}] Błąd podczas komunikacji z OpenRouter API`, openRouterError);

    // Błędy, które mogą być naprawione przez ponowną próbę
    const retryableErrorTypes = [OpenRouterErrorType.TIMEOUT, OpenRouterErrorType.NETWORK];

    // Określone kody statusu HTTP, które mogą być naprawione przez ponowną próbę
    const retryableStatusCodes = [408, 429, 500, 502, 503, 504];

    const isRetryableError =
      retryableErrorTypes.includes(openRouterError.type) ||
      (openRouterError.type === OpenRouterErrorType.API &&
        openRouterError.statusCode !== undefined &&
        retryableStatusCodes.includes(openRouterError.statusCode));

    // Jeśli to błąd, który można naprawić przez ponowną próbę i nie przekroczyliśmy limitu prób
    if (isRetryableError && retryCount < this._retryCount) {
      const nextRetryDelay = Math.pow(2, retryCount) * 1000; // Wykładnicze opóźnienie
      this._logger.info(`Ponowna próba za ${nextRetryDelay}ms (${retryCount + 1}/${this._retryCount})`);

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(this.sendChatRequest());
        }, nextRetryDelay);
      });
    }

    // Dla innych błędów lub po wyczerpaniu prób, rzucamy błąd
    throw openRouterError;
  }
}
