/**
 * Bezpieczny logger usuwający wrażliwe dane przed zapisem do logów
 */

// Typy dla loggera
export interface LoggerOptions {
  /**
   * Poziom logowania: trace, debug, info, warn, error, fatal
   */
  level?: LogLevel;

  /**
   * Lista kluczy, które powinny być redagowane w logach
   */
  sensitiveKeys?: string[];

  /**
   * Wartość zastępcza dla wrażliwych danych
   */
  redactionReplacement?: string;

  /**
   * Czy logger ma być włączony
   */
  enabled?: boolean;
}

export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5,
}

// Domyślne wartości
const DEFAULT_SENSITIVE_KEYS = [
  "apiKey",
  "api_key",
  "token",
  "accessToken",
  "access_token",
  "password",
  "secret",
  "Authorization",
  "authentication",
  "credential",
  "private",
  "key",
];

const DEFAULT_REDACTION_REPLACEMENT = "[REDACTED]";

export class SafeLogger {
  private level: LogLevel;
  private sensitiveKeys: string[];
  private redactionReplacement: string;
  private enabled: boolean;
  private consoleLogger: Console;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? LogLevel.INFO;
    this.sensitiveKeys = options.sensitiveKeys ?? DEFAULT_SENSITIVE_KEYS;
    this.redactionReplacement = options.redactionReplacement ?? DEFAULT_REDACTION_REPLACEMENT;
    this.enabled = options.enabled ?? true;
    this.consoleLogger = console;
  }

  /**
   * Redaguje wrażliwe dane z obiektu lub ciągu znaków
   */
  private redactSensitiveData(data: unknown): unknown {
    if (!data) return data;

    // Dla ciągów znaków, sprawdzamy, czy nie jest to wrażliwa wartość (np. klucz API)
    if (typeof data === "string") {
      // Jeśli ciąg wygląda jak token JWT, redagujemy go
      if (/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/.test(data)) {
        return this.redactionReplacement;
      }
      // Jeśli ciąg wygląda jak klucz API (długi ciąg znaków alfanumerycznych)
      if (data.length > 20 && /^[A-Za-z0-9._-]+$/.test(data)) {
        return this.redactionReplacement;
      }
      return data;
    }

    // Dla tablic, redagujemy każdy element
    if (Array.isArray(data)) {
      return data.map((item) => this.redactSensitiveData(item));
    }

    // Dla obiektów, redagujemy wrażliwe pola
    if (typeof data === "object" && data !== null) {
      const redactedObject: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(data)) {
        // Sprawdzamy, czy klucz jest wrażliwy
        if (this.sensitiveKeys.some((sensitiveKey) => key.toLowerCase().includes(sensitiveKey.toLowerCase()))) {
          redactedObject[key] = this.redactionReplacement;
        } else {
          // Rekurencyjnie redagujemy wartość
          redactedObject[key] = this.redactSensitiveData(value);
        }
      }

      return redactedObject;
    }

    return data;
  }

  /**
   * Formatuje argumenty logowania i redaguje wrażliwe dane
   */
  private formatArgs(args: unknown[]): unknown[] {
    return args.map((arg) => this.redactSensitiveData(arg));
  }

  /**
   * Sprawdza, czy dany poziom logowania powinien być zapisany
   */
  private shouldLog(level: LogLevel): boolean {
    return this.enabled && level >= this.level;
  }

  /**
   * Metody logowania
   */
  trace(...args: unknown[]): void {
    if (this.shouldLog(LogLevel.TRACE)) {
      this.consoleLogger.debug(...this.formatArgs(args));
    }
  }

  debug(...args: unknown[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.consoleLogger.debug(...this.formatArgs(args));
    }
  }

  info(...args: unknown[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.consoleLogger.info(...this.formatArgs(args));
    }
  }

  warn(...args: unknown[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.consoleLogger.warn(...this.formatArgs(args));
    }
  }

  error(...args: unknown[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.consoleLogger.error(...this.formatArgs(args));
    }
  }

  fatal(...args: unknown[]): void {
    if (this.shouldLog(LogLevel.FATAL)) {
      this.consoleLogger.error("[FATAL]", ...this.formatArgs(args));
    }
  }

  /**
   * Konfiguracja loggera
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  addSensitiveKeys(keys: string[]): void {
    this.sensitiveKeys = [...this.sensitiveKeys, ...keys];
  }

  setSensitiveKeys(keys: string[]): void {
    this.sensitiveKeys = keys;
  }

  /**
   * Pobiera listę wrażliwych kluczy
   */
  getSensitiveKeys(): string[] {
    return [...this.sensitiveKeys];
  }

  setRedactionReplacement(replacement: string): void {
    this.redactionReplacement = replacement;
  }
}

// Eksportujemy domyślną instancję loggera
export const logger = new SafeLogger();
